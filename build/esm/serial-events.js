export class SerialDataEvent extends Event {
    constructor(data) {
        super("serialdata");
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: data
        });
    }
}
export class SerialResetEvent extends Event {
    constructor() {
        super("serialreset");
    }
}
export class SerialErrorEvent extends Event {
    constructor(error) {
        super("serialerror");
        Object.defineProperty(this, "error", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: error
        });
    }
}
export class FlashEvent extends Event {
    constructor() {
        super("flash");
    }
}
export class SerialConnectionEventMap {
    constructor() {
        Object.defineProperty(this, "serialdata", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serialreset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serialerror", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "flash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
//# sourceMappingURL=serial-events.js.map