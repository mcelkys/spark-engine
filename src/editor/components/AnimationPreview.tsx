import { styled } from "@mui/material/styles";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import type { SpriteMetadata } from "../../types/assets";

interface AnimationPreviewProps {
  texture: ImageBitmap;
  sprites: SpriteMetadata;
  duration: number;
  frames: string[];
}

const Canvas = styled("canvas")({
    width: "100%",
    height: "100%",
    objectFit: "contain"
});

export const AnimationPreview: FC<AnimationPreviewProps> = ({ texture, sprites, duration, frames }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameIds = useMemo(() => {
        return new Uint32Array(frames.map((name) => sprites.name.indexOf(name)));
    }, [frames, sprites]);
    const [renderer, setRenderer] = useState<Renderer>();

    useEffect(() => {
        if (renderer instanceof Renderer) {
            renderer.duration = duration;
        }
    }, [duration]);

    useEffect(() => {
        if (renderer instanceof Renderer) {
            renderer.frames = frameIds;
        }
    }, [frameIds]);

    useEffect(() => {
        if (canvasRef.current instanceof HTMLCanvasElement) {
            const renderer = new Renderer(canvasRef.current, texture, sprites, frameIds, duration);
            setRenderer(renderer);
            renderer.start();
            return () => renderer.stop();
        }
    }, [canvasRef.current]);

    return (
        <Canvas ref={canvasRef} />
    );
};

class Renderer {
    public frames: Uint32Array;
    public duration: number;
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly texture: ImageBitmap;
    private readonly sprites: SpriteMetadata;
    private progress: number;
    private lastTime: number;
    private isRendering: boolean;
    private rendererId: number;

    constructor(canvas: HTMLCanvasElement, texture: ImageBitmap, sprites: SpriteMetadata, frames: Uint32Array, duration: number) {
        this.canvas = canvas;
        this.texture = texture;
        this.sprites = sprites;
        this.frames = frames;
        this.duration = duration;
        this.context = canvas.getContext("2d")!;
        this.progress = 0;
        this.lastTime = 0;
        this.isRendering = false;
        this.rendererId = 0;
    }

    private renderFrame(deltaTime: number): void {
        let frameIdx = 0;

        if (this.duration > 0 && this.frames.length > 1) {
            this.progress = (this.progress + deltaTime) % this.duration;
            frameIdx = Math.floor(this.progress * this.frames.length / this.duration);
        }

        const frame = this.frames[frameIdx]!;
        const u0 = this.sprites.u0[frame]!;
        const v0 = this.sprites.v0[frame]!;
        const u1 = this.sprites.u1[frame]!;
        const v1 = this.sprites.v1[frame]!;
        const sourceX = u0 * this.texture.width;
        const sourceY = v0 * this.texture.height;
        const sourceWidth = (u1 - u0) * this.texture.width;
        const sourceHeight = (v1 - v0) * this.texture.height;
        const aspectRatio = sourceWidth / sourceHeight;

        this.canvas.width = Math.round(sourceWidth);
        this.canvas.height = Math.round(sourceHeight);
        this.canvas.style.setProperty("aspent-ratio", aspectRatio.toString());

        this.context.imageSmoothingEnabled = false;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.drawImage(
            this.texture,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, this.canvas.width, this.canvas.height
        );
    }

    public start(): void {
        if (this.isRendering) {
            return;
        }

        this.isRendering = true;
        const onFrame: FrameRequestCallback = (currentTime) => {
            if (!this.isRendering) {
                return;
            }

            const deltaTime = (currentTime - this.lastTime) / 1000; // in seconds
            this.lastTime = currentTime;
            this.renderFrame(deltaTime);
            this.rendererId = requestAnimationFrame(onFrame);
        };
        this.rendererId = requestAnimationFrame(onFrame);
    }

    public stop(): void {
        this.isRendering = false;
        cancelAnimationFrame(this.rendererId);
    }
}