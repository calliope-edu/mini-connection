"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullLogging = void 0;
class NullLogging {
    event(_event) {
        console.log(_event);
    }
    error(_m, _e) {
        console.error(_m, _e);
    }
    log(_e) {
        console.log(_e);
    }
}
exports.NullLogging = NullLogging;
//# sourceMappingURL=logging.js.map