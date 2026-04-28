"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flashOverBluetooth = flashOverBluetooth;
/**
 * High-level "drive a partial-flashing run over Web Bluetooth" entry point.
 *
 * Wraps {@link BluetoothPartialFlashSession} with the orchestration that any
 * caller actually needs:
 *
 *   - Suppresses the wrapper-level auto-reconnect of `MicrobitWebBluetoothConnection`
 *     while we drive disconnect/reconnect cycles ourselves. The wrapper's
 *     `gattserverdisconnected` handler otherwise races our manual reconnects
 *     and leads to GATT-connect timeouts.
 *   - Forces a fresh GATT discovery before talking to the partial-flashing
 *     service. Chrome aggressively caches the GATT structure across reconnects;
 *     after a device-side reboot (manual AB+Reset, post-flash auto-reset, or our
 *     own pairing-mode switch) the cached service tree is stale and
 *     getPrimaryService returns handles that fail on actual reads.
 *   - Retries the entire run once if the partial-flashing service isn't
 *     discoverable on the first try — Chrome typically clears its cache after
 *     a subsequent disconnect, so a coordinated retry is enough.
 *   - Reports phase changes (`refreshing`, `running`, `pairing-mode-switch`,
 *     `reconnecting`, `flashing`, `finalising`) so a UI can keep its progress
 *     bar moving and explain to the user what's happening between "0%" and
 *     "first byte transferred".
 */
const bluetooth_partial_flashing_js_1 = require("./bluetooth-partial-flashing.js");
const logging_js_1 = require("./logging.js");
/**
 * Run a complete partial-flashing operation. Resolves once the device has
 * acknowledged END_OF_TRANSMISSION and is rebooting back into application
 * mode. The caller is expected to set up its own UART subscription afterwards
 * (give the program ~1.5 s to start).
 */
async function flashOverBluetooth(opts) {
    const log = opts.logging ?? new logging_js_1.NullLogging();
    const trace = (m) => log.log({ message: `pf-ble: ${m}` });
    const phase = (p) => {
        trace(`phase=${p}`);
        opts.onPhase?.(p);
    };
    const tries = Math.max(1, 1 + (opts.serviceMissingRetries ?? 1));
    if (!opts.device.gatt) {
        throw new Error("BluetoothDevice has no GATT");
    }
    await withWrapperReconnectSuppressed(opts.connection, async () => {
        // Don't disconnect proactively. The wrapper just opened the GATT and is
        // tracking it; our own disconnect+reconnect would race with the wrapper's
        // internal state machine even with the suppress flag set, because the
        // wrapper still has stale connection promises in flight. Try the existing
        // GATT first; if it has a stale service tree (Chrome cache from a prior
        // device-side reboot) the first attempt fails fast on a write timeout or
        // ServiceMissing, and we then do one coordinated refresh.
        phase("running");
        opts.onProgress?.(0.05);
        let lastErr = null;
        for (let attempt = 0; attempt < tries; attempt++) {
            if (attempt > 0) {
                trace(`retrying after ${describeRetryReason(lastErr)} (attempt ${attempt + 1}/${tries})`);
                phase("refreshing");
                opts.onProgress?.(0.04);
                await refreshGatt(opts.device);
                opts.onProgress?.(0.06);
            }
            try {
                await runOnce(opts, phase, trace);
                return;
            }
            catch (err) {
                lastErr = err;
                if (!isRetryableFlashError(err)) {
                    throw err;
                }
                trace(`first attempt failed: ${err.message}`);
            }
        }
        throw lastErr ?? new Error("Flash failed");
    });
}
function isRetryableFlashError(err) {
    if (err instanceof bluetooth_partial_flashing_js_1.BluetoothPartialFlashServiceMissingError)
        return true;
    // Timeouts on writeNoNotify / openCharacteristic are surfaced as plain
    // Errors with a "timeout: …" prefix — see the timeout helper at the bottom
    // of bluetooth-partial-flashing.ts. They almost always mean "Chrome's GATT
    // cache is stale", which a coordinated refresh+reconnect cures.
    const msg = err?.message ?? "";
    return /^timeout:/.test(msg);
}
function describeRetryReason(err) {
    if (err instanceof bluetooth_partial_flashing_js_1.BluetoothPartialFlashServiceMissingError)
        return "service-missing";
    const msg = err?.message ?? "";
    if (/^timeout:/.test(msg))
        return msg;
    return "unknown error";
}
async function runOnce(opts, phase, trace) {
    const server = opts.device.gatt.connected
        ? opts.device.gatt
        : await opts.device.gatt.connect();
    const session = new bluetooth_partial_flashing_js_1.BluetoothPartialFlashSession(server, opts.logging);
    let switchedMode = false;
    try {
        await session.run(opts.hex, {
            logging: opts.logging,
            signal: opts.signal,
            onProgress: (p) => {
                // Map raw protocol progress 0..1 onto 15..99 % of overall work, so
                // the bar keeps advancing past whatever the pre-flash phases
                // already filled in.
                if (!switchedMode)
                    phase("flashing");
                opts.onProgress?.(0.15 + p * 0.84);
            },
            reconnect: async () => {
                switchedMode = true;
                phase("pairing-mode-switch");
                opts.onProgress?.(0.08);
                await refreshGatt(opts.device);
                phase("reconnecting");
                for (let i = 0; i < 6; i++) {
                    try {
                        const s = await opts.device.gatt.connect();
                        opts.onProgress?.(0.12);
                        return s;
                    }
                    catch (err) {
                        trace(`reconnect attempt ${i + 1} failed: ${err.message}`);
                        await delay(500 + i * 250);
                    }
                }
                return null;
            },
        });
        phase("finalising");
        opts.onProgress?.(1);
    }
    finally {
        await session.dispose();
    }
}
/**
 * Force a clean disconnect + fresh GATT connection so Chrome re-discovers
 * services. Cached service trees survive across `gatt.connect()` calls when
 * the underlying connection was kept by the OS, which is exactly what makes
 * partial flashing flaky after a device-side reboot.
 */
async function refreshGatt(device) {
    if (!device.gatt)
        return;
    if (device.gatt.connected) {
        try {
            device.gatt.disconnect();
        }
        catch {
            // ignore — the disconnect may already have been triggered by the
            // device side (e.g. after a reboot)
        }
        // Disconnects are async at the OS level. Give Chrome a beat to finish
        // tearing down before we open a new connection — otherwise we sometimes
        // get back the stale GATT view we tried to discard.
        await delay(400);
    }
    await device.gatt.connect();
}
/**
 * Internal: temporarily flip the wrapper's `duringExplicitConnectDisconnect`
 * flag so its `gattserverdisconnected` handler skips its auto-reconnect path.
 *
 * The flag is private to the wrapper class but exposed via the connection's
 * `connection` property, which is itself private but reachable through a
 * type assertion. This is a deliberate hatch in the public API: callers
 * driving GATT manually need a way to opt out of the wrapper's reconnect
 * behaviour for one operation.
 */
async function withWrapperReconnectSuppressed(connection, fn) {
    if (!connection)
        return fn();
    const wrapper = connection.connection;
    const prev = wrapper?.duringExplicitConnectDisconnect ?? false;
    if (wrapper)
        wrapper.duringExplicitConnectDisconnect = true;
    try {
        return await fn();
    }
    finally {
        if (wrapper)
            wrapper.duringExplicitConnectDisconnect = prev;
    }
}
function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=bluetooth-flash.js.map