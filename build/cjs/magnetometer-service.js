"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MagnetometerService = void 0;
const magnetometer_js_1 = require("./magnetometer.js");
const bluetooth_profile_js_1 = require("./bluetooth-profile.js");
const device_js_1 = require("./device.js");
class MagnetometerService {
    constructor(magnetometerDataCharacteristic, magnetometerPeriodCharacteristic, magnetometerBearingCharacteristic, magnetometerCalibrationCharacteristic, dispatchTypedEvent, queueGattOperation) {
        Object.defineProperty(this, "magnetometerDataCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: magnetometerDataCharacteristic
        });
        Object.defineProperty(this, "magnetometerPeriodCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: magnetometerPeriodCharacteristic
        });
        Object.defineProperty(this, "magnetometerBearingCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: magnetometerBearingCharacteristic
        });
        Object.defineProperty(this, "magnetometerCalibrationCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: magnetometerCalibrationCharacteristic
        });
        Object.defineProperty(this, "dispatchTypedEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dispatchTypedEvent
        });
        Object.defineProperty(this, "queueGattOperation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: queueGattOperation
        });
        this.magnetometerDataCharacteristic.addEventListener("characteristicvaluechanged", (event) => {
            const target = event.target;
            const data = this.dataViewToData(target.value);
            this.dispatchTypedEvent("magnetometerdatachanged", new magnetometer_js_1.MagnetometerDataEvent(data));
        });
    }
    static async createService(gattServer, dispatcher, queueGattOperation, listenerInit) {
        let magnetometerService;
        try {
            magnetometerService = await gattServer.getPrimaryService(bluetooth_profile_js_1.profile.magnetometer.id);
        }
        catch (err) {
            if (listenerInit) {
                dispatcher("backgrounderror", new device_js_1.BackgroundErrorEvent(err));
                return;
            }
            else {
                throw new device_js_1.DeviceError({
                    code: "service-missing",
                    message: err,
                });
            }
        }
        const magnetometerDataCharacteristic = await magnetometerService.getCharacteristic(bluetooth_profile_js_1.profile.magnetometer.characteristics.data.id);
        const magnetometerPeriodCharacteristic = await magnetometerService.getCharacteristic(bluetooth_profile_js_1.profile.magnetometer.characteristics.period.id);
        const magnetometerBearingCharacteristic = await magnetometerService.getCharacteristic(bluetooth_profile_js_1.profile.magnetometer.characteristics.bearing.id);
        const magnetometerCalibrationCharacteristic = await magnetometerService.getCharacteristic(bluetooth_profile_js_1.profile.magnetometer.characteristics.calibration.id);
        return new MagnetometerService(magnetometerDataCharacteristic, magnetometerPeriodCharacteristic, magnetometerBearingCharacteristic, magnetometerCalibrationCharacteristic, dispatcher, queueGattOperation);
    }
    dataViewToData(dataView) {
        return {
            x: dataView.getInt16(0, true),
            y: dataView.getInt16(2, true),
            z: dataView.getInt16(4, true),
        };
    }
    async getData() {
        const dataView = await this.queueGattOperation(() => this.magnetometerDataCharacteristic.readValue());
        return this.dataViewToData(dataView);
    }
    async getPeriod() {
        const dataView = await this.queueGattOperation(() => this.magnetometerPeriodCharacteristic.readValue());
        return dataView.getUint16(0, true);
    }
    async setPeriod(value) {
        if (value === 0) {
            // Writing 0 causes the device to crash.
            return;
        }
        // Allowed values: 10, 20, 50, 100
        // Values passed are rounded up to the allowed values on device.
        // Documentation for allowed values looks wrong.
        // https://lancaster-university.github.io/microbit-docs/ble/profile/#about-the-magnetometer-service
        const dataView = new DataView(new ArrayBuffer(2));
        dataView.setUint16(0, value, true);
        return this.queueGattOperation(() => this.magnetometerPeriodCharacteristic.writeValue(dataView));
    }
    async getBearing() {
        const dataView = await this.queueGattOperation(() => this.magnetometerBearingCharacteristic.readValue());
        return dataView.getUint16(0, true);
    }
    async triggerCalibration() {
        const dataView = new DataView(new ArrayBuffer(1));
        dataView.setUint8(0, 1);
        return this.queueGattOperation(() => this.magnetometerCalibrationCharacteristic.writeValue(dataView));
    }
    async startNotifications(type) {
        await this.characteristicForEvent(type)?.startNotifications();
    }
    async stopNotifications(type) {
        await this.characteristicForEvent(type)?.stopNotifications();
    }
    characteristicForEvent(type) {
        switch (type) {
            case "magnetometerdatachanged": {
                return this.magnetometerDataCharacteristic;
            }
            default: {
                return undefined;
            }
        }
    }
}
exports.MagnetometerService = MagnetometerService;
//# sourceMappingURL=magnetometer-service.js.map