import { AccelerometerDataEvent } from "./accelerometer.js";
import { profile } from "./bluetooth-profile.js";
import { BackgroundErrorEvent, DeviceError } from "./device.js";
export class AccelerometerService {
    constructor(accelerometerDataCharacteristic, accelerometerPeriodCharacteristic, dispatchTypedEvent, queueGattOperation) {
        Object.defineProperty(this, "accelerometerDataCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: accelerometerDataCharacteristic
        });
        Object.defineProperty(this, "accelerometerPeriodCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: accelerometerPeriodCharacteristic
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
        this.accelerometerDataCharacteristic.addEventListener("characteristicvaluechanged", (event) => {
            const target = event.target;
            const data = this.dataViewToData(target.value);
            this.dispatchTypedEvent("accelerometerdatachanged", new AccelerometerDataEvent(data));
        });
    }
    static async createService(gattServer, dispatcher, queueGattOperation, listenerInit) {
        let accelerometerService;
        try {
            accelerometerService = await gattServer.getPrimaryService(profile.accelerometer.id);
        }
        catch (err) {
            if (listenerInit) {
                dispatcher("backgrounderror", new BackgroundErrorEvent(err));
                return;
            }
            else {
                throw new DeviceError({
                    code: "service-missing",
                    message: err,
                });
            }
        }
        const accelerometerDataCharacteristic = await accelerometerService.getCharacteristic(profile.accelerometer.characteristics.data.id);
        const accelerometerPeriodCharacteristic = await accelerometerService.getCharacteristic(profile.accelerometer.characteristics.period.id);
        return new AccelerometerService(accelerometerDataCharacteristic, accelerometerPeriodCharacteristic, dispatcher, queueGattOperation);
    }
    dataViewToData(dataView) {
        return {
            x: dataView.getInt16(0, true),
            y: dataView.getInt16(2, true),
            z: dataView.getInt16(4, true),
        };
    }
    async getData() {
        const dataView = await this.queueGattOperation(() => this.accelerometerDataCharacteristic.readValue());
        return this.dataViewToData(dataView);
    }
    async getPeriod() {
        const dataView = await this.queueGattOperation(() => this.accelerometerPeriodCharacteristic.readValue());
        return dataView.getUint16(0, true);
    }
    async setPeriod(value) {
        if (value === 0) {
            // Writing 0 causes the device to crash.
            return;
        }
        // Allowed values: 2, 5, 10, 20, 40, 100, 1000
        // Values passed are rounded up to the allowed values on device.
        // Documentation for allowed values looks wrong.
        // https://lancaster-university.github.io/microbit-docs/ble/profile/#about-the-accelerometer-service
        const dataView = new DataView(new ArrayBuffer(2));
        dataView.setUint16(0, value, true);
        return this.queueGattOperation(() => this.accelerometerPeriodCharacteristic.writeValue(dataView));
    }
    async startNotifications(type) {
        await this.characteristicForEvent(type)?.startNotifications();
    }
    async stopNotifications(type) {
        await this.characteristicForEvent(type)?.stopNotifications();
    }
    characteristicForEvent(type) {
        switch (type) {
            case "accelerometerdatachanged": {
                return this.accelerometerDataCharacteristic;
            }
            default: {
                return undefined;
            }
        }
    }
}
//# sourceMappingURL=accelerometer-service.js.map