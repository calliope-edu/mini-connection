export class MagnetometerDataEvent extends Event {
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
//# sourceMappingURL=magnetometer.js.map