import { Service } from "./bluetooth-device-wrapper.js";
import { TypedServiceEvent, TypedServiceEventDispatcher } from "./service-events.js";
export declare class ButtonService implements Service {
    private buttonACharacteristic;
    private buttonBCharacteristic;
    private dispatchTypedEvent;
    constructor(buttonACharacteristic: BluetoothRemoteGATTCharacteristic, buttonBCharacteristic: BluetoothRemoteGATTCharacteristic, dispatchTypedEvent: TypedServiceEventDispatcher);
    static createService(gattServer: BluetoothRemoteGATTServer, dispatcher: TypedServiceEventDispatcher, queueGattOperation: <R>(action: () => Promise<R>) => Promise<R>, listenerInit: boolean): Promise<ButtonService | undefined>;
    private dataViewToButtonState;
    startNotifications(type: TypedServiceEvent): Promise<void>;
    stopNotifications(type: TypedServiceEvent): Promise<void>;
    private characteristicForEvent;
}
