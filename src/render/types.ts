export enum BufferUsage {
    MAP_READ = 0x0001,
    MAP_WRITE = 0x0002,
    COPY_SRC = 0x0004,
    COPY_DST = 0x0008,
    INDEX = 0x0010,
    VERTEX = 0x0020,
    UNIFORM = 0x0040,
    STORAGE = 0x0080,
    INDIRECT = 0x0100,
    QUERY_RESOLVE = 0x0200,
}

export enum TextureUsage {
    COPY_SRC = 0x01,
    COPY_DST = 0x02,
    TEXTURE_BINDING = 0x04,
    STORAGE_BINDING = 0x08,
    RENDER_ATTACHMENT = 0x10,
}

export interface RendererOptions {
    canvas: HTMLCanvasElement;
    clearColor: GPUColor;
    vertexShader: string;
    fragmentShader: string;
}

export interface VertexShaderOptions {
    code: string;
    entry?: string;
}

export interface FragmentShaderOptions {
    code: string;
    entry?: string;
}
