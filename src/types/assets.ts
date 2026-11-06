
export interface SpriteMetadata {
    name: string[];
    u0: number[];
    v0: number[];
    u1: number[];
    v1: number[];
    widthScale: number[];
    heightScale: number[];
}

export interface AnimationMetadata {
    id: number;
    name: string;
    duration: number;
    frames: string[];
}

export interface AnimationCollection {
    id: number;
    name: string;
    animations: Record<AnimationPurpose, number>;
}

export interface AnimationPack {
    animations: AnimationMetadata[];
    collections: AnimationCollection[];
}

export enum AnimationPurpose {
    IDLE,
    MOVE_UP,
    MOVE_RIGHT,
    MOVE_DOWN,
    MOVE_LEFT,
}