export declare class SerialDataEvent extends Event {
    readonly data: string;
    constructor(data: string);
}
export declare class SerialResetEvent extends Event {
    constructor();
}
export declare class SerialErrorEvent extends Event {
    readonly error: unknown;
    constructor(error: unknown);
}
export declare class FlashEvent extends Event {
    constructor();
}
export declare class SerialConnectionEventMap {
    "serialdata": SerialDataEvent;
    "serialreset": SerialResetEvent;
    "serialerror": SerialErrorEvent;
    "flash": FlashEvent;
}
