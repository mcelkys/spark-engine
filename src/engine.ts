import { EntityManager } from "./entity-manager";
import { GameRenderer } from "./game-renderer";
import { InputHandler } from "./input-handler";
import { LogicClient } from "./logic-client";
import { PhysicsClient } from "./physics-client";
import { AnimationManifest, TextureAtlas } from "./textures";
import type { BufferOptions } from "./types/buffer";
import type { Game, Scene } from "./types/game";
import type { Point } from "./types/util";
import { EngineBuffer } from "./util/buffer";
import { loadFile } from "./util/util";

export class Engine {
    public buffer: EngineBuffer;
    public scene: Scene;
    public readonly renderer: GameRenderer;
    public readonly entityManager: EntityManager;
    public readonly input: InputHandler;
    private animations: AnimationManifest;
    private readonly game: Game;
    private readonly physics: PhysicsClient;
    private readonly logic: LogicClient;
    private isRunning: boolean;

    constructor(game: Game, device: GPUDevice, canvas: HTMLCanvasElement, texture: ImageBitmap, atlas: TextureAtlas) {
        this.game = game;
        this.animations = atlas.animationManifest;
        this.buffer = new EngineBuffer(this.bufferOptions);
        this.entityManager = new EntityManager(this.buffer, this.animations);

        this.entityManager.loadTemplates(this.game.templates);
        this.scene = this.loadScene(game.scene);

        this.input = new InputHandler(this.buffer, this.game.keyBindings);
        this.renderer = new GameRenderer(device, canvas, texture, atlas, this.buffer);
        this.physics = new PhysicsClient(new URL("./physics.ts", import.meta.url));
        this.logic = new LogicClient(new URL("./logic.ts", import.meta.url));
        this.isRunning = false;
    }

    public set gameName(value: string) {
        this.game.name = value;
        document.title = value;
    }

    protected get bufferOptions(): BufferOptions {
        return {
            maxEntities: this.game.maxEntities,
            maxTemplates: this.game.maxTemplates,
        };
    }

    public async initialize(): Promise<void> {
        document.title = this.game.name;

        const parent = this.renderer.canvas.parentElement!;
        this.renderer.setScreenSize(parent.clientWidth, parent.clientHeight);

        await Promise.all([
            this.physics.createBuffer(this.buffer.buffer, this.bufferOptions),
            this.logic.importAssetManifest(this.animations.export())
                .then(() => this.logic.createBuffer(this.buffer.buffer, this.bufferOptions)),
        ]);

        this.buffer.isRunning = true;
    }

    public async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        await Promise.all([
            this.physics.start(),
            this.logic.start(),
        ]);
        this.renderer.start();
        this.input.start();
    }

    public async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        this.input.stop();
        await Promise.all([
            this.physics.pause(),
            this.logic.pause(),
        ]);
        this.renderer.pause();
    }

    public async resizeBuffer(maxEntities: number, maxTemplates: number): Promise<void> {
        this.game.maxEntities = maxEntities;
        this.game.maxTemplates = maxTemplates;
        this.buffer = new EngineBuffer(this.bufferOptions);
        this.entityManager.buffer = this.buffer;

        this.entityManager.loadTemplates(this.game.templates);
        this.loadScene(this.game.scene);
        this.input.reassignEngineBuffer(this.buffer);
        this.renderer.reassignEngineBuffer(this.buffer);

        await Promise.all([
            this.physics.createBuffer(this.buffer.buffer, this.bufferOptions),
            this.logic.createBuffer(this.buffer.buffer, this.bufferOptions),
        ]);
    }

    public async reassignTexture(texture: ImageBitmap, atlas: TextureAtlas): Promise<void> {
        this.animations = atlas.animationManifest;
        this.entityManager.animations = atlas.animationManifest;
        await this.entityManager.unloadScene();
        this.loadScene(this.scene.id);
        await this.logic.importAssetManifest(atlas.animationManifest.export());
        this.renderer.reassignTexture(texture, atlas);
    }

    public async reassignScenes(scenes: Scene[]): Promise<void> {
        const activeScene = scenes.find((scene) => scene.id === this.scene.id);

        this.game.scenes = scenes;

        if (activeScene) {
            this.scene = activeScene;
            this.applySceneConfig(activeScene);
        } else {
            await this.entityManager.unloadScene();
            this.loadScene(this.game.scene)
        }
    }

    public loadScene(id: number): Scene {
        const scene = this.game.scenes.find((scene) => scene.id === id);
        this.scene = scene ?? {
            id: 0,
            name: "Void",
            worldWidth: 100,
            worldHeight: 100,
            cameraZoom: 1,
            gravity: 9.81,
            airDensity: 1.225,
            gridCellSize: 20,
        };
        this.applySceneConfig(this.scene);
        this.spawnDefaultEntities(this.scene);
        return this.scene;
    }

    protected applySceneConfig(scene: Scene): void {
        this.buffer.worldWidth = scene.worldWidth;
        this.buffer.worldHeight = scene.worldHeight;
        this.buffer.cameraZoom = scene.cameraZoom;
        this.buffer.gravity = scene.gravity;
        this.buffer.airDensity = scene.airDensity;
        this.buffer.gridCellSize = scene.gridCellSize;
    }

    protected spawnDefaultEntities(scene: Scene): void {
        const entities = this.game.entities.filter((entity) => entity.scene === scene.id);

        for (const entity of entities) {
            this.entityManager.spawnEntitity(entity);
        }
    }

    public translateToWorldSpace(point: Point): Point {
        const width = this.renderer.canvas.width;
        const height = this.renderer.canvas.height;

        if (width === 0 || height === 0) {
            return { x: 0, y: 0 };
        }

        // 1. Convert canvas pixel coordinates [0, width/height] to normalized device coordinates [-1, 1]
        // Note: WebGPU/WebGL screen space has Y pointing downwards, whereas your world Y points upwards.
        const ndcX = (point.x / width) * 2 - 1;
        const ndcY = -((point.y / height) * 2 - 1); // Flip Y to match standard cartesian world coordinates

        // 2. Extract camera scaling and offset parameters matching Camera2D logic
        const aspectRatio = width / height;
        const worldWidth = this.buffer.worldWidth;
        const worldHeight = this.buffer.worldHeight;
        const zoom = this.buffer.cameraZoom;

        const scaleX = zoom / worldWidth / Math.max(1, aspectRatio);
        const scaleY = zoom / worldHeight * Math.min(1, aspectRatio);

        // Retrieve camera center offset stored in the camera uniform buffer data
        const cameraX = this.renderer.cameraX;
        const cameraY = this.renderer.cameraY;

        // 3. Reverse projection to get world coordinates
        const worldX = (ndcX / scaleX) + cameraX;
        const worldY = (ndcY / scaleY) + cameraY;

        return { x: worldX, y: worldY };
    }

    public static async start(canvas: HTMLCanvasElement, url: string): Promise<Engine> {
        const [device, game] = await Promise.all([
            GameRenderer.requestDevice(),
            loadFile<Game>(url),
        ]);
        const [atlas, bitmap] = await Promise.all([
            TextureAtlas.load(game.spriteManifest, game.animationPack),
            GameRenderer.loadBitmap(game.textureAtlas),
        ]);
        const engine = new Engine(game, device, canvas, bitmap, atlas);

        await engine.initialize();
        await engine.start();
        return engine;
    }
}