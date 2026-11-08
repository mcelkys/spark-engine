import { WorkerRequestType, type PhysicsWorkerRequest } from "./types/message";
import { Trait } from "./types/entity";
import { Singleton } from "./util/decorators";
import { ComputeWorker } from "./util/worker";
import { EngineBuffer } from "./util/buffer";
import { RateCounter } from "./util/rate-counter";
import { SpacialHashGrid } from "./util/spacial-hash-grid";
import { Uint32Set } from "./util/uint-32-set";

@Singleton
class PhysicsWorker extends ComputeWorker<PhysicsWorkerRequest, never> {
    private grid: SpacialHashGrid = new SpacialHashGrid(1, 1, 1, 0);
    private collisions: Uint32Set = new Uint32Set(0);
    private buffer: EngineBuffer = EngineBuffer.empty();
    private counter = new RateCounter((tps) => {
        this.buffer.physicsRate = Math.round(tps);
    });

    protected override onRequest(request: PhysicsWorkerRequest): Promise<unknown> {
        switch (request.requestType) {
            case WorkerRequestType.BUFFER:
                this.buffer = new EngineBuffer(request);
                this.grid = new SpacialHashGrid(this.buffer.worldWidth * 2, this.buffer.worldHeight * 2, this.buffer.gridCellSize, this.buffer.maxEntities);
                this.collisions = new Uint32Set(this.buffer.maxEntities);
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
            const friction = this.buffer.frictionCoefficient[templateId]!;
            const mass = this.buffer.mass[templateId]!;

            if (!isMobile || mass === 0) {
                continue;
            }

            const lastVelocity = this.buffer.velocity[i]!;
            const lastVelocityAngle = this.buffer.velocityAngle[i]!;
            const hitboxScaleX = this.buffer.hitboxScaleX[templateId]!;
            const hitboxScaleY = this.buffer.hitboxScaleY[templateId]!;
            const resistiveForceAngle = lastVelocityAngle + Math.PI;
            let resistiveForce = 0.0;

            // Compute drag / friction forces
            if (lastVelocity > 0) {
                const drag = this.buffer.dragCoefficient[templateId]!;
                const surfaceArea = hitboxScaleX * hitboxScaleY;
                const dragForce = 0.5 * drag * airDensity * surfaceArea * lastVelocity ** 2;
                const frictionForce = friction * mass * gravity;
                resistiveForce = frictionForce + dragForce;
            }

            // Compute net force
            const force = this.buffer.force[i]!;
            const forceAngle = this.buffer.forceAngle[i]!;
            const forceX = force * Math.cos(forceAngle);
            const forceY = force * Math.sin(forceAngle);
            const resistiveForceX = resistiveForce * Math.cos(resistiveForceAngle);
            const resistiveForceY = resistiveForce * Math.sin(resistiveForceAngle);
            const netForceX = forceX + resistiveForceX;
            const netForceY = forceY + resistiveForceY;
            const netForce = Math.sqrt(netForceX ** 2 + netForceY ** 2);
            const netForceAngle = Math.atan2(netForceY, netForceX);

            // Compute change in velocity
            const acceleration = netForce / mass;
            let newVelocity = lastVelocity;
            let newVelocityAngle = lastVelocityAngle;

            if (lastVelocity > 0.0) {
                const headingDelta = netForceAngle - lastVelocityAngle;
                const accelerationParallel = acceleration * Math.cos(headingDelta);
                const deltaVelocity = accelerationParallel * deltaTime;
                newVelocity = Math.max(0, lastVelocity + deltaVelocity);

                if (newVelocity > 0.0) {
                    const accelerationPerpendicular = acceleration * Math.sin(headingDelta);
                    const angularVelocity = accelerationPerpendicular / newVelocity;
                    newVelocityAngle = lastVelocityAngle + angularVelocity * deltaTime;
                }
            } else {
                const deltaVelocity = acceleration * deltaTime;
                newVelocity = Math.max(0, lastVelocity + deltaVelocity);

                if (newVelocity > 0.0) {
                    newVelocityAngle = netForceAngle;
                }
            }

            this.buffer.velocity[i] = newVelocity;
            this.buffer.velocityAngle[i] = newVelocityAngle;

            if (newVelocity === 0) {
                continue;
            }

            // Compute directional movement deltas
            const lastX = this.buffer.x[i]!;
            const lastY = this.buffer.y[i]!;
            const deltaX = newVelocity * Math.cos(newVelocityAngle) * deltaTime;
            const deltaY = newVelocity * Math.sin(newVelocityAngle) * deltaTime;
            const newX = lastX + deltaX;
            const newY = lastY + deltaY;
            const halfWidth = hitboxScaleX / 2;
            const halfHeight = hitboxScaleY / 2;

            this.collisions.clear();

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

            this.transferMomentum(i);
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

        let collides = false;
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
                    this.collisions.insert(entityId);
                    collides = true;
                }
            }
        }

        return collides;
    }

    private transferMomentum(id: number): void {
        const tplId = this.buffer.template[id]!
        const x1 = this.buffer.x[id]!;
        const y1 = this.buffer.y[id]!;
        const v1 = this.buffer.velocity[id]!;
        const a1 = this.buffer.velocityAngle[id]!;
        const m1 = this.buffer.mass[tplId]!;
        const e1 = this.buffer.elasticity[tplId]!;

        for (let i = 0; i < this.collisions.count; i++) {
            const entityId = this.collisions.values[i]!;
            const templateId = this.buffer.template[entityId]!;
            const traits = this.buffer.traits[templateId]!;
            const isMobile = (traits & Trait.MOBILE) > 0;

            if (!isMobile) {
                continue;
            }

            const x2 = this.buffer.x[entityId]!;
            const y2 = this.buffer.y[entityId]!;
            const v2 = this.buffer.velocity[entityId]!;
            const a2 = this.buffer.velocityAngle[entityId]!;
            const m2 = this.buffer.mass[templateId]!;
            const e2 = this.buffer.elasticity[templateId]!;

            if (m1 > 0 && m2 > 0) {
                const elasticity = Math.sqrt(e1 * e2);
                const impactAngle = Math.atan2(y1 - y2, x1 - x2);
                
                // Project Velocities onto the Impact Axis
                const normalVelocity1 = v1 * Math.cos(a1 - impactAngle);
                const tangentialVelocity1 = v1 * Math.sin(a1 - impactAngle);
                const normalVelocity2 = v2 * Math.cos(a2 - impactAngle);
                const tangentialVelocity2 = v2 * Math.sin(a2 - impactAngle);

                // Apply collision
                const combinedMass = m1 + m2;
                const deltaNormalVelocity = normalVelocity1 - normalVelocity2;
                const combinedMomentum = (m1 * normalVelocity1) + (m2 * normalVelocity2);
                const newNormalVelocity1 = (combinedMomentum - (m2 * elasticity * deltaNormalVelocity)) / combinedMass;
                const newNormalVelocity2 = (combinedMomentum + (m1 * elasticity * deltaNormalVelocity)) / combinedMass;

                // Reconstruct 2D Cartesian velocities (Tangential velocity passes through untouched)
                const newVelocityX1 = (newNormalVelocity1 * Math.cos(impactAngle)) - (tangentialVelocity1 * Math.sin(impactAngle));
                const newVelocityY1 = (newNormalVelocity1 * Math.sin(impactAngle)) + (tangentialVelocity1 * Math.cos(impactAngle));
                const newVelocityX2 = (newNormalVelocity2 * Math.cos(impactAngle)) - (tangentialVelocity2 * Math.sin(impactAngle));
                const newVelocityY2 = (newNormalVelocity2 * Math.sin(impactAngle)) + (tangentialVelocity2 * Math.cos(impactAngle));

                this.buffer.velocity[id] = Math.sqrt(newVelocityX1 ** 2 + newVelocityY1 ** 2);
                this.buffer.velocityAngle[id] = Math.atan2(newVelocityY1, newVelocityX1);

                this.buffer.velocity[entityId] = Math.sqrt(newVelocityX2 ** 2 + newVelocityY2 ** 2);
                this.buffer.velocityAngle[entityId] = Math.atan2(newVelocityY2, newVelocityX2);
            }
        }
    }
}
