import { BoardId } from "./board-id.js";
import { FlashDataError as FlashDataError, } from "./device.js";
import { isUniversalHex, separateUniversalHex, } from "@microbit/microbit-universal-hex";
/**
 * A flash data source that converts universal hex files as needed.
 *
 * @param universalHex A hex file, potentially universal.
 */
export const createUniversalHexFlashDataSource = (universalHex) => {
    return (boardVersion) => {
        if (isUniversalHex(universalHex)) {
            const parts = separateUniversalHex(universalHex);
            const matching = parts.find((p) => p.boardId == BoardId.forVersion(boardVersion).id);
            if (!matching) {
                throw new FlashDataError("No matching part");
            }
            return Promise.resolve(matching.hex);
        }
        return Promise.resolve(universalHex);
    };
};
//# sourceMappingURL=hex-flash-data-source.js.map