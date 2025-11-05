export declare enum ButtonState {
    NotPressed = 0,
    ShortPress = 1,
    LongPress = 2
}
export type ButtonEventType = "buttonachanged" | "buttonbchanged";
export declare class ButtonEvent extends Event {
    readonly state: ButtonState;
    constructor(type: ButtonEventType, state: ButtonState);
}
