/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * This file is made up of a combination of original code, along with code
 * extracted from the following repositories:
 *
 * https://github.com/mmoskal/dapjs/tree/a32f11f54e9e76a9c61896ddd425c1cb1a29c143
 * https://github.com/microsoft/pxt-microbit
 *
 * The pxt-microbit license is included below.
 *
 * PXT - Programming Experience Toolkit
 *
 * The MIT License (MIT)
 *
 * Copyright (c) Microsoft Corporation
 *
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { Logging } from "./logging.js";
import { DAPWrapper } from "./usb-device-wrapper.js";
import { BoardVersion } from "./device.js";
import MemoryMap from "nrf-intel-hex";
type ProgressCallback = (n: number, partial: boolean) => void;
/**
 * Uses a DAPWrapper to flash the micro:bit.
 *
 * Intented to be used for a single flash with a pre-connected DAPWrapper.
 */
export declare class PartialFlashing {
    private dapwrapper;
    private logging;
    private boardVersion;
    constructor(dapwrapper: DAPWrapper, logging: Logging, boardVersion: BoardVersion);
    private log;
    private getFlashChecksumsAsync;
    private runFlash;
    private partialFlashPageAsync;
    private partialFlashCoreAsync;
    private partialFlashAsync;
    fullFlashAsync(data: string | Uint8Array | MemoryMap, updateProgress: ProgressCallback): Promise<void>;
    flashAsync(data: string | Uint8Array | MemoryMap, updateProgress: ProgressCallback): Promise<boolean>;
    private convertDataToHexString;
    private convertDataToPaddedBytes;
    private hexStringToPaddedBytes;
    private paddedBytesToHexString;
    private memoryMapToPaddedBytes;
}
export {};
