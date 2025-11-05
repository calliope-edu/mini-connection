/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { AccelerometerData } from "./accelerometer.js";
import { DeviceConnection } from "./device.js";
import { LedMatrix } from "./led.js";
import { Logging } from "./logging.js";
import { MagnetometerData } from "./magnetometer.js";
import { ServiceConnectionEventMap } from "./service-events.js";
export interface MicrobitWebBluetoothConnectionOptions {
    logging?: Logging;
}
export interface MicrobitWebBluetoothConnection extends DeviceConnection<ServiceConnectionEventMap> {
    /**
     * Sets micro:bit name filter for device requesting.
     *
     * @param name The name of the micro:bit.
     */
    setNameFilter(name: string): void;
    /**
     * Gets micro:bit accelerometer data.
     *
     * @returns accelerometer data or undefined if there is no connection.
     */
    getAccelerometerData(): Promise<AccelerometerData | undefined>;
    /**
     * Gets micro:bit accelerometer period.
     *
     * @returns accelerometer period or undefined if there is no connection.
     */
    getAccelerometerPeriod(): Promise<number | undefined>;
    /**
     * Sets micro:bit accelerometer period.
     *
     * @param value The accelerometer period.
     */
    setAccelerometerPeriod(value: number): Promise<void>;
    /**
     * Sets micro:bit LED text.
     *
     * @param text The text displayed on micro:bit LED.
     */
    setLedText(text: string): Promise<void>;
    /**
     * Gets micro:bit LED scrolling delay.
     *
     * @returns LED scrolling delay in milliseconds.
     */
    getLedScrollingDelay(): Promise<number | undefined>;
    /**
     * Sets micro:bit LED scrolling delay.
     *
     * @param delayInMillis LED scrolling delay in milliseconds.
     */
    setLedScrollingDelay(delayInMillis: number): Promise<void>;
    /**
     * Gets micro:bit LED matrix.
     *
     * @returns a boolean matrix representing the micro:bit LED display.
     */
    getLedMatrix(): Promise<LedMatrix | undefined>;
    /**
     * Sets micro:bit LED matrix.
     *
     * @param matrix an boolean matrix representing the micro:bit LED display.
     */
    setLedMatrix(matrix: LedMatrix): Promise<void>;
    /**
     * Gets micro:bit magnetometer data.
     *
     * @returns magnetometer data.
     */
    getMagnetometerData(): Promise<MagnetometerData | undefined>;
    /**
     * Gets micro:bit magnetometer bearing.
     *
     * @returns magnetometer bearing.
     */
    getMagnetometerBearing(): Promise<number | undefined>;
    /**
     * Gets micro:bit magnetometer period.
     *
     * @returns magnetometer period.
     */
    getMagnetometerPeriod(): Promise<number | undefined>;
    /**
     * Sets micro:bit magnetometer period.
     *
     * @param value magnetometer period.
     */
    setMagnetometerPeriod(value: number): Promise<void>;
    /**
     * Triggers micro:bit magnetometer calibration.
     */
    triggerMagnetometerCalibration(): Promise<void>;
    /**
     * Write UART messages.
     *
     * @param data UART message.
     */
    uartWrite(data: Uint8Array): Promise<void>;
}
/**
 * A Bluetooth connection factory.
 */
export declare const createWebBluetoothConnection: (options?: MicrobitWebBluetoothConnectionOptions) => MicrobitWebBluetoothConnection;
