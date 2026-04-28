export declare const profile: {
    uart: {
        id: string;
        characteristics: {
            tx: {
                id: string;
            };
            rx: {
                id: string;
            };
        };
    };
    accelerometer: {
        id: string;
        characteristics: {
            data: {
                id: string;
            };
            period: {
                id: string;
            };
        };
    };
    deviceInformation: {
        id: string;
        characteristics: {
            modelNumber: {
                id: string;
            };
            serialNumber: {
                id: string;
            };
            firmwareRevision: {
                id: string;
            };
            hardwareRevision: {
                id: string;
            };
            manufacturer: {
                id: string;
            };
        };
    };
    dfuControl: {
        id: string;
        characteristics: {
            control: {
                id: string;
            };
        };
    };
    partialFlashing: {
        id: string;
        characteristics: {
            control: {
                id: string;
            };
        };
    };
    led: {
        id: string;
        characteristics: {
            matrixState: {
                id: string;
            };
            text: {
                id: string;
            };
            scrollingDelay: {
                id: string;
            };
        };
    };
    ioPin: {
        id: string;
        characteristics: {
            pinData: {
                id: string;
            };
            pinAdConfiguration: {
                id: string;
            };
            pinIoConfiguration: {
                id: string;
            };
            pwmControl: {
                id: string;
            };
        };
    };
    button: {
        id: string;
        characteristics: {
            a: {
                id: string;
            };
            b: {
                id: string;
            };
        };
    };
    event: {
        id: string;
        characteristics: {
            microBitRequirements: {
                id: string;
            };
            microBitEvent: {
                id: string;
            };
            clientRequirements: {
                id: string;
            };
            clientEvent: {
                id: string;
            };
        };
    };
    magnetometer: {
        id: string;
        characteristics: {
            data: {
                id: string;
            };
            period: {
                id: string;
            };
            bearing: {
                id: string;
            };
            calibration: {
                id: string;
            };
        };
    };
    temperature: {
        id: string;
        characteristics: {
            data: {
                id: string;
            };
            period: {
                id: string;
            };
        };
    };
};
