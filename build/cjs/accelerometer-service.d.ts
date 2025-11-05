import { AccelerometerData } from "./accelerometer.js";
import { Service } from "./bluetooth-device-wrapper.js";
import { TypedServiceEvent, TypedServiceEventDispatcher } from "./service-events.js";
export declare class AccelerometerService implements Service {
    private accelerometerDataCharacteristic;
    private accelerometerPeriodCharacteristic;
    private dispatchTypedEvent;
    private queueGattOperation;
    constructor(accelerometerDataCharacteristic: BluetoothRemoteGATTCharacteristic, accelerometerPeriodCharacteristic: BluetoothRemoteGATTCharacteristic, dispatchTypedEvent: TypedServiceEventDispatcher, queueGattOperation: <R>(action: () => Promise<R>) => Promise<R>);
    static createService(gattServer: BluetoothRemoteGATTServer, dispatcher: TypedServiceEventDispatcher, queueGattOperation: <R>(action: () => Promise<R>) => Promise<R>, listenerInit: boolean): Promise<AccelerometerService | undefined>;
    private dataViewToData;
    getData(): Promise<AccelerometerData>;
    getPeriod(): Promise<number>;
    setPeriod(value: number): Promise<void>;
    startNotifications(type: TypedServiceEvent): Promise<void>;
    stopNotifications(type: TypedServiceEvent): Promise<void>;
    private characteristicForEvent;
}
