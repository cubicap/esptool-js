import { Transport } from "./webserial.js";
export declare function classicReset(transport: Transport, resetDelay?: number): Promise<void>;
export declare function usbJTAGSerialReset(transport: Transport): Promise<void>;
export declare function hardReset(transport: Transport, usingUsbOtg?: boolean): Promise<void>;
export declare function validateCustomResetStringSequence(seqStr: string): boolean;
/**
 * Custom reset strategy defined with a string.
 *
 * The sequenceString input string consists of individual commands divided by "|".
 *
 * Commands (e.g. R0) are defined by a code (R) and an argument (0).
 *
 * The commands are:
 *
 * D: setDTR (localy only) - 1=True / 0=False
 *
 * R: setRTS (localy only) - 1=True / 0=False
 *
 * S: writeRTSDTR - write DTR and RTS to the device
 *
 * W: Wait (time delay) - positive integer number (miliseconds)
 *
 * "D0|R1|S|W100|D1|R0|S|W50|D0|S" represents the classic reset strategy
 */
export declare function customReset(transport: Transport, sequenceString: string): Promise<void>;
declare const _default: {
    classicReset: typeof classicReset;
    customReset: typeof customReset;
    hardReset: typeof hardReset;
    usbJTAGSerialReset: typeof usbJTAGSerialReset;
    validateCustomResetStringSequence: typeof validateCustomResetStringSequence;
};
export default _default;
