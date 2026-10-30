import type { EngineBuffer } from "./util/buffer";

export class DevClient {
    private readonly buffer: EngineBuffer;

    constructor(buffer: EngineBuffer) {
        this.buffer = buffer;
    }

    public set drawHitboxes(value: boolean) {
        this.buffer.drawHitboxes = value;
    }
}