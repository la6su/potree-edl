import type GUI from 'lil-gui';
import { Color } from 'three';
import type Instance from '../core/Instance';
import Panel from './Panel';
import RenderingInspector from './RenderingInspector';
import WebGLRendererInspector from './WebGLRendererInspector';
declare class InstanceInspector extends Panel {
    /** Store the CRS code of the instance */
    instanceCrs: string;
    state: string;
    webGlRendererPanel: WebGLRendererInspector;
    enginePanel: RenderingInspector;
    clearColor: Color;
    clearAlpha: number;
    cpuMemoryUsage: string;
    gpuMemoryUsage: string;
    /**
     * @param gui - The GUI.
     * @param instance - The Giro3D instance.
     */
    constructor(gui: GUI, instance: Instance);
    triggerUpdate(): void;
    updateValues(): void;
    update(): void;
}
export default InstanceInspector;
//# sourceMappingURL=InstanceInspector.d.ts.map