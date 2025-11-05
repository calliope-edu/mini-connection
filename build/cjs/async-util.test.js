"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
const vitest_1 = require("vitest");
const async_util_js_1 = require("./async-util.js");
(0, vitest_1.describe)("withTimeout", () => {
    (0, vitest_1.it)("times out", async () => {
        const neverResolves = new Promise(() => { });
        await (0, vitest_1.expect)(() => (0, async_util_js_1.withTimeout)(neverResolves, 0)).rejects.toThrowError(async_util_js_1.TimeoutError);
    });
    (0, vitest_1.it)("returns the value", async () => {
        const resolvesWithValue = async () => "foo";
        (0, vitest_1.expect)(await (0, async_util_js_1.withTimeout)(resolvesWithValue(), 10)).toEqual("foo");
    });
});
//# sourceMappingURL=async-util.test.js.map