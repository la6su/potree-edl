import Extent from '../core/geographic/Extent';
import type { ImageResponse } from './ImageSource';
import ImageSource from './ImageSource';
/**
 * An image source that produces nothing. Mainly for debugging/testing purposes.
 */
declare class NullSource extends ImageSource {
    readonly isNullSource: true;
    readonly type: "NullSource";
    private readonly _extent;
    constructor(options?: {
        extent?: Extent;
    });
    getCrs(): string;
    getImages(): ImageResponse[];
    getExtent(): Extent;
}
export default NullSource;
//# sourceMappingURL=NullSource.d.ts.map