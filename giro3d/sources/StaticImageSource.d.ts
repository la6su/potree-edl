import { Texture } from 'three';
import type Extent from '../core/geographic/Extent';
import type { GetImageOptions, ImageResponse, ImageSourceEvents } from './ImageSource';
import ImageSource from './ImageSource';
/**
 * Options for the {@link StaticImageSource} constructor.
 */
export type StaticImageSourceOptions = {
    /**
     * The source of the image. It can be:
     * - a URL to a remote PNG, JPEG or WebP file,
     * - an `<canvas>` or `<image>` element,
     * - a THREE.js [`Texture`](https://threejs.org/docs/index.html?q=texture#api/en/textures/Texture).
     */
    source: string | HTMLImageElement | HTMLCanvasElement | Texture;
    /**
     * The extent of the image.
     */
    extent: Extent;
    /**
     * Should the texture be flipped vertically ? This parameter only applies if
     * {@link StaticImageSourceOptions.source | source} is a texture.
     */
    flipY?: boolean;
};
export interface StaticImageSourceEvents extends ImageSourceEvents {
    /**
     * Raised when the remote image has been loaded.
     */
    loaded: unknown;
    /**
     * Raised when the remote image failed to load.
     */
    error: {
        error: Error;
    };
}
/**
 * An {@link ImageSource} that displays a single, static image.
 *
 * The image must be either a PNG, JPG or WebP file.
 */
export default class StaticImageSource extends ImageSource<StaticImageSourceEvents> {
    readonly isStaticImageSource: true;
    readonly type: "StaticImageSource";
    private readonly _extent;
    private readonly _source;
    private readonly _id;
    private _promise;
    /**
     * Create a {@link StaticImageSource}.
     * @param options - The options.
     */
    constructor(options: StaticImageSourceOptions);
    getExtent(): Extent;
    getCrs(): string;
    private fetchTexture;
    private loadImageOnce;
    private loadImage;
    getImages(_options: GetImageOptions): Array<ImageResponse>;
}
//# sourceMappingURL=StaticImageSource.d.ts.map