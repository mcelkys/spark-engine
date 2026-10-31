import { AnimationManifest } from "./textures";
import type { Entity, Template } from "./types/game";
import type { Point } from "./types/util";
import { EngineBuffer } from "./util/buffer";

export class EntityManager {
    public buffer: EngineBuffer;
    public animations: AnimationManifest;
    private readonly templates: Map<number, number>;
    private readonly entities: Map<number, number>;


    constructor(buffer: EngineBuffer, animations: AnimationManifest) {
        this.buffer = buffer;
        this.templates = new Map();
        this.entities = new Map();
        this.animations = animations;
    }

    public spawnEntitity(entity: Entity): number {
        const entityId = this.buffer.storeEntity({
            ...entity,
            template: this.templates.get(entity.template)!,
            animation: typeof entity.animation === "number" 
                ? this.animations.getAnimationId(entity.animation)
                : undefined,
        });

        if (entityId < 0) {
            return entityId;
        }

        this.entities.set(entity.id, entityId);

        if (entity.isPlayer) {
            this.buffer.playerId = entityId;
        }

        return entityId;
    }

    public async despawnEntity(idx: number): Promise<void> {
        await this.buffer.acquireLock();
        this.dangerouslyDespawnEntity(idx);
        this.buffer.releaseLock();
    }

    public async unloadScene(): Promise<void> {
        await this.buffer.acquireLock();
        this.entities.clear();
        this.buffer.clearEntities();
        this.buffer.releaseLock();
    }

    public loadTemplates(templates: Template[]): void {
        for (const template of templates) {
            this.loadTemplate(template);
        }
    }

    public loadTemplate(template: Template): number {
        const templateId = this.buffer.storeTemplate({
            ...template,
            traits: template.traits.reduce((all, one) => all | one, 0),
        });

        if (templateId < 0) {
            return templateId;
        }

        this.templates.set(template.id, templateId);
        return templateId;
    }

    public async unloadTemplates(): Promise<void> {
        await this.buffer.acquireLock();
        this.templates.clear();
        this.entities.clear();
        this.buffer.clearTemplates();
        this.buffer.clearEntities();
        this.buffer.releaseLock();
    }

    public async reassignTemplates(templates: Template[]): Promise<void> {
        const activeEntityCount = this.buffer.activeEntityCount;
        const removedTemplateIds: number[] = [];
        const orphanedEntityIds: number[] = [];

        // Clear removed templates
        for (const [templateId, currentId] of this.templates.entries()) {
            const isRetained = templates.some((template) => template.id === templateId);

            if (!isRetained) {
                this.templates.delete(templateId);
                this.templates.forEach((cId, tId) => {
                    if (cId > currentId) {
                        this.templates.set(tId, cId - 1);
                    }
                });
                removedTemplateIds.push(currentId);

                // Removing a template cause all other templates, which were
                // stored behind the one removed, to shift backwards by 1 index.
                // Every entity that was pointing to one of these shifted templates
                // needs to move their template pointer back by 1 index, so that
                // they are once again pointing at their original templates. Also,
                // every entity that was pointing to the just removed template is 
                // now orphaned, and therefore must be removed.
                for (let i = 0; i < activeEntityCount; i++) {
                    const usedId = this.buffer.template[i]!;

                    if (usedId === currentId) {
                        orphanedEntityIds.push(i);
                    }
                    if (usedId > currentId) {
                        this.buffer.template[i] = usedId - 1;
                    }
                }
            }
        }

        // Ids are array indices. We have to work backwards
        // to make sure we remove the right entities, as 
        // they get shifted backwards with every removal
        removedTemplateIds.sort().reverse();
        orphanedEntityIds.sort().reverse();

        await this.buffer.acquireLock();
        for (const templateId of removedTemplateIds) {
            this.buffer.removeTemplate(templateId);
        }
        for (const entityId of orphanedEntityIds) {
            this.dangerouslyDespawnEntity(entityId);
        }
        this.buffer.releaseLock();


        for (const template of templates) {
            const currentId = this.templates.get(template.id);

            if (typeof currentId === "number") {
                // Template is already loaded

                this.buffer.setTemplateValues(currentId, {
                    ...template,
                    traits: template.traits.reduce((all, one) => all | one, 0),
                });
            } else {
                // New templated not yet loaded
                this.loadTemplate(template);
            }
        }
    }

    public async reassignEntities(entities: Entity[], changed?: Set<number>): Promise<void> {
        const removedEntityIds: number[] = [];

        for (const [entityId, currentId] of this.entities.entries()) {
            const isRetained = entities.some((entity) => entity.id === entityId);

            if (!isRetained) {
                removedEntityIds.push(currentId);
            }
        }

        // Ids are array indices. We have to work backwards
        // to make sure we remove the right entities, as 
        // they get shifted backwards with every removal
        removedEntityIds.sort().reverse();

        await this.buffer.acquireLock();
        for (const entityId of removedEntityIds) {
            this.dangerouslyDespawnEntity(entityId);
        }
        this.buffer.releaseLock();

        for (const entity of entities) {
            const currentId = this.entities.get(entity.id);

            if (typeof currentId === "number") {
                if (!changed || changed.has(entity.id)) {
                    const templateId = this.templates.get(entity.template);

                    if (typeof templateId !== "number") {
                        continue;
                    }

                    this.buffer.setEntityValues(currentId, {
                        ...entity,
                        template: templateId,
                        animation: this.buffer.animation[currentId]!,
                    });
                }
            } else {
                this.spawnEntitity(entity);
            }
        }
    }

    public findEntitiesAt(point: Point): number[] {
        const currentIds: number[] = [];
        const activeCount = this.buffer.activeEntityCount;
        const lookup = new Map(Array.from(this.entities.entries()).map(([original, current]) => [current, original]));

        for (let i = 0; i < activeCount; i++) {
            const templateId = this.buffer.template[i]!;

            if (templateId < 0) {
                continue;
            }

            const entX = this.buffer.x[i]!;
            const entY = this.buffer.y[i]!;
            const w = this.buffer.scaleX[templateId]!;
            const h = this.buffer.scaleY[templateId]!;

            // Calculate AABB boundaries (centered anchor at entX, entY)
            const left = entX - w / 2;
            const right = entX + w / 2;
            const bottom = entY - h / 2;
            const top = entY + h / 2;

            if (point.x >= left && point.x <= right && point.y >= bottom && point.y <= top) {
                currentIds.push(i);
            }
        }

        return currentIds.map((id) => lookup.get(id)!);
    }

    private dangerouslyDespawnEntity(idx: number): void {
        this.entities.forEach((currentId, id) => {
            if (currentId === idx) {
                this.entities.delete(id);
            }
            if (currentId > idx) {
                this.entities.set(id, currentId - 1);
            }
        });
        this.buffer.removeEntity(idx);
    }
}