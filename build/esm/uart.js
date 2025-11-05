export class UARTDataEvent extends Event {
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
//# sourceMappingURL=uart.js.map