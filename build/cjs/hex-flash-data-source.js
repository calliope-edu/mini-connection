"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUniversalHexFlashDataSource = void 0;
const board_id_js_1 = require("./board-id.js");
const device_js_1 = require("./device.js");
const microbit_universal_hex_1 = require("@microbit/microbit-universal-hex");
/**
 * A flash data source that converts universal hex files as needed.
 *
 * @param universalHex A hex file, potentially universal.
 */
const createUniversalHexFlashDataSource = (universalHex) => {
    return (boardVersion) => {
        if ((0, microbit_universal_hex_1.isUniversalHex)(universalHex)) {
            const parts = (0, microbit_universal_hex_1.separateUniversalHex)(universalHex);
            const matching = parts.find((p) => p.boardId == board_id_js_1.BoardId.forVersion(boardVersion).id);
            if (!matching) {
                throw new device_js_1.FlashDataError("No matching part");
            }
            return Promise.resolve(matching.hex);
        }
        return Promise.resolve(universalHex);
    };
};
exports.createUniversalHexFlashDataSource = createUniversalHexFlashDataSource;
//# sourceMappingURL=hex-flash-data-source.js.map