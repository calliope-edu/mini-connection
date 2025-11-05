export class AccelerometerDataEvent extends Event {
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
//# sourceMappingURL=accelerometer.js.map