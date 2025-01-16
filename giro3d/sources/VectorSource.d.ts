import type Feature from 'ol/Feature.js';
import type FeatureFormat from 'ol/format/Feature.js';
import type { Geometry } from 'ol/geom';
import Vector from 'ol/source/Vector.js';
import type { Style } from 'ol/style.js';
import type { StyleFunction } from 'ol/style/Style';
import Extent from '../core/geographic/Extent';
import type { GetImageOptions, ImageSourceOptions } from './ImageSource';
import ImageSource, { ImageResult } from './ImageSource';
/**
 * The data content. Can be:
 *  - The URL to a remote file and a {@link FeatureFormat} to parse the data,
 *  - The content of the source file (such as GeoJSON) and a {@link FeatureFormat} to parse the data,
 *  - A list of OpenLayers {@link Feature} (no format decoder required)
 */
export type DataSource = {
    url: string;
    format: FeatureFormat;
} | {
    content: unknown;
    format: FeatureFormat;
} | Feature[];
export interface VectorSourceOptions extends ImageSourceOptions {
    /**
     * The projection of the data source. Must be specified if the source
     * does not have the same projection as the Giro3D instance.
     */
    dataProjection?: string;
    /**
     * The data content.
     */
    data?: DataSource;
    /**
     * The style(s), or style function.
     */
    style?: Style | Style[] | StyleFunction;
}
/**
 * An image source that reads vector data. Internally, this wraps an OpenLayers' [VectorSource](https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html).
 * This uses OpenLayers' styles and features.
 *
 * Note: to assign a new style to the source, use {@link setStyle} instead of
 * the {@link style} property.
 *
 * @example
 * // To load a remote GeoJSON file
 * const source = new VectorSource(\{
 *      data: 'http://example.com/data.geojson',
 *      format: new GeoJSON(), // Pass the OpenLayers FeatureFormat here
 *      style: new Style(...), // Pass an OpenLayers style here
 * \});
 *
 * // To load a local GeoJSON
 * const source = new VectorSource(\{
 *      data: \{ "type": "FeatureCollection" ... \},
 *      format: new GeoJSON(), // Pass the OpenLayers FeatureFormat here
 *      style: new Style(...), // Pass an OpenLayers style here
 * \});
 *
 * // To load features directly (no need to pass a format as the features are already decoded.)
 * const source = new VectorSource(\{
 *      data: [new Feature(...)], // Pass the OpenLayers features here
 *      style: new Style(...), // Pass an OpenLayers style here
 * \});
 */
declare class VectorSource extends ImageSource {
    readonly isVectorSource: true;
    readonly type: "VectorSource";
    readonly data: DataSource;
    readonly dataProjection: string | undefined;
    readonly source: Vector;
    private _targetProjection;
    /**
     * The current style.
     * Note: to set a new style, use `setStyle()` instead.
     */
    style?: Style | Style[] | StyleFunction;
    /**
     * @param options - Options.
     */
    constructor(options: VectorSourceOptions);
    /**
     * Change the style of this source. This triggers an update of the source.
     *
     * @param style - The style, or style function.
     */
    setStyle(style: Style | StyleFunction): void;
    private loadFeaturesFromContent;
    /**
     * Loads the features from this source, either from:
     * - the URL
     * - the data string (for example a GeoJSON string)
     * - the features array
     */
    loadFeatures(): Promise<void>;
    /**
     * Reprojects a feature from the source projection into the target (instance) projection.
     *
     * @param feature - The feature to reproject.
     */
    reproject(feature: Feature): void;
    initialize(opts: {
        targetProjection: string;
    }): Promise<void>;
    get featureCount(): number;
    /**
     * Returns an array with the feature in this source.
     *
     * @returns The features.
     */
    getFeatures(): Feature<Geometry>[];
    /**
     * Adds a feature to this source.
     * @param feature - The feature to add.
     */
    addFeature(feature: Feature): void;
    /**
     * Adds features to this source.
     * @param features - The features to add.
     */
    addFeatures(features: Feature[]): void;
    /**
     * Removes a feature from this source.
     * @param feature - The feature to remove.
     */
    removeFeature(feature: Feature): void;
    /**
     * Removes all feature in this source.
     */
    clear(): void;
    /**
     * Updates the region associated with the feature(s).
     * @param feature - The feature(s) to update.
     */
    updateFeature(...feature: Feature[]): void;
    /**
     * Returns the feature with the specified id.
     *
     * @param id - The feature id.
     * @returns The feature.
     */
    getFeatureById(id: string | number): Feature | null;
    /**
     * Applies the callback for each feature in this source.
     *
     * @param callback - The callback.
     */
    forEachFeature(callback: (arg0: Feature<Geometry>) => unknown): void;
    getCrs(): string;
    getExtent(): Extent;
    getCurrentExtent(): Extent | null;
    /**
     * @param extent - The target extent.
     * @param size - The target pixel size.
     * @returns The builder group, or null if no features have been rendered.
     */
    private createBuilderGroup;
    /**
     * @param id - The unique id of the request.
     * @param extent - The request extent.
     * @param size - The size in pixels of the request.
     * @returns The image result.
     */
    private createImage;
    intersects(extent: Extent): boolean;
    getImages(options: GetImageOptions): {
        id: string;
        request: () => ImageResult;
    }[];
}
export default VectorSource;
//# sourceMappingURL=VectorSource.d.ts.map