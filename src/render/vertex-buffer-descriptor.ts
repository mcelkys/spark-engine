import { BufferUsage } from "./types";

export class VertexBufferDescriptor {
    public readonly label: string;
    private stride?: number;
    private capacity?: number;
    private stepMode?: GPUVertexStepMode;
    private readonly attributes: GPUVertexAttribute[];

    constructor(label: string) {
        this.label = label;
        this.attributes = [];
    }

    public withStride(stride: number): this {
        this.stride = stride;
        return this;
    }

    public withCapacity(capacity: number): this {
        this.capacity = capacity;
        return this;
    }

    public withStepMode(stepMode: GPUVertexStepMode): this {
        this.stepMode = stepMode;
        return this;
    }

    public withAttribute(shaderLocation: number, offset: number, format: GPUVertexFormat): this {
        this.attributes.push({ shaderLocation, offset, format });
        return this;
    }

    public describe(): GPUVertexBufferLayout {
        if (this.stride === undefined) {
            throw new Error("Vertex buffer stride not defined");
        }

        return {
            arrayStride: this.stride,
            stepMode: this.stepMode,
            attributes: this.attributes,
        };
    }

    public allocate(device: GPUDevice): GPUBuffer {
        if (this.stride === undefined) {
            throw new Error("Vertex buffer stride not defined");
        }

        if (this.capacity === undefined) {
            throw new Error("Vertex buffer capacity not defined");
        }

        return device.createBuffer({
            size: this.capacity * this.stride, // Fits 4096 quads
            usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
        });
    }

    public static create(label: string): VertexBufferDescriptor {
        return new VertexBufferDescriptor(label);
    }

    public static createInstanced(label: string, stride: number, capacity: number): VertexBufferDescriptor {
        return this.create(label)
            .withStride(stride)
            .withCapacity(capacity)
            .withStepMode("instance");
    }
}