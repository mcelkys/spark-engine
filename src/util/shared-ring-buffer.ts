export class SharedRingBuffer {
    private static readonly METADATA_COUNT = 2; // [writeIndex, readIndex]
    public readonly buffer: SharedArrayBuffer;
    private readonly capacity: number;
    private readonly capacityMask: number; // Bitwise mask for rapid wrapping
    private readonly unitSize: number;
    private readonly payload: Float32Array;
    private readonly metadata: Int32Array;

    constructor(unitSize: number, capacity: number, buffer: SharedArrayBuffer) {
        // Enforce mathematical requirement: capacity must be a power of 2
        if ((capacity & (capacity - 1)) !== 0) {
            throw new Error("SharedRingBuffer capacity must be a power of 2 for bitwise optimization.");
        }

        const metadataBytes = SharedRingBuffer.METADATA_COUNT * Int32Array.BYTES_PER_ELEMENT;
    
        this.unitSize = unitSize;
        this.capacity = capacity;
        this.capacityMask = capacity - 1; // e.g., 1024 - 1 = 1032 (0b1111111111)
        this.buffer = buffer;
        this.metadata = new Int32Array(buffer, 0, SharedRingBuffer.METADATA_COUNT);
        this.payload = new Float32Array(buffer, metadataBytes);
    }

    public push(src: Float32Array, srcOffset = 0): boolean {
        const writeIdx = Atomics.load(this.metadata, 0);
        const readIdx = Atomics.load(this.metadata, 1);
        
        // BITWISE WRAP: Replaces % operator with a single-cycle bitwise AND
        const nextWriteIdx = (writeIdx + 1) & this.capacityMask;

        if (nextWriteIdx === readIdx) {
            return false; // Ring buffer full
        }

        const destOffset = writeIdx * this.unitSize;

        for (let i = 0; i < this.unitSize; i++) {
            this.payload[destOffset + i] = src[srcOffset + i]!;
        }

        Atomics.store(this.metadata, 0, nextWriteIdx);
        return true;
    }

public drain(target: Float32Array): number {
        const writeIdx = Atomics.load(this.metadata, 0);
        let readIdx = Atomics.load(this.metadata, 1);

        if (readIdx === writeIdx) {
            return 0; // Nothing new
        }

        let count = 0;
        while (readIdx !== writeIdx && count < this.capacity) {
            const srcOffset = readIdx * this.unitSize;
            const targetOffset = count * this.unitSize;

            for (let i = 0; i < this.unitSize; i++) {
                target[targetOffset + i] = this.payload[srcOffset + i]!;
            }

            readIdx = (readIdx + 1) & this.capacityMask;
            count++;
        }

        Atomics.store(this.metadata, 1, readIdx);
        return count;
    }

    public static allocate(unitSize: number, capacity: number): SharedRingBuffer {
        const metadataBytes = this.METADATA_COUNT * Int32Array.BYTES_PER_ELEMENT;
        const dataBytes = capacity * unitSize * Float32Array.BYTES_PER_ELEMENT;
        const buffer = new SharedArrayBuffer(metadataBytes + dataBytes);
        return new SharedRingBuffer(unitSize, capacity, buffer);
    }
}