import type { GetMemoryUsageContext } from '../core/MemoryUsage';
import { PointCloudSourceBase, type GetNodeDataOptions, type PointCloudMetadata, type PointCloudNode, type PointCloudNodeData, type PointCloudSource } from './PointCloudSource';
export type AggregatePointCloudSourceOptions = {
    /**
     * The sources to aggregate. Cannot be empty.
     */
    sources: PointCloudSource[];
};
/**
 * A {@link PointCloudSource} that combines multiple sources.
 *
 * All aspects of the underlying sources are combined in the following way:
 * - volumes are union'ed
 * - point counts are summed
 * - only attributes that are found in *all* sources are exposed.
 */
export default class AggregatePointCloudSource extends PointCloudSourceBase {
    readonly isAggregatePointCloudSource: true;
    readonly type: "AggregatePointCloudSource";
    private readonly _sourceMap;
    private readonly _sources;
    /**
     * The sources in this source.
     */
    get sources(): PointCloudSource<import("./PointCloudSource").PointCloudSourceEventMap>[];
    constructor(params: AggregatePointCloudSourceOptions);
    protected initializeOnce(): Promise<this>;
    get loading(): boolean;
    get progress(): number;
    getHierarchy(): Promise<PointCloudNode>;
    getMetadata(): Promise<PointCloudMetadata>;
    getNodeData(params: GetNodeDataOptions): Promise<PointCloudNodeData>;
    /**
     * Disposes this source and all underlying sources.
     */
    dispose(): void;
    getMemoryUsage(context: GetMemoryUsageContext): void;
}
//# sourceMappingURL=AggregatePointCloudSource.d.ts.map