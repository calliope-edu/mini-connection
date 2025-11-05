export var ButtonState;
(function (ButtonState) {
    ButtonState[ButtonState["NotPressed"] = 0] = "NotPressed";
    ButtonState[ButtonState["ShortPress"] = 1] = "ShortPress";
    ButtonState[ButtonState["LongPress"] = 2] = "LongPress";
})(ButtonState || (ButtonState = {}));
export class ButtonEvent extends Event {
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
//# sourceMappingURL=buttons.js.map