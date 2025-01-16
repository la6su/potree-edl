import type Instance from './Instance';
/** Rendering state */
export declare enum RenderingState {
    RENDERING_PAUSED = 0,
    RENDERING_SCHEDULED = 1
}
declare class MainLoop {
    private _renderingState;
    get renderingState(): RenderingState;
    private _needsRedraw;
    private _automaticCameraPlaneComputation;
    private _updateLoopRestarted;
    private readonly _changeSources;
    private readonly _clock;
    private _frame;
    /**
     * The number of frames processed.
     */
    get frameCount(): number;
    /**
     * Toggles automatic camera clipping plane computation.
     * @defaultValue true
     */
    get automaticCameraPlaneComputation(): boolean;
    set automaticCameraPlaneComputation(v: boolean);
    constructor();
    scheduleUpdate(instance: Instance, changeSource?: unknown | unknown[], options?: {
        needsRedraw?: boolean;
        immediate?: boolean;
    }): void;
    private update;
    private updateCameraPlanesFromObjects;
    private step;
}
export default MainLoop;
//# sourceMappingURL=MainLoop.d.ts.map