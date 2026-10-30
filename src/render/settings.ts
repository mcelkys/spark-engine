import { Uniform } from "./uniform";

export class RenderSettings extends Uniform {
    constructor(device: GPUDevice) {
        super(device, 4);
    }

    public get drawHitboxes(): boolean {
        return this.data[0]! > 0;
    }

    public set drawHitboxes(value: boolean) {
        this.data[0] = value ? 1.0 : 0.0;
        this.write();
    }
}