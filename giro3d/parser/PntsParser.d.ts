import { BufferGeometry, Vector3 } from 'three';
import type { BatchTable } from './BatchTableParser';
export type Pnts = {
    point: {
        geometry: BufferGeometry;
        offset?: Vector3;
    };
    batchTable: BatchTable;
};
declare const _default: {
    /**
     * Parse pnts buffer and extract Points and batch table
     *
     * @param buffer - the pnts buffer.
     * @returns a promise that resolves with an object containig a Points (point)
     * and a batch table (batchTable).
     */
    parse: (buffer: ArrayBuffer) => Promise<Pnts>;
};
export default _default;
//# sourceMappingURL=PntsParser.d.ts.map