import type { GetNodeDataOptions, PointCloudMetadata, PointCloudNode, PointCloudNodeData } from './PointCloudSource';
import { PointCloudSourceBase } from './PointCloudSource';
export type PotreeSourceOptions = {
    /**
     * The URL to the dataset.
     */
    url: string;
    /**
     * Enable web workers to perform CPU intensive tasks.
     * @defaultValue true
     */
    enableWorkers?: boolean;
};
/**
 * Reads Potree datasets.
 *
 * ## Supported formats
 *
 * This source currently reads legacy Potree datasets (a `cloud.js` files and multiple `.hrc` and
 * data files). Data files may either be in the BIN format or LAZ files.
 *
 * LAZ decompression is done in background threads using workers. If you wish to disable workers
 * (for a noticeable cost in performance), you can set {@link PotreeSourceOptions.enableWorkers} to
 * `false` in constructor options.
 *
 * Note: this source uses the **laz-perf** package to perform decoding of point cloud data. This
 * package uses WebAssembly. If you wish to override the path to the required .wasm file, use
 * {@link sources.las.config.setLazPerfPath | setLazPerfPath()} before using this source.
 * The default path is {@link sources.las.config.DEFAULT_LAZPERF_PATH | DEFAULT_LAZPERF_PATH}.
 */
export default class PotreeSource extends PointCloudSourceBase {
    readonly type: "PotreeSource";
    readonly isPotreeSource: true;
    private readonly _opCounter;
    private readonly _options;
    /**  Available after initialization. */
    private _datasetInfo;
    get progress(): number;
    get loading(): boolean;
    constructor(options: PotreeSourceOptions);
    protected initializeOnce(): Promise<this>;
    private readLazFile;
    private readBinFileSync;
    private readBinFile;
    private fetchDataFile;
    getNodeData(params: GetNodeDataOptions): Promise<PointCloudNodeData>;
    getHierarchy(): Promise<PointCloudNode>;
    dispose(): void;
    getMemoryUsage(): void;
    getMetadata(): Promise<PointCloudMetadata>;
}
//# sourceMappingURL=PotreeSource.d.ts.map