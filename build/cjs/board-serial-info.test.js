"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
const board_id_js_1 = require("./board-id.js");
const board_serial_info_js_1 = require("./board-serial-info.js");
const vitest_1 = require("vitest");
(0, vitest_1.describe)("BoardSerialInfo", () => {
    const valid = {
        serialNumber: "9904360251974e450039900a00000041000000009796990b",
    };
    const weirdLength = {
        serialNumber: "9904360251974e450039900a000000410000000097969",
    };
    const missing = { serialNumber: "" };
    const log = vitest_1.vi.fn();
    (0, vitest_1.afterEach)(() => {
        log.mockReset();
    });
    (0, vitest_1.it)("throws if serialNumber missing", () => {
        (0, vitest_1.expect)(() => board_serial_info_js_1.BoardSerialInfo.parse(missing, log)).toThrowError();
        (0, vitest_1.expect)(log.mock.calls).toEqual([]);
    });
    (0, vitest_1.it)("parses serials", () => {
        const result = board_serial_info_js_1.BoardSerialInfo.parse(valid, log);
        (0, vitest_1.expect)(result).toEqual({
            id: board_id_js_1.BoardId.parse("9904"),
            familyId: "3602",
            hic: "9796990b",
        });
        (0, vitest_1.expect)(log.mock.calls).toEqual([]);
    });
    (0, vitest_1.it)("logs if unexpected length", () => {
        const result = board_serial_info_js_1.BoardSerialInfo.parse(weirdLength, log);
        (0, vitest_1.expect)(result).toEqual({
            id: board_id_js_1.BoardId.parse("9904"),
            familyId: "3602",
            hic: "00097969",
        });
        (0, vitest_1.expect)(log.mock.calls).toEqual([
            ["USB serial number unexpected length: 45"],
        ]);
    });
});
//# sourceMappingURL=board-serial-info.test.js.map