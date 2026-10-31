import type { Point } from "./util";

export enum Trait {
    MOBILE = 1 << 0,
    TILED = 1 << 1,
    TANGIBLE = 1 << 2,
    HAS_STATIC_DEPTH = 1 << 3,
    VISIBLE = 1 << 4,
}

export interface EntityOptions extends Point {
    template: number;
    velocity?: number;
    angle?: number;
    animation?: number;
    force?: number;
}

export interface TemplateOptions {
    traits?: number;
    scaleX: number;
    scaleY: number;
    tileScaleX?: number;
    tileScaleY?: number;
    hitboxScaleX?: number;
    hitboxScaleY?: number;
    mass?: number;
    dragCoefficient?: number;
    runForce?: number;
    depth?: number;
    animations?: number;
}