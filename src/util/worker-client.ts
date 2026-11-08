import { type WorkerRequest, type ResponseMessage } from "../types/message";
import { WorkerBridge } from "./worker-bridge";


export abstract class WorkerClient<O extends WorkerRequest, I extends WorkerRequest> extends WorkerBridge<O, I> {
    private worker: Worker;

    constructor(url: URL) {
        super();
        this.worker = new Worker(url, { type: "module" });
        this.worker.addEventListener("message", (event) => this.handleEvent(event), { passive: true });
    }

    protected override postMessage(message: O | ResponseMessage<unknown>): void {
        this.worker.postMessage(message);
    }
}