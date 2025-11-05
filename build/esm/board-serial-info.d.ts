/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { BoardId } from "./board-id.js";
export declare class BoardSerialInfo {
    id: BoardId;
    familyId: string;
    hic: string;
    constructor(id: BoardId, familyId: string, hic: string);
    static parse(device: USBDevice, log: (msg: string) => void): BoardSerialInfo;
    eq(other: BoardSerialInfo): boolean;
}
