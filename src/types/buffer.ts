export enum GlobalI32 {
    ACTIVE_ENTITY_COUNT,
    INPUT_BIT_MASK,
    PHYSICS_RATE,
    PLAYER_ID,
    FLAGS,
    RENDER_RATE,
    INPUT_MODE,
    TEMPLATE_COUNT,
    GRID_CELL_SIZE,
    BUFFER_WRITER_COUNT,
    PENDING_BUFFER_LOCK_COUNT,
}

export enum GlobalF32 {
    WORLD_WIDTH,
    WORLD_HEIGHT,
    CAMERA_ZOOM,
    GRAVITATIONAL_ACCELERATION,
    AIR_DENSITY,
    ANALOG_LEFT_X,
    ANALOG_LEFT_Y,
}

export enum GpuAttribute {
    X,
    Y,
    SCALE_X,
    SCALE_Y,
    U0,
    V0,
    U1,
    V1,
    TILE_SCALE_X,
    TILE_SCALE_Y,
    HITBOX_SCALE_X,
    HITBOX_SCALE_Y,
}

export enum Flag {
    DRAW_HITBOXES = 1 << 0,
    IS_RUNNING = 1 << 1,
    IS_BUFFER_LOCKED = 1 << 2,
}

export interface BufferOptions {
    buffer?: SharedArrayBuffer;
    maxEntities: number;
    maxTemplates: number;
}
