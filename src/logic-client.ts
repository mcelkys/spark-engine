import type { AssetMetadata } from "./types/assets";
import type { BufferOptions } from "./types/buffer";
import { MessageType, WorkerRequestType, type LogicWorkerRequest } from "./types/message";
import { WorkerClient } from "./util/worker-client";

export class LogicClient extends WorkerClient<LogicWorkerRequest> {
    public importAssetManifest(assets: AssetMetadata[]): Promise<void> {
        return this.send({
            messageType: MessageType.REQUEST,
            requestType: WorkerRequestType.ASSET_MANIFEST,
            id: this.nextId,
            assets,
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