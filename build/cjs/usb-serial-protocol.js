"use strict";
/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomRadioFrequency = exports.generateCmdRemoteMbId = exports.generateCmdRadioFrequency = exports.generateCmdStop = exports.generateCmdStart = exports.generateCmdHandshake = exports.processPeriodicMessage = exports.processResponseMessage = exports.splitMessages = exports.version = exports.ResponseTypes = exports.CommandTypes = void 0;
var MessageTypes;
(function (MessageTypes) {
    MessageTypes["Command"] = "C";
    MessageTypes["Response"] = "R";
    MessageTypes["Periodic"] = "P";
})(MessageTypes || (MessageTypes = {}));
var CommandTypes;
(function (CommandTypes) {
    CommandTypes["Handshake"] = "HS";
    CommandTypes["RadioFrequency"] = "RF";
    CommandTypes["RemoteMbId"] = "RMBID";
    CommandTypes["SoftwareVersion"] = "SWVER";
    CommandTypes["HardwareVersion"] = "HWVER";
    CommandTypes["Zstart"] = "ZSTART";
    CommandTypes["Stop"] = "STOP";
})(CommandTypes || (exports.CommandTypes = CommandTypes = {}));
var ResponseExtraTypes;
(function (ResponseExtraTypes) {
    ResponseExtraTypes["Error"] = "ERROR";
})(ResponseExtraTypes || (ResponseExtraTypes = {}));
exports.ResponseTypes = { ...CommandTypes, ...ResponseExtraTypes };
// Currently implemented protocol version
exports.version = 1;
const splitMessages = (message) => {
    if (!message) {
        return {
            messages: [],
            remainingInput: "",
        };
    }
    let messages = message.split("\n");
    let remainingInput = messages.pop() || "";
    // Throw away any empty messages and messages that don't start with a valid type
    messages = messages.filter((msg) => msg.length > 0 &&
        Object.values(MessageTypes).includes(msg[0]));
    // Any remaining input will be the start of the next message, so if it doesn't start
    // with a valid type throw it away as it'll be prepended to the next serial string
    if (remainingInput.length > 0 &&
        !Object.values(MessageTypes).includes(remainingInput[0])) {
        remainingInput = "";
    }
    return {
        messages,
        remainingInput,
    };
};
exports.splitMessages = splitMessages;
const processResponseMessage = (message) => {
    // Regex for a message response with 3 groups:
    // id    -> The message ID, 1-8 hex characters
    // cmd   -> The command type, a string, only capital letters, matching CommandTypes
    // value -> The response value, empty string or a word, number,
    //          or version (e.g 1.2.3) depending on the command type
    const responseMatch = /^R\[(?<id>[0-9A-Fa-f]{1,8})\](?<cmd>[A-Z]+)\[(?<value>-?[\w.]*)\]$/.exec(message);
    if (!responseMatch || !responseMatch.groups) {
        return undefined;
    }
    const messageId = parseInt(responseMatch.groups["id"], 16);
    if (isNaN(messageId)) {
        return undefined;
    }
    const responseType = responseMatch.groups["cmd"];
    if (!Object.values(exports.ResponseTypes).includes(responseType)) {
        return undefined;
    }
    let value = responseMatch.groups["value"];
    switch (responseType) {
        // Commands with numeric values
        case exports.ResponseTypes.Handshake:
        case exports.ResponseTypes.RadioFrequency:
        case exports.ResponseTypes.RemoteMbId:
        case exports.ResponseTypes.HardwareVersion:
        case exports.ResponseTypes.Error:
            value = Number(value);
            if (isNaN(value) || value < 0 || value > 0xffffffff) {
                return undefined;
            }
            break;
        // Commands without values
        case exports.ResponseTypes.Zstart:
        case exports.ResponseTypes.Stop:
            if (value !== "") {
                return undefined;
            }
            break;
        // Semver-ish values (valid range 00.00.00 to 99.99.99)
        case exports.ResponseTypes.SoftwareVersion:
            if (!/^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}$/.test(value)) {
                return undefined;
            }
            break;
    }
    return {
        message,
        messageId,
        type: responseType,
        value,
    };
};
exports.processResponseMessage = processResponseMessage;
const processPeriodicMessage = (message) => {
    // Basic checks to match the message being a compact periodic message
    if (message.length !== 13 || message[0] !== MessageTypes.Periodic) {
        return undefined;
    }
    // All characters except the first one should be hex
    if (!/^[0-9A-Fa-f]+$/.test(message.substring(1))) {
        return undefined;
    }
    // Only the two Least Significant Bits from the buttons are used
    const buttons = parseInt(message[12], 16);
    if (buttons > 3) {
        return undefined;
    }
    return {
        // The accelerometer data has been clamped to -2048 to 2047, and an offset
        // added to make the values positive, so that needs to be reversed
        accelerometerX: parseInt(message.substring(3, 6), 16) - 2048,
        accelerometerY: parseInt(message.substring(6, 9), 16) - 2048,
        accelerometerZ: parseInt(message.substring(9, 12), 16) - 2048,
        // Button A is the LSB, button B is the next bit
        buttonA: buttons & 1,
        buttonB: (buttons >> 1) & 1,
    };
};
exports.processPeriodicMessage = processPeriodicMessage;
const generateCommand = (cmdType, cmdData = "") => {
    // Generate an random (enough) ID with max value of 8 hex digits
    const msgID = Math.floor(Math.random() * 0xffffffff);
    return {
        message: `C[${msgID.toString(16).toUpperCase()}]${cmdType}[${cmdData}]\n`,
        messageId: msgID,
        type: cmdType,
        value: cmdData,
    };
};
const generateCmdHandshake = () => {
    return generateCommand(CommandTypes.Handshake);
};
exports.generateCmdHandshake = generateCmdHandshake;
const generateCmdStart = (sensors) => {
    let cmdData = "";
    if (sensors.accelerometer) {
        cmdData += "A";
    }
    if (sensors.buttons) {
        cmdData += "B";
    }
    return generateCommand(CommandTypes.Zstart, cmdData);
};
exports.generateCmdStart = generateCmdStart;
const generateCmdStop = () => {
    return generateCommand(CommandTypes.Stop);
};
exports.generateCmdStop = generateCmdStop;
const generateCmdRadioFrequency = (frequency) => {
    if (frequency < 0 || frequency > 83) {
        throw new Error("Radio frequency out of range");
    }
    return generateCommand(CommandTypes.RadioFrequency, frequency.toString());
};
exports.generateCmdRadioFrequency = generateCmdRadioFrequency;
const generateCmdRemoteMbId = (remoteMicrobitId) => {
    if (remoteMicrobitId < 0 || remoteMicrobitId > 0xffffffff) {
        throw new Error("Remote micro:bit ID out of range");
    }
    return generateCommand(CommandTypes.RemoteMbId, remoteMicrobitId.toString());
};
exports.generateCmdRemoteMbId = generateCmdRemoteMbId;
const generateRandomRadioFrequency = () => {
    // The value range for radio frequencies is 0 to 83
    return Math.floor(Math.random() * 84);
};
exports.generateRandomRadioFrequency = generateRandomRadioFrequency;
//# sourceMappingURL=usb-serial-protocol.js.map