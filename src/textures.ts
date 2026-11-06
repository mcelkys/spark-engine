import type { AnimationCollection, AnimationMetadata, AnimationPack, AnimationPurpose, SpriteMetadata } from "./types/assets";
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
    public readonly animationManifest: AnimationManifest;

    constructor(sprites: SpriteMetadata, animations: AnimationMetadata[], collections: AnimationCollection[]) {
        this.u0 = new Float32Array(sprites.u0);
        this.v0 = new Float32Array(sprites.v0);
        this.u1 = new Float32Array(sprites.u1);
        this.v1 = new Float32Array(sprites.v1);
        this.widthScale = new Float32Array(sprites.widthScale);
        this.heightScale = new Float32Array(sprites.heightScale);
        this.animationManifest = new AnimationManifest(animations, collections);
        this.animationFrames = new Array(animations.length);
        this.animationDuration = new Float32Array(animations.length);

        animations.forEach((animation, index) => {
            const frames = animation.frames.map((name) => sprites.name.indexOf(name));
            this.animationDuration[index] = animation.duration;
            this.animationFrames[index] = new Uint32Array(frames);
        });
    }

    public static async load(spriteUrl: string, assetUrl: string): Promise<TextureAtlas> {
        const [sprites, pack] = await Promise.all([
            loadFile<SpriteMetadata>(spriteUrl),
            loadFile<AnimationPack>(assetUrl),
        ]);
        return new TextureAtlas(sprites, pack.animations, pack.collections);
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
        return new TextureAtlas(sprites, [], []);
    }
}

export class AnimationManifest {
    private readonly animations: AnimationMetadata[];
    private readonly collections: AnimationCollection[];
    private readonly animationIds: Map<number, number>;
    private readonly purposes: Map<number, Map<AnimationPurpose, number>>;

    constructor(animations: AnimationMetadata[], collections: AnimationCollection[]) {
        this.animations = animations;
        this.collections = collections;
        this.animationIds = new Map(animations.map((animation, index) => [
            animation.id, index,
        ]));
        this.purposes = new Map(collections.map((collection) => [
            collection.id,
            new Map(Object.entries(collection.animations).map(([key, id]) => [
                parseInt(key), id
            ])),
        ]));
    }

    public getAnimationId(id: number): number {
        return this.animationIds.get(id)!;
    }

    public getAnimationByPurpose(collectionId: number, purpose: AnimationPurpose): number {
        return this.purposes.get(collectionId)!.get(purpose)!;
    }

    public export(): AnimationPack {
        return {
            animations: this.animations,
            collections: this.collections,
        };
    }

    public static empty(): AnimationManifest {
        return new AnimationManifest([], []);
    }
}