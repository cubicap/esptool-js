export class NodeTransport {
    constructor(device, usbVendorId, usbProductId) {
        this.device = device;
        this.slip_reader_enabled = false;
        this.left_over = new Uint8Array(0);
        this.baudrate = 0;
        this._DTR_state = false;
        this._RTS_state = false;
        this.usbVendorId = usbVendorId;
        this.usbProductId = usbProductId;
    }
    get_info() {
        return this.usbVendorId && this.usbProductId
            ? `Node SerialPort VendorID 0x${this.usbVendorId.toString(16)} ProductID 0x${this.usbProductId.toString(16)}`
            : "";
    }
    get_pid() {
        return this.usbProductId;
    }
    slip_writer(data) {
        let count_esc = 0;
        let i = 0, j = 0;
        for (i = 0; i < data.length; i++) {
            if (data[i] === 0xc0 || data[i] === 0xdb) {
                count_esc++;
            }
        }
        const out_data = new Uint8Array(2 + count_esc + data.length);
        out_data[0] = 0xc0;
        j = 1;
        for (i = 0; i < data.length; i++, j++) {
            if (data[i] === 0xc0) {
                out_data[j++] = 0xdb;
                out_data[j] = 0xdc;
                continue;
            }
            if (data[i] === 0xdb) {
                out_data[j++] = 0xdb;
                out_data[j] = 0xdd;
                continue;
            }
            out_data[j] = data[i];
        }
        out_data[j] = 0xc0;
        return out_data;
    }
    async write(data) {
        const out_data = this.slip_writer(data);
        if (this.device.writable) {
            this.device.write(out_data);
            await new Promise((resolve, reject) => {
                this.device.drain((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(null);
                    }
                });
            });
        }
    }
    _appendBuffer(buffer1, buffer2) {
        const tmp = new Uint8Array(buffer1.length + buffer2.length);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.length);
        return tmp.buffer;
    }
    /* this function expects complete packet (hence reader reads for atleast 8 bytes. This function is
     * stateless and returns the first wellformed packet only after replacing escape sequence */
    slip_reader(data) {
        let i = 0;
        let data_start = 0, data_end = 0;
        let state = "init";
        while (i < data.length) {
            if (state === "init" && data[i] == 0xc0) {
                data_start = i + 1;
                state = "valid_data";
                i++;
                continue;
            }
            if (state === "valid_data" && data[i] == 0xc0) {
                data_end = i - 1;
                state = "packet_complete";
                break;
            }
            i++;
        }
        if (state !== "packet_complete") {
            this.left_over = data;
            return new Uint8Array(0);
        }
        this.left_over = data.slice(data_end + 2);
        const temp_pkt = new Uint8Array(data_end - data_start + 1);
        let j = 0;
        for (i = data_start; i <= data_end; i++, j++) {
            if (data[i] === 0xdb && data[i + 1] === 0xdc) {
                temp_pkt[j] = 0xc0;
                i++;
                continue;
            }
            if (data[i] === 0xdb && data[i + 1] === 0xdd) {
                temp_pkt[j] = 0xdb;
                i++;
                continue;
            }
            temp_pkt[j] = data[i];
        }
        const packet = temp_pkt.slice(0, j); /* Remove unused bytes due to escape seq */
        return packet;
    }
    async read(timeout = 0, min_data = 12) {
        let packet = this.left_over;
        this.left_over = new Uint8Array(0);
        if (this.slip_reader_enabled) {
            const val_final = this.slip_reader(packet);
            if (val_final.length > 0) {
                return val_final;
            }
            packet = this.left_over;
            this.left_over = new Uint8Array(0);
        }
        if (this.device.readable == null) {
            return this.left_over;
        }
        let t;
        try {
            let done = false;
            if (timeout > 0) {
                t = setTimeout(function () {
                    done = true;
                }, timeout);
            }
            do {
                const value = this.device.read();
                if (done) {
                    this.left_over = packet;
                    await new Promise((resolve, reject) => {
                        this.device.flush((err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(null);
                            }
                        });
                    });
                    throw new Error("Timeout");
                }
                if (value == null) {
                    await this.sleep(1);
                    continue;
                }
                const p = new Uint8Array(this._appendBuffer(packet, value));
                packet = p;
            } while (packet.length < min_data);
        }
        finally {
            if (timeout > 0) {
                clearTimeout(t);
            }
        }
        if (this.slip_reader_enabled) {
            return this.slip_reader(packet);
        }
        return packet;
    }
    async rawRead(timeout = 0) {
        if (this.left_over.length != 0) {
            const p = this.left_over;
            this.left_over = new Uint8Array(0);
            return p;
        }
        if (!this.device.readable) {
            return this.left_over;
        }
        let t;
        try {
            let done = false;
            if (timeout > 0) {
                t = setTimeout(function () {
                    done = true;
                }, timeout);
            }
            while (!done) {
                if (this.device.readableLength > 0) {
                    await this.sleep(10);
                }
                const value = this.device.read();
                if (value == null) {
                    await this.sleep(1);
                    continue;
                }
                return value;
            }
            throw new Error("Timeout");
        }
        finally {
            if (timeout > 0) {
                clearTimeout(t);
            }
        }
    }
    async setRTS(state) {
        this._RTS_state = state;
    }
    async setDTR(state) {
        this._DTR_state = state;
    }
    async writeRTSDTR() {
        await new Promise((resolve, reject) => {
            this.device.set({
                rts: this._RTS_state,
                dtr: this._DTR_state,
            }, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(null);
                }
            });
        });
    }
    async connect(baud = 115200) {
        await new Promise((resolve, reject) => {
            this.device.open((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(null);
                }
            });
        });
        await new Promise((resolve, reject) => {
            this.device.update({ baudRate: baud }, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(null);
                }
            });
        });
        this.baudrate = baud;
        this.left_over = new Uint8Array(0);
    }
    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async disconnect() {
        await new Promise((resolve, reject) => {
            this.device.close((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(null);
                }
            });
        });
    }
}
