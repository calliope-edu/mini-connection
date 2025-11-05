/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export declare const FICR: {
    CODEPAGESIZE: number;
    CODESIZE: number;
    DEVICE_ID_1: number;
};
export declare const DapCmd: {
    DAP_INFO: number;
    DAP_CONNECT: number;
    DAP_DISCONNECT: number;
    DAP_TRANSFER: number;
    DAP_TRANSFER_BLOCK: number;
};
export declare const Csw: {
    CSW_SIZE: number;
    CSW_SIZE32: number;
    CSW_ADDRINC: number;
    CSW_SADDRINC: number;
    CSW_DBGSTAT: number;
    CSW_HPROT: number;
    CSW_MSTRDBG: number;
    CSW_RESERVED: number;
    CSW_VALUE: number;
};
export declare const DapVal: {
    AP_ACC: number;
    READ: number;
    WRITE: number;
};
export declare const ApReg: {
    CSW: number;
    TAR: number;
    DRW: number;
};
export declare const CortexSpecialReg: {
    DEMCR: number;
    DEMCR_VC_CORERESET: number;
    CPUID: number;
    DHCSR: number;
    S_RESET_ST: number;
    NVIC_AIRCR: number;
    NVIC_AIRCR_VECTKEY: number;
    NVIC_AIRCR_SYSRESETREQ: number;
};
