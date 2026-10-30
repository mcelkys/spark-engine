import { MessageType, type ResponseMessage, type WorkerRequest } from "../types/message";

export abstract class GeneralWorker<T extends WorkerRequest> {
    constructor() {
        self.addEventListener("message", (event) => {
            const message = event.data as T | ResponseMessage<unknown>;

            switch (message.messageType) {
                case MessageType.REQUEST:
                    this.handleRequest(message);
                    break;

                default:
                    console.warn("Invalid worker message", message);
                    break;
            }
        }, { passive: true });
    }

    protected abstract onRequest(request: T): Promise<unknown>;

    private async handleRequest(request: T): Promise<void> {
        try {
            const result = await this.onRequest(request);
            self.postMessage({
                messageType: MessageType.SUCCESS,
                id: request.id,
                result,
            });
        } catch (error) {
            const reason = error instanceof Error ? error.message : "Unknown";
            self.postMessage({
                messageType: MessageType.FAILURE,
                id: request.id,
                reason,
            });
        }
    }
}

export abstract class ComputeWorker<T extends WorkerRequest> extends GeneralWorker<T> {
    private lastTime: number;
    private interval?: number;
    private isRunning: boolean;
    // private readonly channel: MessageChannel;

    constructor() {
        super();
        this.lastTime = 0;
        this.isRunning = false;
        // this.channel = new MessageChannel();
    }

    protected start(): void {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.lastTime = performance.now();
        this.interval = setInterval(() => {
            const currentTime = performance.now();
            const deltaTime = (currentTime - this.lastTime) / 1000; // in seconds
            this.lastTime = currentTime;
            this.onTick(deltaTime);
        }, 1) as unknown as number;

        // this.channel.port2.onmessage = () => {

        //     this.channel.port1.postMessage(null);
        // };
        // this.channel.port1.postMessage(null);
    }

    protected pause(): void {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        clearInterval(this.interval);
    }

    protected abstract onTick(deltaTime: number): void;
}
