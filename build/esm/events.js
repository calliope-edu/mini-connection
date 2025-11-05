/**
 * Copyright (c) 2022 Jonas "DerZade" Schade
 *
 * SPDX-License-Identifier: MIT
 *
 * https://github.com/DerZade/typescript-event-target/blob/master/src/TypedEventTarget.ts
 */
// We've added this in to keep track of what events are active.
// Having done this it's questionable whether it's worth the reimplementation
// just to use an EventTarget API.
export class TrackingEventTarget extends EventTarget {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "activeEventTracking", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    addEventListener(type, callback, options) {
        if (callback !== null) {
            const registrations = this.activeEventTracking.get(type) ?? [];
            const wasEmpty = registrations.length === 0;
            const registration = new Registration(callback, options ?? false);
            if (!registrations.find((r) => r.eq(registration))) {
                registrations.push(registration);
                this.activeEventTracking.set(type, registrations);
                if (wasEmpty) {
                    this.eventActivated(type);
                }
            }
        }
        super.addEventListener(type, callback, options);
    }
    removeEventListener(type, callback, options) {
        if (callback !== null) {
            const registration = new Registration(callback, options ?? false);
            this.filterRegistrations(type, (r) => !r.eq(registration));
        }
        super.removeEventListener(type, callback, options);
    }
    dispatchEvent(event) {
        const result = super.dispatchEvent(event);
        this.filterRegistrations(event.type, (r) => !r.isOnce());
        return result;
    }
    filterRegistrations(type, predicate) {
        let registrations = this.activeEventTracking.get(type) ?? [];
        registrations = registrations.filter(predicate);
        if (registrations.length === 0) {
            this.activeEventTracking.delete(type);
            this.eventDeactivated(type);
        }
        else {
            this.activeEventTracking.set(type, registrations);
        }
    }
    eventActivated(type) { }
    eventDeactivated(type) { }
    getActiveEvents() {
        return [...this.activeEventTracking.keys()];
    }
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class TypedEventTarget extends TrackingEventTarget {
    /**
     * Dispatches a synthetic event event to target and returns true if either
     * event's cancelable attribute value is false or its preventDefault() method
     * was not invoked, and false otherwise.
     */
    dispatchTypedEvent(_type, event) {
        return super.dispatchEvent(event);
    }
}
class Registration {
    constructor(callback, options) {
        Object.defineProperty(this, "callback", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: callback
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: options
        });
    }
    isOnce() {
        return typeof this.options === "object" && this.options.once === true;
    }
    eq(other) {
        return (other.callback === this.callback &&
            eqUseCapture(this.options, other.options));
    }
}
const eqUseCapture = (left, right) => {
    const leftValue = typeof left === "boolean" ? left : left.capture ?? false;
    const rightValue = typeof right === "boolean" ? right : right.capture ?? false;
    return leftValue === rightValue;
};
//# sourceMappingURL=events.js.map