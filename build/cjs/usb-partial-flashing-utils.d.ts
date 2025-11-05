export declare const CoreRegister: {
    SP: number;
    LR: number;
    PC: number;
};
export declare const read32FromUInt8Array: (data: Uint8Array, i: number) => number;
export declare const bufferConcat: (bufs: Uint8Array[]) => Uint8Array;
export declare const murmur3_core: (data: Uint8Array) => [number, number];
export declare const apReg: (r: number, mode: number) => number;
export declare const regRequest: (regId: number, isWrite?: boolean) => number;
export declare class Page {
    readonly targetAddr: number;
    readonly data: Uint8Array;
    constructor(targetAddr: number, data: Uint8Array);
}
export declare const pageAlignBlocks: (buffer: Uint8Array, targetAddr: number, pageSize: number) => Page[];
export declare const onlyChanged: (pages: Page[], checksums: Uint8Array, pageSize: number) => Page[];
