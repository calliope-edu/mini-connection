"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MagnetometerDataEvent = void 0;
class MagnetometerDataEvent extends Event {
    constructor(data) {
        super("magnetometerdatachanged");
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: data
        });
    }
}
exports.MagnetometerDataEvent = MagnetometerDataEvent;
//# sourceMappingURL=magnetometer.js.map