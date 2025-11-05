"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = void 0;
exports.withTimeout = withTimeout;
/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
class TimeoutError extends Error {
}
exports.TimeoutError = TimeoutError;
/**
 * Utility to time out an action after a delay.
 *
 * The action cannot be cancelled; it may still proceed after the timeout.
 */
async function withTimeout(actionPromise, timeout) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new TimeoutError());
        }, timeout);
    });
    // timeoutPromise never resolves so result must be from action
    return Promise.race([actionPromise, timeoutPromise]);
}
//# sourceMappingURL=async-util.js.map