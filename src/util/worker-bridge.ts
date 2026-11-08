import { MessageType, type FailuteMessage, type ResponseMessage, type SuccessMessage, type WorkerRequest } from "../types/message";

interface PendingMessage<T> {
    resolve: (value: T) => void;
    reject: (reason: string) => void;
}

export abstract class WorkerBridge<O extends WorkerRequest, I extends WorkerRequest> {
    private lastId: number;
    private pending: Map<number, PendingMessage<unknown>>;

    constructor() {
        this.lastId = 0;
        this.pending = new Map();
    }

    protected async handleEvent(event: MessageEvent<I | ResponseMessage<unknown>>): Promise<void> {
        const message = event.data;

        switch(message.messageType) {
            case MessageType.REQUEST:
                await this.handleRequest(message);
                break;

            case MessageType.SUCCESS:
                this.handleSuccess(message);
                break;

            case MessageType.FAILURE:
                this.handleFailure(message);
                break;
        }
    }

    protected abstract onRequest(request: I): Promise<unknown>;
    protected abstract postMessage(message: O | ResponseMessage<unknown>): void;

    protected get nextId(): number {
        return ++this.lastId;
    }

    protected send<U>(request: O): Promise<U> {
        return new Promise((resolve, reject) => {
            this.pending.set(request.id, {
                reject,
                resolve: resolve as (value: unknown) => void,
            });
            this.postMessage(request);
        });
    }

    private handleSuccess(response: SuccessMessage<unknown>): void {
        const pending = this.pending.get(response.id);

        if (pending) {
            this.pending.delete(response.id);
            pending.resolve(response.result);
        } else {
            console.warn("Unhandled worker response", response);
        }
    }

    private handleFailure(response: FailuteMessage): void {
        const pending = this.pending.get(response.id);

        if (pending) {
            this.pending.delete(response.id);
            pending.reject(response.reason);
        } else {
            console.warn("Unhandled worker response", response);
        }
    }

    private async handleRequest(request: I): Promise<void> {
        try {
            const result = await this.onRequest(request);
            this.postMessage({
                messageType: MessageType.SUCCESS,
                id: request.id,
                result,
            });
        } catch (error) {
            const reason = error instanceof Error ? error.message : "Unknown";
            this.postMessage({
                messageType: MessageType.FAILURE,
                id: request.id,
                reason,
            });
        }
    }
}