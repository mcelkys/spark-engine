import { WorkerRequestType, type LogicWorkerRequest } from "./types/message";
import { Input, InputMode } from "./types/input";
import { AnimationManifest } from "./textures";
import { EngineBuffer } from "./util/buffer";
import { Singleton } from "./util/decorators";
import { ComputeWorker } from "./util/worker";
import type { AnimationCollection } from "./types/assets";

@Singleton
class LogicWorker extends ComputeWorker<LogicWorkerRequest> {
    private buffer: EngineBuffer = EngineBuffer.empty();
    private animations: AnimationManifest = AnimationManifest.empty();

    protected override onRequest(request: LogicWorkerRequest): Promise<unknown> {
        switch (request.requestType) {
            case WorkerRequestType.ASSET_MANIFEST:
                this.animations = new AnimationManifest(request.pack.animations, request.pack.collections);
                break;

            case WorkerRequestType.BUFFER:
                this.buffer = new EngineBuffer(request);
                break;

            case WorkerRequestType.START:
                this.start();
                break;

            case WorkerRequestType.PAUSE:
                this.pause();
                break;

            default:
                console.warn("Invalid worker request", request);
                break;
        }

        return Promise.resolve();
    }

    protected override onTick(): void {
        if (!this.buffer.isRunning) {
            return;
        }

        const inputMode = this.buffer.inputMode;
        const playerId = this.buffer.playerId;

        if (playerId < 0) {
            return;
        }

        const templateId = this.buffer.template[playerId]!;

        if (templateId < 0) {
            return;
        }
        if (!this.buffer.startWriting()) {
            return;
        }

        const force = this.buffer.runForce[templateId]!;
        const animationCollectionId = this.buffer.animations[templateId]!;
        const animationCollection = this.animations.getCollection(animationCollectionId);

        if (inputMode === InputMode.KEYBOARD) {
            const mask = this.buffer.inputBitMask;
            let moveX = 0;
            let moveY = 0;

            // Interpret WASD bitmask flags
            if (mask & Input.UP) moveY += 1;
            if (mask & Input.DOWN) moveY -= 1;
            if (mask & Input.LEFT) moveX -= 1;
            if (mask & Input.RIGHT) moveX += 1;

            // If keys are pressed, calculate movement vector and set run animation
            if (moveX !== 0 || moveY !== 0) {
                const angle = Math.atan2(moveY, moveX); // Heading in radians
                this.buffer.force[playerId] = force;
                this.buffer.angle[playerId] = angle;
                this.buffer.animation[playerId] = this.getDirectionalAnimationId(animationCollection, angle);
            } else {
                // Stop movement and switch back to idle animation
                this.buffer.force[playerId] = 0.0;
                this.buffer.animation[playerId] = this.animations.getAnimationId(animationCollection.idle);
            }
        }

        if (inputMode === InputMode.GAMEPAD) {
            const rawX = this.buffer.analogLeftX;
            const rawY = this.buffer.analogLeftY; // Standard gamepad: up is negative (-1), down is positive (+1)

            // 1. Apply a deadzone to prevent stick drift (e.g., ignore inputs below 15% tilt)
            const deadzone = 0.15;
            const magnitude = Math.sqrt(rawX * rawX + rawY * rawY);

            if (magnitude > deadzone) {
                // Normalize the remaining range past the deadzone from [deadzone, 1.0] to [0.0, 1.0]
                const normalizedMagnitude = Math.min(1.0, (magnitude - deadzone) / (1.0 - deadzone));

                // Scale the base force by stick pressure (allows for slow walking vs running)
                this.buffer.force[playerId] = force * normalizedMagnitude;

                // Invert rawY because standard 2D canvas/world coordinates treat UP as positive
                const angle = Math.atan2(-rawY, rawX);
                this.buffer.angle[playerId] = angle;
                this.buffer.animation[playerId] = this.getDirectionalAnimationId(animationCollection, angle);
            } else {
                // Stick is centered within deadzone
                this.buffer.force[playerId] = 0.0;
                this.buffer.animation[playerId] = this.animations.getAnimationId(animationCollection.idle);
            }
        }

        this.buffer.endWriting();
    }

    private getDirectionalAnimationId(collection: AnimationCollection, angle: number): number {
        if (angle >= Math.PI * 0.25 && angle <= Math.PI * 0.75) {
            return this.animations.getAnimationId(collection.moveUp ?? collection.idle);
        } else if (angle >= -Math.PI * 0.75 && angle <= -Math.PI * 0.25) {
            return this.animations.getAnimationId(collection.moveDown ?? collection.idle);
        } else if (angle > Math.PI * 0.75 || angle < -Math.PI * 0.75) {
            return this.animations.getAnimationId(collection.moveLeft ?? collection.idle);
        } else {
            return this.animations.getAnimationId(collection.moveRight ?? collection.idle);
        }
    }
}