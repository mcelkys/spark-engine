import type { AnimationMetadata, SpriteMetadata } from "./src/types/assets";

interface UnityMetadata {
    format: string;
    sheets: UnitySpritesheet[];
}

interface UnitySpritesheet {
    image: string;
    size: UnitySize;
    sprites: UnitySprite[];
}

interface UnitySize {
    width: number;
    height: number;
}

interface UnitySprite {
    name: string;
    alignment: string;
    rotated: boolean;
    rect: UnityRect;
    pivot: UnityPosition;
    border: UnityBorder;
    originalSize: UnitySize;
    trimmedRect?: UnityRect;
}

interface UnityPosition {
    x: number;
    y: number;
}

interface UnityRect extends UnitySize, UnityPosition {}

interface UnityBorder {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface AssetType {
    name: string;
    duration: number;
    regex: RegExp;
}

const [ inputPath ] = Bun.argv.slice(2, 4);

if (!inputPath) {
    console.log("First argument has to be the input file path");
    process.exit(0);
}

const meta: UnityMetadata = await Bun.file(inputPath).json();
const sprites: SpriteMetadata = {
    name: [],
    u0: [],
    v0: [],
    u1: [],
    v1: [],
    widthScale: [],
    heightScale: [],
};
const assets: AnimationMetadata[] = [];
const assetTypes: AssetType[] = [
    {
        name: "dead",
        duration: 0.5,
        regex: /Dead-(?<idx>\d+)/,
    },
    {
        name: "grass",
        duration: 0,
        regex: /grass/,
    },
    {
        name: "hurt",
        duration: 0.5,
        regex: /Hurt-(?<idx>\d+)/,
    },
    {
        name: "idle",
        duration: 0.5,
        regex: /Idle-(?<idx>\d+)/,
    },
    {
        name: "jump",
        duration: 0.5,
        regex: /Jump-(?<idx>\d+)/,
    },
    {
        name: "run",
        duration: 0.5,
        regex: /Run-(?<idx>\d+)/,
    },
    {
        name: "slide",
        duration: 0.5,
        regex: /Slide-(?<idx>\d+)/,
    },
    {
        name: "rock",
        duration: 0,
        regex: /rock/,
    },
];

for (const sheet of meta.sheets) {
    for (const sprite of sheet.sprites) {
        sprites.name.push(sprite.name);
        sprites.u0.push(sprite.rect.x / sheet.size.width);
        sprites.v0.push(sprite.rect.y / sheet.size.height);
        sprites.u1.push((sprite.rect.x + sprite.rect.width) / sheet.size.width);
        sprites.v1.push((sprite.rect.y + sprite.rect.height) / sheet.size.height);
        
        if (sprite.trimmedRect) {
            sprites.widthScale.push(sprite.trimmedRect.width / sprite.originalSize.width);
            sprites.heightScale.push(sprite.trimmedRect.height / sprite.originalSize.height);
        } else {
            sprites.widthScale.push(1);
            sprites.heightScale.push(1);
        }
    }
}

for (const definition of assetTypes) {
    const frames = sprites.name.filter((name) => definition.regex.test(name));

    frames.sort((a, b) => {;
        const idxA = parseIdx(a, definition.regex);
        const idxB = parseIdx(b, definition.regex);
        return idxA - idxB;
    });

    assets.push({
        name: definition.name,
        duration: definition.duration,
        frames: frames,
    });
}

function parseIdx(value: string, regex: RegExp): number {
    const { groups } = value.match(regex) ?? {};
    const { idx } = groups ?? {};
    return idx === undefined ? 0 : parseInt(idx);
}

await Bun.write("assets/sprites.json", JSON.stringify(sprites));
await Bun.write("assets/assets.json", JSON.stringify(assets));
