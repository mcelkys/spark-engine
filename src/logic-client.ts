import type { AudioManager } from "./audio-manager";
import type { AnimationPack } from "./types/assets";
import type { BufferOptions } from "./types/buffer";
import { MessageType, WorkerRequestType, type LogicWindowRequest, type LogicWorkerRequest, } from "./types/message";
import { WorkerClient } from "./util/worker-client";

export class LogicClient extends WorkerClient<LogicWorkerRequest, LogicWindowRequest> {
    private readonly audioManager: AudioManager;

    constructor(url: URL, audioManager: AudioManager) {
        super(url);
        this.audioManager = audioManager;
    }

    protected override onRequest(request: LogicWindowRequest): Promise<unknown> {
        switch (request.requestType) {
            case WorkerRequestType.PLAY_AUDIO:
                this.audioManager.play(request.id);
                return Promise.resolve();
        }
    }

    public importAssetManifest(pack: AnimationPack): Promise<void> {
        return this.send({
            messageType: MessageType.REQUEST,
            requestType: WorkerRequestType.ASSET_MANIFEST,
            id: this.nextId,
            pack,
        });
    }

    public createBuffer(buffer: SharedArrayBuffer, options: BufferOptions): Promise<void> {
        return this.send({
            messageType: MessageType.REQUEST,
            requestType: WorkerRequestType.BUFFER,
            id: this.nextId,
            buffer,
            ...options,
        });
    }

    public start(): Promise<void> {
        return this.send({
            messageType: MessageType.REQUEST,
            requestType: WorkerRequestType.START,
            id: this.nextId,
        });
    }

    public pause(): Promise<void> {
        return this.send({
            messageType: MessageType.REQUEST,
            requestType: WorkerRequestType.PAUSE,
            id: this.nextId,
        });
    }
}