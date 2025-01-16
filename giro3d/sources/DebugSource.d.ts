import { Color } from 'three';
import type Extent from '../core/geographic/Extent';
import type { CustomContainsFn, GetImageOptions } from './ImageSource';
import ImageSource, { ImageResult } from './ImageSource';
declare class DebugSource extends ImageSource {
    readonly isDebugSource: boolean;
    readonly type: "DebugSource";
    private readonly _delay;
    private readonly _extent;
    private readonly _opacity;
    private readonly _subdivisions;
    private readonly _color;
    /**
     * @param options - options
     */
    constructor(options: {
        /** The extent. */
        extent: Extent;
        /** The delay before loading the images. */
        delay?: number;
        /** The opacity of the images. */
        opacity?: number;
        /** The color of the images. */
        color?: Color;
        /** How many images per tile are served. */
        subdivisions?: number;
        /** The custom function to test if a given extent is contained in this source. */
        containsFn?: CustomContainsFn;
    });
    private getImage;
    getCrs(): string;
    getExtent(): Extent;
    getImages(options: GetImageOptions): {
        id: string;
        request: () => Promise<ImageResult>;
    }[];
}
export default DebugSource;
//# sourceMappingURL=DebugSource.d.ts.map