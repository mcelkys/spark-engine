import { Uniform } from "./uniform";

export class Camera2D extends Uniform {
    private readonly canvas: HTMLCanvasElement;
    private worldWidth: number;
    private worldHeight: number;
    private zoomValue: number;

    constructor(device: GPUDevice, canvas: HTMLCanvasElement) {
        // scale.x, scale.y, offset.x, offset.y (centered at 0,0)
        super(device, 4);
        this.canvas = canvas;
        this.worldWidth = 1;
        this.worldHeight = 1;
        this.zoomValue = 1;
    }

    public get offsetX(): number {
        return this.data[2]!;
    }

    public get offsetY(): number {
        return this.data[3]!;
    }

    public update(x: number, y: number, width: number, height: number, zoom: number): void {
        this.worldWidth = width;
        this.worldHeight = height;
        this.zoomValue = zoom;
        this.computeScaling();
        this.computePosition(x, y);
        this.write();
    }

    public updateInPlace(width: number, height: number, zoom: number): void {
        this.worldWidth = width;
        this.worldHeight = height;
        this.zoomValue = zoom;
        this.computeScaling();
        this.write();
    }

    public set zoom(value: number) {
        this.zoomValue = value;
        this.updateScaling();
    }

    public setWorldSize(width: number, height: number): void {
        this.worldWidth = width;
        this.worldHeight = height;
        this.updateScaling();
    }

    public panTo(x: number, y: number): void {
        this.computePosition(x, y);
        this.write();
    }

    public updateScaling(): void {
        this.computeScaling();
        this.write();
    }

    private computePosition(x: number, y: number): void {
        const scaleX = this.data[0]!;
        const scaleY = this.data[1]!;

        if (scaleX !== 0 && scaleY !== 0) {
            // Half-extents of the visible screen in world units
            const halfWidth = 1 / Math.abs(scaleX);
            const halfHeight = 1 / Math.abs(scaleY);

            // Min and Max allowable world coordinates for the camera center
            const minX = -this.worldWidth + halfWidth;
            const maxX = this.worldWidth - halfWidth;
            const minY = -this.worldHeight + halfHeight;
            const maxY = this.worldHeight - halfHeight;

            // If the viewport is larger than the world itself, center it; otherwise clamp
            this.data[2] = minX > maxX ? 0 : Math.max(minX, Math.min(maxX, x));
            this.data[3] = minY > maxY ? 0 : Math.max(minY, Math.min(maxY, y));
        } else {
            this.data[2] = x;
            this.data[3] = y;
        }
    }

    private computeScaling(): void {
        const aspectRatio = this.canvas.width / this.canvas.height;
        this.data[0] = this.zoomValue / this.worldWidth / Math.max(1, aspectRatio);
        this.data[1] = this.zoomValue / this.worldHeight * Math.min(1, aspectRatio);
    }
}