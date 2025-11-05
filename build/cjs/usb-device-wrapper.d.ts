import type { CortexM, DAPLink, WebUSB } from "dapjs";
import { Logging } from "./logging.js";
import { BoardSerialInfo } from "./board-serial-info.js";
export declare class DAPWrapper {
    device: USBDevice;
    private logging;
    transport: WebUSB;
    daplink: DAPLink;
    cortexM: CortexM;
    _pageSize: number | undefined;
    _numPages: number | undefined;
    _deviceId: number | undefined;
    private loggedBoardSerialInfo;
    private initialConnectionComplete;
    constructor(device: USBDevice, logging: Logging);
    /**
     * The page size. Throws if we've not connected.
     */
    get pageSize(): number;
    /**
     * The number of pages. Throws if we've not connected.
     */
    get numPages(): number;
    /**
     * The number of pages. Undefined if we've not connected.
     */
    get deviceId(): number | undefined;
    get boardSerialInfo(): BoardSerialInfo;
    reconnectAsync(): Promise<void>;
    readMem32WaitOnError(register: number): Promise<number>;
    startSerial(listener: (data: string) => void): Promise<void>;
    stopSerial(listener: (data: string) => void): void;
    disconnectAsync(): Promise<void>;
    private send;
    private cmdNums;
    private readRegRepeat;
    private writeRegRepeat;
    private readBlockCore;
    private writeBlockCore;
    readBlockAsync(addr: number, words: number): Promise<Uint8Array>;
    writeBlockAsync(address: number, data: Uint32Array): Promise<void>;
    executeAsync(address: number, code: Uint32Array, sp: number, pc: number, lr: number, ...registers: number[]): Promise<void>;
    private waitForHaltCore;
    waitForHalt(timeToWait?: number): Promise<void>;
    softwareReset(): Promise<void>;
    reset(halt?: boolean): Promise<void>;
}
