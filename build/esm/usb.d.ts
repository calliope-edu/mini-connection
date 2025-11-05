import { DeviceConnection, FlashDataSource } from "./device.js";
import { Logging } from "./logging.js";
import { SerialConnectionEventMap } from "./serial-events.js";
export declare const isChromeOS105: () => boolean;
export declare enum DeviceSelectionMode {
    /**
     * Attempts to connect to known device, otherwise asks which device to
     * connect to.
     */
    AlwaysAsk = "AlwaysAsk",
    /**
     * Attempts to connect to known device, otherwise attempts to connect to any
     * allowed devices. If that fails, asks which device to connect to.
     */
    UseAnyAllowed = "UseAnyAllowed"
}
export interface MicrobitWebUSBConnectionOptions {
    /**
     * Determines logging behaviour for events, errors, and logs.
     */
    logging?: Logging;
    /**
     * Determines how a device should be selected.
     */
    deviceSelectionMode?: DeviceSelectionMode;
}
export interface MicrobitWebUSBConnection extends DeviceConnection<SerialConnectionEventMap> {
    /**
     * Gets micro:bit deviceId.
     *
     * @returns the device id or undefined if there is no connection.
     */
    getDeviceId(): number | undefined;
    /**
     * Sets device request exclusion filters.
     */
    setRequestDeviceExclusionFilters(exclusionFilters: USBDeviceFilter[]): void;
    /**
     * Flash the micro:bit.
     *
     * @param dataSource The data to use.
     * @param options Flash options and progress callback.
     */
    flash(dataSource: FlashDataSource, options: {}): Promise<void>;
    /**
     * Gets micro:bit device.
     *
     * @returns the USB device or undefined if there is no connection.
     */
    getDevice(): USBDevice | undefined;
    /**
     * Resets the micro:bit in software.
     */
    softwareReset(): Promise<void>;
}
/**
 * A WebUSB connection factory.
 */
export declare const createWebUSBConnection: (options?: MicrobitWebUSBConnectionOptions) => MicrobitWebUSBConnection;
/**
 * Applying WebUSB device filter. Exported for testing.
 * Based on: https://wicg.github.io/webusb/#enumeration
 */
export declare const applyDeviceFilters: (device: USBDevice, filters: USBDeviceFilter[], exclusionFilters: USBDeviceFilter[]) => boolean;
