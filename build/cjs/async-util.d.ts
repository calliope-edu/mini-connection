/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export declare class TimeoutError extends Error {
}
/**
 * Utility to time out an action after a delay.
 *
 * The action cannot be cancelled; it may still proceed after the timeout.
 */
export declare function withTimeout<T>(actionPromise: Promise<T>, timeout: number): Promise<T>;
