import { Service } from "./bluetooth-device-wrapper.js";
import { LedMatrix } from "./led.js";
import { TypedServiceEvent, TypedServiceEventDispatcher } from "./service-events.js";
export declare class LedService implements Service {
    private matrixStateCharacteristic;
    private scrollingDelayCharacteristic;
    private textCharactertistic;
    private queueGattOperation;
    constructor(matrixStateCharacteristic: BluetoothRemoteGATTCharacteristic, scrollingDelayCharacteristic: BluetoothRemoteGATTCharacteristic, textCharactertistic: BluetoothRemoteGATTCharacteristic, queueGattOperation: <R>(action: () => Promise<R>) => Promise<R>);
    static createService(gattServer: BluetoothRemoteGATTServer, dispatcher: TypedServiceEventDispatcher, queueGattOperation: <R>(action: () => Promise<R>) => Promise<R>, listenerInit: boolean): Promise<LedService | undefined>;
    getLedMatrix(): Promise<LedMatrix>;
    setLedMatrix(value: LedMatrix): Promise<void>;
    private dataViewToLedMatrix;
    private ledMatrixToDataView;
    setText(text: string): Promise<void>;
    setScrollingDelay(value: number): Promise<void>;
    getScrollingDelay(): Promise<number>;
    startNotifications(type: TypedServiceEvent): Promise<void>;
    stopNotifications(type: TypedServiceEvent): Promise<void>;
}
