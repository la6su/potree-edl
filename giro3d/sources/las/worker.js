import * as copc from 'copc';
import { createErrorResponse } from '../../utils/WorkerPool';
import { getLazPerf, setLazPerfPath } from './config';
import { getPerPointFilters } from './filter';
import { readColor, readPosition, readScalarAttribute } from './readers';
async function decompressChunk(chunk, metadata) {
  const lazPerf = await getLazPerf();
  return await copc.Las.PointData.decompressChunk(new Uint8Array(chunk), metadata, lazPerf);
}
async function decompressFile(chunk) {
  const lazPerf = await getLazPerf();
  return await copc.Las.PointData.decompressFile(new Uint8Array(chunk), lazPerf);
}
function processDecodeChunkMessage(msg) {
  decompressChunk(msg.payload.buffer, msg.payload.metadata).then(buf => {
    const response = {
      requestId: msg.id,
      payload: buf.buffer
    };
    postMessage(response, {
      transfer: [buf.buffer]
    });
  }).catch(err => {
    postMessage(createErrorResponse(msg.id, err));
  });
}
function processDecodeFileMessage(msg) {
  decompressFile(msg.payload.buffer).then(buf => {
    const response = {
      requestId: msg.id,
      payload: buf.buffer
    };
    postMessage(response, {
      transfer: [buf.buffer]
    });
  }).catch(err => {
    console.error(err);
    postMessage(createErrorResponse(msg.id, err));
  });
}
export function readView(options) {
  const {
    view,
    filters,
    origin,
    optionalAttribute,
    compressColors
  } = options;
  const stride = options.stride ?? 1;
  const perPointFilters = getPerPointFilters(filters ?? [], view);
  let position = undefined;
  if (options.position) {
    const data = readPosition(view, origin, stride, perPointFilters);
    const localBoundingBox = [data.localBoundingBox.min.x, data.localBoundingBox.min.y, data.localBoundingBox.min.z, data.localBoundingBox.max.x, data.localBoundingBox.max.y, data.localBoundingBox.max.z];
    position = {
      buffer: data.buffer,
      localBoundingBox
    };
  }
  let attribute = undefined;
  if (optionalAttribute != null) {
    switch (optionalAttribute.interpretation) {
      case 'color':
        attribute = readColor(view, stride, compressColors, perPointFilters);
        break;
      case 'classification':
      case 'unknown':
        attribute = readScalarAttribute(view, optionalAttribute, stride, perPointFilters);
        break;
    }
  }
  return {
    position,
    attribute
  };
}
function processReadViewMessage(msg) {
  const {
    buffer,
    metadata,
    header,
    eb,
    include
  } = msg.payload;
  decompressChunk(buffer, metadata).then(bin => {
    const view = copc.Las.View.create(bin, header, eb, include);
    const payload = readView({
      ...msg.payload,
      view
    });
    const response = {
      requestId: msg.id,
      payload
    };
    const transfer = [];
    if (payload.attribute) {
      transfer.push(payload.attribute);
    }
    if (payload.position) {
      transfer.push(payload.position.buffer);
    }
    postMessage(response, {
      transfer
    });
  }).catch(err => {
    console.error(err);
    postMessage(createErrorResponse(msg.id, err));
  });
}
onmessage = event => {
  const message = event.data;
  switch (message.type) {
    case 'DecodeLazChunk':
      processDecodeChunkMessage(message);
      break;
    case 'DecodeLazFile':
      processDecodeFileMessage(message);
      break;
    case 'ReadView':
      processReadViewMessage(message);
      break;
    case 'SetWasmPath':
      setLazPerfPath(message.path);
      break;
  }
};