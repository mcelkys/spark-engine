import type { AssetMetadata, SpriteMetadata } from "./types/assets";
import { loadFile } from "./util/util";

export class TextureAtlas {
    public readonly u0: Float32Array;
    public readonly v0: Float32Array;
    public readonly u1: Float32Array;
    public readonly v1: Float32Array;
    public readonly widthScale: Float32Array;
    public readonly heightScale: Float32Array;
    public readonly animationFrames: Uint32Array[];
    public readonly animationDuration: Float32Array;
    public readonly assetManifest: AssetManifest;
    private readonly sprites: Map<string, number>;

    constructor(sprites: SpriteMetadata, animations: AssetMetadata[]) {
        this.u0 = new Float32Array(sprites.u0);
        this.v0 = new Float32Array(sprites.v0);
        this.u1 = new Float32Array(sprites.u1);
        this.v1 = new Float32Array(sprites.v1);
        this.widthScale = new Float32Array(sprites.widthScale);
        this.heightScale = new Float32Array(sprites.heightScale);
        this.assetManifest = new AssetManifest(animations);
        this.animationFrames = new Array(animations.length);
        this.animationDuration = new Float32Array(animations.length);
        this.sprites = new Map(sprites.name.map((name, id) => [name, id]));

        animations.forEach((animation, index) => {
            const frames = animation.frames.map((name) => this.sprites.get(name)!);
            this.animationDuration[index] = animation.duration;
            this.animationFrames[index] = new Uint32Array(frames);
        });
    }

    public getAssetId(name: string): number {
        return this.assetManifest.getId(name);
    }

    public exportAssetMetadata(): AssetMetadata[] {
        const meta: AssetMetadata[] = new Array(this.assetManifest.ids.size);
        const sprites = new Map(this.sprites.entries().map(([ name, id ]) => [id, name]));

        for (const [ name, id ] of this.assetManifest.ids.entries()) {
            meta[id] = {
                name,
                duration: this.animationDuration[id]!,
                frames: Array.from(this.animationFrames[id]!).map((i) => sprites.get(i)!),
            };
        }

        return meta;
    }

    public static async load(spriteUrl: string, assetUrl: string): Promise<TextureAtlas> {
        const [sprites, animations] = await Promise.all([
            loadFile<SpriteMetadata>(spriteUrl),
            loadFile<AssetMetadata[]>(assetUrl),
        ]);
        return new TextureAtlas(sprites, animations);
    }

    public static empty(): TextureAtlas {
        const sprites: SpriteMetadata = {
            name: [],
            u0: [],
            v0: [],
            u1: [],
            v1: [],
            widthScale: [],
            heightScale: [],
        };
        return new TextureAtlas(sprites, []);
    }
}

export class AssetManifest {
    public readonly ids: Map<string, number>;

    constructor(animations: AssetMetadata[]) {
        this.ids = new Map(animations.map((animation, index) => [
            animation.name, index,
        ]));
    }

    public getId(name: string): number {
        return this.ids.get(name)!;
    }

    public static async load(url: string): Promise<AssetManifest> {
        const animations = await loadFile<AssetMetadata[]>(url);
        return new AssetManifest(animations);
    }

    public static empty(): AssetManifest {
        return new AssetManifest([]);
    }
}