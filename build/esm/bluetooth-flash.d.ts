import { Logging } from "./logging.js";
import type { MicrobitWebBluetoothConnection } from "./bluetooth.js";
export type BluetoothFlashPhase = "refreshing" | "running" | "pairing-mode-switch" | "reconnecting" | "flashing" | "finalising";
export interface BluetoothFlashOptions {
    /** The chosen Calliope. The OS-level pair must already exist. */
    device: BluetoothDevice;
    /**
     * Optional connection wrapper. If passed, its built-in auto-reconnect is
     * suppressed for the duration of the flash so we can drive disconnects
     * ourselves without the wrapper fighting us. After the flash finishes the
     * suppression is lifted again.
     */
    connection?: MicrobitWebBluetoothConnection;
    /** Intel-hex MakeCode build. */
    hex: string;
    /** Progress in [0, 1] across the whole run (incl. pre-flash phases). */
    onProgress?: (progress: number) => void;
    /** Phase change notifications — useful for descriptive UI labels. */
    onPhase?: (phase: BluetoothFlashPhase) => void;
    /** Optional cancel signal. */
    signal?: AbortSignal;
    /** Optional logger; defaults to the no-op logger. */
    logging?: Logging;
    /**
     * Service-missing retry count. After the first attempt fails with
     * "service not visible", we coordinate one full disconnect+reconnect and
     * try again. Defaults to 1.
     */
    serviceMissingRetries?: number;
}
/**
 * Run a complete partial-flashing operation. Resolves once the device has
 * acknowledged END_OF_TRANSMISSION and is rebooting back into application
 * mode. The caller is expected to set up its own UART subscription afterwards
 * (give the program ~1.5 s to start).
 */
export declare function flashOverBluetooth(opts: BluetoothFlashOptions): Promise<void>;
