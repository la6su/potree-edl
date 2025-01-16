import type GUI from 'lil-gui';
import { Object3D } from 'three';
import type Instance from '../../core/Instance';
import Panel from '../Panel';
declare class OutlinerPropertyView extends Panel {
    protected _folders: GUI[];
    constructor(parentGui: GUI, instance: Instance);
    createControllers(obj: object, gui: GUI): void;
    /**
     * @param obj - The object to update.
     */
    updateObject(obj: Object3D): void;
    populateProperties(obj: Object3D): void;
}
export default OutlinerPropertyView;
//# sourceMappingURL=OutlinerPropertyView.d.ts.map