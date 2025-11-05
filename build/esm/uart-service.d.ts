import { Service } from "./bluetooth-device-wrapper.js";
import { TypedServiceEvent, TypedServiceEventDispatcher } from "./service-events.js";
export declare class UARTService implements Service {
    private txCharacteristic;
    private rxCharacteristic;
    private dispatchTypedEvent;
    private queueGattOperation;
    constructor(txCharacteristic: BluetoothRemoteGATTCharacteristic, rxCharacteristic: BluetoothRemoteGATTCharacteristic, dispatchTypedEvent: TypedServiceEventDispatcher, queueGattOperation: <R>(action: () => Promise<R>) => Promise<R>);
    static createService(gattServer: BluetoothRemoteGATTServer, dispatcher: TypedServiceEventDispatcher, queueGattOperation: <R>(action: () => Promise<R>) => Promise<R>, listenerInit: boolean): Promise<UARTService | undefined>;
    startNotifications(type: TypedServiceEvent): Promise<void>;
    stopNotifications(type: TypedServiceEvent): Promise<void>;
    writeData(value: Uint8Array): Promise<void>;
}
