import type { AssetMetadata } from "./assets";
import type { BufferOptions } from "./buffer";

export enum MessageType {
    REQUEST,
    SUCCESS,
    FAILURE,
}

export enum WorkerRequestType {
    START,
    PAUSE,
    ASSET_MANIFEST,
    BUFFER,
}

export interface WorkerMessage {
    id: number;
    messageType: MessageType;
}

export interface WorkerRequest extends WorkerMessage {
    messageType: MessageType.REQUEST;
    requestType: WorkerRequestType;
}

export interface SuccessMessage<T> extends WorkerMessage {
    messageType: MessageType.SUCCESS;
    result: T;
}

export interface FailuteMessage extends WorkerMessage {
    messageType: MessageType.FAILURE;
    reason: string;
}



export interface StartRequest extends WorkerRequest {
    requestType: WorkerRequestType.START;
}

export interface PauseRequest extends WorkerRequest {
    requestType: WorkerRequestType.PAUSE;
}

export interface AssetManifestRequest extends WorkerRequest {
    requestType: WorkerRequestType.ASSET_MANIFEST;
    assets: AssetMetadata[];
}

export interface BufferRequest extends WorkerRequest, BufferOptions {
    requestType: WorkerRequestType.BUFFER;
    buffer: SharedArrayBuffer;
}



export type ResponseMessage<T> = SuccessMessage<T> | FailuteMessage;
export type LogicWorkerRequest = StartRequest | PauseRequest | AssetManifestRequest | BufferRequest;
export type PhysicsWorkerRequest = StartRequest | PauseRequest | BufferRequest;
