"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UARTDataEvent = void 0;
class UARTDataEvent extends Event {
    constructor(value) {
        super("uartdata");
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
        });
    }
}
exports.UARTDataEvent = UARTDataEvent;
//# sourceMappingURL=uart.js.map