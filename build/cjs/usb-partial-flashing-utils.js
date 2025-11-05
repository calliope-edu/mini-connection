"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlyChanged = exports.pageAlignBlocks = exports.Page = exports.regRequest = exports.apReg = exports.murmur3_core = exports.bufferConcat = exports.read32FromUInt8Array = exports.CoreRegister = void 0;
/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
const constants_js_1 = require("./constants.js");
// Represents the micro:bit's core registers
// Drawn from https://armmbed.github.io/dapjs/docs/enums/coreregister.html
exports.CoreRegister = {
    SP: 13,
    LR: 14,
    PC: 15,
};
const read32FromUInt8Array = (data, i) => {
    return ((data[i] |
        (data[i + 1] << 8) |
        (data[i + 2] << 16) |
        (data[i + 3] << 24)) >>>
        0);
};
exports.read32FromUInt8Array = read32FromUInt8Array;
const bufferConcat = (bufs) => {
    let len = 0;
    for (const b of bufs) {
        len += b.length;
    }
    const r = new Uint8Array(len);
    len = 0;
    for (const b of bufs) {
        r.set(b, len);
        len += b.length;
    }
    return r;
};
exports.bufferConcat = bufferConcat;
// Returns the MurmurHash of the data passed to it, used for checksum calculation.
// Drawn from https://github.com/microsoft/pxt-microbit/blob/dec5b8ce72d5c2b4b0b20aafefce7474a6f0c7b2/editor/extension.tsx#L14
const murmur3_core = (data) => {
    let h0 = 0x2f9be6cc;
    let h1 = 0x1ec3a6c8;
    for (let i = 0; i < data.byteLength; i += 4) {
        let k = (0, exports.read32FromUInt8Array)(data, i) >>> 0;
        k = Math.imul(k, 0xcc9e2d51);
        k = (k << 15) | (k >>> 17);
        k = Math.imul(k, 0x1b873593);
        h0 ^= k;
        h1 ^= k;
        h0 = (h0 << 13) | (h0 >>> 19);
        h1 = (h1 << 13) | (h1 >>> 19);
        h0 = (Math.imul(h0, 5) + 0xe6546b64) >>> 0;
        h1 = (Math.imul(h1, 5) + 0xe6546b64) >>> 0;
    }
    return [h0, h1];
};
exports.murmur3_core = murmur3_core;
// Returns a representation of an Access Port Register.
// Drawn from https://github.com/mmoskal/dapjs/blob/a32f11f54e9e76a9c61896ddd425c1cb1a29c143/src/util.ts#L63
const apReg = (r, mode) => {
    const v = r | mode | constants_js_1.DapVal.AP_ACC;
    return 4 + ((v & 0x0c) >> 2);
};
exports.apReg = apReg;
// Returns a code representing a request to read/write a certain register.
// Drawn from https://github.com/mmoskal/dapjs/blob/a32f11f54e9e76a9c61896ddd425c1cb1a29c143/src/util.ts#L92
const regRequest = (regId, isWrite = false) => {
    let request = !isWrite ? 1 << 1 /* READ */ : 0 << 1; /* WRITE */
    if (regId < 4) {
        request |= 0 << 0 /* DP_ACC */;
    }
    else {
        request |= 1 << 0 /* AP_ACC */;
    }
    request |= (regId & 3) << 2;
    return request;
};
exports.regRequest = regRequest;
class Page {
    constructor(targetAddr, data) {
        Object.defineProperty(this, "targetAddr", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: targetAddr
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: data
        });
    }
}
exports.Page = Page;
// Split buffer into pages, each of pageSize size.
// Drawn from https://github.com/microsoft/pxt-microbit/blob/dec5b8ce72d5c2b4b0b20aafefce7474a6f0c7b2/editor/extension.tsx#L209
const pageAlignBlocks = (buffer, targetAddr, pageSize) => {
    let unaligned = new Uint8Array(buffer);
    let pages = [];
    for (let i = 0; i < unaligned.byteLength;) {
        let newbuf = new Uint8Array(pageSize).fill(0xff);
        let startPad = (targetAddr + i) & (pageSize - 1);
        let newAddr = targetAddr + i - startPad;
        for (; i < unaligned.byteLength; ++i) {
            if (targetAddr + i >= newAddr + pageSize)
                break;
            newbuf[targetAddr + i - newAddr] = unaligned[i];
        }
        let page = new Page(newAddr, newbuf);
        pages.push(page);
    }
    return pages;
};
exports.pageAlignBlocks = pageAlignBlocks;
// Filter out all pages whose calculated checksum matches the corresponding checksum passed as an argument.
// Drawn from https://github.com/microsoft/pxt-microbit/blob/dec5b8ce72d5c2b4b0b20aafefce7474a6f0c7b2/editor/extension.tsx#L523
const onlyChanged = (pages, checksums, pageSize) => {
    return pages.filter((page) => {
        let idx = page.targetAddr / pageSize;
        if (idx * 8 + 8 > checksums.length)
            return true; // out of range?
        let c0 = (0, exports.read32FromUInt8Array)(checksums, idx * 8);
        let c1 = (0, exports.read32FromUInt8Array)(checksums, idx * 8 + 4);
        let ch = (0, exports.murmur3_core)(page.data);
        if (c0 === ch[0] && c1 === ch[1])
            return false;
        return true;
    });
};
exports.onlyChanged = onlyChanged;
//# sourceMappingURL=usb-partial-flashing-utils.js.map