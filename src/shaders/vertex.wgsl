struct CameraUniform {
    scale: vec2f,
    offset: vec2f,
};

@group(0) @binding(0) var<uniform> camera: CameraUniform;

const BASE_POS = array<vec2f, 6>(
    vec2f(-0.5,  0.5),
    vec2f(-0.5, -0.5),
    vec2f( 0.5, -0.5),
    vec2f(-0.5,  0.5),
    vec2f( 0.5, -0.5),
    vec2f( 0.5,  0.5)
);

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) localPos: vec2f,
    @location(1) instanceUV: vec4f,
    @location(2) instanceTileScale: vec2f,
    @location(3) instanceScale: vec2f,
    @location(4) hitboxScale: vec2f,
    @location(5) visualScale: vec2f,
}

@vertex
fn main(
    @builtin(vertex_index) vertexIndex: u32,
    @location(0) instancePos: vec2f,
    @location(1) instanceScale: vec2f,
    @location(2) instanceUV: vec4f,        
    @location(3) instanceTileScale: vec2f, 
    @location(4) instanceHitboxScale: vec2f,
) -> VertexOutput {
    let localPos = BASE_POS[vertexIndex];  // -0.5 to 0.5

    let worldX = localPos.x * instanceScale.x + instancePos.x;
    let worldY = localPos.y * instanceScale.y + instancePos.y;

    // Apply world-space offset first, then scale directly to NDC [-1, 1]
    let clipX = (worldX - camera.offset.x) * camera.scale.x;
    let clipY = (worldY - camera.offset.y) * camera.scale.y;

    var output: VertexOutput;
    output.position = vec4f(clipX, clipY, 0.0, 1.0);
    output.localPos = localPos;
    output.instanceUV = instanceUV;
    output.instanceTileScale = instanceTileScale;
    output.instanceScale = instanceScale;
    output.hitboxScale = instanceHitboxScale;
    output.visualScale = instanceScale;
    return output;
}