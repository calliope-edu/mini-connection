"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonService = void 0;
const bluetooth_profile_js_1 = require("./bluetooth-profile.js");
const buttons_js_1 = require("./buttons.js");
const device_js_1 = require("./device.js");
class ButtonService {
    constructor(buttonACharacteristic, buttonBCharacteristic, dispatchTypedEvent) {
        Object.defineProperty(this, "buttonACharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: buttonACharacteristic
        });
        Object.defineProperty(this, "buttonBCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: buttonBCharacteristic
        });
        Object.defineProperty(this, "dispatchTypedEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dispatchTypedEvent
        });
        for (const type of ["buttonachanged", "buttonbchanged"]) {
            this.characteristicForEvent(type)?.addEventListener("characteristicvaluechanged", (event) => {
                const target = event.target;
                const data = this.dataViewToButtonState(target.value);
                this.dispatchTypedEvent(type, new buttons_js_1.ButtonEvent(type, data));
            });
        }
    }
    static async createService(gattServer, dispatcher, queueGattOperation, listenerInit) {
        let buttonService;
        try {
            buttonService = await gattServer.getPrimaryService(bluetooth_profile_js_1.profile.button.id);
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
        const buttonACharacteristic = await buttonService.getCharacteristic(bluetooth_profile_js_1.profile.button.characteristics.a.id);
        const buttonBCharacteristic = await buttonService.getCharacteristic(bluetooth_profile_js_1.profile.button.characteristics.b.id);
        return new ButtonService(buttonACharacteristic, buttonBCharacteristic, dispatcher);
    }
    dataViewToButtonState(dataView) {
        return dataView.getUint8(0);
    }
    async startNotifications(type) {
        await this.characteristicForEvent(type)?.startNotifications();
    }
    async stopNotifications(type) {
        await this.characteristicForEvent(type)?.stopNotifications();
    }
    characteristicForEvent(type) {
        switch (type) {
            case "buttonachanged": {
                return this.buttonACharacteristic;
            }
            case "buttonbchanged": {
                return this.buttonBCharacteristic;
            }
            default: {
                return undefined;
            }
        }
    }
}
exports.ButtonService = ButtonService;
//# sourceMappingURL=button-service.js.map