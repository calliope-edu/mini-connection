/**
 * Error type used for all interactions with this module.
 *
 * The code indicates the error type and may be suitable for providing
 * translated error messages.
 *
 * The message is the underlying message text and will usually be in
 * English.
 */
export class DeviceError extends Error {
    constructor({ code, message }) {
        super(message);
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.code = code;
    }
}
/**
 * Tracks connection status,
 */
export var ConnectionStatus;
(function (ConnectionStatus) {
    /**
     * Determining whether the connection type is supported requires
     * initialize() to complete.
     */
    ConnectionStatus["SUPPORT_NOT_KNOWN"] = "SUPPORT_NOT_KNOWN";
    /**
     * Not supported.
     */
    ConnectionStatus["NOT_SUPPORTED"] = "NOT_SUPPORTED";
    /**
     * Supported but no device available.
     *
     * This will be the case even when a device is physically connected
     * but has not been connected via the browser security UI.
     */
    ConnectionStatus["NO_AUTHORIZED_DEVICE"] = "NO_AUTHORIZED_DEVICE";
    /**
     * Authorized device available but we haven't connected to it.
     */
    ConnectionStatus["DISCONNECTED"] = "DISCONNECTED";
    /**
     * Connected.
     */
    ConnectionStatus["CONNECTED"] = "CONNECTED";
    /**
     * Connecting.
     */
    ConnectionStatus["CONNECTING"] = "CONNECTING";
    /**
     * Reconnecting. When there is unexpected disruption in the connection,
     * a reconnection is attempted.
     */
    ConnectionStatus["RECONNECTING"] = "RECONNECTING";
})(ConnectionStatus || (ConnectionStatus = {}));
export class FlashDataError extends Error {
}
export class ConnectionStatusEvent extends Event {
    constructor(status) {
        super("status");
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
    }
}
export class BeforeRequestDevice extends Event {
    constructor() {
        super("beforerequestdevice");
    }
}
export class AfterRequestDevice extends Event {
    constructor() {
        super("afterrequestdevice");
    }
}
export class BackgroundErrorEvent extends Event {
    constructor(errorMessage) {
        super("backgrounderror");
        Object.defineProperty(this, "errorMessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: errorMessage
        });
    }
}
export class DeviceConnectionEventMap {
    constructor() {
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "backgrounderror", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "beforerequestdevice", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "afterrequestdevice", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
//# sourceMappingURL=device.js.map