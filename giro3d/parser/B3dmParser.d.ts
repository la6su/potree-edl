import type { Material, Object3D } from 'three';
import { type BatchTable } from './BatchTableParser';
export interface B3dmParserOptions {
    /**
     * embedded glTF model up axis.
     *
     * @defaultValue Y
     */
    gltfUpAxis?: string;
    /** the base url of the b3dm file (used to fetch textures for the embedded glTF model). */
    urlBase: string;
    /**
     * disable patching material with logarithmic depth buffer support.
     *
     * @defaultValue false
     */
    doNotPatchMaterial?: boolean;
    /**
     * override b3dm's embedded glTF materials.
     * If overrideMaterials is a three.js material, it will be the material used to override.
     *
     * @defaultValue false
     */
    overrideMaterials?: boolean | Material;
}
declare const _default: {
    /**
     * Parse b3dm buffer and extract Scene and batch table
     *
     * @param buffer - the b3dm buffer.
     * @param options - additional properties.
     * @returns a promise that resolves with an object containig
     * a Scene (gltf) and a batch table (batchTable).
     */
    parse(buffer: ArrayBuffer, options: B3dmParserOptions): Promise<{
        gltf: {
            scene: Object3D;
        };
        batchTable: BatchTable;
    }>;
};
export default _default;
//# sourceMappingURL=B3dmParser.d.ts.map