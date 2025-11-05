/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoardVersion } from "./device.js";
/**
 * Validates micro:bit board IDs.
 */
export declare class BoardId {
    id: number;
    private static v1Normalized;
    private static v2Normalized;
    constructor(id: number);
    toBoardVersion(): BoardVersion;
    isV1(): boolean;
    isV2(): boolean;
    /**
     * Return the board ID using the default ID for the board type.
     * Used to integrate with MicropythonFsHex.
     */
    normalize(): BoardId;
    /**
     * toString matches the input to parse.
     *
     * @returns the ID as a string.
     */
    toString(): string;
    /**
     * @param value The ID as a hex string with no 0x prefix (e.g. 9900).
     * @returns the valid board ID
     * @throws if the ID isn't known.
     */
    static parse(value: string): BoardId;
    static forVersion(boardVersion: BoardVersion): BoardId;
}
