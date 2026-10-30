import { type KeyBindings } from "./types/input";
import { Input, InputMode } from "./types/input";
import type { EngineBuffer } from "./util/buffer";

const PASSIVE: AddEventListenerOptions = {
    passive: true,
};

type EventHandler<E> = (event: E) => void;

export class InputHandler {
    private buffer: EngineBuffer;
    private readonly bindings: Map<string, Input>;
    private bitMask: number;
    private timer?: Timer;
    private gamepadIndex: number;
    private keyDownHandler: EventHandler<KeyboardEvent>;
    private keyUpHandler: EventHandler<KeyboardEvent>;
    private gamepadConnectedHandler: EventHandler<GamepadEvent>;
    private gamepadDisconnectedHandler: EventHandler<GamepadEvent>;

    constructor(buffer: EngineBuffer, bindings: KeyBindings) {
        this.buffer = buffer;
        this.bindings = new Map(Object.entries(bindings));
        this.bitMask = 0;
        this.gamepadIndex = 0;
        this.buffer.inputMode = InputMode.KEYBOARD;

        this.keyDownHandler = (event) => {
            if (event.repeat) {
                return;
            }

            const input = this.bindings.get(event.code);

            if (input === Input.PAUSE) {
                this.buffer.isRunning = !this.buffer.isRunning;
            }

            if (input !== undefined) {
                this.bitMask |= input;
                this.buffer.inputMode = InputMode.KEYBOARD;
                this.buffer.inputBitMask = this.bitMask;
            }
        };

        this.keyUpHandler = (event) => {
            const input = this.bindings.get(event.code);

            if (input !== undefined) {
                this.bitMask &= ~input;
            }

            this.buffer.inputBitMask = this.bitMask;
        };

        this.gamepadConnectedHandler = (event) => {
            this.gamepadIndex = event.gamepad.index;
            this.buffer.inputMode = InputMode.GAMEPAD;
            this.timer = setInterval(() => {
                const gamepads = navigator.getGamepads();
                const gamepad = gamepads[this.gamepadIndex];

                if (gamepad) {
                    this.buffer.analogLeftX = gamepad.axes[0]!;
                    this.buffer.analogLeftY = gamepad.axes[1]!;
                }
            }, 1);
        };

        this.gamepadDisconnectedHandler = () => {
            clearInterval(this.timer);
            this.buffer.inputMode = InputMode.KEYBOARD;
        };
    }

    public start(): void {
        window.addEventListener("keydown", this.keyDownHandler, PASSIVE);
        window.addEventListener("keyup", this.keyUpHandler, PASSIVE);
        window.addEventListener("gamepadconnected", this.gamepadConnectedHandler, PASSIVE);
        window.addEventListener("gamepaddisconnected", this.gamepadDisconnectedHandler, PASSIVE);
    }

    public stop(): void {
        window.removeEventListener("keydown", this.keyDownHandler, PASSIVE);
        window.removeEventListener("keyup", this.keyUpHandler, PASSIVE);
        window.removeEventListener("gamepadconnected", this.gamepadConnectedHandler, PASSIVE);
        window.removeEventListener("gamepaddisconnected", this.gamepadDisconnectedHandler, PASSIVE);
    }

    public reassignEngineBuffer(buffer: EngineBuffer): void {
        this.buffer = buffer;
    }
}