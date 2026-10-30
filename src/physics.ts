import { WorkerRequestType, type PhysicsWorkerRequest } from "./types/message";
import { Trait } from "./types/entity";
import { Singleton } from "./util/decorators";
import { ComputeWorker } from "./util/worker";
import { EngineBuffer } from "./util/buffer";
import { RateCounter } from "./util/rate-counter";
import { SpacialHashGrid } from "./util/spacial-hash-grid";

@Singleton
class PhysicsWorker extends ComputeWorker<PhysicsWorkerRequest> {
    private grid: SpacialHashGrid = new SpacialHashGrid(1, 1, 1, 0);
    private buffer: EngineBuffer = EngineBuffer.empty();
    private counter = new RateCounter((tps) => {
        this.buffer.physicsRate = Math.round(tps);
    });

    protected override onRequest(request: PhysicsWorkerRequest): Promise<unknown> {
        switch (request.requestType) {
            case WorkerRequestType.BUFFER:
                this.buffer = new EngineBuffer(request);
                this.grid = new SpacialHashGrid(this.buffer.worldWidth * 2, this.buffer.worldHeight * 2, this.buffer.gridCellSize, this.buffer.maxEntities);
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

    protected override onTick(deltaTime: number): void {
        if (!this.buffer.isRunning) {
            return;
        }
        if (!this.buffer.startWriting()) {
            return;
        }

        const friction = 10;
        const worldWidth = this.buffer.worldWidth;
        const worldHeight = this.buffer.worldHeight;
        const gravity = this.buffer.gravity;
        const airDensity = this.buffer.airDensity;
        const activeCount = this.buffer.activeEntityCount;

        this.grid.clear();

        for (let i = 0; i < activeCount; i++) {
            const templateId = this.buffer.template[i]!;

            if (templateId < 0) {
                continue;
            }

            const traits = this.buffer.traits[templateId]!;
            const isTangible = (traits & Trait.TANGIBLE) > 0;

            if (!isTangible) {
                continue;
            }

            const x = this.buffer.x[i]!;
            const y = this.buffer.y[i]!;
            const width = this.buffer.hitboxScaleX[templateId]!;
            const height = this.buffer.hitboxScaleY[templateId]!;
            this.grid.insert(i, x, y, width, height);
        }

        // Update physics with delta-time scaling for smooth, framerate-independent motion
        for (let i = 0; i < activeCount; i++) {
            const templateId = this.buffer.template[i]!;

            if (templateId < 0) {
                continue;
            }

            const traits = this.buffer.traits[templateId]!;
            const isMobile = (traits & Trait.MOBILE) > 0;
            const mass = this.buffer.mass[templateId]!;

            if (!isMobile || mass === 0) {
                continue;
            }

            const force = this.buffer.force[i]!;
            const lastVelocity = this.buffer.velocity[i]!;
            const hitboxScaleX = this.buffer.hitboxScaleX[templateId]!;
            const hitboxScaleY = this.buffer.hitboxScaleY[templateId]!;
            let resistiveForce = 0.0;

            // Compute drag / friction forces
            if (lastVelocity > 0) {
                const drag = this.buffer.dragCoefficient[templateId]!;
                const surfaceArea = hitboxScaleX * hitboxScaleY;
                const dragForce = 0.5 * drag * airDensity * surfaceArea * lastVelocity ** 2;
                const frictionForce = friction * mass * gravity;
                resistiveForce = frictionForce + dragForce;
            }

            // Compute velocity
            const netForce = force - resistiveForce;
            const accelation = netForce / mass;
            const deltaVelocity = accelation * deltaTime;
            const newVelocity = Math.max(0, lastVelocity + deltaVelocity);
            this.buffer.velocity[i] = newVelocity;

            if (newVelocity === 0) {
                continue;
            }

            // Compute directional movement deltas
            const angle = this.buffer.angle[i]!; // radians
            const lastX = this.buffer.x[i]!;
            const lastY = this.buffer.y[i]!;
            const deltaX = newVelocity * Math.cos(angle) * deltaTime;
            const deltaY = newVelocity * Math.sin(angle) * deltaTime;
            const newX = lastX + deltaX;
            const newY = lastY + deltaY;
            const halfWidth = hitboxScaleX / 2;
            const halfHeight = hitboxScaleY / 2;

            this.buffer.x[i] = newX;

            if (this.collides(i)) {
                this.buffer.x[i] = lastX;
            }
            if (newX - halfWidth < -worldWidth || newX + halfWidth > worldWidth) {
                this.buffer.x[i] = lastX;
            }

            this.buffer.y[i] = newY;

            if (this.collides(i)) {
                this.buffer.y[i] = lastY;
            }
            if (newY - halfHeight < -worldHeight || newY + halfHeight > worldHeight) {
                this.buffer.y[i] = lastY;
            }

            // console.log(`
            //     x: ${this.buffer.x[i]}
            //     y: ${this.buffer.y[i]}
            //     force: ${this.buffer.force[i]}
            //     mass: ${this.buffer.mass[i]}
            //     velocity: ${this.buffer.velocity[i]}
            //     resistiveForce: ${resistiveForce}
            // `);
        }

        this.buffer.endWriting();
        this.counter.tick();
    }

    private collides(id: number): boolean {
        const tplId = this.buffer.template[id]!

        if (tplId < 0) {
            return false;
        }

        const traits = this.buffer.traits[tplId]!;
        const isTangible = (traits & Trait.TANGIBLE) > 0;

        if (!isTangible) {
            return false;
        }

        const x1 = this.buffer.x[id]!;
        const y1 = this.buffer.y[id]!;
        const w1 = this.buffer.hitboxScaleX[tplId]!;
        const h1 = this.buffer.hitboxScaleY[tplId]!;

        const left1 = x1 - w1 / 2;
        const right1 = x1 + w1 / 2;
        const bottom1 = y1 - h1 / 2;
        const top1 = y1 + h1 / 2;

        this.grid.select(x1, y1, w1, h1);

        for (let c = 0; c < this.grid.selected.count; c++) {
            const cellId = this.grid.selected.cells[c]!;
            const cell = this.grid.cells[cellId]!;

            for (let i = 0; i < cell.count; i++) {
                const entityId = cell.ids[i]!;

                if (entityId === id) {
                    continue;
                }

                const templateId = this.buffer.template[entityId]!;

                if (templateId < 0) {
                    continue;
                }

                const x2 = this.buffer.x[entityId]!;
                const y2 = this.buffer.y[entityId]!;
                const w2 = this.buffer.hitboxScaleX[templateId]!;
                const h2 = this.buffer.hitboxScaleY[templateId]!;

                const left2 = x2 - w2 / 2;
                const right2 = x2 + w2 / 2;
                const bottom2 = y2 - h2 / 2;
                const top2 = y2 + h2 / 2;

                if (left1 < right2 && right1 > left2 && bottom1 < top2 && top1 > bottom2) {
                    return true;
                }
            }
        }

        return false;
    }
}
