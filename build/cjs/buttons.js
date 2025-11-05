"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ButtonEvent = exports.ButtonState = void 0;
var ButtonState;
(function (ButtonState) {
    ButtonState[ButtonState["NotPressed"] = 0] = "NotPressed";
    ButtonState[ButtonState["ShortPress"] = 1] = "ShortPress";
    ButtonState[ButtonState["LongPress"] = 2] = "LongPress";
})(ButtonState || (exports.ButtonState = ButtonState = {}));
class ButtonEvent extends Event {
    constructor(type, state) {
        super(type);
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: state
        });
    }
}
exports.ButtonEvent = ButtonEvent;
//# sourceMappingURL=buttons.js.map