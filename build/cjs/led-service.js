"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedService = void 0;
const bluetooth_profile_js_1 = require("./bluetooth-profile.js");
const device_js_1 = require("./device.js");
const createLedMatrix = () => {
    return [
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
    ];
};
class LedService {
    constructor(matrixStateCharacteristic, scrollingDelayCharacteristic, textCharactertistic, queueGattOperation) {
        Object.defineProperty(this, "matrixStateCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: matrixStateCharacteristic
        });
        Object.defineProperty(this, "scrollingDelayCharacteristic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: scrollingDelayCharacteristic
        });
        Object.defineProperty(this, "textCharactertistic", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: textCharactertistic
        });
        Object.defineProperty(this, "queueGattOperation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: queueGattOperation
        });
    }
    static async createService(gattServer, dispatcher, queueGattOperation, listenerInit) {
        let ledService;
        try {
            ledService = await gattServer.getPrimaryService(bluetooth_profile_js_1.profile.led.id);
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
        const matrixStateCharacteristic = await ledService.getCharacteristic(bluetooth_profile_js_1.profile.led.characteristics.matrixState.id);
        const scrollingDelayCharacteristic = await ledService.getCharacteristic(bluetooth_profile_js_1.profile.led.characteristics.scrollingDelay.id);
        const textCharacteristic = await ledService.getCharacteristic(bluetooth_profile_js_1.profile.led.characteristics.text.id);
        return new LedService(matrixStateCharacteristic, scrollingDelayCharacteristic, textCharacteristic, queueGattOperation);
    }
    async getLedMatrix() {
        const dataView = await this.queueGattOperation(() => this.matrixStateCharacteristic.readValue());
        return this.dataViewToLedMatrix(dataView);
    }
    async setLedMatrix(value) {
        const dataView = this.ledMatrixToDataView(value);
        return this.queueGattOperation(() => this.matrixStateCharacteristic.writeValue(dataView));
    }
    dataViewToLedMatrix(dataView) {
        if (dataView.byteLength !== 5) {
            throw new Error("Unexpected LED matrix byte length");
        }
        const matrix = createLedMatrix();
        for (let row = 0; row < 5; ++row) {
            const rowByte = dataView.getUint8(row);
            for (let column = 0; column < 5; ++column) {
                const columnMask = 0x1 << (4 - column);
                matrix[row][column] = (rowByte & columnMask) != 0;
            }
        }
        return matrix;
    }
    ledMatrixToDataView(matrix) {
        const dataView = new DataView(new ArrayBuffer(5));
        for (let row = 0; row < 5; ++row) {
            let rowByte = 0;
            for (let column = 0; column < 5; ++column) {
                const columnMask = 0x1 << (4 - column);
                if (matrix[row][column]) {
                    rowByte |= columnMask;
                }
            }
            dataView.setUint8(row, rowByte);
        }
        return dataView;
    }
    async setText(text) {
        const bytes = new TextEncoder().encode(text);
        if (bytes.length > 20) {
            throw new Error("Text must be <= 20 bytes when encoded as UTF-8");
        }
        return this.queueGattOperation(() => this.textCharactertistic.writeValue(bytes));
    }
    async setScrollingDelay(value) {
        const dataView = new DataView(new ArrayBuffer(2));
        dataView.setUint16(0, value, true);
        return this.queueGattOperation(() => this.scrollingDelayCharacteristic.writeValue(dataView));
    }
    async getScrollingDelay() {
        const dataView = await this.queueGattOperation(() => this.scrollingDelayCharacteristic.readValue());
        return dataView.getUint16(0, true);
    }
    async startNotifications(type) { }
    async stopNotifications(type) { }
}
exports.LedService = LedService;
//# sourceMappingURL=led-service.js.map