import type { AudioMetadata } from "./types/audio";

export class AudioManager {
    private readonly context: AudioContext;
    private readonly tracks: Map<number, AudioTrack>;
    private readonly masterGain: GainNode;

    constructor() {
        this.context = new AudioContext();
        this.masterGain = this.context.createGain();
        this.tracks = new Map();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.context.destination);
    }

    public set gain(value: number) {
        this.masterGain.gain.value = value;
    }

    public async loadAll(audios: AudioMetadata[]): Promise<void> {
        await Promise.all(audios.map((audio) => this.load(audio)));
    }

    public async reload(audio: AudioMetadata[]): Promise<void> {
        await Promise.all(audio.map(async (aud) => {
            const track  = this.tracks.get(aud.id);

            if (track instanceof AudioTrack) {
                const buffer = await this.loadBuffer(aud.source);
                track.reassignBuffer(buffer);
            } else {
                await this.load(aud);
            }
        }));
    }

    public async load(audio: AudioMetadata): Promise<void> {
        const buffer = await this.loadBuffer(audio.source);
        const track = new AudioTrack(this.context, buffer, this.masterGain);
        this.tracks.set(audio.id, track);
    }

    public play(id: number, volume = 1.0, loop = false): void {
        const track = this.tracks.get(id);
        
        if (!(track instanceof AudioTrack)) {
            return;
        }
        
        this.resume();

        track.volume = volume;
        track.play(loop);
    }

    public stop(id: number): void {
        const track = this.tracks.get(id);

        if (track instanceof AudioTrack) {
            track.stop();
        }
    }

    public resume(): void {
        if (this.context.state === "suspended") {
            this.context.resume();
        }
    }

    public async loadBuffer(url: string | URL): Promise<AudioBuffer> {
        const response = await fetch(url);
        const data = await response.arrayBuffer();
        return this.context.decodeAudioData(data);
    }
}

class AudioTrack {
    private readonly context: AudioContext;
    private readonly gain: GainNode;
    private buffer: AudioBuffer;
    private source?: AudioBufferSourceNode;

    constructor(context: AudioContext, buffer: AudioBuffer, node: AudioNode) {
        this.context = context;
        this.buffer = buffer;
        this.gain = this.context.createGain();
        this.gain.connect(node);
    }

    public get isPlaying(): boolean {
        return this.source instanceof AudioBufferSourceNode;
    }

    public get volume(): number {
        return this.gain.gain.value;
    }

    public set volume(value: number) {
        this.gain.gain.value = value;
    }

    public get loop(): boolean {
        return this.source?.loop ?? false;
    }

    public play(loop = false): void {
        if (this.isPlaying) {
            return;
        }

        this.source = this.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.loop = loop;
        this.source.connect(this.gain);
        this.source.start();
    }

    public stop(): void {
        if (this.source instanceof AudioBufferSourceNode) {
            this.source.stop();
            this.source.disconnect();
            this.source = undefined;
        }
    }

    public reassignBuffer(buffer: AudioBuffer): void {
        const loop = this.loop;
        const isPlaying = this.isPlaying;

        if (isPlaying) {
            this.stop();
        }

        this.buffer = buffer;

        if (isPlaying) {
            this.play(loop);
        }
    }
}