import type GUI from 'lil-gui';
import type { Color, Object3D } from 'three';
import type Instance from '../core/Instance';
import type FeatureCollection from '../entities/FeatureCollection';
import EntityInspector from './EntityInspector';
declare class FeatureCollectionInspector extends EntityInspector<FeatureCollection> {
    /** Toggle the wireframe rendering of the features. */
    wireframe: boolean;
    /** Toggle the frozen property of the features. */
    frozen: boolean;
    /** Store the CRS code of this.featureCollection */
    dataProjection: string;
    showGrid: boolean;
    /**
     * Creates an instance of FeatureCollectionInspector.
     *
     * @param parentGui - The parent GUI.
     * @param instance - The Giro3D instance.
     * @param featureCollection - The inspected Features.
     */
    constructor(parentGui: GUI, instance: Instance, featureCollection: FeatureCollection);
    /**
     * @param tile - The tile to decorate.
     * @param add - If true, bounding box is added, otherwise it is removed.
     * @param color - The bounding box color.
     */
    addOrRemoveBoundingBox(tile: Object3D, add: boolean, color: Color): void;
    toggleWireframe(value: boolean): void;
}
export default FeatureCollectionInspector;
//# sourceMappingURL=FeatureCollectionInspector.d.ts.map