import type { EntityOptions, TemplateOptions } from "./entity";
import type { Input } from "./input";

export interface Game {
    name: string;
    maxEntities: number;
    maxTemplates: number;
    animationPack: string;
    spriteManifest: string;
    textureAtlas: string;
    templates: Template[];
    scenes: Scene[];
    scene: number;
    keyBindings: Record<string, Input>;
    entities: Entity[];
}

export interface Scene {
    id: number;
    name: string;
    worldWidth: number;
    worldHeight: number;
    cameraZoom: number;
    gravity: number;
    airDensity: number;
    gridCellSize: number;
}

export interface Entity extends EntityOptions {
    id: number;
    scene: number;
    isPlayer?: boolean;
}

export interface Template extends Omit<TemplateOptions, "traits"> {
    id: number;
    name: string;
    traits: number[];
}