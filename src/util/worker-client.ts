import { MessageType, type WorkerRequest, type ResponseMessage, type SuccessMessage, type FailuteMessage } from "../types/message";

interface PendingMessage<T> {
    resolve: (value: T) => void;
    reject: (reason: string) => void;
}

export abstract class WorkerClient<T extends WorkerRequest> {
    private lastId: number;
    private worker: Worker;
    private pending: Map<number, PendingMessage<unknown>>;

    constructor(url: URL) {
        this.lastId = 0;
        this.pending = new Map();
        this.worker = new Worker(url, { type: "module" });
        this.worker.addEventListener("message", (event) => {
            const message = event.data as T | ResponseMessage<unknown>;

            switch(message.messageType) {
                case MessageType.SUCCESS:
                    this.handleSuccess(message);
                    break;

                case MessageType.FAILURE:
                    this.handleFailure(message);
                    break;
                
                default:
                    console.warn("Invalid worker message", message);
                    break;
            }
        }, { passive: true });
    }

    protected get nextId(): number {
        return ++this.lastId;
    }

    protected send<U>(request: T): Promise<U> {
        return new Promise((resolve, reject) => {
            this.pending.set(request.id, { 
                reject,
                resolve: resolve as (value: unknown) => void,
            });
            this.worker.postMessage(request);
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
}