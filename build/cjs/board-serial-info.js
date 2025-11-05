"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardSerialInfo = void 0;
/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
const board_id_js_1 = require("./board-id.js");
class BoardSerialInfo {
    constructor(id, familyId, hic) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "familyId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: familyId
        });
        Object.defineProperty(this, "hic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: hic
        });
    }
    static parse(device, log) {
        const serial = device.serialNumber;
        if (!serial) {
            throw new Error("Could not detected ID from connected board.");
        }
        if (serial.length !== 48) {
            log(`USB serial number unexpected length: ${serial.length}`);
        }
        const id = serial.substring(0, 4);
        const familyId = serial.substring(4, 8);
        const hic = serial.slice(-8);
        return new BoardSerialInfo(board_id_js_1.BoardId.parse(id), familyId, hic);
    }
    eq(other) {
        return (other.id === this.id &&
            other.familyId === this.familyId &&
            other.hic === this.hic);
    }
}
exports.BoardSerialInfo = BoardSerialInfo;
//# sourceMappingURL=board-serial-info.js.map