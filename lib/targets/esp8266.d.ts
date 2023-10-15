import { ESPLoader } from "../esploader.js";
import { ROM } from "./rom.js";
export declare class ESP8266ROM extends ROM {
    CHIP_NAME: string;
    CHIP_DETECT_MAGIC_VALUE: number[];
    EFUSE_RD_REG_BASE: number;
    UART_CLKDIV_REG: number;
    UART_CLKDIV_MASK: number;
    XTAL_CLK_DIVIDER: number;
    FLASH_WRITE_SIZE: number;
    BOOTLOADER_FLASH_OFFSET: number;
    UART_DATE_REG_ADDR: number;
    FLASH_SIZES: {
        "512KB": number;
        "256KB": number;
        "1MB": number;
        "2MB": number;
        "4MB": number;
        "2MB-c1": number;
        "4MB-c1": number;
        "8MB": number;
        "16MB": number;
    };
    SPI_REG_BASE: number;
    SPI_USR_OFFS: number;
    SPI_USR1_OFFS: number;
    SPI_USR2_OFFS: number;
    SPI_MOSI_DLEN_OFFS: number;
    SPI_MISO_DLEN_OFFS: number;
    SPI_W0_OFFS: number;
    TEXT_START: number;
    ENTRY: number;
    DATA_START: number;
    ROM_DATA: string;
    ROM_TEXT: string;
    read_efuse(loader: ESPLoader, offset: number): Promise<number>;
    get_chip_description(loader: ESPLoader): Promise<"ESP8285" | "ESP8266EX">;
    get_chip_features: (loader: ESPLoader) => Promise<string[]>;
    get_crystal_freq(loader: ESPLoader): Promise<number>;
    _d2h(d: number): string;
    read_mac(loader: ESPLoader): Promise<string>;
    get_erase_size(offset: number, size: number): number;
}
