import type { EngineBuffer } from "../util/buffer";
import { Camera2D } from "./camera-2d";
import { TextureUsage, type RendererOptions } from "./types";
import type { VertexBufferDescriptor } from "./vertex-buffer-descriptor";


export abstract class Renderer {
    public static readonly LAYOUT_MODE = "auto";
    public static readonly ALPHA_MODE = "opaque";
    public static readonly TOPOLOGY = "triangle-list";
    protected buffer: EngineBuffer;
    public readonly canvas: HTMLCanvasElement;
    protected readonly sampler: GPUSampler;
    protected readonly device: GPUDevice;
    private readonly context: GPUCanvasContext;
    private readonly pipeline: GPURenderPipeline;
    private readonly buffers: Map<string, GPUBuffer>;
    private readonly clearColor: GPUColor;
    private lastTime: DOMHighResTimeStamp;
    private rendererId: number;
    private isRendering: boolean;

    protected constructor(device: GPUDevice, buffer: EngineBuffer, options: RendererOptions) {
        const format = navigator.gpu.getPreferredCanvasFormat();
        this.buffer = buffer;
        this.device = device;
        this.canvas = options.canvas;
        this.context = Renderer.createContext(this.canvas);
        this.clearColor = options.clearColor;
        this.buffers = new Map();
        this.lastTime = 0;
        this.rendererId = 0;
        this.isRendering = false;
        this.sampler = device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
        });

        this.context.configure({
            device,
            format,
            alphaMode: Renderer.ALPHA_MODE,
        });

        const vertexBuffers = this.describeVertexBuffers();

        this.initializeGpuBuffers();
        this.pipeline = device.createRenderPipeline({
            layout: Renderer.LAYOUT_MODE,
            vertex: {
                module: device.createShaderModule({
                    code: options.vertexShader,
                }),
                entryPoint: "main",
                buffers: vertexBuffers.map((buffer) => buffer.describe()),
            },
            fragment: {
                module: device.createShaderModule({
                    code: options.fragmentShader,
                }),
                entryPoint: "main",
                targets: [
                    {
                        format,
                        blend: {
                            color: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                        }
                    },
                ],
            },
            primitive: {
                topology: Renderer.TOPOLOGY,
            }
        });
    }

    public start(): void {
        if (this.isRendering) {
            return;
        }
        
        this.isRendering = true;
        const onFrame: FrameRequestCallback = (currentTime) => {
            if (!this.isRendering) {
                return;
            }

            const deltaTime = (currentTime - this.lastTime) / 1000; // in seconds
            const encoder = this.device.createCommandEncoder();
            const pass = encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.createTextureView(),
                        clearValue: this.clearColor,
                        loadOp: "clear",
                        storeOp: "store",
                    }
                ],
            });

            this.lastTime = currentTime;
            pass.setPipeline(this.pipeline);
            this.onRenderPass(pass, deltaTime);
            this.device.queue.submit([
                encoder.finish(),
            ]);
            this.rendererId = requestAnimationFrame(onFrame);
        };
        this.rendererId = requestAnimationFrame(onFrame);
    }

    public pause(): void {
        this.isRendering = false;
        cancelAnimationFrame(this.rendererId);
    }

    protected abstract describeVertexBuffers(): VertexBufferDescriptor[];
    protected abstract onRenderPass(encoder: GPURenderPassEncoder, deltaTime: number): void;

    protected initializeGpuBuffers(): void {
        const vertexBuffers = this.describeVertexBuffers();

        for (const buffer of vertexBuffers) {
            this.buffers.set(buffer.label, buffer.allocate(this.device));
        }
    }

    protected destroyGpuBuffers(): void {
        for (const buffer of this.buffers.values()) {
            buffer.destroy();
        }

        this.buffers.clear();
    }

    protected getBuffer(label: string): GPUBuffer {
        const buffer = this.buffers.get(label);

        if (!buffer) {
            throw new Error(`Buffer ${label} not found`);
        }

        return buffer;
    }

    protected bind(group: number, ...resources: GPUBindingResource[]): GPUBindGroup {
        return this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(group),
            entries: resources.map<GPUBindGroupEntry>((resource, binding) => ({
                binding,
                resource,
            })),
        });
    }

    protected createTextureView(): GPUTextureView {
        return this.context.getCurrentTexture().createView();
    }

    protected createCamera2D(): Camera2D {
        return new Camera2D(this.device, this.canvas);
    }

    protected createTexture(bitmap: ImageBitmap): GPUTexture {
        const texture = this.device.createTexture({
            size: [bitmap.width, bitmap.height, 1],
            format: "rgba8unorm",
            usage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST | TextureUsage.RENDER_ATTACHMENT,
        });
        this.device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture: texture },
            [bitmap.width, bitmap.height]
        );
        return texture;
    }

    public static findCanvas(id: string): HTMLCanvasElement {
        const canvas = document.getElementById(id);

        if (!(canvas instanceof HTMLCanvasElement)) {
            throw Error(`Element with ID: ${id} is not a canvas`);
        }

        return canvas;
    }

    public static async loadBitmap(url: string | URL): Promise<ImageBitmap> {
        const response = await fetch(url);
        const blob = await response.blob();
        return createImageBitmap(blob, { colorSpaceConversion: "none" });
    }

    private static createContext(canvas: HTMLCanvasElement): GPUCanvasContext {
        const context = canvas.getContext("webgpu");

        if (!(context instanceof GPUCanvasContext)) {
            throw new Error("WebGPU context is unavailable");
        }

        return context;
    }

    public static async requestDevice(): Promise<GPUDevice> {
        const adapter = await navigator.gpu.requestAdapter();

        if (!adapter) {
            throw new Error("No appropriate GPUAdapter found.");
        }

        return adapter.requestDevice();
    }
}