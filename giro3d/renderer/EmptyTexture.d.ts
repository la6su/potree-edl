import { Texture } from 'three';
export default class EmptyTexture extends Texture {
    readonly isEmptyTexture = true;
    constructor();
}
export declare function isEmptyTexture(obj: unknown): obj is EmptyTexture;
//# sourceMappingURL=EmptyTexture.d.ts.map