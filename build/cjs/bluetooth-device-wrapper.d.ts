/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { AccelerometerService } from "./accelerometer-service.js";
import { BoardVersion } from "./device.js";
import { LedService } from "./led-service.js";
import { Logging } from "./logging.js";
import { MagnetometerService } from "./magnetometer-service.js";
import { ServiceConnectionEventMap, TypedServiceEvent, TypedServiceEventDispatcher } from "./service-events.js";
import { UARTService } from "./uart-service.js";
export interface Service {
    startNotifications(type: TypedServiceEvent): Promise<void>;
    stopNotifications(type: TypedServiceEvent): Promise<void>;
}
interface ConnectCallbacks {
    onConnecting: () => void;
    onReconnecting: () => void;
    onFail: () => void;
    onSuccess: () => void;
}
export declare class BluetoothDeviceWrapper {
    readonly device: BluetoothDevice;
    private logging;
    private dispatchTypedEvent;
    private currentEvents;
    private callbacks;
    private duringExplicitConnectDisconnect;
    private gattConnectPromise;
    private disconnectPromise;
    private connecting;
    private isReconnect;
    private connectReadyPromise;
    private accelerometer;
    private buttons;
    private led;
    private magnetometer;
    private uart;
    private serviceInfo;
    boardVersion: BoardVersion | undefined;
    private disconnectedRejectionErrorFactory;
    private gattOperations;
    constructor(device: BluetoothDevice, logging: Logging, dispatchTypedEvent: TypedServiceEventDispatcher, currentEvents: () => Array<keyof ServiceConnectionEventMap>, callbacks: ConnectCallbacks);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private disconnectInternal;
    reconnect(): Promise<void>;
    handleDisconnectEvent: () => Promise<void>;
    private assertGattServer;
    private getBoardVersion;
    private queueGattOperation;
    private createIfNeeded;
    getAccelerometerService(): Promise<AccelerometerService | undefined>;
    getLedService(): Promise<LedService | undefined>;
    getMagnetometerService(): Promise<MagnetometerService | undefined>;
    getUARTService(): Promise<UARTService | undefined>;
    startNotifications(type: TypedServiceEvent): Promise<void>;
    stopNotifications(type: TypedServiceEvent): Promise<void>;
    private disposeServices;
}
export declare const createBluetoothDeviceWrapper: (device: BluetoothDevice, logging: Logging, dispatchTypedEvent: TypedServiceEventDispatcher, currentEvents: () => Array<keyof ServiceConnectionEventMap>, callbacks: ConnectCallbacks) => Promise<BluetoothDeviceWrapper | undefined>;
export {};
