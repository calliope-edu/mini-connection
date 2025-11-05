"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDeviceFilters = exports.createWebUSBConnection = exports.DeviceSelectionMode = exports.isChromeOS105 = void 0;
/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
const async_util_js_1 = require("./async-util.js");
const device_js_1 = require("./device.js");
const events_js_1 = require("./events.js");
const logging_js_1 = require("./logging.js");
const promise_queue_js_1 = require("./promise-queue.js");
const serial_events_js_1 = require("./serial-events.js");
const usb_device_wrapper_js_1 = require("./usb-device-wrapper.js");
const usb_partial_flashing_js_1 = require("./usb-partial-flashing.js");
// Temporary workaround for ChromeOS 105 bug.
// See https://bugs.chromium.org/p/chromium/issues/detail?id=1363712&q=usb&can=2
const isChromeOS105 = () => {
    const userAgent = navigator.userAgent;
    return /CrOS/.test(userAgent) && /Chrome\/105\b/.test(userAgent);
};
exports.isChromeOS105 = isChromeOS105;
const defaultFilters = [
    { vendorId: 0x0d28, productId: 0x0204 }, // micro:bit & Mini 3
    {
        vendorId: 0x1366, // Segger
        productId: 0x1015 // Mini 2.0
    }, {
        vendorId: 0x1366, // Segger
        productId: 0x1025 // Mini 2.1
    }
];
var DeviceSelectionMode;
(function (DeviceSelectionMode) {
    /**
     * Attempts to connect to known device, otherwise asks which device to
     * connect to.
     */
    DeviceSelectionMode["AlwaysAsk"] = "AlwaysAsk";
    /**
     * Attempts to connect to known device, otherwise attempts to connect to any
     * allowed devices. If that fails, asks which device to connect to.
     */
    DeviceSelectionMode["UseAnyAllowed"] = "UseAnyAllowed";
})(DeviceSelectionMode || (exports.DeviceSelectionMode = DeviceSelectionMode = {}));
/**
 * A WebUSB connection factory.
 */
const createWebUSBConnection = (options) => new MicrobitWebUSBConnectionImpl(options);
exports.createWebUSBConnection = createWebUSBConnection;
/**
 * A WebUSB connection to a micro:bit device.
 */
class MicrobitWebUSBConnectionImpl extends events_js_1.TypedEventTarget {
    constructor(options = {}) {
        super();
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: navigator.usb && !(0, exports.isChromeOS105)()
                ? device_js_1.ConnectionStatus.NO_AUTHORIZED_DEVICE
                : device_js_1.ConnectionStatus.NOT_SUPPORTED
        });
        Object.defineProperty(this, "exclusionFilters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The USB device we last connected to.
         * Cleared if it is disconnected.
         */
        Object.defineProperty(this, "device", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The connection to the device.
         */
        Object.defineProperty(this, "connection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serialState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "serialStateChangeQueue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new promise_queue_js_1.PromiseQueue()
        });
        Object.defineProperty(this, "serialListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (data) => {
                this.dispatchTypedEvent("serialdata", new serial_events_js_1.SerialDataEvent(data));
            }
        });
        Object.defineProperty(this, "flashing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "disconnectAfterFlash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "visibilityReconnect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "visibilityChangeListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                if (document.visibilityState === "visible") {
                    if (this.visibilityReconnect &&
                        this.status !== device_js_1.ConnectionStatus.CONNECTED) {
                        this.disconnectAfterFlash = false;
                        this.visibilityReconnect = false;
                        if (!this.flashing) {
                            this.log("Reconnecting visible tab");
                            this.connect();
                        }
                    }
                }
                else {
                    if (!this.unloading && this.status === device_js_1.ConnectionStatus.CONNECTED) {
                        if (!this.flashing) {
                            this.log("Disconnecting hidden tab");
                            this.disconnect().then(() => {
                                this.visibilityReconnect = true;
                            });
                        }
                        else {
                            this.log("Scheduling disconnect of hidden tab for after flash");
                            this.disconnectAfterFlash = true;
                        }
                    }
                }
            }
        });
        Object.defineProperty(this, "unloading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "beforeUnloadListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                // If serial is in progress when the page unloads with V1 DAPLink 0254 or V2 0255
                // then it'll fail to reconnect with mismatched command/response errors.
                // Try hard to disconnect as a workaround.
                // https://github.com/microbit-foundation/python-editor-v3/issues/89
                this.unloading = true;
                this.stopSerialInternal();
                // The user might stay on the page if they have unsaved changes and there's another beforeunload listener.
                window.addEventListener("focus", () => {
                    const assumePageIsStayingOpenDelay = 1000;
                    setTimeout(() => {
                        if (this.status === device_js_1.ConnectionStatus.CONNECTED) {
                            this.unloading = false;
                            if (this.addedListeners.serialdata) {
                                this.startSerialInternal();
                            }
                        }
                    }, assumePageIsStayingOpenDelay);
                }, { once: true });
            }
        });
        Object.defineProperty(this, "logging", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "deviceSelectionMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "addedListeners", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                serialdata: 0,
            }
        });
        Object.defineProperty(this, "handleDisconnect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (event) => {
                if (event.device === this.device) {
                    this.connection = undefined;
                    this.device = undefined;
                    this.setStatus(device_js_1.ConnectionStatus.NO_AUTHORIZED_DEVICE);
                }
            }
        });
        this.logging = options.logging || new logging_js_1.NullLogging();
        this.deviceSelectionMode =
            options.deviceSelectionMode || DeviceSelectionMode.AlwaysAsk;
    }
    log(v) {
        this.logging.log(v);
    }
    async initialize() {
        if (navigator.usb) {
            navigator.usb.addEventListener("disconnect", this.handleDisconnect);
        }
        if (typeof window !== "undefined") {
            window.addEventListener("beforeunload", this.beforeUnloadListener);
            if (window.document) {
                window.document.addEventListener("visibilitychange", this.visibilityChangeListener);
            }
        }
    }
    dispose() {
        if (navigator.usb) {
            navigator.usb.removeEventListener("disconnect", this.handleDisconnect);
        }
        if (typeof window !== "undefined") {
            window.removeEventListener("beforeunload", this.beforeUnloadListener);
            if (window.document) {
                window.document.removeEventListener("visibilitychange", this.visibilityChangeListener);
            }
        }
    }
    setRequestDeviceExclusionFilters(exclusionFilters) {
        this.exclusionFilters = exclusionFilters;
    }
    async connect() {
        return this.withEnrichedErrors(async () => {
            await this.connectInternal();
            return this.status;
        });
    }
    getDeviceId() {
        return this.connection?.deviceId;
    }
    getDevice() {
        return this.device;
    }
    getBoardVersion() {
        return this.connection?.boardSerialInfo?.id.toBoardVersion();
    }
    async flash(dataSource, options) {
        this.flashing = true;
        try {
            const startTime = new Date().getTime();
            await this.withEnrichedErrors(() => this.flashInternal(dataSource, options));
            this.dispatchTypedEvent("flash", new serial_events_js_1.FlashEvent());
            const flashTime = new Date().getTime() - startTime;
            this.logging.event({
                type: "WebUSB-time",
                detail: {
                    flashTime,
                },
            });
            this.logging.log("Flash complete");
        }
        finally {
            this.flashing = false;
        }
    }
    async flashInternal(dataSource, options) {
        this.log("Stopping serial before flash");
        await this.stopSerialInternal();
        this.log("Reconnecting before flash");
        await this.connectInternal();
        if (!this.connection) {
            throw new Error("Must be connected now");
        }
        const partial = options.partial;
        const progress = rateLimitProgress(options.minimumProgressIncrement ?? 0.0025, options.progress || (() => { }));
        const boardId = this.connection.boardSerialInfo.id;
        const boardVersion = boardId.toBoardVersion();
        const data = await dataSource(boardVersion);
        const flashing = new usb_partial_flashing_js_1.PartialFlashing(this.connection, this.logging, boardVersion);
        let wasPartial = false;
        try {
            if (partial) {
                wasPartial = await flashing.flashAsync(data, progress);
            }
            else {
                await flashing.fullFlashAsync(data, progress);
            }
        }
        finally {
            progress(undefined, wasPartial);
            if (this.disconnectAfterFlash) {
                this.log("Disconnecting after flash due to tab visibility");
                this.disconnectAfterFlash = false;
                await this.disconnect();
                this.visibilityReconnect = true;
            }
            else {
                if (this.addedListeners.serialdata) {
                    this.log("Reinstating serial after flash");
                    if (this.connection.daplink) {
                        await this.connection.daplink.connect();
                        await this.startSerialInternal();
                    }
                }
            }
        }
    }
    async startSerialInternal() {
        return this.serialStateChangeQueue.add(async () => {
            if (!this.connection || this.serialState) {
                return;
            }
            this.log("Starting serial");
            this.serialState = true;
            this.connection
                .startSerial(this.serialListener)
                .then(() => {
                this.log("Finished listening for serial data");
            })
                .catch((e) => {
                this.dispatchTypedEvent("serialerror", new serial_events_js_1.SerialErrorEvent(e));
            })
                .finally(() => {
                this.serialState = false;
            });
        });
    }
    async stopSerialInternal() {
        return this.serialStateChangeQueue.add(async () => {
            if (!this.connection || !this.serialState) {
                return;
            }
            this.connection.stopSerial(this.serialListener);
            this.dispatchTypedEvent("serialreset", new serial_events_js_1.SerialResetEvent());
        });
    }
    async disconnect(quiet) {
        try {
            if (this.connection) {
                await this.stopSerialInternal();
                await this.connection.disconnectAsync();
            }
        }
        catch (e) {
            if (!quiet) {
                this.log("Error during disconnection:\r\n" + e);
                this.logging.event({
                    type: "WebUSB-error",
                    message: "error-disconnecting",
                });
            }
        }
        finally {
            this.connection = undefined;
            this.setStatus(device_js_1.ConnectionStatus.DISCONNECTED);
            if (!quiet) {
                this.logging.log("Disconnection complete");
                this.logging.event({
                    type: "WebUSB-info",
                    message: "disconnected",
                });
            }
        }
    }
    setStatus(newStatus) {
        this.status = newStatus;
        this.visibilityReconnect = false;
        this.log("USB connection status " + newStatus);
        this.dispatchTypedEvent("status", new device_js_1.ConnectionStatusEvent(newStatus));
    }
    async withEnrichedErrors(f) {
        try {
            return await f();
        }
        catch (e) {
            if (e instanceof device_js_1.FlashDataError) {
                throw e;
            }
            // Log error to console for feedback
            this.log("An error occurred whilst attempting to use WebUSB.");
            this.log("Details of the error can be found below, and may be useful when trying to replicate and debug the error.");
            this.log(e);
            // Disconnect from the microbit.
            // Any new connection reallocates all the internals.
            // Use the top-level API so any listeners reflect that we're disconnected.
            await this.disconnect(true);
            const enriched = enrichedError(e);
            // Sanitise error message, replace all special chars with '-', if last char is '-' remove it
            const errorMessage = e.message
                ? e.message.replace(/\W+/g, "-").replace(/\W$/, "").toLowerCase()
                : "";
            this.logging.event({
                type: "WebUSB-error",
                message: e.code + "/" + errorMessage,
            });
            throw enriched;
        }
    }
    serialWrite(data) {
        return this.withEnrichedErrors(async () => {
            if (this.connection) {
                // Using WebUSB/DAPJs we're limited to 64 byte packet size with a two byte header.
                // https://github.com/microbit-foundation/python-editor-v3/issues/215
                const maxSerialWrite = 62;
                let start = 0;
                while (start < data.length) {
                    const end = Math.min(start + maxSerialWrite, data.length);
                    const chunkData = data.slice(start, end);
                    await this.connection.daplink.serialWrite(chunkData);
                    start = end;
                }
            }
        });
    }
    async softwareReset() {
        return this.serialStateChangeQueue.add(async () => await this.connection?.softwareReset());
    }
    async clearDevice() {
        await this.disconnect();
        this.device = undefined;
        this.setStatus(device_js_1.ConnectionStatus.NO_AUTHORIZED_DEVICE);
    }
    async connectInternal() {
        if (!this.connection && this.device) {
            this.connection = new usb_device_wrapper_js_1.DAPWrapper(this.device, this.logging);
            await (0, async_util_js_1.withTimeout)(this.connection.reconnectAsync(), 10_000);
        }
        else if (!this.connection) {
            await this.connectWithOtherDevice();
        }
        else {
            await (0, async_util_js_1.withTimeout)(this.connection.reconnectAsync(), 10_000);
        }
        if (this.addedListeners.serialdata && !this.flashing) {
            this.startSerialInternal();
        }
        this.setStatus(device_js_1.ConnectionStatus.CONNECTED);
    }
    async connectWithOtherDevice() {
        if (this.deviceSelectionMode === DeviceSelectionMode.UseAnyAllowed) {
            await this.attemptConnectAllowedDevices();
        }
        if (!this.connection) {
            this.device = await this.chooseDevice();
            this.connection = new usb_device_wrapper_js_1.DAPWrapper(this.device, this.logging);
            await (0, async_util_js_1.withTimeout)(this.connection.reconnectAsync(), 10_000);
        }
    }
    // Based on: https://github.com/microsoft/pxt/blob/ab97a2422879824c730f009b15d4bf446b0e8547/pxtlib/webusb.ts#L361
    async attemptConnectAllowedDevices() {
        const pairedDevices = await this.getFilteredAllowedDevices();
        for (const device of pairedDevices) {
            const connection = await this.attemptDeviceConnection(device);
            if (connection) {
                this.device = device;
                this.connection = connection;
                return;
            }
        }
    }
    // Based on: https://github.com/microsoft/pxt/blob/ab97a2422879824c730f009b15d4bf446b0e8547/pxtlib/webusb.ts#L530
    async getFilteredAllowedDevices() {
        this.log("Retrieving previously paired USB devices");
        const devices = await navigator.usb?.getDevices();
        if (devices === undefined) {
            return [];
        }
        const filteredDevices = devices.filter((device) => (0, exports.applyDeviceFilters)(device, defaultFilters, this.exclusionFilters ?? []));
        return filteredDevices;
    }
    async attemptDeviceConnection(device) {
        this.log(`Attempting connection to: ${device.manufacturerName} ${device.productName}`);
        this.log(`Serial number: ${device.serialNumber}`);
        const connection = new usb_device_wrapper_js_1.DAPWrapper(device, this.logging);
        await (0, async_util_js_1.withTimeout)(connection.reconnectAsync(), 10_000);
        return connection;
    }
    async chooseDevice() {
        this.dispatchTypedEvent("beforerequestdevice", new device_js_1.BeforeRequestDevice());
        try {
            this.device = await navigator.usb.requestDevice({
                exclusionFilters: this.exclusionFilters,
                filters: defaultFilters,
            });
        }
        finally {
            this.dispatchTypedEvent("afterrequestdevice", new device_js_1.AfterRequestDevice());
        }
        return this.device;
    }
    eventActivated(type) {
        switch (type) {
            case "serialdata": {
                // Prevent starting serial if already started and when flashing.
                if (!this.addedListeners.serialdata && !this.flashing) {
                    this.startSerialInternal();
                }
                this.addedListeners.serialdata++;
                break;
            }
        }
    }
    async eventDeactivated(type) {
        switch (type) {
            case "serialdata": {
                this.addedListeners.serialdata--;
                if (!this.addedListeners.serialdata) {
                    this.stopSerialInternal();
                }
                break;
            }
        }
    }
}
/**
 * Applying WebUSB device filter. Exported for testing.
 * Based on: https://wicg.github.io/webusb/#enumeration
 */
const applyDeviceFilters = (device, filters, exclusionFilters) => {
    return ((filters.length === 0 ||
        filters.some((filter) => matchFilter(device, filter))) &&
        (exclusionFilters.length === 0 ||
            exclusionFilters.every((filter) => !matchFilter(device, filter))));
};
exports.applyDeviceFilters = applyDeviceFilters;
const matchFilter = (device, filter) => {
    if (filter.vendorId && device.vendorId !== filter.vendorId) {
        return false;
    }
    if (filter.productId && device.productId !== filter.productId) {
        return false;
    }
    if (filter.serialNumber && device.serialNumber !== filter.serialNumber) {
        return false;
    }
    return hasMatchingInterface(device, filter);
};
const hasMatchingInterface = (device, filter) => {
    if (filter.classCode === undefined &&
        filter.subclassCode === undefined &&
        filter.protocolCode === undefined) {
        return true;
    }
    if (!device.configuration?.interfaces) {
        return false;
    }
    return device.configuration.interfaces.some((configInterface) => {
        return configInterface.alternates?.some((alternate) => {
            const classCodeNotMatch = filter.classCode !== undefined &&
                alternate.interfaceClass !== filter.classCode;
            const subClassCodeNotMatch = filter.subclassCode !== undefined &&
                alternate.interfaceSubclass !== filter.subclassCode;
            const protocolCodeNotMatch = filter.protocolCode !== undefined &&
                alternate.interfaceProtocol !== filter.protocolCode;
            return (!classCodeNotMatch || !subClassCodeNotMatch || !protocolCodeNotMatch);
        });
    });
};
const genericErrorSuggestingReconnect = (e) => new device_js_1.DeviceError({
    code: "reconnect-microbit",
    message: e.message,
});
// tslint:disable-next-line: no-any
const enrichedError = (err) => {
    if (err instanceof device_js_1.DeviceError) {
        return err;
    }
    if (err instanceof async_util_js_1.TimeoutError) {
        return new device_js_1.DeviceError({
            code: "timeout-error",
            message: err.message,
        });
    }
    switch (typeof err) {
        case "object":
            // We might get Error objects as Promise rejection arguments
            if (!err.message && err.promise && err.reason) {
                err = err.reason;
            }
            // This is somewhat fragile but worth it for scenario specific errors.
            // These messages changed to be prefixed in 2023 so we've relaxed the checks.
            if (/No valid interfaces found/.test(err.message)) {
                // This comes from DAPjs's WebUSB open.
                return new device_js_1.DeviceError({
                    code: "update-req",
                    message: err.message,
                });
            }
            else if (/No device selected/.test(err.message)) {
                return new device_js_1.DeviceError({
                    code: "no-device-selected",
                    message: err.message,
                });
            }
            else if (/Unable to claim interface/.test(err.message)) {
                return new device_js_1.DeviceError({
                    code: "clear-connect",
                    message: err.message,
                });
            }
            else if (err.name === "device-disconnected") {
                return new device_js_1.DeviceError({
                    code: "device-disconnected",
                    message: err.message,
                });
            }
            else {
                // Unhandled error. User will need to reconnect their micro:bit
                return genericErrorSuggestingReconnect(err);
            }
        case "string": {
            // Caught a string. Example case: "Flash error" from DAPjs
            return genericErrorSuggestingReconnect(err);
        }
        default: {
            return genericErrorSuggestingReconnect(err);
        }
    }
};
const rateLimitProgress = (minimumProgressIncrement, callback) => {
    let lastCallValue = -1;
    return (value, partial) => {
        if (value === undefined ||
            value === 0 ||
            value === 1 ||
            value >= lastCallValue + minimumProgressIncrement) {
            lastCallValue = value ?? -1;
            callback(value, partial);
        }
    };
};
//# sourceMappingURL=usb.js.map