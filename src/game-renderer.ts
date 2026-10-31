import vertexShader from "./shaders/vertex.wgsl" with { type: "text" };
import fragmentShader from "./shaders/fragment.wgsl" with { type: "text" };
import { Renderer } from "./render/renderer";
import { VertexBufferDescriptor } from "./render/vertex-buffer-descriptor";
import { EngineBuffer } from "./util/buffer";
import { Scalar } from "./types/core";
import { Trait } from "./types/entity";
import { GpuAttribute } from "./types/buffer";
import type { Camera2D } from "./render/camera-2d";
import { RateCounter } from "./util/rate-counter";
import { TextureAtlas } from "./textures";
import { RenderSettings } from "./render/settings";

export class GameRenderer extends Renderer {
    private atlas: TextureAtlas;
    private quadBuffer: GPUBuffer;
    private texture: GPUTexture;
    private textureBind: GPUBindGroup;
    private readonly camera: Camera2D;
    private readonly cameraBind: GPUBindGroup;
    private readonly settings: RenderSettings;
    private readonly settingsBind: GPUBindGroup;
    private readonly fps: RateCounter;
    private visibleEntities: Uint32Array;
    private visibleCount: number;
    private staticDepthCount: number;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement, textureBitmap: ImageBitmap, atlas: TextureAtlas, buffer: EngineBuffer) {
        super(device, buffer, {
            canvas,
            clearColor: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 }, // Black background
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        });
        this.atlas = atlas;

        this.visibleCount = 0;
        this.staticDepthCount = 0;
        this.visibleEntities = new Uint32Array(buffer.maxEntities);
        this.texture = this.createTexture(textureBitmap);
        this.textureBind = this.bind(1, this.sampler, this.texture.createView());
        this.quadBuffer = this.getBuffer("quads");

        this.camera = this.createCamera2D();
        this.cameraBind = this.bind(0, this.camera.buffer);
        this.camera.setWorldSize(this.buffer.worldWidth, this.buffer.worldHeight);
        this.camera.zoom = this.buffer.cameraZoom;

        this.settings = new RenderSettings(this.device);
        this.settingsBind = this.bind(2, this.settings.buffer);

        this.fps = new RateCounter((fps) => {
            this.buffer.fps = Math.round(fps);
        });
    }

    public get cameraX(): number {
        return this.camera.offsetX;
    }

    public get cameraY(): number {
        return this.camera.offsetY;
    }

    protected override onRenderPass(encoder: GPURenderPassEncoder, deltaTime: number): void {
        this.selectVisible();
        this.depthTest();
        this.updateGpuData(deltaTime);
        this.updateCamera();

        this.settings.drawHitboxes = this.buffer.drawHitboxes;

        this.writeToGpuBuffer();

        encoder.setBindGroup(0, this.cameraBind);
        encoder.setBindGroup(1, this.textureBind); // Bind the texture/sampler
        encoder.setBindGroup(2, this.settingsBind);
        encoder.setVertexBuffer(0, this.quadBuffer);

        if (this.visibleCount > 0) {
            encoder.draw(6, this.visibleCount, 0, 0); // Instanced draw call for all active quads!
        }

        encoder.end();
        this.fps.tick();
    }

    private selectVisible(): void {
        const activeCount = this.buffer.activeEntityCount;

        this.visibleCount = 0;
        this.staticDepthCount = 0;

        for (let i = 0; i < activeCount; i++) {
            const templateId = this.buffer.template[i]!;

            if (templateId < 0) {
                continue;
            }

            const traits = this.buffer.traits[templateId]!;
            const hasStaticDepth = (traits & Trait.HAS_STATIC_DEPTH) > 0;
            const isVisible = (traits & Trait.VISIBLE) > 0;

            if (!hasStaticDepth || !isVisible) {
                continue;
            }

            this.visibleEntities[this.visibleCount] = i;
            this.visibleCount++;
        }

        this.staticDepthCount = this.visibleCount;

        for (let i = 0; i < activeCount; i++) {
            const templateId = this.buffer.template[i]!;

            if (templateId < 0) {
                continue;
            }

            const traits = this.buffer.traits[templateId]!;
            const hasStaticDepth = (traits & Trait.HAS_STATIC_DEPTH) > 0;
            const isVisible = (traits & Trait.VISIBLE) > 0;

            if (hasStaticDepth || !isVisible) {
                continue;
            }

            this.visibleEntities[this.visibleCount] = i;
            this.visibleCount++;
        }
    }

    private depthTest(): void {
        const entityIds = this.visibleEntities;
        const yCoords = this.buffer.y;
        const templateIds = this.buffer.template;
        const depthIndices = this.buffer.depth;

        for (let i = 1; i < this.staticDepthCount; i++) {
            const entityId = entityIds[i]!;
            const templateId = templateIds[entityId]!;
            const targetDepth = depthIndices[templateId]!;
            let j = i - 1;

            // Sort descending: higher depths index (background) drawn first, lower depth index (foreground) drawn last
            while (j >= 0 && depthIndices[templateIds[entityIds[j]!]!]! < targetDepth) {
                entityIds[j + 1] = entityIds[j]!;
                j--;
            }

            entityIds[j + 1] = entityId;
        }

        for (let i = this.staticDepthCount + 1; i < this.visibleCount; i++) {
            const entityId = entityIds[i]!;
            const targetY = yCoords[entityId]!;
            let j = i - 1;

            // Sort descending: higher Y (background) drawn first, lower Y (foreground) drawn last
            while (j >= this.staticDepthCount && yCoords[entityIds[j]!]! < targetY) {
                entityIds[j + 1] = entityIds[j]!;
                j--;
            }

            entityIds[j + 1] = entityId;
        }
    }

    private updateGpuData(deltaTime: number): void {
        const isRunning = this.buffer.isRunning;
        let offset = 0;

        for (let i = 0; i < this.visibleCount; i++) {
            const entityId = this.visibleEntities[i]!;
            const templateId = this.buffer.template[entityId]!;
            const traits = this.buffer.traits[templateId]!
            const isTiled = (traits & Trait.TILED) > 0;
            const animationId = this.buffer.animation[entityId]!;
            const duration = this.atlas.animationDuration[animationId]!;
            const frames = this.atlas.animationFrames[animationId]!;
            let frameIdx = 0;

            if (duration > 0 && frames.length > 1) {
                let animationProgress = this.buffer.animationProgress[entityId]!;

                if (isRunning) {
                    animationProgress = (animationProgress + deltaTime) % duration;
                    this.buffer.animationProgress[entityId] = animationProgress;
                }

                frameIdx = Math.floor(animationProgress * frames.length / duration);
            }

            const frame = frames[frameIdx]!;
            this.buffer.gpu[offset + GpuAttribute.X] = this.buffer.x[entityId]!;
            this.buffer.gpu[offset + GpuAttribute.Y] = this.buffer.y[entityId]!;
            if (isTiled) {
                this.buffer.gpu[offset + GpuAttribute.SCALE_X] = this.buffer.scaleX[templateId]!;
                this.buffer.gpu[offset + GpuAttribute.SCALE_Y] = this.buffer.scaleY[templateId]!;
            } else {
                this.buffer.gpu[offset + GpuAttribute.SCALE_X] = this.buffer.scaleX[templateId]! * this.atlas.widthScale[frame]!;
                this.buffer.gpu[offset + GpuAttribute.SCALE_Y] = this.buffer.scaleY[templateId]! * this.atlas.heightScale[frame]!;
            }
            this.buffer.gpu[offset + GpuAttribute.U0] = this.atlas.u0[frame]!;
            this.buffer.gpu[offset + GpuAttribute.V0] = this.atlas.v0[frame]!;
            this.buffer.gpu[offset + GpuAttribute.U1] = this.atlas.u1[frame]!;
            this.buffer.gpu[offset + GpuAttribute.V1] = this.atlas.v1[frame]!;
            this.buffer.gpu[offset + GpuAttribute.TILE_SCALE_X] = this.buffer.tileScaleX[templateId]!;
            this.buffer.gpu[offset + GpuAttribute.TILE_SCALE_Y] = this.buffer.tileScaleY[templateId]!;
            this.buffer.gpu[offset + GpuAttribute.HITBOX_SCALE_X] = this.buffer.hitboxScaleX[templateId]!;
            this.buffer.gpu[offset + GpuAttribute.HITBOX_SCALE_Y] = this.buffer.hitboxScaleY[templateId]!;

            offset += EngineBuffer.GPU_ATTRIBUTE_COUNT;
        }
    }

    private updateCamera(): void {
        const worldWidth = this.buffer.worldWidth;
        const worldHeight = this.buffer.worldHeight;
        const cameraZoom = this.buffer.cameraZoom;
        const playerId = this.buffer.playerId;

        if (playerId >= 0) {
            const playerX = this.buffer.x[playerId]!;
            const playerY = this.buffer.y[playerId]!;
            this.camera.update(playerX, playerY, worldWidth, worldHeight, cameraZoom);
        } else {
            this.camera.updateInPlace(worldWidth, worldHeight, cameraZoom);
        }
    }

    private writeToGpuBuffer(): void {
        if (this.visibleCount > 0) {
            // Upload ONLY the active chunk of data from the payload offset
            const activeBytes = this.visibleCount * EngineBuffer.GPU_ATTRIBUTE_COUNT * Scalar.F32;
            this.device.queue.writeBuffer(this.quadBuffer, 0, this.buffer.buffer, this.buffer.gpuByteOffset, activeBytes);
        }
    }

    public setScreenSize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.camera.updateScaling();
    }

    public reassignEngineBuffer(buffer: EngineBuffer): void {
        this.destroyGpuBuffers();
        this.buffer = buffer;
        this.visibleEntities = new Uint32Array(buffer.maxEntities);
        this.initializeGpuBuffers();
        this.quadBuffer = this.getBuffer("quads");
    }

    public reassignTexture(textureBitmap: ImageBitmap, atlas: TextureAtlas): void {
        this.texture.destroy();
        this.atlas = atlas;
        this.texture = this.createTexture(textureBitmap);
        this.textureBind = this.bind(1, this.sampler, this.texture.createView());
    }

    protected override describeVertexBuffers(): VertexBufferDescriptor[] {
        const quadBufferDescriptor = VertexBufferDescriptor.create("quads")
            .withStride(EngineBuffer.GPU_ATTRIBUTE_COUNT * Scalar.F32)
            .withCapacity(this.buffer.maxEntities)
            .withStepMode("instance")
            .withAttribute(0, Scalar.F32 * 0, "float32x2")      // Position (x, y)
            .withAttribute(1, Scalar.F32 * 2, "float32x2")     	// Scale (scaleX, scaleY)
            .withAttribute(2, Scalar.F32 * 4, "float32x4")    	// UV Rect (u0, v0, u1, v1)
            .withAttribute(3, Scalar.F32 * 8, "float32x2")      // Scale tiled quads (tileScaleX, tileScaleY)
            .withAttribute(4, Scalar.F32 * 10, "float32x2");

        return [quadBufferDescriptor];
    }
}
