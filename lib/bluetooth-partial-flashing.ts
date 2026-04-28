/**
 * BLE Partial Flashing for the micro:bit / Calliope mini.
 *
 * Ported from MakeCode's webble.ts PartialFlashingService
 * (https://github.com/microsoft/pxt/blob/master/pxtlib/webble.ts) and
 * follows the protocol documented in
 * codal-microbit-v2/docs/bluetooth/MicroBitPartialFlashing.md.
 *
 * The caller is responsible for establishing the GATT connection and OS-level
 * pairing. We assume the partial-flashing service is reachable on the passed
 * server. On firmware running with the default CODAL settings the service is
 * encrypted (NO_MITM) so a bond must already exist — otherwise the browser will
 * either trigger a "Just Works" pair prompt or raise SecurityError.
 */
import MemoryMap from "nrf-intel-hex";
import { profile } from "./bluetooth-profile.js";
import { Logging, NullLogging } from "./logging.js";

export const PARTIAL_FLASH_SERVICE_UUID =
  profile.partialFlashing.id;
export const PARTIAL_FLASH_CHARACTERISTIC_UUID =
  profile.partialFlashing.characteristics.control.id;

const MAGIC_MARKER = new Uint8Array([
  0x70, 0x8e, 0x3b, 0x92, 0xc6, 0x15, 0xa8, 0x41, 0xc4, 0x98, 0x66, 0xc9, 0x75,
  0xee, 0x51, 0x97,
]);

const Cmd = {
  RegionInfo: 0x00,
  FlashData: 0x01,
  EndOfTransmission: 0x02,
  Status: 0xee,
  Reset: 0xff,
} as const;

const Region = {
  SoftDevice: 0x00,
  Dal: 0x01,
  MakeCode: 0x02,
} as const;

const Mode = {
  Pairing: 0x00,
  Application: 0x01,
} as const;

const FlashAck = {
  OutOfOrder: 0xaa,
  Written: 0xff,
} as const;

/**
 * The DAL hash on the connected device does not match the DAL hash embedded in
 * the supplied hex. Partial flashing is impossible — the user has to do a full
 * USB flash first to update the runtime.
 */
export class BluetoothPartialFlashDalMismatchError extends Error {
  constructor() {
    super(
      "DAL hash mismatch — full USB flash required before BLE partial flashing can resume",
    );
    this.name = "BluetoothPartialFlashDalMismatchError";
  }
}

/**
 * The hex file does not contain the MakeCode magic marker, i.e. it is not a
 * MakeCode-compiled binary. Partial flashing only works for MakeCode hexes.
 */
export class BluetoothPartialFlashInvalidHexError extends Error {
  constructor() {
    super("Hex does not contain a MakeCode magic marker");
    this.name = "BluetoothPartialFlashInvalidHexError";
  }
}

/**
 * The partial-flashing service is not advertised on the device. Most likely the
 * firmware was built without `MICROBIT_BLE_PARTIAL_FLASHING=1`, or the device
 * is currently running a non-MakeCode hex.
 */
export class BluetoothPartialFlashServiceMissingError extends Error {
  constructor() {
    super("Calliope is not exposing the partial-flashing service");
    this.name = "BluetoothPartialFlashServiceMissingError";
  }
}

export interface BluetoothPartialFlashOptions {
  /**
   * Progress callback. Receives a value in [0, 1]. Called at most every
   * `progressUpdateMs`.
   */
  onProgress?: (progress: number) => void;
  /** Cancel the operation. */
  signal?: AbortSignal;
  /**
   * Optional logger. mini-connection's other modules use the same shape.
   */
  logging?: Logging;
  /**
   * Throttle progress updates. Default 100 ms.
   */
  progressUpdateMs?: number;
  /**
   * After issuing a reset-into-pairing command, the device disconnects and
   * needs to be reconnected. The caller must reconnect the GATT server and
   * re-discover services; we'll receive a fresh server via this callback.
   *
   * Returning null/undefined cancels the flash with an error.
   */
  reconnect?: () => Promise<BluetoothRemoteGATTServer | null>;
}

interface ParsedHex {
  /** Binary contents of the MakeCode region (and onwards). */
  bin: Uint8Array;
  /** Offset of the magic marker within `bin` — always 0 by construction here. */
  magicOffset: number;
  /** First absolute address of the MakeCode region. */
  baseAddr: number;
  /** 8-byte DAL hash extracted from the hex (post magic marker). */
  dalHash: Uint8Array;
  /** 8-byte MakeCode hash extracted from the hex. */
  makeCodeHash: Uint8Array;
}

/**
 * Parse a MakeCode-compiled Intel hex, find the magic marker and slice out the
 * MakeCode region.
 */
export function parseMakeCodeHex(hex: string): ParsedHex {
  const map = MemoryMap.fromHex(hex);
  // Walk segments looking for the magic marker.
  for (const [segStart, bytes] of map) {
    const u8: Uint8Array = bytes;
    for (
      let i = 0;
      i + MAGIC_MARKER.length + 16 <= u8.length;
      i += 16 // markers are 16-byte aligned in MakeCode
    ) {
      let match = true;
      for (let j = 0; j < MAGIC_MARKER.length; j++) {
        if (u8[i + j] !== MAGIC_MARKER[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        const dalHash = u8.slice(
          i + MAGIC_MARKER.length,
          i + MAGIC_MARKER.length + 8,
        );
        const makeCodeHash = u8.slice(
          i + MAGIC_MARKER.length + 8,
          i + MAGIC_MARKER.length + 16,
        );
        const bin = u8.slice(i);
        return {
          bin,
          magicOffset: 0,
          baseAddr: segStart + i,
          dalHash,
          makeCodeHash,
        };
      }
    }
  }
  throw new BluetoothPartialFlashInvalidHexError();
}

interface PfStatus {
  version: number;
  mode: number;
}

interface PfRegion {
  id: number;
  start: number;
  end: number;
  hash: Uint8Array;
}

/**
 * Drive a partial-flash session over an already-connected GATT server.
 */
export class BluetoothPartialFlashSession {
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private pendingResponse: ((data: Uint8Array) => void) | null = null;
  private aborted = false;
  private logging: Logging;

  constructor(
    private server: BluetoothRemoteGATTServer,
    logging?: Logging,
  ) {
    this.logging = logging ?? new NullLogging();
  }

  async run(hex: string, opts: BluetoothPartialFlashOptions = {}): Promise<void> {
    const onProgress = opts.onProgress ?? (() => {});
    const log = (m: string) => this.logging.log({ message: `pf-ble: ${m}` });

    if (opts.signal) {
      if (opts.signal.aborted) throw new DOMException("Aborted", "AbortError");
      opts.signal.addEventListener("abort", () => {
        this.aborted = true;
      });
    }

    const parsed = parseMakeCodeHex(hex);
    log(
      `parsed hex: bin=${parsed.bin.length} bytes, base=0x${parsed.baseAddr.toString(16)}`,
    );

    await this.openCharacteristic();

    let status = await this.requestStatus();
    log(`status: version=${status.version} mode=${status.mode}`);

    // Read DAL region — must match the hex's expected DAL hash, otherwise we
    // need a full USB flash.
    const dal = await this.requestRegion(Region.Dal);
    log(`DAL hash on device: ${hexFmt(dal.hash)} / file: ${hexFmt(parsed.dalHash)}`);
    if (!arraysEqual(dal.hash, parsed.dalHash)) {
      throw new BluetoothPartialFlashDalMismatchError();
    }

    const mc = await this.requestRegion(Region.MakeCode);
    log(`MakeCode hash on device: ${hexFmt(mc.hash)} / file: ${hexFmt(parsed.makeCodeHash)}`);

    if (arraysEqual(mc.hash, parsed.makeCodeHash)) {
      // Identical code — just reset into application mode to mirror USB
      // drag-and-drop behaviour.
      log("identical hash — resetting into application mode");
      await this.writeNoNotify(new Uint8Array([Cmd.Reset, Mode.Application]));
      onProgress(1);
      return;
    }

    // The partial-flashing service can only write flash while the device is in
    // pairing mode. If it's currently in application mode, we have to ask it
    // to reboot into pairing mode and reconnect.
    if (status.mode !== Mode.Pairing) {
      log("device in application mode — switching to pairing mode");
      await this.switchToPairingMode(opts.reconnect);
      // After reconnect, re-confirm status.
      status = await this.requestStatus();
      log(`post-reconnect status: version=${status.version} mode=${status.mode}`);
      if (status.mode !== Mode.Pairing) {
        throw new Error("Calliope did not enter pairing mode");
      }
    }

    // Write data: 4 BLE packets per 64-byte block, ack after each block.
    const startAddr = mc.start;
    const totalBytes = parsed.bin.length;
    let offset = 0;
    let packetNumber = 0;
    let chunkDelayMs = 0;
    let lastReport = 0;
    const updateMs = opts.progressUpdateMs ?? 100;

    while (offset < totalBytes) {
      if (this.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const blockAddr = startAddr + offset;
      const block = new Uint8Array(64);
      block.set(
        parsed.bin.subarray(offset, Math.min(offset + 64, totalBytes)),
        0,
      );

      // Send the four packets that make up one flash block.
      const packets = buildFlashPackets(blockAddr, packetNumber, block);
      for (let i = 0; i < 4; i++) {
        if (chunkDelayMs > 0) await delay(chunkDelayMs);
        await this.writeNoNotify(packets[i]);
      }

      // Wait for the device's flush ACK.
      const ack = await this.waitForResponse(5000, "flash-block-ack");
      if (ack[0] !== Cmd.FlashData) {
        throw new Error(
          `expected FLASH_DATA ack, got 0x${ack[0].toString(16)}`,
        );
      }
      if (ack[1] === FlashAck.OutOfOrder) {
        // Slow down and resend the same block.
        chunkDelayMs = Math.min(chunkDelayMs + 10, 75);
        packetNumber += 4;
        continue;
      }
      if (ack[1] !== FlashAck.Written) {
        throw new Error(`unexpected flash ack 0x${ack[1].toString(16)}`);
      }

      chunkDelayMs = Math.max(chunkDelayMs - 1, 0);
      offset += 64;
      packetNumber = (packetNumber + 4) & 0xff;

      const now = Date.now();
      if (now - lastReport >= updateMs) {
        onProgress(Math.min(offset / totalBytes, 1));
        lastReport = now;
      }
    }

    log("end of transmission");
    await this.writeNoNotify(new Uint8Array([Cmd.EndOfTransmission]));
    onProgress(1);
  }

  /** Release listeners. Safe to call even if the GATT server is gone. */
  async dispose(): Promise<void> {
    if (this.characteristic) {
      try {
        this.characteristic.removeEventListener(
          "characteristicvaluechanged",
          this.onNotify,
        );
        await this.characteristic.stopNotifications().catch(() => undefined);
      } catch {
        // ignore — connection may already be torn down
      }
      this.characteristic = null;
    }
  }

  private async openCharacteristic(): Promise<void> {
    let service: BluetoothRemoteGATTService;
    try {
      service = await this.server.getPrimaryService(
        PARTIAL_FLASH_SERVICE_UUID,
      );
    } catch {
      throw new BluetoothPartialFlashServiceMissingError();
    }
    const ch = await service.getCharacteristic(
      PARTIAL_FLASH_CHARACTERISTIC_UUID,
    );
    await ch.startNotifications();
    ch.addEventListener("characteristicvaluechanged", this.onNotify);
    this.characteristic = ch;
  }

  private onNotify = (ev: Event): void => {
    const ch = ev.target as BluetoothRemoteGATTCharacteristic;
    const value = ch.value;
    if (!value) return;
    const u8 = new Uint8Array(value.buffer.slice(0));
    const cb = this.pendingResponse;
    if (cb) {
      this.pendingResponse = null;
      cb(u8);
    }
  };

  private async writeNoNotify(payload: Uint8Array): Promise<void> {
    if (!this.characteristic) throw new Error("not connected");
    if (this.characteristic.writeValueWithoutResponse) {
      await this.characteristic.writeValueWithoutResponse(payload);
    } else {
      await this.characteristic.writeValue(payload);
    }
  }

  private waitForResponse(
    timeoutMs: number,
    label: string,
  ): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const t = setTimeout(() => {
        if (this.pendingResponse) {
          this.pendingResponse = null;
          reject(new Error(`timeout waiting for ${label}`));
        }
      }, timeoutMs);
      this.pendingResponse = (data) => {
        clearTimeout(t);
        resolve(data);
      };
    });
  }

  private async requestStatus(): Promise<PfStatus> {
    await this.writeNoNotify(new Uint8Array([Cmd.Status]));
    const data = await this.waitForResponse(3000, "status");
    if (data[0] !== Cmd.Status) {
      throw new Error(`expected STATUS, got 0x${data[0].toString(16)}`);
    }
    return { version: data[1], mode: data[2] };
  }

  private async requestRegion(regionId: number): Promise<PfRegion> {
    await this.writeNoNotify(new Uint8Array([Cmd.RegionInfo, regionId]));
    const data = await this.waitForResponse(3000, `region-${regionId}`);
    if (data[0] !== Cmd.RegionInfo) {
      throw new Error(`expected REGION_INFO, got 0x${data[0].toString(16)}`);
    }
    return {
      id: data[1],
      start:
        ((data[2] << 24) | (data[3] << 16) | (data[4] << 8) | data[5]) >>> 0,
      end:
        ((data[6] << 24) | (data[7] << 16) | (data[8] << 8) | data[9]) >>> 0,
      hash: data.slice(10, 18),
    };
  }

  private async switchToPairingMode(
    reconnect: BluetoothPartialFlashOptions["reconnect"],
  ): Promise<void> {
    if (!reconnect) {
      throw new Error(
        "device in application mode — caller must supply reconnect()",
      );
    }
    await this.writeNoNotify(
      new Uint8Array([Cmd.Reset, Mode.Pairing]),
    );
    // The device disconnects almost immediately. Tear down our handle.
    await this.dispose();
    // Give the device time to reset (~1.5 s).
    await delay(1600);
    const newServer = await reconnect();
    if (!newServer) {
      throw new Error("reconnect callback did not produce a new GATT server");
    }
    this.server = newServer;
    await this.openCharacteristic();
  }
}

function buildFlashPackets(
  blockAddr: number,
  startPacketNum: number,
  block64: Uint8Array,
): [Uint8Array, Uint8Array, Uint8Array, Uint8Array] {
  // Mirror MakeCode's wire layout exactly:
  //   pkt0: [FLASH, addr_hi8, addr_lo8, seq+0]   + bytes[ 0..15]
  //   pkt1: [FLASH, addr_HI8, addr_HM8, seq+1]   + bytes[16..31]
  //   pkt2: [FLASH, 0,        0,        seq+2]   + bytes[32..47]
  //   pkt3: [FLASH, 0,        0,        seq+3]   + bytes[48..63]
  // The full address arrives split across pkt0 (low half) and pkt1 (high half).
  const mk = (b1: number, b2: number, seq: number, payload: Uint8Array) => {
    const out = new Uint8Array(20);
    out[0] = Cmd.FlashData;
    out[1] = b1 & 0xff;
    out[2] = b2 & 0xff;
    out[3] = seq & 0xff;
    out.set(payload, 4);
    return out;
  };
  return [
    mk((blockAddr >> 8) & 0xff, blockAddr & 0xff, startPacketNum, block64.subarray(0, 16)),
    mk((blockAddr >> 24) & 0xff, (blockAddr >> 16) & 0xff, startPacketNum + 1, block64.subarray(16, 32)),
    mk(0, 0, startPacketNum + 2, block64.subarray(32, 48)),
    mk(0, 0, startPacketNum + 3, block64.subarray(48, 64)),
  ];
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function hexFmt(a: Uint8Array): string {
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
