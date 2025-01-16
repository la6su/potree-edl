import type { BaseMessageMap, Message, SuccessResponse } from '../utils/WorkerPool';
export type DecodeBilTerrainResult = {
    data: ArrayBuffer;
    min: number;
    max: number;
};
export declare function decodeRaster(bil: Float32Array, noData?: number): DecodeBilTerrainResult;
type DecodeBilTerrainRequest = {
    buffer: ArrayBuffer;
    noData?: number;
};
export type DecodeBilTerrainMessage = Message<DecodeBilTerrainRequest>;
export type DecodeBilTerrainMessageResponse = SuccessResponse<DecodeBilTerrainResult>;
export type MessageType = 'DecodeBilTerrainMessage';
export interface MessageMap extends BaseMessageMap<MessageType> {
    DecodeBilTerrainMessage: {
        payload: DecodeBilTerrainRequest;
        response: DecodeBilTerrainResult;
    };
}
export {};
//# sourceMappingURL=bilWorker.d.ts.map