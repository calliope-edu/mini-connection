import { profile } from "./bluetooth-profile.js";
import { BackgroundErrorEvent, DeviceError } from "./device.js";
import { UARTDataEvent } from "./uart.js";
export class UARTService {
    constructor(txCharacteristic, rxCharacteristic, dispatchTypedEvent, queueGattOperation) {
        Object.defineProperty(this, "txCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: txCharacteristic
        });
        Object.defineProperty(this, "rxCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: rxCharacteristic
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
        this.txCharacteristic.addEventListener("characteristicvaluechanged", (event) => {
            const target = event.target;
            const value = new Uint8Array(target.value.buffer);
            this.dispatchTypedEvent("uartdata", new UARTDataEvent(value));
        });
    }
    static async createService(gattServer, dispatcher, queueGattOperation, listenerInit) {
        let uartService;
        try {
            uartService = await gattServer.getPrimaryService(profile.uart.id);
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
        const rxCharacteristic = await uartService.getCharacteristic(profile.uart.characteristics.rx.id);
        const txCharacteristic = await uartService.getCharacteristic(profile.uart.characteristics.tx.id);
        return new UARTService(txCharacteristic, rxCharacteristic, dispatcher, queueGattOperation);
    }
    async startNotifications(type) {
        if (type === "uartdata") {
            await this.txCharacteristic.startNotifications();
        }
    }
    async stopNotifications(type) {
        if (type === "uartdata") {
            await this.txCharacteristic.stopNotifications();
        }
    }
    async writeData(value) {
        const dataView = new DataView(value.buffer);
        return this.queueGattOperation(() => this.rxCharacteristic.writeValueWithoutResponse(dataView));
    }
}
//# sourceMappingURL=uart-service.js.map