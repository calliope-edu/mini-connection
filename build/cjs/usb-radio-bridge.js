"use strict";
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRadioBridgeConnection = void 0;
const accelerometer_js_1 = require("./accelerometer.js");
const buttons_js_1 = require("./buttons.js");
const device_js_1 = require("./device.js");
const events_js_1 = require("./events.js");
const logging_js_1 = require("./logging.js");
const protocol = __importStar(require("./usb-serial-protocol.js"));
const connectTimeoutDuration = 10000;
class BridgeError extends Error {
}
class RemoteError extends Error {
}
/**
 * A radio bridge connection factory.
 */
const createRadioBridgeConnection = (delegate, options) => new MicrobitRadioBridgeConnectionImpl(delegate, options);
exports.createRadioBridgeConnection = createRadioBridgeConnection;
/**
 * Wraps around a USB connection to implement a subset of services over a serial protocol.
 *
 * When it connects/disconnects it affects the delegate connection.
 */
class MicrobitRadioBridgeConnectionImpl extends events_js_1.TypedEventTarget {
    constructor(delegate, options) {
        super();
        Object.defineProperty(this, "delegate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: delegate
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logging", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serialSession", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "remoteDeviceId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "disconnectPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serialSessionOpen", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "ignoreDelegateStatus", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "delegateStatusListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                if (this.ignoreDelegateStatus) {
                    return;
                }
                const currentStatus = this.status;
                if (e.status !== device_js_1.ConnectionStatus.CONNECTED) {
                    this.setStatus(e.status);
                    if (this.serialSessionOpen) {
                        // If the session is already closed we don't need to dispose.
                        this.serialSession?.dispose();
                    }
                }
                else {
                    this.status = device_js_1.ConnectionStatus.DISCONNECTED;
                    if (currentStatus === device_js_1.ConnectionStatus.DISCONNECTED &&
                        this.serialSessionOpen) {
                        this.serialSession?.connect();
                    }
                }
            }
        });
        this.logging = options?.logging ?? new logging_js_1.NullLogging();
        this.status = this.statusFromDelegate();
    }
    getBoardVersion() {
        return this.delegate.getBoardVersion();
    }
    serialWrite(data) {
        return this.delegate.serialWrite(data);
    }
    async initialize() {
        await this.delegate.initialize();
        this.setStatus(this.statusFromDelegate());
        this.delegate.addEventListener("status", this.delegateStatusListener);
    }
    dispose() {
        this.delegate.removeEventListener("status", this.delegateStatusListener);
        this.delegate.dispose();
    }
    clearDevice() {
        this.delegate.clearDevice();
    }
    setRemoteDeviceId(remoteDeviceId) {
        this.remoteDeviceId = remoteDeviceId;
    }
    async connect() {
        if (this.disconnectPromise) {
            await this.disconnectPromise;
        }
        // TODO: previously this skipped overlapping connect attempts but that seems awkward
        // can we... just not do that? or wait?
        if (this.remoteDeviceId === undefined) {
            throw new BridgeError(`Missing remote micro:bit ID`);
        }
        this.logging.event({
            type: "Connect",
            message: "Serial connect start",
        });
        this.ignoreDelegateStatus = false;
        await this.delegate.connect();
        try {
            this.serialSession = new RadioBridgeSerialSession(this.logging, this.remoteDeviceId, this.delegate, this.dispatchTypedEvent.bind(this), {
                onConnecting: () => this.setStatus(device_js_1.ConnectionStatus.CONNECTING),
                onReconnecting: () => {
                    // Leave serial connection running in case the remote device comes back.
                    if (this.status !== device_js_1.ConnectionStatus.RECONNECTING) {
                        this.setStatus(device_js_1.ConnectionStatus.RECONNECTING);
                    }
                },
                onRestartConnection: () => {
                    // So that serial session does not get repetitively disposed in
                    // delegate status listener when delegate is disconnected for restarting connection
                    this.ignoreDelegateStatus = true;
                },
                onFail: () => {
                    if (this.status !== device_js_1.ConnectionStatus.DISCONNECTED) {
                        this.setStatus(device_js_1.ConnectionStatus.DISCONNECTED);
                    }
                    this.ignoreDelegateStatus = false;
                    this.serialSessionOpen = false;
                },
                onSuccess: () => {
                    if (this.status !== device_js_1.ConnectionStatus.CONNECTED) {
                        this.setStatus(device_js_1.ConnectionStatus.CONNECTED);
                    }
                    this.ignoreDelegateStatus = false;
                    this.serialSessionOpen = true;
                },
            });
            await this.serialSession.connect();
            this.logging.event({
                type: "Connect",
                message: "Serial connect success",
            });
            return this.status;
        }
        catch (e) {
            this.serialSessionOpen = false;
            this.logging.error("Failed to initialise serial protocol", e);
            this.logging.event({
                type: "Connect",
                message: "Serial connect failed",
            });
            throw e;
        }
    }
    async disconnect() {
        if (this.disconnectPromise) {
            return this.disconnectPromise;
        }
        this.serialSessionOpen = false;
        this.disconnectPromise = (async () => {
            await this.serialSession?.dispose(true);
            this.disconnectPromise = undefined;
        })();
    }
    log(v) {
        this.logging.log(v);
    }
    setStatus(status) {
        this.status = status;
        this.log("Radio connection status " + status);
        this.dispatchTypedEvent("status", new device_js_1.ConnectionStatusEvent(status));
    }
    statusFromDelegate() {
        return this.delegate.status == device_js_1.ConnectionStatus.CONNECTED
            ? device_js_1.ConnectionStatus.DISCONNECTED
            : this.delegate.status;
    }
}
/**
 * Wraps a connected delegate for a single session from attempted serial handshake to error/dispose.
 */
class RadioBridgeSerialSession {
    processButton(button, type, sensorData) {
        if (sensorData[button] !== this.previousButtonState[button]) {
            this.previousButtonState[button] = sensorData[button];
            this.dispatchTypedEvent(type, new buttons_js_1.ButtonEvent(type, sensorData[button] ? buttons_js_1.ButtonState.ShortPress : buttons_js_1.ButtonState.NotPressed));
        }
    }
    constructor(logging, remoteDeviceId, delegate, dispatchTypedEvent, callbacks) {
        Object.defineProperty(this, "logging", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: logging
        });
        Object.defineProperty(this, "remoteDeviceId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: remoteDeviceId
        });
        Object.defineProperty(this, "delegate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: delegate
        });
        Object.defineProperty(this, "dispatchTypedEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dispatchTypedEvent
        });
        Object.defineProperty(this, "callbacks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: callbacks
        });
        Object.defineProperty(this, "unprocessedData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "previousButtonState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: { buttonA: 0, buttonB: 0 }
        });
        Object.defineProperty(this, "onPeriodicMessageReceived", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lastReceivedMessageTimestamp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "connectionCheckIntervalId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isRestartingConnection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "serialErrorListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (event) => {
                this.logging.error("Serial error", event.error);
                void this.dispose();
            }
        });
        Object.defineProperty(this, "serialDataListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (event) => {
                const { data } = event;
                const messages = protocol.splitMessages(this.unprocessedData + data);
                this.unprocessedData = messages.remainingInput;
                messages.messages.forEach(async (msg) => {
                    this.lastReceivedMessageTimestamp = Date.now();
                    // Messages are either periodic sensor data or command/response
                    const sensorData = protocol.processPeriodicMessage(msg);
                    if (sensorData) {
                        this.onPeriodicMessageReceived?.();
                        this.dispatchTypedEvent("accelerometerdatachanged", new accelerometer_js_1.AccelerometerDataEvent({
                            x: sensorData.accelerometerX,
                            y: sensorData.accelerometerY,
                            z: sensorData.accelerometerZ,
                        }));
                        this.processButton("buttonA", "buttonachanged", sensorData);
                        this.processButton("buttonB", "buttonbchanged", sensorData);
                    }
                    else {
                        const messageResponse = protocol.processResponseMessage(msg);
                        if (!messageResponse) {
                            return;
                        }
                        const responseResolve = this.responseMap.get(messageResponse.messageId);
                        if (responseResolve) {
                            this.responseMap.delete(messageResponse.messageId);
                            responseResolve(messageResponse);
                        }
                    }
                });
            }
        });
        Object.defineProperty(this, "responseMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    async connect() {
        this.delegate.addEventListener("serialdata", this.serialDataListener);
        this.delegate.addEventListener("serialerror", this.serialErrorListener);
        try {
            if (this.isRestartingConnection) {
                this.callbacks.onReconnecting();
            }
            else {
                this.callbacks.onConnecting();
            }
            await this.handshake();
            this.logging.log(`Serial: using remote device id ${this.remoteDeviceId}`);
            const remoteMbIdCommand = protocol.generateCmdRemoteMbId(this.remoteDeviceId);
            const remoteMbIdResponse = await this.sendCmdWaitResponse(remoteMbIdCommand);
            if (remoteMbIdResponse.type === protocol.ResponseTypes.Error ||
                remoteMbIdResponse.value !== this.remoteDeviceId) {
                throw new BridgeError(`Failed to set remote micro:bit ID. Expected ${this.remoteDeviceId}, got ${remoteMbIdResponse.value}`);
            }
            // Request the micro:bit to start sending the periodic messages
            const startCmd = protocol.generateCmdStart({
                accelerometer: true,
                buttons: true,
            });
            const periodicMessagePromise = new Promise((resolve, reject) => {
                this.onPeriodicMessageReceived = resolve;
                setTimeout(() => {
                    this.onPeriodicMessageReceived = undefined;
                    reject(new Error("Failed to receive data from remote micro:bit"));
                }, 500);
            });
            const startCmdResponse = await this.sendCmdWaitResponse(startCmd);
            if (startCmdResponse.type === protocol.ResponseTypes.Error) {
                throw new RemoteError(`Failed to start streaming sensors data. Error response received: ${startCmdResponse.message}`);
            }
            // TODO: in the first-time connection case we used to move the error/disconnect to the background here, why? timing?
            await periodicMessagePromise;
            this.isRestartingConnection = false;
            await this.startConnectionCheck();
            this.callbacks.onSuccess();
        }
        catch (e) {
            this.callbacks.onFail();
            await this.dispose();
        }
    }
    async dispose(disconnect = false) {
        this.stopConnectionCheck();
        try {
            await this.sendCmdWaitResponse(protocol.generateCmdStop());
        }
        catch (e) {
            // If this fails the remote micro:bit has already gone away.
        }
        this.responseMap.clear();
        this.delegate.removeEventListener("serialdata", this.serialDataListener);
        this.delegate.removeEventListener("serialerror", this.serialErrorListener);
        if (disconnect) {
            await this.delegate.disconnect();
        }
        await this.delegate.softwareReset();
    }
    async sendCmdWaitResponse(cmd) {
        const responsePromise = new Promise((resolve, reject) => {
            this.responseMap.set(cmd.messageId, resolve);
            setTimeout(() => {
                this.responseMap.delete(cmd.messageId);
                reject(new Error(`Timeout waiting for response ${cmd.messageId}`));
            }, 1_000);
        });
        await this.delegate.serialWrite(cmd.message);
        return responsePromise;
    }
    async startConnectionCheck() {
        // Check for connection lost
        if (this.connectionCheckIntervalId === undefined) {
            this.connectionCheckIntervalId = setInterval(async () => {
                if (this.lastReceivedMessageTimestamp &&
                    Date.now() - this.lastReceivedMessageTimestamp <= 1_000) {
                    this.callbacks.onSuccess();
                }
                if (this.lastReceivedMessageTimestamp &&
                    Date.now() - this.lastReceivedMessageTimestamp > 1_000) {
                    this.logging.event({
                        type: "Serial",
                        message: "Serial connection lost...attempt to reconnect",
                    });
                    this.callbacks.onReconnecting();
                }
                if (this.lastReceivedMessageTimestamp &&
                    Date.now() - this.lastReceivedMessageTimestamp >
                        connectTimeoutDuration) {
                    await this.restartConnection();
                }
            }, 1000);
        }
    }
    async restartConnection() {
        this.isRestartingConnection = true;
        this.logging.event({
            type: "Serial",
            message: "Serial connection lost...restart connection",
        });
        this.callbacks.onRestartConnection();
        await this.dispose(true);
        await this.delegate.connect();
        await this.connect();
    }
    stopConnectionCheck() {
        clearInterval(this.connectionCheckIntervalId);
        this.connectionCheckIntervalId = undefined;
        this.lastReceivedMessageTimestamp = undefined;
    }
    async handshake() {
        // There is an issue where we cannot read data out from the micro:bit serial
        // buffer until the buffer has been filled.
        // As a workaround we can spam the micro:bit with handshake messages until
        // enough responses have been queued in the buffer to fill it and the data
        // starts to flow.
        this.logging.log("Serial handshake");
        const handshakeResult = await new Promise(async (resolve, reject) => {
            const attempts = 20;
            let attemptCounter = 0;
            let failureCounter = 0;
            let resolved = false;
            while (attemptCounter < 20 && !resolved) {
                attemptCounter++;
                this.sendCmdWaitResponse(protocol.generateCmdHandshake())
                    .then((value) => {
                    if (!resolved) {
                        resolved = true;
                        resolve(value);
                    }
                })
                    .catch(() => {
                    // We expect some to time out, likely well after the handshake is completed.
                    if (!resolved) {
                        if (++failureCounter === attempts) {
                            reject(new BridgeError("Handshake not completed"));
                        }
                    }
                });
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        });
        if (handshakeResult.value !== protocol.version) {
            throw new BridgeError(`Handshake failed. Unexpected protocol version ${protocol.version}`);
        }
    }
}
//# sourceMappingURL=usb-radio-bridge.js.map