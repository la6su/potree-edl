import { type Vector2 } from 'three';
import { type Node } from './Packer';
/**
 * An atlas image.
 */
export interface AtlasImage {
    id: string;
    size: Vector2;
}
export interface LayerAtlasInfo {
    x: number;
    y: number;
    fit?: Node;
    offset?: number;
}
export type Atlas = Record<string, Node>;
export interface AtlasInfo {
    maxX: number;
    maxY: number;
    atlas: Atlas | null;
}
/**
 * Build a texture atlas from N images.
 *
 * @param maxSize - The maximum texture size of the atlas, in pixels.
 * @param images - The images to pack.
 * @param oldAtlas - The previous atlas.
 */
declare function pack(maxSize: number, images: Array<AtlasImage>, oldAtlas: Atlas | null): AtlasInfo;
declare const _default: {
    pack: typeof pack;
};
export default _default;
//# sourceMappingURL=AtlasBuilder.d.ts.map