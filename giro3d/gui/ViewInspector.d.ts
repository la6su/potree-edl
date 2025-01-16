import type GUI from 'lil-gui';
import { CameraHelper, type OrthographicCamera, type PerspectiveCamera } from 'three';
import type Instance from '../core/Instance';
import type View from '../renderer/View';
import Panel from './Panel';
declare class CameraInspector extends Panel {
    view: View;
    camera: PerspectiveCamera | OrthographicCamera;
    snapshots: CameraHelper[];
    /**
     * @param gui - The GUI.
     * @param instance - The Giro3D instance.
     */
    constructor(gui: GUI, instance: Instance);
    deleteSnapshots(): void;
    createFrustumSnapshot(): void;
}
export default CameraInspector;
//# sourceMappingURL=ViewInspector.d.ts.map