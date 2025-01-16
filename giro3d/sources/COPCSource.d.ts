import type { Getter } from 'copc';
import { type DimensionFilter } from './las/filter';
import type { GetNodeDataOptions, PointCloudMetadata, PointCloudNode, PointCloudNodeData } from './PointCloudSource';
import { PointCloudSourceBase } from './PointCloudSource';
export type COPCSourceOptions = {
    /**
     * The URL to the remote COPC LAS file, or a copc.js `Getter` function to directly access the file.
     */
    url: string | Getter;
    /**
     * If true, colors are compressed to 8-bit (instead of 16-bit).
     * @defaultValue true
     */
    compressColorsTo8Bit?: boolean;
    /**
     * If specified, will keep every Nth point. For example, a decimation value of 10 will keep
     * one point out of ten, and discard the 9 other points. Useful to reduce memory usage.
     * @defaultValue 1
     */
    decimate?: number;
    /**
     * Enable web workers to perform CPU intensive tasks.
     * @defaultValue true
     */
    enableWorkers?: boolean;
    /**
     * The filters to use.
     */
    filters?: Readonly<DimensionFilter[]>;
};
/**
 * A source that reads from a remote [Cloud Optimized Point Cloud (COPC)](https://copc.io/) LAS file.
 *
 * LAZ decompression is done in background threads using workers. If you wish to disable workers
 * (for a noticeable cost in performance), you can set {@link COPCSourceOptions.enableWorkers} to
 * `false` in constructor options.
 *
 * Note: this source uses the **laz-perf** package to perform decoding of point cloud data. This
 * package uses WebAssembly. If you wish to override the path to the required .wasm file, use
 * {@link sources.las.config.setLazPerfPath | setLazPerfPath()} before using this source.
 * The default path is {@link sources.las.config.DEFAULT_LAZPERF_PATH | DEFAULT_LAZPERF_PATH}.
 *
 * ### Decimation
 *
 * This source supports decimation. By passing the {@link COPCSourceOptions.decimate} argument to
 * a value other than 1, every Nth point will be kept and other points will be discarded during
 * read operations.
 *
 * ### Dimensions filtering
 *
 * This source supports filtering over dimensions (also known as attributes) to eliminate points
 * during reads. For example, it is possible to remove unwanted classifications such as noise
 * from the output points.
 *
 * Note that dimension filtering is independent from the selected attribute. In other words, it is
 * possible to select the dimension `"Intensity"`, while filtering on dimensions `"Classification"`
 * and `"ReturnNumber"` for example.
 *
 * For example, if we wish to remove all points that have the dimension "High noise" (dimension 18
 * in the ASPRS classification list), as well as removing all points whose intensity is lower than
 * 1000:
 *
 * ```ts
 * const source = new COPCSource(...);
 *
 * source.filters = [
 *  { dimension: 'Classification', operator: 'not', value: 18 },
 *  { dimension: 'Intensity', operator: 'greaterequal', value: 1000 },
 * ];
 * ```
 */
export default class COPCSource extends PointCloudSourceBase {
    /** Readonly flag to indicate that this object is a COPCSource. */
    readonly isCOPCSource: true;
    readonly type = "COPCSource";
    private readonly _getter;
    private readonly _opCounter;
    private readonly _nodeMap;
    private readonly _filters;
    private readonly _options;
    private _data?;
    get loading(): boolean;
    get progress(): number;
    /**
     * Gets or sets the dimension filters.
     * @defaultValue `[]`
     */
    get filters(): Readonly<DimensionFilter[]>;
    set filters(v: Readonly<DimensionFilter[]> | null | undefined);
    constructor(options: COPCSourceOptions);
    protected initializeOnce(): Promise<this>;
    getMetadata(): Promise<PointCloudMetadata>;
    getHierarchy(): Promise<PointCloudNode>;
    getNodeData(params: GetNodeDataOptions): Promise<PointCloudNodeData>;
    private loadNodeData;
    private loadNodeDataWithWorker;
    private ensureInitialized;
    /**
     * Loads a view buffer.
     */
    private loadPointDataViewBuffer;
    /**
     * Loads a view and delegate LAZ decoding into a worker.
     */
    private loadPointDataView;
    getMemoryUsage(): void;
    dispose(): void;
}
//# sourceMappingURL=COPCSource.d.ts.map