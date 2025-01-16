import type { BaseMessageMap } from '../utils/WorkerPool';
import { type Message } from '../utils/WorkerPool';
/**
 * Utility functions and worker to process mapbox encoded terrain.
 */
export type DecodeMapboxTerrainResult = {
    min: number;
    max: number;
    width: number;
    height: number;
    /**
     * An array buffer that can be turned into a Float32Array.
     */
    data: ArrayBuffer;
};
export declare function decodeMapboxTerrainImage(blob: Blob, noData?: number): Promise<DecodeMapboxTerrainResult>;
export type DecodeMapboxTerrainMessage = Message<{
    buffer: ArrayBuffer;
    noData?: number;
}>;
export type MessageType = 'DecodeMapboxTerrainMessage';
export interface MessageMap extends BaseMessageMap<MessageType> {
    DecodeMapboxTerrainMessage: {
        payload: DecodeMapboxTerrainMessage['payload'];
        response: DecodeMapboxTerrainResult;
    };
}
//# sourceMappingURL=mapboxWorker.d.ts.map