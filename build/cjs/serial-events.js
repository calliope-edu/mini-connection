"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialConnectionEventMap = exports.FlashEvent = exports.SerialErrorEvent = exports.SerialResetEvent = exports.SerialDataEvent = void 0;
class SerialDataEvent extends Event {
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
exports.SerialDataEvent = SerialDataEvent;
class SerialResetEvent extends Event {
    constructor() {
        super("serialreset");
    }
}
exports.SerialResetEvent = SerialResetEvent;
class SerialErrorEvent extends Event {
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
exports.SerialErrorEvent = SerialErrorEvent;
class FlashEvent extends Event {
    constructor() {
        super("flash");
    }
}
exports.FlashEvent = FlashEvent;
class SerialConnectionEventMap {
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
exports.SerialConnectionEventMap = SerialConnectionEventMap;
//# sourceMappingURL=serial-events.js.map