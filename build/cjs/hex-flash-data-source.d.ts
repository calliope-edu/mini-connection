import { FlashDataSource } from "./device.js";
/**
 * A flash data source that converts universal hex files as needed.
 *
 * @param universalHex A hex file, potentially universal.
 */
export declare const createUniversalHexFlashDataSource: (universalHex: string) => FlashDataSource;
