import { createErrorResponse } from '../../utils/WorkerPool';
import { readBinFile } from './bin';
function processReadBinMessage(msg) {
  try {
    const {
      buffer,
      info
    } = msg.payload;
    const result = readBinFile(buffer, info.pointByteSize, info.positionAttribute, info.optionalAttribute);
    const response = {
      requestId: msg.id,
      payload: {
        position: result.positionBuffer,
        attribute: result.attributeBuffer
      }
    };
    const position = result.positionBuffer.array;
    const attribute = result.attributeBuffer?.array;
    const transfer = [position];
    if (attribute) {
      transfer.push(attribute);
    }
    postMessage(response, {
      transfer
    });
  } catch (err) {
    postMessage(createErrorResponse(msg.id, err));
  }
}
onmessage = e => {
  const message = e.data;
  switch (message.type) {
    case 'ReadBinFile':
      processReadBinMessage(message);
      break;
  }
};