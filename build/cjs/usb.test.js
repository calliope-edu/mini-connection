"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 *
 * @jest-environment node
 *
 * Without node environment USB code fails with a buffer type check.
 * It might be we could create a custom environment that was web but
 * with a tweak to Buffer.
 */
const device_js_1 = require("./device.js");
const usb_js_1 = require("./usb.js");
const vitest_1 = require("vitest");
vitest_1.vi.mock("./webusb-device-wrapper", () => ({
    DAPWrapper: class DapWrapper {
        constructor() {
            Object.defineProperty(this, "startSerial", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: vitest_1.vi.fn().mockReturnValue(Promise.resolve())
            });
            Object.defineProperty(this, "reconnectAsync", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: vitest_1.vi.fn()
            });
        }
    },
}));
const describeDeviceOnly = process.env.TEST_MODE_DEVICE
    ? vitest_1.describe
    : vitest_1.describe.skip;
(0, vitest_1.describe)("MicrobitWebUSBConnection (WebUSB unsupported)", () => {
    (0, vitest_1.it)("notices if WebUSB isn't supported", () => {
        global.navigator = {};
        const microbit = (0, usb_js_1.createWebUSBConnection)();
        (0, vitest_1.expect)(microbit.status).toBe(device_js_1.ConnectionStatus.NOT_SUPPORTED);
    });
    (0, vitest_1.it)("still triggers afterrequestdevice if requestDevice throws", async () => {
        global.navigator = {
            usb: {
                requestDevice: () => {
                    throw new Error();
                },
            },
        };
        const microbit = (0, usb_js_1.createWebUSBConnection)();
        (0, vitest_1.expect)(microbit.status).toBe(device_js_1.ConnectionStatus.NO_AUTHORIZED_DEVICE);
        const afterRequestDevice = vitest_1.vi.fn();
        microbit.addEventListener("afterrequestdevice", afterRequestDevice);
        await (0, vitest_1.expect)(() => microbit.connect()).rejects.toThrow();
        (0, vitest_1.expect)(afterRequestDevice.mock.calls.length).toEqual(1);
    });
});
describeDeviceOnly("MicrobitWebUSBConnection (WebUSB supported)", () => {
    (0, vitest_1.beforeAll)(() => {
        const usb = {
            addEventListener: vitest_1.vi.fn(),
            removeEventListener: vitest_1.vi.fn(),
            requestDevice() {
                const device = {};
                return device;
            },
        };
        // Maybe we can move this to a custom jest environment?
        global.navigator = {
            usb,
        };
    });
    (0, vitest_1.it)("shows no device as initial status", () => {
        const microbit = (0, usb_js_1.createWebUSBConnection)();
        (0, vitest_1.expect)(microbit.status).toBe(device_js_1.ConnectionStatus.NO_AUTHORIZED_DEVICE);
    });
    (0, vitest_1.it)("connects and disconnects updating status and events", async () => {
        const events = [];
        const connection = (0, usb_js_1.createWebUSBConnection)();
        connection.addEventListener("status", (event) => {
            events.push(event.status);
        });
        await connection.connect();
        (0, vitest_1.expect)(connection.status).toEqual(device_js_1.ConnectionStatus.CONNECTED);
        (0, vitest_1.expect)(events).toEqual([device_js_1.ConnectionStatus.CONNECTED]);
        // without this it breaks! something is up!
        await new Promise((resolve) => setTimeout(resolve, 100));
        await connection.disconnect();
        connection.dispose();
        (0, vitest_1.expect)(connection.status).toEqual(device_js_1.ConnectionStatus.DISCONNECTED);
        (0, vitest_1.expect)(events).toEqual([
            device_js_1.ConnectionStatus.CONNECTED,
            device_js_1.ConnectionStatus.DISCONNECTED,
        ]);
    });
});
const mockDevice = (config) => ({
    vendorId: config?.vendorId || 0x2341,
    productId: config?.productId || 0x0043,
    serialNumber: config?.serialNumber || "MOCK123456",
    configuration: {
        interfaces: config?.interfaces || [
            {
                alternates: [
                    {
                        alternateSetting: 0,
                        interfaceClass: config?.interfaceClass || 2,
                        interfaceSubclass: config?.interfaceSubclass || 2,
                        interfaceProtocol: config?.interfaceProtocol || 0,
                    },
                ],
            },
        ],
    },
});
const filter = {
    classCode: 123,
    productId: 456,
    protocolCode: 789,
    serialNumber: "012",
    subclassCode: 345,
    vendorId: 690,
};
(0, vitest_1.describe)("applyDevicesFilter", () => {
    (0, vitest_1.it)("has no filter", () => {
        const device = mockDevice();
        (0, vitest_1.expect)((0, usb_js_1.applyDeviceFilters)(device, [], [])).toEqual(true);
    });
    (0, vitest_1.it)("satisfies filter", () => {
        const device = mockDevice({
            interfaceClass: filter.classCode,
            productId: filter.productId,
            interfaceProtocol: filter.protocolCode,
            serialNumber: filter.serialNumber,
            interfaceSubclass: filter.subclassCode,
            vendorId: filter.vendorId,
        });
        (0, vitest_1.expect)((0, usb_js_1.applyDeviceFilters)(device, [filter], [])).toEqual(true);
    });
    (0, vitest_1.it)("does not satisfies filter", () => {
        const device = mockDevice({
            interfaceClass: filter.classCode,
            productId: filter.productId,
            interfaceProtocol: filter.protocolCode,
            serialNumber: "something else",
            interfaceSubclass: filter.subclassCode,
            vendorId: filter.vendorId,
        });
        (0, vitest_1.expect)((0, usb_js_1.applyDeviceFilters)(device, [filter], [])).toEqual(false);
    });
    (0, vitest_1.it)("satisfies exclusion filter", () => {
        const device = mockDevice({
            interfaceClass: filter.classCode,
            productId: filter.productId,
            interfaceProtocol: filter.protocolCode,
            serialNumber: filter.serialNumber,
            interfaceSubclass: filter.subclassCode,
            vendorId: filter.vendorId,
        });
        (0, vitest_1.expect)((0, usb_js_1.applyDeviceFilters)(device, [], [filter])).toEqual(false);
    });
    (0, vitest_1.it)("satifies filter and does not satisfy exclusion filter", () => {
        const device = mockDevice({
            interfaceClass: filter.classCode,
            productId: filter.productId,
            interfaceProtocol: filter.protocolCode,
            serialNumber: filter.serialNumber,
            interfaceSubclass: filter.subclassCode,
            vendorId: filter.vendorId,
        });
        (0, vitest_1.expect)((0, usb_js_1.applyDeviceFilters)(device, [filter], [{ ...filter, serialNumber: "not satisfied" }])).toEqual(true);
    });
});
//# sourceMappingURL=usb.test.js.map