export enum Input {
    UP = 1 << 0,
    RIGHT = 1 << 1,
    DOWN = 1 << 2,
    LEFT = 1 << 3,
    PAUSE = 1 << 4,
}

export enum InputMode {
    KEYBOARD,
    GAMEPAD
}

export interface KeyBindings {
    [keyCode: string]: Input;
}
