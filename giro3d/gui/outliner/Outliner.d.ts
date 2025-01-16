import type GUI from 'lil-gui';
import type { Object3D } from 'three';
import type Instance from '../../core/Instance';
import type { BoundingBoxHelper } from '../../helpers/Helpers';
import Panel from '../Panel';
import OutlinerPropertyView from './OutlinerPropertyView';
type OutlinedObject3D = Object3D & {
    ___outlinerTreeviewVisible?: boolean;
    ___outlinerTreeviewCollapsed?: boolean;
};
interface Filter {
    showHelpers: boolean;
    showHiddenObjects: boolean;
    searchRegex?: RegExp;
    searchQuery: string;
}
/**
 * Provides a tree view of the three.js [scene](https://threejs.org/docs/index.html?q=scene#api/en/scenes/Scene).
 *
 */
declare class Outliner extends Panel {
    filters: Filter;
    treeviewContainer: HTMLDivElement;
    treeview: HTMLDivElement;
    rootNode: HTMLDivElement | undefined;
    propView: OutlinerPropertyView;
    selectionHelper?: BoundingBoxHelper;
    sceneHash: number | undefined;
    private readonly _nodes;
    /**
     * @param gui - The GUI.
     * @param instance - The Giro3D instance.
     */
    constructor(gui: GUI, instance: Instance);
    updateValues(): void;
    onNodeClicked(obj: OutlinedObject3D): void;
    /**
     * Selects the object by displaying a bright bounding box around it.
     *
     * @param obj - The object to select.
     */
    select(obj: OutlinedObject3D): void;
    /**
     * Unselect the currently selected object.
     */
    clearSelection(): void;
    search(): void;
    updateObject(o: Object3D): void;
    private updateExistingNodes;
    updateTreeView(): void;
}
export default Outliner;
//# sourceMappingURL=Outliner.d.ts.map