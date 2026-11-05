export interface UnityMetadata {
    format: string;
    sheets: UnitySpritesheet[];
}

export interface UnitySpritesheet {
    image: string;
    size: UnitySize;
    sprites: UnitySprite[];
}

export interface UnitySize {
    width: number;
    height: number;
}

export interface UnitySprite {
    name: string;
    alignment: string;
    rotated: boolean;
    rect: UnityRect;
    pivot: UnityPosition;
    border: UnityBorder;
    originalSize: UnitySize;
    trimmedRect?: UnityRect;
}

export interface UnityPosition {
    x: number;
    y: number;
}

export interface UnityRect extends UnitySize, UnityPosition {}

export interface UnityBorder {
    left: number;
    right: number;
    top: number;
    bottom: number;
}