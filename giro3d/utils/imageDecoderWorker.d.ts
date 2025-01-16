import type { TextureDataType, TypedArray } from 'three';
import type { BaseMessageMap, Message, SuccessResponse } from './WorkerPool';
export declare const OPAQUE_BYTE = 255;
export declare const OPAQUE_FLOAT = 1;
export declare const TRANSPARENT = 0;
export declare const DEFAULT_NODATA = 0;
export type TypedArrayType = 'Float32Array' | 'Float64Array' | 'Uint8ClampedArray' | 'Uint8Array' | 'Uint16Array' | 'Uint32Array' | 'Int8Array' | 'Int16Array' | 'Int32Array';
export type CreatePixelBufferOptions = {
    input: ArrayBuffer[];
    bufferSize: number;
    inputType: TypedArrayType;
    dataType: TextureDataType;
    nodata?: number;
    opaqueValue: number;
};
export type CreatePixelBufferResult = {
    buffer: ArrayBuffer;
    min: number;
    max: number;
    isTransparent: boolean;
};
export declare function getTypedArrayType(array: TypedArray): TypedArrayType;
export declare function createTypedArrayFromBuffer(buf: ArrayBuffer, type: TypedArrayType | TextureDataType): TypedArray;
export declare function createPixelBuffer(options: CreatePixelBufferOptions): CreatePixelBufferResult;
export type CreatePixelBufferMessage = Message<CreatePixelBufferOptions> & {
    type: 'CreatePixelBuffer';
};
export type CreatePixelBufferResponse = SuccessResponse<CreatePixelBufferResult>;
export type CreateImageBitmapMessage = Message<{
    buffer: ArrayBuffer;
    options?: ImageBitmapOptions;
}> & {
    type: 'CreateImageBitmap';
};
export type CreateImageBitmapMessageResponse = SuccessResponse<ImageBitmap>;
export type MessageType = 'CreateImageBitmap' | 'CreatePixelBuffer';
export interface MessageMap extends BaseMessageMap<MessageType> {
    CreatePixelBuffer: {
        payload: CreatePixelBufferMessage['payload'];
        response: CreatePixelBufferResponse['payload'];
    };
    CreateImageBitmap: {
        payload: CreateImageBitmapMessage['payload'];
        response: CreateImageBitmapMessageResponse['payload'];
    };
}
export type Messages = CreateImageBitmapMessage | CreatePixelBufferMessage;
//# sourceMappingURL=imageDecoderWorker.d.ts.map