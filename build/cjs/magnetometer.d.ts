export interface MagnetometerData {
    x: number;
    y: number;
    z: number;
}
export declare class MagnetometerDataEvent extends Event {
    readonly data: MagnetometerData;
    constructor(data: MagnetometerData);
}
