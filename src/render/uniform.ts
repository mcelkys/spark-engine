import { Scalar } from "../types/core";
import { BufferUsage } from "./types";

export class Uniform {
    public readonly buffer: GPUBuffer;
    protected readonly data: Float32Array;
    private readonly device: GPUDevice;

    constructor(device: GPUDevice, size: number) {
        this.device = device;
        this.buffer = this.device.createBuffer({
            size: size * Scalar.F32,
            usage: BufferUsage.UNIFORM | BufferUsage.COPY_DST,
        });
        this.data = new Float32Array(size);
    }

    protected write(): void {
        this.device.queue.writeBuffer(this.buffer, 0, this.data);
    }
}