/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DeviceConnection } from "./device.js";
import { Logging } from "./logging.js";
import { ServiceConnectionEventMap } from "./service-events.js";
import { MicrobitWebUSBConnection } from "./usb.js";
export interface MicrobitRadioBridgeConnectionOptions {
    logging: Logging;
}
export interface MicrobitRadioBridgeConnection extends DeviceConnection<ServiceConnectionEventMap> {
    /**
     * Sets remote device.
     *
     * @param deviceId The device id of remote micro:bit.
     */
    setRemoteDeviceId(deviceId: number): void;
}
/**
 * A radio bridge connection factory.
 */
export declare const createRadioBridgeConnection: (delegate: MicrobitWebUSBConnection, options?: MicrobitRadioBridgeConnectionOptions) => MicrobitRadioBridgeConnection;
