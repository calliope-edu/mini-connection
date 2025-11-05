import { MagnetometerData } from "./magnetometer.js";
import { Service } from "./bluetooth-device-wrapper.js";
import { TypedServiceEvent, TypedServiceEventDispatcher } from "./service-events.js";
export declare class MagnetometerService implements Service {
    private magnetometerDataCharacteristic;
    private magnetometerPeriodCharacteristic;
    private magnetometerBearingCharacteristic;
    private magnetometerCalibrationCharacteristic;
    private dispatchTypedEvent;
    private queueGattOperation;
    constructor(magnetometerDataCharacteristic: BluetoothRemoteGATTCharacteristic, magnetometerPeriodCharacteristic: BluetoothRemoteGATTCharacteristic, magnetometerBearingCharacteristic: BluetoothRemoteGATTCharacteristic, magnetometerCalibrationCharacteristic: BluetoothRemoteGATTCharacteristic, dispatchTypedEvent: TypedServiceEventDispatcher, queueGattOperation: <R>(action: () => Promise<R>) => Promise<R>);
    static createService(gattServer: BluetoothRemoteGATTServer, dispatcher: TypedServiceEventDispatcher, queueGattOperation: <R>(action: () => Promise<R>) => Promise<R>, listenerInit: boolean): Promise<MagnetometerService | undefined>;
    private dataViewToData;
    getData(): Promise<MagnetometerData>;
    getPeriod(): Promise<number>;
    setPeriod(value: number): Promise<void>;
    getBearing(): Promise<number>;
    triggerCalibration(): Promise<void>;
    startNotifications(type: TypedServiceEvent): Promise<void>;
    stopNotifications(type: TypedServiceEvent): Promise<void>;
    private characteristicForEvent;
}
