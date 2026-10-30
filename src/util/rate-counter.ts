export class RateCounter {
    private tickCount = 0;
    private lastTime = 0;
    private handler: (rate: number) => void;

    constructor(handler: (rate: number) => void) {
        this.handler = handler;
    }

    public tick(): void {
        this.tickCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime > 1000) {
            const rate = (this.tickCount * 1000) / deltaTime;
            
            this.handler(rate);
            this.tickCount = 0;
            this.lastTime = currentTime;
        }
    }
}