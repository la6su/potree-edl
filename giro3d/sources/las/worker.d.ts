import * as copc from 'copc';
import type { BaseMessageMap, Message, SuccessResponse } from '../../utils/WorkerPool';
import type { PointCloudAttribute } from '../PointCloudSource';
import type { DimensionFilter } from './filter';
export type Metadata = {
    pointCount: number;
    pointDataRecordFormat: number;
    pointDataRecordLength: number;
};
export type BoundingBox = [number, number, number, number, number, number];
export type MessageType = 'DecodeLazChunk' | 'DecodeLazFile' | 'ReadView';
type TypedMessage<K extends MessageType, T> = Message<T> & {
    type: K;
};
type DecodeLazChunkMessage = TypedMessage<'DecodeLazChunk', {
    buffer: ArrayBuffer;
    metadata: Metadata;
}>;
export type ReadViewResult = {
    position?: {
        buffer: ArrayBuffer;
        localBoundingBox: BoundingBox;
    };
    attribute?: ArrayBuffer;
};
type ReadViewMessage = TypedMessage<'ReadView', {
    buffer: ArrayBuffer;
    metadata: Metadata;
    header: copc.Las.Extractor.PartialHeader;
    origin: {
        x: number;
        y: number;
        z: number;
    };
    eb?: copc.Las.ExtraBytes[];
    position: boolean;
    stride?: number;
    include?: string[];
    optionalAttribute?: PointCloudAttribute;
    filters?: DimensionFilter[];
    compressColors: boolean;
}>;
type DecodeLazFileMessage = TypedMessage<'DecodeLazFile', {
    buffer: ArrayBuffer;
}>;
type DecodeLazChunkResponse = SuccessResponse<ArrayBuffer>;
type DecodeLazFileResponse = SuccessResponse<ArrayBuffer>;
type ReadViewResponse = SuccessResponse<ReadViewResult>;
export type SetWasmPathMessage = {
    type: 'SetWasmPath';
    path: string;
};
export interface MessageMap extends BaseMessageMap<MessageType> {
    DecodeLazChunk: {
        payload: DecodeLazChunkMessage['payload'];
        response: DecodeLazFileResponse['payload'];
    };
    DecodeLazFile: {
        payload: DecodeLazFileMessage['payload'];
        response: DecodeLazChunkResponse['payload'];
    };
    ReadView: {
        payload: ReadViewMessage['payload'];
        response: ReadViewResponse['payload'];
    };
}
export interface LazWorker extends Worker {
    postMessage(message: SetWasmPathMessage, options?: StructuredSerializeOptions): void;
    postMessage(message: SetWasmPathMessage, transfer: Transferable[]): void;
}
export declare function readView(options: {
    view: copc.View;
    origin: {
        x: number;
        y: number;
        z: number;
    };
    stride?: number;
    position: boolean;
    optionalAttribute?: PointCloudAttribute;
    filters?: DimensionFilter[];
    compressColors: boolean;
}): ReadViewResult;
export {};
//# sourceMappingURL=worker.d.ts.map