"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const events_js_1 = require("./events.js");
class TestTrackingEventTarget extends events_js_1.TrackingEventTarget {
    constructor(activate, deactivate) {
        super();
        Object.defineProperty(this, "activate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: activate
        });
        Object.defineProperty(this, "deactivate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: deactivate
        });
    }
    getActiveEvents() {
        return super.getActiveEvents();
    }
    eventActivated(type) {
        this.activate(type);
    }
    eventDeactivated(type) {
        this.deactivate(type);
    }
}
(0, vitest_1.describe)("TrackingEventTarget", () => {
    const listener = () => { };
    (0, vitest_1.it)("add remove", () => {
        const activate = vitest_1.vi.fn();
        const deactivate = vitest_1.vi.fn();
        const target = new TestTrackingEventTarget(activate, deactivate);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual([]);
        target.addEventListener("foo", listener);
        (0, vitest_1.expect)(activate).toBeCalledTimes(1);
        (0, vitest_1.expect)(deactivate).toBeCalledTimes(0);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual(["foo"]);
        target.removeEventListener("foo", listener);
        (0, vitest_1.expect)(activate).toBeCalledTimes(1);
        (0, vitest_1.expect)(deactivate).toBeCalledTimes(1);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual([]);
    });
    (0, vitest_1.it)("callback equality", () => {
        const listenerAlt = () => { };
        const activate = vitest_1.vi.fn();
        const deactivate = vitest_1.vi.fn();
        const target = new TestTrackingEventTarget(activate, deactivate);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual([]);
        target.addEventListener("foo", listenerAlt);
        target.addEventListener("foo", listener);
        target.addEventListener("foo", listener);
        target.removeEventListener("foo", listener);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual(["foo"]);
        target.removeEventListener("foo", listenerAlt);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual([]);
    });
    (0, vitest_1.it)("option equality - capture", () => {
        const fooListener = vitest_1.vi.fn();
        const activate = vitest_1.vi.fn();
        const deactivate = vitest_1.vi.fn();
        const target = new TestTrackingEventTarget(activate, deactivate);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual([]);
        target.addEventListener("foo", fooListener, { capture: true });
        target.addEventListener("foo", fooListener, false);
        target.removeEventListener("foo", fooListener, true);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual(["foo"]);
        target.dispatchEvent(new Event("foo"));
        (0, vitest_1.expect)(fooListener).toBeCalledTimes(1);
    });
    (0, vitest_1.it)("option equality", () => {
        const fooListener = vitest_1.vi.fn();
        const activate = vitest_1.vi.fn();
        const deactivate = vitest_1.vi.fn();
        const target = new TestTrackingEventTarget(activate, deactivate);
        // Despite MDN docs claiming all options can result in another listener added
        // it seems only capture counts for both add and remove
        target.addEventListener("foo", fooListener, { passive: true });
        target.addEventListener("foo", fooListener, { once: true });
        target.addEventListener("foo", fooListener, { capture: true });
        target.addEventListener("foo", fooListener, { capture: false });
        target.dispatchEvent(new Event("foo"));
        (0, vitest_1.expect)(fooListener).toBeCalledTimes(2);
        target.removeEventListener("foo", fooListener, true);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual(["foo"]);
        target.dispatchEvent(new Event("foo"));
        (0, vitest_1.expect)(fooListener).toBeCalledTimes(3);
        target.removeEventListener("foo", fooListener, false);
        (0, vitest_1.expect)(target.getActiveEvents()).toEqual([]);
        target.dispatchEvent(new Event("foo"));
        (0, vitest_1.expect)(fooListener).toBeCalledTimes(3);
    });
    (0, vitest_1.it)("once", () => {
        const fooListener = vitest_1.vi.fn();
        const activate = vitest_1.vi.fn();
        const deactivate = vitest_1.vi.fn();
        const target = new TestTrackingEventTarget(activate, deactivate);
        target.addEventListener("foo", fooListener, { once: true });
        target.dispatchEvent(new Event("foo"));
        (0, vitest_1.expect)(fooListener).toBeCalledTimes(1);
        (0, vitest_1.expect)(deactivate).toBeCalledTimes(1);
        target.dispatchEvent(new Event("foo"));
        (0, vitest_1.expect)(fooListener).toBeCalledTimes(1);
    });
});
//# sourceMappingURL=events.test.js.map