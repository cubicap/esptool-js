import { SerialPort } from "serialport";
export declare class NodeTransport {
    device: SerialPort;
    slip_reader_enabled: boolean;
    left_over: Uint8Array;
    baudrate: number;
    private usbVendorId;
    private usbProductId;
    constructor(device: SerialPort, usbVendorId?: number, usbProductId?: number);
    get_info(): string;
    get_pid(): number | undefined;
    slip_writer(data: Uint8Array): Uint8Array;
    write(data: Uint8Array): Promise<void>;
    _appendBuffer(buffer1: Uint8Array, buffer2: Uint8Array): ArrayBufferLike;
    slip_reader(data: Uint8Array): Uint8Array;
    read(timeout?: number, min_data?: number): Promise<Uint8Array>;
    rawRead(timeout?: number): Promise<any>;
    _DTR_state: boolean;
    _RTS_state: boolean;
    setRTS(state: boolean): Promise<void>;
    setDTR(state: boolean): Promise<void>;
    writeRTSDTR(): Promise<void>;
    connect(baud?: number): Promise<void>;
    sleep(ms: number): Promise<unknown>;
    disconnect(): Promise<void>;
}
