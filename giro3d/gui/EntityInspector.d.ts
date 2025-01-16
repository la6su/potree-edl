import type GUI from 'lil-gui';
import { Color, Object3D, PlaneHelper, Vector3, type ColorRepresentation } from 'three';
import type Instance from '../core/Instance';
import type Entity3D from '../entities/Entity3D';
import Panel from './Panel';
declare class ClippingPlanePanel extends Panel {
    entity: Entity3D;
    enableClippingPlane: boolean;
    normal: Vector3;
    distance: number;
    helperSize: number;
    negate: boolean;
    planeHelper?: PlaneHelper;
    constructor(entity: Entity3D, parentGui: GUI, instance: Instance);
    updateClippingPlane(): void;
    dispose(): void;
}
interface EntityInspectorOptions {
    /** Display the bounding box checkbox. */
    boundingBoxes?: boolean;
    /** Display the bounding box color checkbox. */
    boundingBoxColor?: boolean;
    /** Display the opacity slider. */
    opacity?: boolean;
    /** Display the visibility checkbox. */
    visibility?: boolean;
}
/**
 * Base class for entity inspectors. To implement a custom inspector
 * for an entity type, you can inherit this class.
 */
declare class EntityInspector<T extends Entity3D = Entity3D> extends Panel {
    /** The inspected entity. */
    entity: T;
    /** The root object of the entity's hierarchy. */
    rootObject: Object3D;
    /** Toggle the visibility of the entity. */
    visible: boolean;
    /** Toggle the visibility of the bounding boxes. */
    boundingBoxes: boolean;
    boundingBoxColor: Color | string;
    state: string;
    clippingPlanePanel: ClippingPlanePanel;
    cpuMemoryUsage: string;
    gpuMemoryUsage: string;
    /**
     * @param parentGui - The parent GUI.
     * @param instance - The Giro3D instance.
     * @param entity - The entity to inspect.
     * @param options - The options.
     */
    constructor(parentGui: GUI, instance: Instance, entity: T, options?: EntityInspectorOptions);
    deleteEntity(): void;
    dispose(): void;
    updateValues(): void;
    /**
     * Toggles the visibility of the entity in the scene.
     * You may override this method if the entity's visibility is not directly related
     * to its root object visibility.
     *
     * @param visible - The new visibility.
     */
    toggleVisibility(visible: boolean): void;
    /**
     * Toggles the visibility of the bounding boxes.
     * You may override this method to use custom bounding boxes.
     *
     * @param visible - The new state.
     */
    toggleBoundingBoxes(visible: boolean): void;
    /**
     * @param obj - The object to decorate.
     * @param add - If true, bounding box is added, otherwise it is removed.
     * @param color - The bounding box color.
     */
    addOrRemoveBoundingBox(obj: Object3D, add: boolean, color: Color): void;
    updateBoundingBoxColor(colorHex: ColorRepresentation): void;
}
export default EntityInspector;
//# sourceMappingURL=EntityInspector.d.ts.map