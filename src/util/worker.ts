import { type ResponseMessage, type WorkerRequest } from "../types/message";
import { WorkerBridge } from "./worker-bridge";

export abstract class GeneralWorker<I extends WorkerRequest, O extends WorkerRequest> extends WorkerBridge<O, I> {
    constructor() {
        super();
        self.addEventListener("message", (event) => this.handleEvent(event), { passive: true });
    }

    protected override postMessage(message: ResponseMessage<unknown>): void {
        self.postMessage(message);
    }
}

export abstract class ComputeWorker<I extends WorkerRequest, O extends WorkerRequest> extends GeneralWorker<I, O> {
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
