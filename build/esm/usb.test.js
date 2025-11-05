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
import { ConnectionStatus } from "./device.js";
import { applyDeviceFilters, createWebUSBConnection } from "./usb.js";
import { beforeAll, expect, vi, describe, it } from "vitest";
vi.mock("./webusb-device-wrapper", () => ({
    DAPWrapper: class DapWrapper {
        constructor() {
            Object.defineProperty(this, "startSerial", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: vi.fn().mockReturnValue(Promise.resolve())
            });
            Object.defineProperty(this, "reconnectAsync", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: vi.fn()
            });
        }
    },
}));
const describeDeviceOnly = process.env.TEST_MODE_DEVICE
    ? describe
    : describe.skip;
describe("MicrobitWebUSBConnection (WebUSB unsupported)", () => {
    it("notices if WebUSB isn't supported", () => {
        global.navigator = {};
        const microbit = createWebUSBConnection();
        expect(microbit.status).toBe(ConnectionStatus.NOT_SUPPORTED);
    });
    it("still triggers afterrequestdevice if requestDevice throws", async () => {
        global.navigator = {
            usb: {
                requestDevice: () => {
                    throw new Error();
                },
            },
        };
        const microbit = createWebUSBConnection();
        expect(microbit.status).toBe(ConnectionStatus.NO_AUTHORIZED_DEVICE);
        const afterRequestDevice = vi.fn();
        microbit.addEventListener("afterrequestdevice", afterRequestDevice);
        await expect(() => microbit.connect()).rejects.toThrow();
        expect(afterRequestDevice.mock.calls.length).toEqual(1);
    });
});
describeDeviceOnly("MicrobitWebUSBConnection (WebUSB supported)", () => {
    beforeAll(() => {
        const usb = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
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
    it("shows no device as initial status", () => {
        const microbit = createWebUSBConnection();
        expect(microbit.status).toBe(ConnectionStatus.NO_AUTHORIZED_DEVICE);
    });
    it("connects and disconnects updating status and events", async () => {
        const events = [];
        const connection = createWebUSBConnection();
        connection.addEventListener("status", (event) => {
            events.push(event.status);
        });
        await connection.connect();
        expect(connection.status).toEqual(ConnectionStatus.CONNECTED);
        expect(events).toEqual([ConnectionStatus.CONNECTED]);
        // without this it breaks! something is up!
        await new Promise((resolve) => setTimeout(resolve, 100));
        await connection.disconnect();
        connection.dispose();
        expect(connection.status).toEqual(ConnectionStatus.DISCONNECTED);
        expect(events).toEqual([
            ConnectionStatus.CONNECTED,
            ConnectionStatus.DISCONNECTED,
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
describe("applyDevicesFilter", () => {
    it("has no filter", () => {
        const device = mockDevice();
        expect(applyDeviceFilters(device, [], [])).toEqual(true);
    });
    it("satisfies filter", () => {
        const device = mockDevice({
            interfaceClass: filter.classCode,
            productId: filter.productId,
            interfaceProtocol: filter.protocolCode,
            serialNumber: filter.serialNumber,
            interfaceSubclass: filter.subclassCode,
            vendorId: filter.vendorId,
        });
        expect(applyDeviceFilters(device, [filter], [])).toEqual(true);
    });
    it("does not satisfies filter", () => {
        const device = mockDevice({
            interfaceClass: filter.classCode,
            productId: filter.productId,
            interfaceProtocol: filter.protocolCode,
            serialNumber: "something else",
            interfaceSubclass: filter.subclassCode,
            vendorId: filter.vendorId,
        });
        expect(applyDeviceFilters(device, [filter], [])).toEqual(false);
    });
    it("satisfies exclusion filter", () => {
        const device = mockDevice({
            interfaceClass: filter.classCode,
            productId: filter.productId,
            interfaceProtocol: filter.protocolCode,
            serialNumber: filter.serialNumber,
            interfaceSubclass: filter.subclassCode,
            vendorId: filter.vendorId,
        });
        expect(applyDeviceFilters(device, [], [filter])).toEqual(false);
    });
    it("satifies filter and does not satisfy exclusion filter", () => {
        const device = mockDevice({
            interfaceClass: filter.classCode,
            productId: filter.productId,
            interfaceProtocol: filter.protocolCode,
            serialNumber: filter.serialNumber,
            interfaceSubclass: filter.subclassCode,
            vendorId: filter.vendorId,
        });
        expect(applyDeviceFilters(device, [filter], [{ ...filter, serialNumber: "not satisfied" }])).toEqual(true);
    });
});
//# sourceMappingURL=usb.test.js.map