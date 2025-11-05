/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export type SplittedMessages = {
    messages: string[];
    remainingInput: string;
};
export declare enum CommandTypes {
    Handshake = "HS",
    RadioFrequency = "RF",
    RemoteMbId = "RMBID",
    SoftwareVersion = "SWVER",
    HardwareVersion = "HWVER",
    Zstart = "ZSTART",
    Stop = "STOP"
}
declare enum ResponseExtraTypes {
    Error = "ERROR"
}
export type ResponseTypes = CommandTypes | ResponseExtraTypes;
export declare const ResponseTypes: {
    Error: ResponseExtraTypes.Error;
    Handshake: CommandTypes.Handshake;
    RadioFrequency: CommandTypes.RadioFrequency;
    RemoteMbId: CommandTypes.RemoteMbId;
    SoftwareVersion: CommandTypes.SoftwareVersion;
    HardwareVersion: CommandTypes.HardwareVersion;
    Zstart: CommandTypes.Zstart;
    Stop: CommandTypes.Stop;
};
export type MessageCmd = {
    message: string;
    messageId: number;
    type: CommandTypes;
    value: number | string;
};
export type MessageResponse = {
    message: string;
    messageId: number;
    type: ResponseTypes;
    value: number | string;
};
export type MicrobitSensors = {
    accelerometer: boolean;
    buttons: boolean;
};
export type MicrobitSensorState = {
    accelerometerX: number;
    accelerometerY: number;
    accelerometerZ: number;
    buttonA: number;
    buttonB: number;
};
export declare const version = 1;
export declare const splitMessages: (message: string) => SplittedMessages;
export declare const processResponseMessage: (message: string) => MessageResponse | undefined;
export declare const processPeriodicMessage: (message: string) => MicrobitSensorState | undefined;
export declare const generateCmdHandshake: () => MessageCmd;
export declare const generateCmdStart: (sensors: MicrobitSensors) => MessageCmd;
export declare const generateCmdStop: () => MessageCmd;
export declare const generateCmdRadioFrequency: (frequency: number) => MessageCmd;
export declare const generateCmdRemoteMbId: (remoteMicrobitId: number) => MessageCmd;
export declare const generateRandomRadioFrequency: () => number;
export {};
