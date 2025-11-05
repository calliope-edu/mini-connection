"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebBluetoothConnection = void 0;
const bluetooth_device_wrapper_js_1 = require("./bluetooth-device-wrapper.js");
const bluetooth_profile_js_1 = require("./bluetooth-profile.js");
const device_js_1 = require("./device.js");
const events_js_1 = require("./events.js");
const logging_js_1 = require("./logging.js");
const requestDeviceTimeoutDuration = 30000;
/**
 * A Bluetooth connection factory.
 */
const createWebBluetoothConnection = (options) => new MicrobitWebBluetoothConnectionImpl(options);
exports.createWebBluetoothConnection = createWebBluetoothConnection;
/**
 * A Bluetooth connection to a micro:bit device.
 */
class MicrobitWebBluetoothConnectionImpl extends events_js_1.TypedEventTarget {
    constructor(options = {}) {
        super();
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: device_js_1.ConnectionStatus.SUPPORT_NOT_KNOWN
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
        Object.defineProperty(this, "logging", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "connection", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "availabilityListener", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                // TODO: is this called? is `value` correct?
                const value = e.value;
                this.availability = value;
            }
        });
        Object.defineProperty(this, "availability", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "nameFilter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.logging = options.logging || new logging_js_1.NullLogging();
    }
    eventActivated(type) {
        this.connection?.startNotifications(type);
    }
    eventDeactivated(type) {
        this.connection?.stopNotifications(type);
    }
    log(v) {
        this.logging.log(v);
    }
    async initialize() {
        navigator.bluetooth?.addEventListener("availabilitychanged", this.availabilityListener);
        this.availability = await navigator.bluetooth?.getAvailability();
        this.setStatus(this.availability
            ? device_js_1.ConnectionStatus.NO_AUTHORIZED_DEVICE
            : device_js_1.ConnectionStatus.NOT_SUPPORTED);
    }
    dispose() {
        navigator.bluetooth?.removeEventListener("availabilitychanged", this.availabilityListener);
    }
    async connect() {
        await this.connectInternal();
        return this.status;
    }
    getBoardVersion() {
        return this.connection?.boardVersion;
    }
    async disconnect() {
        try {
            if (this.connection) {
                await this.connection.disconnect();
            }
        }
        catch (e) {
            this.log("Error during disconnection:\r\n" + e);
            this.logging.event({
                type: "Bluetooth-error",
                message: "error-disconnecting",
            });
        }
        finally {
            this.connection = undefined;
            this.setStatus(device_js_1.ConnectionStatus.DISCONNECTED);
            this.logging.log("Disconnection complete");
            this.logging.event({
                type: "Bluetooth-info",
                message: "disconnected",
            });
        }
    }
    setStatus(newStatus) {
        this.status = newStatus;
        this.log("Bluetooth connection status " + newStatus);
        this.dispatchTypedEvent("status", new device_js_1.ConnectionStatusEvent(newStatus));
    }
    serialWrite(data) {
        if (this.connection) {
            // TODO
        }
        return Promise.resolve();
    }
    async clearDevice() {
        await this.disconnect();
        this.device = undefined;
        this.setStatus(device_js_1.ConnectionStatus.NO_AUTHORIZED_DEVICE);
    }
    async connectInternal() {
        if (!this.connection) {
            const device = await this.chooseDevice();
            if (!device) {
                this.setStatus(device_js_1.ConnectionStatus.NO_AUTHORIZED_DEVICE);
                return;
            }
            this.connection = await (0, bluetooth_device_wrapper_js_1.createBluetoothDeviceWrapper)(device, this.logging, this.dispatchTypedEvent.bind(this), () => this.getActiveEvents(), {
                onConnecting: () => this.setStatus(device_js_1.ConnectionStatus.CONNECTING),
                onReconnecting: () => this.setStatus(device_js_1.ConnectionStatus.RECONNECTING),
                onSuccess: () => this.setStatus(device_js_1.ConnectionStatus.CONNECTED),
                onFail: () => {
                    this.setStatus(device_js_1.ConnectionStatus.DISCONNECTED);
                    this.connection = undefined;
                },
            });
            return;
        }
        // TODO: timeout unification?
    }
    setNameFilter(name) {
        this.nameFilter = name;
    }
    async chooseDevice() {
        if (this.device) {
            return this.device;
        }
        this.dispatchTypedEvent("beforerequestdevice", new device_js_1.BeforeRequestDevice());
        try {
            // In some situations the Chrome device prompt simply doesn't appear so we time this out after 30 seconds and reload the page
            // TODO: give control over this to the caller
            const result = await Promise.race([
                navigator.bluetooth.requestDevice({
                    filters: [
                        {
                            namePrefix: this.nameFilter
                                ? `BBC micro:bit [${this.nameFilter}]`
                                : "BBC micro:bit",
                        },
                        {
                            // See https://github.com/bsiever/microbit-pxt-blehid/issues/31
                            namePrefix: this.nameFilter
                                ? `uBit [${this.nameFilter}]`
                                : "uBit",
                        },
                        {
                            // See https://github.com/bsiever/microbit-pxt-blehid/issues/31
                            namePrefix: this.nameFilter
                                ? `Calliope mini [${this.nameFilter}]`
                                : "Calliope mini",
                        },
                    ],
                    optionalServices: [
                        bluetooth_profile_js_1.profile.accelerometer.id,
                        bluetooth_profile_js_1.profile.button.id,
                        bluetooth_profile_js_1.profile.deviceInformation.id,
                        bluetooth_profile_js_1.profile.dfuControl.id,
                        bluetooth_profile_js_1.profile.event.id,
                        bluetooth_profile_js_1.profile.ioPin.id,
                        bluetooth_profile_js_1.profile.led.id,
                        bluetooth_profile_js_1.profile.magnetometer.id,
                        bluetooth_profile_js_1.profile.temperature.id,
                        bluetooth_profile_js_1.profile.uart.id,
                    ],
                }),
                new Promise((resolve) => setTimeout(() => resolve("timeout"), requestDeviceTimeoutDuration)),
            ]);
            if (result === "timeout") {
                // btSelectMicrobitDialogOnLoad.set(true);
                window.location.reload();
                return undefined;
            }
            this.device = result;
            return result;
        }
        catch (e) {
            this.logging.error("Bluetooth request device failed/cancelled", e);
            return undefined;
        }
        finally {
            this.dispatchTypedEvent("afterrequestdevice", new device_js_1.AfterRequestDevice());
        }
    }
    async getAccelerometerData() {
        const accelerometerService = await this.connection?.getAccelerometerService();
        return accelerometerService?.getData();
    }
    async getAccelerometerPeriod() {
        const accelerometerService = await this.connection?.getAccelerometerService();
        return accelerometerService?.getPeriod();
    }
    async setAccelerometerPeriod(value) {
        const accelerometerService = await this.connection?.getAccelerometerService();
        return accelerometerService?.setPeriod(value);
    }
    async setLedText(text) {
        const ledService = await this.connection?.getLedService();
        return ledService?.setText(text);
    }
    async getLedScrollingDelay() {
        const ledService = await this.connection?.getLedService();
        return ledService?.getScrollingDelay();
    }
    async setLedScrollingDelay(delayInMillis) {
        const ledService = await this.connection?.getLedService();
        await ledService?.setScrollingDelay(delayInMillis);
    }
    async getLedMatrix() {
        const ledService = await this.connection?.getLedService();
        return ledService?.getLedMatrix();
    }
    async setLedMatrix(matrix) {
        const ledService = await this.connection?.getLedService();
        ledService?.setLedMatrix(matrix);
    }
    async getMagnetometerData() {
        const magnetometerService = await this.connection?.getMagnetometerService();
        return magnetometerService?.getData();
    }
    async getMagnetometerPeriod() {
        const magnetometerService = await this.connection?.getMagnetometerService();
        return magnetometerService?.getPeriod();
    }
    async setMagnetometerPeriod(value) {
        const magnetometerService = await this.connection?.getMagnetometerService();
        return magnetometerService?.setPeriod(value);
    }
    async getMagnetometerBearing() {
        const magnetometerService = await this.connection?.getMagnetometerService();
        return magnetometerService?.getBearing();
    }
    async triggerMagnetometerCalibration() {
        const magnetometerService = await this.connection?.getMagnetometerService();
        return magnetometerService?.triggerCalibration();
    }
    async uartWrite(data) {
        const uartService = await this.connection?.getUARTService();
        uartService?.writeData(data);
    }
}
//# sourceMappingURL=bluetooth.js.map