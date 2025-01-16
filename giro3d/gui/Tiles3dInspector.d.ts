import type GUI from 'lil-gui';
import type { Color } from 'three';
import type Instance from '../core/Instance';
import type Tiles3D from '../entities/Tiles3D';
import EntityInspector from './EntityInspector';
import LayerInspector from './LayerInspector';
declare class Tiles3dInspector extends EntityInspector<Tiles3D> {
    /** Toggle the wireframe rendering of the entity. */
    wireframe: boolean;
    /** The SSE of the entity. */
    sse: number;
    layers: LayerInspector[];
    layerFolder: GUI;
    /**
     * Creates an instance of Tiles3dInspector.
     *
     * @param parentGui - The parent GUI.
     * @param instance - The Giro3D instance.
     * @param entity - The inspected 3D tileset.
     */
    constructor(parentGui: GUI, instance: Instance, entity: Tiles3D);
    updateControllers(): void;
    updateValues(): void;
    fillLayers(): void;
    toggleWireframe(value: boolean): void;
    updateSSE(v: number): void;
    notify(): void;
    toggleBoundingBoxes(visible: boolean): void;
    updateBoundingBoxColor(color: Color): void;
}
export default Tiles3dInspector;
//# sourceMappingURL=Tiles3dInspector.d.ts.map