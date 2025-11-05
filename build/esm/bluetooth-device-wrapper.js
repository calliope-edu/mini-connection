/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { AccelerometerService } from "./accelerometer-service.js";
import { profile } from "./bluetooth-profile.js";
import { ButtonService } from "./button-service.js";
import { DeviceError } from "./device.js";
import { LedService } from "./led-service.js";
import { NullLogging } from "./logging.js";
import { MagnetometerService } from "./magnetometer-service.js";
import { PromiseQueue } from "./promise-queue.js";
import { UARTService } from "./uart-service.js";
const deviceIdToWrapper = new Map();
const connectTimeoutDuration = 10000;
function findPlatform() {
    const navigator = typeof window !== "undefined" ? window.navigator : undefined;
    if (!navigator) {
        return "unknown";
    }
    const platform = navigator.userAgentData?.platform;
    if (platform) {
        return platform;
    }
    const isAndroid = /android/.test(navigator.userAgent.toLowerCase());
    return isAndroid ? "android" : navigator.platform ?? "unknown";
}
const platform = findPlatform();
const isWindowsOS = platform && /^Win/.test(platform);
class ServiceInfo {
    constructor(serviceFactory, events) {
        Object.defineProperty(this, "serviceFactory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: serviceFactory
        });
        Object.defineProperty(this, "events", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: events
        });
        Object.defineProperty(this, "service", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    get() {
        return this.service;
    }
    async createIfNeeded(gattServer, dispatcher, queueGattOperation, listenerInit) {
        this.service =
            this.service ??
                (await this.serviceFactory(gattServer, dispatcher, queueGattOperation, listenerInit));
        return this.service;
    }
    dispose() {
        this.service = undefined;
    }
}
export class BluetoothDeviceWrapper {
    constructor(device, logging = new NullLogging(), dispatchTypedEvent, currentEvents, callbacks) {
        Object.defineProperty(this, "device", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: device
        });
        Object.defineProperty(this, "logging", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: logging
        });
        Object.defineProperty(this, "dispatchTypedEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dispatchTypedEvent
        });
        Object.defineProperty(this, "currentEvents", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: currentEvents
        });
        Object.defineProperty(this, "callbacks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: callbacks
        });
        // Used to avoid automatic reconnection during user triggered connect/disconnect
        // or reconnection itself.
        Object.defineProperty(this, "duringExplicitConnectDisconnect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        // On ChromeOS and Mac there's no timeout and no clear way to abort
        // device.gatt.connect(), so we accept that sometimes we'll still
        // be trying to connect when we'd rather not be. If it succeeds when
        // we no longer intend to be connected then we disconnect at that
        // point. If we try to connect when a previous connection attempt is
        // still around then we wait for it for our timeout period.
        //
        // On Windows it times out after 7s.
        // https://bugs.chromium.org/p/chromium/issues/detail?id=684073
        Object.defineProperty(this, "gattConnectPromise", {
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
        Object.defineProperty(this, "connecting", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "isReconnect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "connectReadyPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "accelerometer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new ServiceInfo(AccelerometerService.createService, [
                "accelerometerdatachanged",
            ])
        });
        Object.defineProperty(this, "buttons", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new ServiceInfo(ButtonService.createService, [
                "buttonachanged",
                "buttonbchanged",
            ])
        });
        Object.defineProperty(this, "led", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new ServiceInfo(LedService.createService, [])
        });
        Object.defineProperty(this, "magnetometer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new ServiceInfo(MagnetometerService.createService, [
                "magnetometerdatachanged",
            ])
        });
        Object.defineProperty(this, "uart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new ServiceInfo(UARTService.createService, ["uartdata"])
        });
        Object.defineProperty(this, "serviceInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                this.accelerometer,
                this.buttons,
                this.led,
                this.magnetometer,
                this.uart,
            ]
        });
        Object.defineProperty(this, "boardVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "disconnectedRejectionErrorFactory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                return new DeviceError({
                    code: "device-disconnected",
                    message: "Error processing gatt operations queue - device disconnected",
                });
            }
        });
        Object.defineProperty(this, "gattOperations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new PromiseQueue({
                abortCheck: () => {
                    if (!this.device.gatt?.connected) {
                        return this.disconnectedRejectionErrorFactory;
                    }
                    return undefined;
                },
            })
        });
        Object.defineProperty(this, "handleDisconnectEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                try {
                    if (!this.duringExplicitConnectDisconnect) {
                        this.logging.log("Bluetooth GATT disconnected... automatically trying reconnect");
                        // stateOnReconnectionAttempt();
                        this.disposeServices();
                        await this.reconnect();
                    }
                    else {
                        this.logging.log("Bluetooth GATT disconnect ignored during explicit disconnect");
                    }
                }
                catch (e) {
                    this.logging.error("Bluetooth connect triggered by disconnect listener failed", e);
                }
            }
        });
        device.addEventListener("gattserverdisconnected", this.handleDisconnectEvent);
    }
    async connect() {
        this.logging.event({
            type: this.isReconnect ? "Reconnect" : "Connect",
            message: "Bluetooth connect start",
        });
        if (this.duringExplicitConnectDisconnect) {
            this.logging.log("Skipping connect attempt when one is already in progress");
            // Wait for the gattConnectPromise while showing a "connecting" dialog.
            // If the user clicks disconnect while the automatic reconnect is in progress,
            // then clicks reconnect, we need to wait rather than return immediately.
            await this.gattConnectPromise;
            return;
        }
        if (this.isReconnect) {
            this.callbacks.onReconnecting();
        }
        else {
            this.callbacks.onConnecting();
        }
        this.duringExplicitConnectDisconnect++;
        if (this.device.gatt === undefined) {
            throw new Error("BluetoothRemoteGATTServer for micro:bit device is undefined");
        }
        if (isWindowsOS) {
            // On Windows, the micro:bit can take around 3 seconds to respond to gatt.disconnect().
            // Attempting to connect/reconnect before the micro:bit has responded results in another
            // gattserverdisconnected event being fired. We then fail to get primaryService on a
            // disconnected GATT server.
            await this.connectReadyPromise;
        }
        try {
            // A previous connect might have completed in the background as a device was replugged etc.
            await this.disconnectPromise;
            this.gattConnectPromise =
                this.gattConnectPromise ??
                    this.device.gatt
                        .connect()
                        .then(async () => {
                        // We always do this even if we might immediately disconnect as disconnecting
                        // without using services causes getPrimaryService calls to hang on subsequent
                        // reconnect - probably a device-side issue.
                        this.boardVersion = await this.getBoardVersion();
                        // This connection could be arbitrarily later when our manual timeout may have passed.
                        // Do we still want to be connected?
                        if (!this.connecting) {
                            this.logging.log("Bluetooth GATT server connect after timeout, triggering disconnect");
                            this.disconnectPromise = (async () => {
                                await this.disconnectInternal(false);
                                this.disconnectPromise = undefined;
                            })();
                        }
                        else {
                            this.logging.log("Bluetooth GATT server connected when connecting");
                        }
                    })
                        .catch((e) => {
                        if (this.connecting) {
                            // Error will be logged by main connect error handling.
                            throw e;
                        }
                        else {
                            this.logging.error("Bluetooth GATT server connect error after our timeout", e);
                            return undefined;
                        }
                    })
                        .finally(() => {
                        this.logging.log("Bluetooth GATT server promise field cleared");
                        this.gattConnectPromise = undefined;
                    });
            this.connecting = true;
            try {
                const gattConnectResult = await Promise.race([
                    this.gattConnectPromise,
                    new Promise((resolve) => setTimeout(() => resolve("timeout"), connectTimeoutDuration)),
                ]);
                if (gattConnectResult === "timeout") {
                    this.logging.log("Bluetooth GATT server connect timeout");
                    throw new Error("Bluetooth GATT server connect timeout");
                }
            }
            finally {
                this.connecting = false;
            }
            this.currentEvents().forEach((e) => this.startNotifications(e));
            this.logging.event({
                type: this.isReconnect ? "Reconnect" : "Connect",
                message: "Bluetooth connect success",
            });
            this.callbacks.onSuccess();
        }
        catch (e) {
            this.logging.error("Bluetooth connect error", e);
            this.logging.event({
                type: this.isReconnect ? "Reconnect" : "Connect",
                message: "Bluetooth connect failed",
            });
            await this.disconnectInternal(false);
            this.callbacks.onFail();
            throw new Error("Failed to establish a connection!");
        }
        finally {
            this.duringExplicitConnectDisconnect--;
            // Reset isReconnect for next time
            this.isReconnect = false;
        }
    }
    async disconnect() {
        return this.disconnectInternal(true);
    }
    async disconnectInternal(userTriggered) {
        this.logging.log(`Bluetooth disconnect ${userTriggered ? "(user triggered)" : "(programmatic)"}`);
        this.duringExplicitConnectDisconnect++;
        try {
            if (this.device.gatt?.connected) {
                this.device.gatt?.disconnect();
            }
        }
        catch (e) {
            this.logging.error("Bluetooth GATT disconnect error (ignored)", e);
            // We might have already lost the connection.
        }
        finally {
            this.disposeServices();
            this.duringExplicitConnectDisconnect--;
        }
        this.connectReadyPromise = new Promise((resolve) => setTimeout(resolve, 3_500));
    }
    async reconnect() {
        this.logging.log("Bluetooth reconnect");
        this.isReconnect = true;
        await this.connect();
    }
    assertGattServer() {
        if (!this.device.gatt?.connected) {
            throw new Error("Could not listen to services, no microbit connected!");
        }
        return this.device.gatt;
    }
    async getBoardVersion() {
        this.assertGattServer();
        const serviceMeta = profile.deviceInformation;
        try {
            const deviceInfo = await this.assertGattServer().getPrimaryService(serviceMeta.id);
            const characteristic = await deviceInfo.getCharacteristic(serviceMeta.characteristics.modelNumber.id);
            const modelNumberBytes = await characteristic.readValue();
            const modelNumber = new TextDecoder().decode(modelNumberBytes);
            if (modelNumber.toLowerCase() === "BBC micro:bit".toLowerCase()) {
                return "V1";
            }
            // Recognize Calliope mini devices and treat as V2
            if (modelNumber.toLowerCase().includes("Calliope mini".toLowerCase())) {
                return "V2";
            }
            throw new Error(`Unexpected model number ${modelNumber}`);
        }
        catch (e) {
            this.logging.error("Could not read model number", e);
            throw new Error("Could not read model number");
        }
    }
    queueGattOperation(action) {
        // Previously we wrapped rejections with:
        // new DeviceError({ code: "background-comms-error", message: err }),
        return this.gattOperations.add(action);
    }
    createIfNeeded(info, listenerInit) {
        const gattServer = this.assertGattServer();
        return info.createIfNeeded(gattServer, this.dispatchTypedEvent, this.queueGattOperation.bind(this), listenerInit);
    }
    async getAccelerometerService() {
        return this.createIfNeeded(this.accelerometer, false);
    }
    async getLedService() {
        return this.createIfNeeded(this.led, false);
    }
    async getMagnetometerService() {
        return this.createIfNeeded(this.magnetometer, false);
    }
    async getUARTService() {
        return this.createIfNeeded(this.uart, false);
    }
    async startNotifications(type) {
        const serviceInfo = this.serviceInfo.find((s) => s.events.includes(type));
        if (serviceInfo) {
            this.queueGattOperation(async () => {
                // TODO: type cheat! why?
                const service = await this.createIfNeeded(serviceInfo, true);
                await service?.startNotifications(type);
            });
        }
    }
    async stopNotifications(type) {
        this.queueGattOperation(async () => {
            const serviceInfo = this.serviceInfo.find((s) => s.events.includes(type));
            await serviceInfo?.get()?.stopNotifications(type);
        });
    }
    disposeServices() {
        this.serviceInfo.forEach((s) => s.dispose());
        this.gattOperations.clear(this.disconnectedRejectionErrorFactory);
    }
}
export const createBluetoothDeviceWrapper = async (device, logging, dispatchTypedEvent, currentEvents, callbacks) => {
    try {
        // Reuse our connection objects for the same device as they
        // track the GATT connect promise that never resolves.
        const bluetooth = deviceIdToWrapper.get(device.id) ??
            new BluetoothDeviceWrapper(device, logging, dispatchTypedEvent, currentEvents, callbacks);
        deviceIdToWrapper.set(device.id, bluetooth);
        await bluetooth.connect();
        return bluetooth;
    }
    catch (e) {
        logging.error("Bluetooth connect error", e);
        return undefined;
    }
};
//# sourceMappingURL=bluetooth-device-wrapper.js.map