import { Scalar } from "../types/core";
import { Trait, type EntityOptions, type TemplateOptions } from "../types/entity";
import { Flag, type BufferOptions } from "../types/buffer";
import { GlobalF32, GlobalI32 } from "../types/buffer";
import type { InputMode } from "../types/input";

export class EngineBuffer {
    public static readonly GLOBAL_I32_COUNT = 11;
    public static readonly GLOGAL_F32_COUNT = 7;
    public static readonly GPU_ATTRIBUTE_COUNT = 12;
    public static readonly ENTITY_F32_COUNT = 6;
    public static readonly ENTITY_U16_COUNT = 2;
    public static readonly TEMPLATE_F32_COUNT = 10;
    public static readonly TEMPLATE_U16_COUNT = 1;

    private isWaitingForLock: boolean;
    private readonly pendingLocks: Map<number, VoidFunction>;
    public readonly buffer: SharedArrayBuffer;
    private readonly globalIntegers: Int32Array;
    private readonly globalFloats: Float32Array;
    public readonly gpu: Float32Array;
    public readonly gpuByteOffset: number;
    public readonly maxEntities: number;
    public readonly maxTemplates: number;

    // Template
    public readonly traits: Uint16Array;
    public readonly scaleX: Float32Array;
    public readonly scaleY: Float32Array;
    public readonly tileScaleX: Float32Array;
    public readonly tileScaleY: Float32Array;
    public readonly hitboxScaleX: Float32Array;
    public readonly hitboxScaleY: Float32Array;
    public readonly mass: Float32Array;
    public readonly dragCoefficient: Float32Array;
    public readonly runForce: Float32Array;
    public readonly depth: Float32Array;

    // Entity
    public readonly template: Uint16Array;
    public readonly asset: Uint16Array;
    public readonly x: Float32Array;
    public readonly y: Float32Array;
    public readonly velocity: Float32Array;
    public readonly angle: Float32Array;
    public readonly animationProgress: Float32Array;
    public readonly force: Float32Array;

    constructor(options: BufferOptions) {
        const globalIntCount = EngineBuffer.GLOBAL_I32_COUNT;
        const globalFloatCount = EngineBuffer.GLOGAL_F32_COUNT;
        const gpuLength = options.maxEntities * EngineBuffer.GPU_ATTRIBUTE_COUNT;
        let totalBytes = 0;

        totalBytes = Allocator.align(totalBytes, Scalar.I32) + (globalIntCount * Scalar.I32);
        totalBytes = Allocator.align(totalBytes, Scalar.F32) + (globalFloatCount * Scalar.F32);
        totalBytes = Allocator.align(totalBytes, Scalar.F32) + (gpuLength * Scalar.F32);
        for (let i = 0; i < EngineBuffer.TEMPLATE_U16_COUNT; i++) {
            totalBytes = Allocator.align(totalBytes, Scalar.U16) + (options.maxTemplates * Scalar.U16);
        }
        for (let i = 0; i < EngineBuffer.TEMPLATE_F32_COUNT; i++) {
            totalBytes = Allocator.align(totalBytes, Scalar.F32) + (options.maxTemplates * Scalar.F32);
        }
        for (let i = 0; i < EngineBuffer.ENTITY_U16_COUNT; i++) {
            totalBytes = Allocator.align(totalBytes, Scalar.U16) + (options.maxEntities * Scalar.U16);
        }
        for (let i = 0; i < EngineBuffer.ENTITY_F32_COUNT; i++) {
            totalBytes = Allocator.align(totalBytes, Scalar.F32) + (options.maxEntities * Scalar.F32);
        }

        this.isWaitingForLock = false;
        this.pendingLocks = new Map();
        this.maxEntities = options.maxEntities;
        this.maxTemplates = options.maxTemplates;
        this.buffer = options.buffer ?? new SharedArrayBuffer(totalBytes);

        const allocator = new Allocator(this.buffer);
        this.globalIntegers = allocator.i32(globalIntCount);
        this.globalFloats = allocator.f32(globalFloatCount);

        // GPU
        this.gpuByteOffset = Allocator.align(allocator.byteOffet, Scalar.F32);
        this.gpu = allocator.f32(gpuLength);

        // Template
        this.traits = allocator.u16(options.maxTemplates);
        this.scaleX = allocator.f32(options.maxTemplates);
        this.scaleY = allocator.f32(options.maxTemplates);
        this.tileScaleX = allocator.f32(options.maxTemplates);
        this.tileScaleY = allocator.f32(options.maxTemplates);
        this.hitboxScaleX = allocator.f32(options.maxTemplates);
        this.hitboxScaleY = allocator.f32(options.maxTemplates);
        this.mass = allocator.f32(options.maxTemplates);
        this.dragCoefficient = allocator.f32(options.maxTemplates);
        this.runForce = allocator.f32(options.maxTemplates);
        this.depth = allocator.f32(options.maxTemplates);

        // Entity
        this.template = allocator.u16(options.maxEntities);
        this.asset = allocator.u16(options.maxEntities);
        this.x = allocator.f32(options.maxEntities);
        this.y = allocator.f32(options.maxEntities);
        this.velocity = allocator.f32(options.maxEntities);
        this.angle = allocator.f32(options.maxEntities);
        this.animationProgress = allocator.f32(options.maxEntities);
        this.force = allocator.f32(options.maxEntities);

        // There is no player assigned yet if this is a fresh buffer
        if (!options.buffer) {
            this.playerId = -1;
        }
    }

    private get writerCount(): number {
        return Atomics.load(this.globalIntegers, GlobalI32.BUFFER_WRITER_COUNT);
    }

    private get pendingLockCount(): number {
        return Atomics.load(this.globalIntegers, GlobalI32.PENDING_BUFFER_LOCK_COUNT);
    }

    public startWriting(): boolean {
        if (this.isLocked || this.pendingLockCount > 0) {
            return false;
        }

        Atomics.add(this.globalIntegers, GlobalI32.BUFFER_WRITER_COUNT, 1);
        return true;
    }

    public endWriting(): void {
        Atomics.sub(this.globalIntegers, GlobalI32.BUFFER_WRITER_COUNT, 1);
    }

    public acquireLock(): Promise<void> {
        if (!this.isLocked && this.pendingLockCount === 0 && this.writerCount === 0) {
            this.setFlag(Flag.IS_BUFFER_LOCKED, true);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const previousLockId = Atomics.add(this.globalIntegers, GlobalI32.PENDING_BUFFER_LOCK_COUNT, 1);
            this.pendingLocks.set(previousLockId + 1, resolve);
            this.waitForLock();
        });
    }

    public releaseLock(): void {
        this.setFlag(Flag.IS_BUFFER_LOCKED, false);
    }

    private waitForLock(): void {
        if (this.isWaitingForLock) {
            return;
        }

        this.isWaitingForLock = true;

        const interval = setInterval(() => {
            if (this.pendingLocks.size > 0) {
                if (!this.isLocked && this.writerCount === 0) {
                    const upcomingLockId = this.pendingLockCount;
                    const resolve = this.pendingLocks.get(upcomingLockId);

                    if (typeof resolve === "function") {
                        this.setFlag(Flag.IS_BUFFER_LOCKED, true);
                        this.pendingLocks.delete(upcomingLockId);
                        Atomics.sub(this.globalIntegers, GlobalI32.PENDING_BUFFER_LOCK_COUNT, 1);
                        resolve();
                    }
                }
            } else {
                this.isWaitingForLock = false;
                clearInterval(interval);
            }
        }, 1);
    }

    public get activeEntityCount(): number {
        return Atomics.load(this.globalIntegers, GlobalI32.ACTIVE_ENTITY_COUNT);
    }

    public set activeEntityCount(value: number) {
        Atomics.store(this.globalIntegers, GlobalI32.ACTIVE_ENTITY_COUNT, value);
    }

    public get templateCount(): number {
        return Atomics.load(this.globalIntegers, GlobalI32.TEMPLATE_COUNT);
    }

    public set templateCount(value: number) {
        Atomics.store(this.globalIntegers, GlobalI32.TEMPLATE_COUNT, value);
    }

    public get inputBitMask(): number {
        return Atomics.load(this.globalIntegers, GlobalI32.INPUT_BIT_MASK);
    }

    public set inputBitMask(value: number) {
        Atomics.store(this.globalIntegers, GlobalI32.INPUT_BIT_MASK, value);
    }

    public get physicsRate(): number {
        return this.globalIntegers[GlobalI32.PHYSICS_RATE]!;
    }

    public set physicsRate(value: number) {
        this.globalIntegers[GlobalI32.PHYSICS_RATE] = value;
    }

    public get playerId(): number {
        return Atomics.load(this.globalIntegers, GlobalI32.PLAYER_ID);
    }

    public set playerId(value: number) {
        Atomics.store(this.globalIntegers, GlobalI32.PLAYER_ID, value);
    }

    private getFlag(flag: Flag): boolean {
        const bitMask = Atomics.load(this.globalIntegers, GlobalI32.FLAGS);
        return (bitMask & flag) > 0;
    }

    private setFlag(flag: Flag, value: boolean): void {
        if (value) {
            Atomics.or(this.globalIntegers, GlobalI32.FLAGS, flag);
        } else {
            Atomics.and(this.globalIntegers, GlobalI32.FLAGS, ~flag);
        }
    }

    public get drawHitboxes(): boolean {
        return this.getFlag(Flag.DRAW_HITBOXES);
    }

    public set drawHitboxes(value: boolean) {
        this.setFlag(Flag.DRAW_HITBOXES, value);
    }

    public get isRunning(): boolean {
        return this.getFlag(Flag.IS_RUNNING);
    }

    public set isRunning(value: boolean) {
        this.setFlag(Flag.IS_RUNNING, value);
    }

    public get isLocked(): boolean {
        return this.getFlag(Flag.IS_BUFFER_LOCKED);
    }

    public get worldWidth(): number {
        return this.globalFloats[GlobalF32.WORLD_WIDTH]!;
    }

    public set worldWidth(value: number) {
        this.globalFloats[GlobalF32.WORLD_WIDTH] = value;
    }

    public get worldHeight(): number {
        return this.globalFloats[GlobalF32.WORLD_HEIGHT]!;
    }

    public set worldHeight(value: number) {
        this.globalFloats[GlobalF32.WORLD_HEIGHT] = value;
    }

    public get cameraZoom(): number {
        return this.globalFloats[GlobalF32.CAMERA_ZOOM]!;
    }

    public set cameraZoom(value: number) {
        this.globalFloats[GlobalF32.CAMERA_ZOOM] = value;
    }

    public get gravity(): number {
        return this.globalFloats[GlobalF32.GRAVITATIONAL_ACCELERATION]!;
    }

    public set gravity(value: number) {
        this.globalFloats[GlobalF32.GRAVITATIONAL_ACCELERATION] = value;
    }

    public get airDensity(): number {
        return this.globalFloats[GlobalF32.AIR_DENSITY]!;
    }

    public set airDensity(value: number) {
        this.globalFloats[GlobalF32.AIR_DENSITY] = value;
    }

    public get fps(): number {
        return this.globalIntegers[GlobalI32.RENDER_RATE]!;
    }

    public set fps(value: number) {
        this.globalIntegers[GlobalI32.RENDER_RATE] = value;
    }

    public get inputMode(): InputMode {
        return Atomics.load(this.globalIntegers, GlobalI32.INPUT_MODE);
    }

    public set inputMode(value: InputMode) {
        Atomics.store(this.globalIntegers, GlobalI32.INPUT_MODE, value);
    }

    public get analogLeftX(): number {
        return this.globalFloats[GlobalF32.ANALOG_LEFT_X]!;
    }

    public set analogLeftX(value: number) {
        this.globalFloats[GlobalF32.ANALOG_LEFT_X] = value;
    }

    public get analogLeftY(): number {
        return this.globalFloats[GlobalF32.ANALOG_LEFT_Y]!;
    }

    public set analogLeftY(value: number) {
        this.globalFloats[GlobalF32.ANALOG_LEFT_Y] = value;
    }

    public get gridCellSize(): number {
        return Atomics.load(this.globalIntegers, GlobalI32.GRID_CELL_SIZE);
    }

    public set gridCellSize(value: number) {
        Atomics.store(this.globalIntegers, GlobalI32.GRID_CELL_SIZE, value);
    }

    public storeEntity(entity: EntityOptions): number {
        const idx = this.activeEntityCount;

        if (idx >= this.maxEntities) {
            console.error("Maximum entity count exceeded");
            return -1;
        }

        if (entity.template < 0) {
            console.error("Entity template ID is less then 0. This indicate that the entity does not have a template assigned");
            return -1;
        }

        this.setEntityValues(idx, entity);
        this.activeEntityCount = idx + 1;
        return idx;
    }

    public setEntityValues(idx: number, entity: EntityOptions): void {
        this.template[idx] = entity.template;
        this.x[idx] = entity.x;
        this.y[idx] = entity.y;
        this.velocity[idx] = entity.velocity ?? 0.0;
        this.angle[idx] = entity.angle ?? 0.0;
        this.asset[idx] = entity.asset;
        this.animationProgress[idx] = 0.0;
        this.force[idx] = entity.force ?? 0.0;
    }

    public removeEntity(idx: number): void {
        const count = this.activeEntityCount;
        const playerId = this.playerId;
        const nextIdx = idx + 1;
        const lastIdx = count - 1;

        this.template.copyWithin(idx, nextIdx, count);
        this.x.copyWithin(idx, nextIdx, count);
        this.y.copyWithin(idx, nextIdx, count);
        this.velocity.copyWithin(idx, nextIdx, count);
        this.angle.copyWithin(idx, nextIdx, count);
        this.asset.copyWithin(idx, nextIdx, count);
        this.animationProgress.copyWithin(idx, nextIdx, count);
        this.force.copyWithin(idx, nextIdx, count);

        this.template[lastIdx] = 0;
        this.x[lastIdx] = 0.0;
        this.y[lastIdx] = 0.0;
        this.velocity[lastIdx] = 0.0;
        this.angle[lastIdx] = 0.0;
        this.asset[lastIdx] = 0;
        this.animationProgress[lastIdx] = 0.0;
        this.force[lastIdx] = 0.0;

        this.activeEntityCount = lastIdx;

        if (playerId === idx) {
            this.playerId = -1;
        }
        if (playerId > idx) {
            this.playerId = playerId - 1;
        }
    }

    public clearEntities(): void {
        const count = this.activeEntityCount;
        this.template.fill(0, 0, count);
        this.x.fill(0.0, 0, count);
        this.y.fill(0.0, 0, count);
        this.velocity.fill(0.0, 0, count);
        this.angle.fill(0.0, 0, count);
        this.asset.fill(0, 0, count);
        this.animationProgress.fill(0.0, 0, count);
        this.force.fill(0.0, 0, count);
        this.playerId = -1;
        this.activeEntityCount = 0;
    }

    public storeTemplate(template: TemplateOptions): number {
        const idx = this.templateCount;

        if (idx >= this.maxTemplates) {
            console.error("Maximum template count exceeded");
            return -1;
        }

        this.setTemplateValues(idx, template);
        this.templateCount = idx + 1;
        return idx;
    }

    public setTemplateValues(idx: number, template: TemplateOptions): void {
        const traits = template.traits ?? 0;
        const isTangible = (traits & Trait.TANGIBLE) > 0;
        this.traits[idx] = traits;
        this.scaleX[idx] = template.scaleX;
        this.scaleY[idx] = template.scaleY;
        this.tileScaleX[idx] = template.tileScaleX ?? 0.0;
        this.tileScaleY[idx] = template.tileScaleY ?? 0.0;
        this.hitboxScaleX[idx] = template.hitboxScaleX ?? (isTangible ? template.scaleX : 0.0);
        this.hitboxScaleY[idx] = template.hitboxScaleY ?? (isTangible ? template.scaleY : 0.0);
        this.mass[idx] = template.mass ?? 0.0;
        this.dragCoefficient[idx] = template.dragCoefficient ?? 1.2;
        this.runForce[idx] = template.runForce ?? 0.0;
        this.depth[idx] = template.depth ?? 0.0;
    }

    public removeTemplate(idx: number): void {
        const count = this.templateCount;
        const nextIdx = idx + 1;
        const lastIdx = count - 1;

        this.traits.copyWithin(idx, nextIdx, count);
        this.scaleX.copyWithin(idx, nextIdx, count);
        this.scaleY.copyWithin(idx, nextIdx, count);
        this.tileScaleX.copyWithin(idx, nextIdx, count);
        this.tileScaleY.copyWithin(idx, nextIdx, count);
        this.hitboxScaleX.copyWithin(idx, nextIdx, count);
        this.hitboxScaleY.copyWithin(idx, nextIdx, count);
        this.mass.copyWithin(idx, nextIdx, count);
        this.dragCoefficient.copyWithin(idx, nextIdx, count);
        this.runForce.copyWithin(idx, nextIdx, count);
        this.depth.copyWithin(idx, nextIdx, count);
        
        this.traits[lastIdx] = 0;
        this.scaleX[lastIdx] = 0.0;
        this.scaleY[lastIdx] = 0.0;
        this.tileScaleX[lastIdx] = 0.0;
        this.tileScaleY[lastIdx] = 0.0;
        this.hitboxScaleX[lastIdx] = 0.0;
        this.hitboxScaleY[lastIdx] = 0.0;
        this.mass[lastIdx] = 0.0;
        this.dragCoefficient[lastIdx] = 0.0;
        this.runForce[lastIdx] = 0.0;
        this.depth[lastIdx] = 0.0;

        this.templateCount = lastIdx;
    }

    public clearTemplates(): void {
        const count = this.templateCount;
        this.traits.fill(0, 0, count);
        this.scaleX.fill(0.0, 0, count);
        this.scaleY.fill(0.0, 0, count);
        this.tileScaleX.fill(0.0, 0, count);
        this.tileScaleY.fill(0.0, 0, count);
        this.hitboxScaleX.fill(0.0, 0, count);
        this.hitboxScaleY.fill(0.0, 0, count);
        this.mass.fill(0.0, 0, count);
        this.dragCoefficient.fill(0.0, 0, count);
        this.runForce.fill(0.0, 0, count);
        this.depth.fill(0.0, 0, count);
        this.templateCount = 0;
    }

    public static empty(): EngineBuffer {
        return new EngineBuffer({
            maxEntities: 0,
            maxTemplates: 0,
        });
    }
}

class Allocator {
    private readonly buffer: SharedArrayBuffer;
    public byteOffet: number;

    constructor(buffer: SharedArrayBuffer) {
        this.buffer = buffer;
        this.byteOffet = 0;
    }

    public u16(length: number): Uint16Array {
        this.byteOffet = Allocator.align(this.byteOffet, Scalar.U16);
        const view = new Uint16Array(this.buffer, this.byteOffet, length);
        this.byteOffet += length * Scalar.U16;
        return view;
    }

    public i32(length: number): Int32Array {
        this.byteOffet = Allocator.align(this.byteOffet, Scalar.I32);
        const view = new Int32Array(this.buffer, this.byteOffet, length);
        this.byteOffet += length * Scalar.I32;
        return view;
    }

    public f32(length: number): Float32Array {
        this.byteOffet = Allocator.align(this.byteOffet, Scalar.F32);
        const view = new Float32Array(this.buffer, this.byteOffet, length);
        this.byteOffet += length * Scalar.F32;
        return view;
    }

    public static align(offset: number, alignment: number): number {
        return Math.ceil(offset / alignment) * alignment;
    }
}