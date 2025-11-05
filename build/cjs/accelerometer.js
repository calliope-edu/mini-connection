"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccelerometerDataEvent = void 0;
class AccelerometerDataEvent extends Event {
    constructor(data) {
        super("accelerometerdatachanged");
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: data
        });
    }
}
exports.AccelerometerDataEvent = AccelerometerDataEvent;
//# sourceMappingURL=accelerometer.js.map