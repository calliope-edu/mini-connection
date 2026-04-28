import { Logging } from "./logging.js";
export declare const PARTIAL_FLASH_SERVICE_UUID: string;
export declare const PARTIAL_FLASH_CHARACTERISTIC_UUID: string;
/**
 * The DAL hash on the connected device does not match the DAL hash embedded in
 * the supplied hex. Partial flashing is impossible — the user has to do a full
 * USB flash first to update the runtime.
 */
export declare class BluetoothPartialFlashDalMismatchError extends Error {
    constructor();
}
/**
 * The hex file does not contain the MakeCode magic marker, i.e. it is not a
 * MakeCode-compiled binary. Partial flashing only works for MakeCode hexes.
 */
export declare class BluetoothPartialFlashInvalidHexError extends Error {
    constructor();
}
/**
 * The partial-flashing service is not advertised on the device. Most likely the
 * firmware was built without `MICROBIT_BLE_PARTIAL_FLASHING=1`, or the device
 * is currently running a non-MakeCode hex.
 */
export declare class BluetoothPartialFlashServiceMissingError extends Error {
    constructor();
}
export interface BluetoothPartialFlashOptions {
    /**
     * Progress callback. Receives a value in [0, 1]. Called at most every
     * `progressUpdateMs`.
     */
    onProgress?: (progress: number) => void;
    /** Cancel the operation. */
    signal?: AbortSignal;
    /**
     * Optional logger. mini-connection's other modules use the same shape.
     */
    logging?: Logging;
    /**
     * Throttle progress updates. Default 100 ms.
     */
    progressUpdateMs?: number;
    /**
     * After issuing a reset-into-pairing command, the device disconnects and
     * needs to be reconnected. The caller must reconnect the GATT server and
     * re-discover services; we'll receive a fresh server via this callback.
     *
     * Returning null/undefined cancels the flash with an error.
     */
    reconnect?: () => Promise<BluetoothRemoteGATTServer | null>;
}
interface ParsedHex {
    /** Binary contents of the MakeCode region (and onwards). */
    bin: Uint8Array;
    /** Offset of the magic marker within `bin` — always 0 by construction here. */
    magicOffset: number;
    /** First absolute address of the MakeCode region. */
    baseAddr: number;
    /** 8-byte DAL hash extracted from the hex (post magic marker). */
    dalHash: Uint8Array;
    /** 8-byte MakeCode hash extracted from the hex. */
    makeCodeHash: Uint8Array;
}
/**
 * Parse a MakeCode-compiled Intel hex, find the magic marker and slice out the
 * MakeCode region.
 */
export declare function parseMakeCodeHex(hex: string): ParsedHex;
/**
 * Drive a partial-flash session over an already-connected GATT server.
 */
export declare class BluetoothPartialFlashSession {
    private server;
    private characteristic;
    private pendingResponse;
    private aborted;
    private logging;
    constructor(server: BluetoothRemoteGATTServer, logging?: Logging);
    run(hex: string, opts?: BluetoothPartialFlashOptions): Promise<void>;
    /** Release listeners. Safe to call even if the GATT server is gone. */
    dispose(): Promise<void>;
    private openCharacteristic;
    private onNotify;
    private writeNoNotify;
    private waitForResponse;
    private requestStatus;
    private requestRegion;
    private switchToPairingMode;
}
export {};
