import type { SpriteMetadata } from "../../types/assets";
import type { UnityMetadata } from "../../types/unity";

export function translateUnityMetadata(meta: UnityMetadata): SpriteMetadata {
    const sprites: SpriteMetadata = {
        name: [],
        u0: [],
        v0: [],
        u1: [],
        v1: [],
        widthScale: [],
        heightScale: [],
    };

    for (const sheet of meta.sheets) {
        for (const sprite of sheet.sprites) {
            sprites.name.push(sprite.name);
            sprites.u0.push(sprite.rect.x / sheet.size.width);
            sprites.v0.push(sprite.rect.y / sheet.size.height);
            sprites.u1.push((sprite.rect.x + sprite.rect.width) / sheet.size.width);
            sprites.v1.push((sprite.rect.y + sprite.rect.height) / sheet.size.height);
            
            if (sprite.trimmedRect) {
                sprites.widthScale.push(sprite.trimmedRect.width / sprite.originalSize.width);
                sprites.heightScale.push(sprite.trimmedRect.height / sprite.originalSize.height);
            } else {
                sprites.widthScale.push(1);
                sprites.heightScale.push(1);
            }
        }
    }

    return sprites;
}