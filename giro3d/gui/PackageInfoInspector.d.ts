import type GUI from 'lil-gui';
import type Instance from '../core/Instance';
import Panel from './Panel';
declare class PackageInfoInspector extends Panel {
    olversion: string;
    giro3dVersion: string;
    /**
     * @param parentGui - The parent GUI.
     * @param instance - The Giro3D instance.
     */
    constructor(parentGui: GUI, instance: Instance);
}
export default PackageInfoInspector;
//# sourceMappingURL=PackageInfoInspector.d.ts.map