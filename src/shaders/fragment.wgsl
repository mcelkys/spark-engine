struct SettingsUniform {
    drawHitboxes: f32,
};

@group(1) @binding(0) var atlasSampler: sampler;
@group(1) @binding(1) var atlasTexture: texture_2d<f32>;
@group(2) @binding(0) var<uniform> settings: SettingsUniform;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) localPos: vec2f,
    @location(1) instanceUV: vec4f,
    @location(2) instanceTileScale: vec2f,
    @location(3) instanceScale: vec2f,
    @location(4) hitboxScale: vec2f,
    @location(5) visualScale: vec2f,
}

@fragment
fn main(in: VertexOutput) -> @location(0) vec4f {
    // 1. UNCONDITIONAL fwidth calculation (Must be at top of main, outside any if-branches)
    let baseWorldOffset = in.localPos * in.visualScale;
    let pixelWidth = fwidth(baseWorldOffset);
    
    // Map localPos.x from [-0.5, 0.5] to [0.0, 1.0]
    var tiledU = in.localPos.x + 0.5;
    
    // Map localPos.y and flip it so top is 0.0 and bottom is 1.0
    var tiledV = 0.5 - in.localPos.y; 

    if (in.instanceTileScale.x > 0.0 && in.instanceTileScale.y > 0.0) {
        let repeatX = in.instanceScale.x / in.instanceTileScale.x;
        let repeatY = in.instanceScale.y / in.instanceTileScale.y;

        let rawU = fract(tiledU * repeatX);
        let rawV = fract(tiledV * repeatY);

        tiledU = clamp(rawU, 0.002, 0.998);
        tiledV = clamp(rawV, 0.002, 0.998);
    }

    // Inset the atlas sub-rectangle bounds to prevent edge bleeding
    let uvWidth = in.instanceUV.z - in.instanceUV.x;
    let uvHeight = in.instanceUV.w - in.instanceUV.y;
    let insetX = uvWidth * 0.01;
    let insetY = uvHeight * 0.01;

    let minU = in.instanceUV.x + insetX;
    let maxU = in.instanceUV.z - insetX;
    let minV = in.instanceUV.y + insetY;
    let maxV = in.instanceUV.w - insetY;

    let u = mix(minU, maxU, tiledU);
    let v = mix(minV, maxV, tiledV);

    var color = textureSample(atlasTexture, atlasSampler, vec2f(u, v));

// 2. Overlay Constant-Pixel Hitbox Borders (tangible check via hitboxScale > 0)
    if (settings.drawHitboxes > 0.5 && in.hitboxScale.x > 0.0 && in.hitboxScale.y > 0.0) {
        let hScale = select(in.hitboxScale, in.visualScale, in.hitboxScale <= vec2f(0.0));
        
        let worldOffset = in.localPos * in.visualScale;
        let halfHitbox = hScale * 0.5;

        // Check if fragment is within the physical hitbox bounds
        if (abs(worldOffset.x) <= halfHitbox.x && abs(worldOffset.y) <= halfHitbox.y) {
            let distX = halfHitbox.x - abs(worldOffset.x);
            let distY = halfHitbox.y - abs(worldOffset.y);

            // Draw a crisp 2-pixel wide border using our precalculated pixelWidth
            if (distX < 2.0 * pixelWidth.x || distY < 2.0 * pixelWidth.y) {
                color = vec4f(1.0, 0.0, 0.0, 1.0);
            }
        }
    }

    return color;
}
