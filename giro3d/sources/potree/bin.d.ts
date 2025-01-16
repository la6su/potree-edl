import type { Box3 } from 'three';
import { type PotreePointCloudAttribute } from './attributes';
export type BufferAttributeDescriptor = {
    array: ArrayBuffer;
    dimension: number;
    normalized: boolean;
};
export type ParseResult = {
    positionBuffer: BufferAttributeDescriptor;
    attributeBuffer?: BufferAttributeDescriptor;
    localBoundingBox?: Box3;
};
export declare function readBinFile(buffer: ArrayBuffer, pointByteSize: number, positionAttribute: PotreePointCloudAttribute, optionalAttribute?: PotreePointCloudAttribute): ParseResult;
//# sourceMappingURL=bin.d.ts.map