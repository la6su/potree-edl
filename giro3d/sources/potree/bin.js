import { createReader, getTypedArray } from './attributes';
function readAttribute(attribute, view, pointByteSize, pointCount) {
  const array = getTypedArray(attribute.type, attribute.size, attribute.dimension, pointCount);
  const read = createReader(attribute, pointByteSize);
  for (let i = 0; i < pointCount; i++) {
    read(view, i, array);
  }
  return {
    array: array.buffer,
    dimension: attribute.dimension,
    normalized: attribute.normalized
  };
}
export function readBinFile(buffer, pointByteSize, positionAttribute, optionalAttribute) {
  const view = new DataView(buffer);

  // Format: X1,Y1,Z1,R1,G1,B1,A1,[...],XN,YN,ZN,RN,GN,BN,AN
  const pointCount = Math.floor(buffer.byteLength / pointByteSize);
  const positionBuffer = readAttribute(positionAttribute, view, pointByteSize, pointCount);
  let attributeBuffer = undefined;
  if (optionalAttribute != null) {
    attributeBuffer = readAttribute(optionalAttribute, view, pointByteSize, pointCount);
  }
  return {
    positionBuffer,
    attributeBuffer
  };
}