import type GUI from 'lil-gui';
import type { AxesHelper, GridHelper } from 'three';
import { Color } from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type Instance from '../core/Instance';
import TileMesh from '../core/TileMesh';
import type Map from '../entities/Map';
import type { BoundingBoxHelper } from '../helpers/Helpers';
import ColorimetryPanel from './ColorimetryPanel';
import ContourLinePanel from './ContourLinePanel';
import EntityInspector from './EntityInspector';
import GraticulePanel from './GraticulePanel';
import HillshadingPanel from './HillshadingPanel';
import LayerInspector from './LayerInspector';
import MapTerrainPanel from './MapTerrainPanel';
type Sidedness = 'Front' | 'Back' | 'DoubleSide';
declare class MapInspector extends EntityInspector<Map> {
    /** Toggle the frozen property of the map. */
    frozen: boolean;
    showGrid: boolean;
    renderState: string;
    layerCount: number;
    background: Color;
    backgroundOpacity: number;
    extentColor: Color;
    showExtent: boolean;
    showTileInfo: boolean;
    extentHelper: BoundingBoxHelper | null;
    labels: globalThis.Map<number, CSS2DObject>;
    hillshadingPanel: HillshadingPanel;
    contourLinePanel: ContourLinePanel;
    colorimetryPanel: ColorimetryPanel;
    graticulePanel: GraticulePanel;
    /** The layer folder. */
    layerFolder: GUI;
    layers: LayerInspector[];
    private _fillLayersCb;
    grid?: GridHelper;
    axes?: AxesHelper;
    reachableTiles: number;
    visibleTiles: number;
    terrainPanel: MapTerrainPanel;
    side: Sidedness;
    /**
     * Creates an instance of MapInspector.
     *
     * @param parentGui - The parent GUI.
     * @param instance - The Giro3D instance.
     * @param map - The inspected Map.
     */
    constructor(parentGui: GUI, instance: Instance, map: Map);
    disposeMapAndLayers(): void;
    getOrCreateLabel(obj: TileMesh): CSS2DObject;
    getInfo(tile: TileMesh): string;
    updateLabel(tile: TileMesh, visible: boolean, color: Color): void;
    toggleBoundingBoxes(): void;
    updateControllers(): void;
    updateBackgroundOpacity(a: number): void;
    updateBackgroundColor(srgb: Color): void;
    updateExtentColor(): void;
    toggleExtent(): void;
    setSidedness(side: Sidedness): void;
    setRenderState(state: string): void;
    removeEventListeners(): void;
    dispose(): void;
    dumpTiles(): void;
    updateValues(): void;
    fillLayers(): void;
    toggleGrid(value: boolean): void;
}
export default MapInspector;
//# sourceMappingURL=MapInspector.d.ts.map