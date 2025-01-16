import type { BaseMessageMap, Message, SuccessResponse } from '../../utils/WorkerPool';
import type { PotreePointCloudAttribute } from './attributes';
import type { BufferAttributeDescriptor } from './bin';
export type MessageType = 'ReadBinFile';
export type TypedMessage<K extends MessageType, T> = Message<T> & {
    type: K;
};
type ReadBinFileMessage = TypedMessage<'ReadBinFile', {
    buffer: ArrayBuffer;
    info: {
        positionAttribute: PotreePointCloudAttribute;
        optionalAttribute?: PotreePointCloudAttribute;
        pointByteSize: number;
    };
}>;
type ReadBinFileResponse = SuccessResponse<{
    position: BufferAttributeDescriptor;
    attribute?: BufferAttributeDescriptor;
}>;
export interface MessageMap extends BaseMessageMap<MessageType> {
    ReadBinFile: {
        payload: ReadBinFileMessage['payload'];
        response: ReadBinFileResponse['payload'];
    };
}
export {};
//# sourceMappingURL=worker.d.ts.map