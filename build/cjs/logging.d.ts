/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export interface LoggingEvent {
    type: string;
    message?: string;
    value?: number;
    detail?: any;
}
export interface Logging {
    event(event: LoggingEvent): void;
    error(message: string, e: unknown): void;
    log(e: any): void;
}
export declare class NullLogging implements Logging {
    event(_event: LoggingEvent): void;
    error(_m: string, _e: unknown): void;
    log(_e: any): void;
}
