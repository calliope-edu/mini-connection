export interface AccelerometerData {
    x: number;
    y: number;
    z: number;
}
export declare class AccelerometerDataEvent extends Event {
    readonly data: AccelerometerData;
    constructor(data: AccelerometerData);
}
