export class Uint32Set {
    public readonly values: Uint32Array;
    public count: number;

    constructor(capacity: number) {
        this.values = new Uint32Array(capacity);
        this.count = 0;
    }

    public has(value: number): boolean {
        for (let i = 0; i < this.count; i++) {
            if (this.values[i] === value) {
                return true;
            }
        }
        return false;
    }

    public clear(): void {
        this.count = 0;
    }

    public insert(value: number): void {
        if (!this.has(value)) {
            const idx = this.count;
            this.values[idx] = value;
            this.count = idx + 1;
        }
    }
}