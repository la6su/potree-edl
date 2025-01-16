import { Box3, Float32BufferAttribute, Int16BufferAttribute, Int32BufferAttribute, Int8BufferAttribute, IntType, Uint16BufferAttribute, Uint32BufferAttribute, Uint8BufferAttribute, Vector3 } from 'three';
import TypedArrayVector from '../../core/TypedArrayVector';
import { Vector3Array } from '../../core/VectorArray';
import { UnsupportedAttributeError } from '../../entities/PointCloud';
import { evaluateFilters } from './filter';

/**
 * Reads the color in the provided LAS view.
 *
 * Note: the color is the aggregate of the `Red`, `Green` and `Blue` dimensions.
 *
 * @param view - The view to read.
 * @param stride - The stride (take every Nth point). A stride of 3 means we take every 3rd point
 * and discard the others.
 * @param compress - Compress colors to 8-bit.
 * @param filters - The optional dimension filters to use.
 * @returns An object containing the color buffer.
 */
export function readColor(view, stride, compress, filters) {
  const pointCount = view.pointCount;
  const [readR, readG, readB] = ['Red', 'Green', 'Blue'].map(view.getter);
  const array = new Vector3Array(compress ? new Uint8Array(pointCount * 3) : new Uint16Array(pointCount * 3));
  array.length = 0;
  const factor = compress ? 1 / 65536 * 256 : 1;
  for (let i = 0; i < pointCount; i += stride) {
    if (evaluateFilters(filters, i)) {
      const r = readR(i) * factor;
      const g = readG(i) * factor;
      const b = readB(i) * factor;
      array.push(r, g, b);
    }
  }
  return array.array.buffer;
}

/**
 * Reads the point position in the provided LAS view.
 * @param view - The view to read.
 * @param origin - The origin to use for relative point coordinates.
 * @param stride - The stride (take every Nth point). A stride of 3 means we take every 3rd point
 * and discard the others.
 * @param filters - The optional dimension filters to use.
 * @returns An object containing the relative position buffer, and a local (tight) bounding box of
 * the position buffer.
 */
export function readPosition(view, origin, stride, filters) {
  const pointCount = view.pointCount;
  const [readX, readY, readZ] = ['X', 'Y', 'Z'].map(view.getter);
  const pointCountIncludingStride = Math.floor(pointCount / stride) + pointCount % stride;
  const array = new Vector3Array(new Float32Array(pointCountIncludingStride * 3));
  array.length = 0;
  let minx = +Infinity;
  let miny = +Infinity;
  let minz = +Infinity;
  let maxx = -Infinity;
  let maxy = -Infinity;
  let maxz = -Infinity;
  for (let i = 0; i < pointCount; i += stride) {
    if (evaluateFilters(filters, i)) {
      const x = readX(i) - origin.x;
      const y = readY(i) - origin.y;
      const z = readZ(i) - origin.z;
      minx = Math.min(x, minx);
      miny = Math.min(y, miny);
      minz = Math.min(z, minz);
      maxx = Math.max(x, maxx);
      maxy = Math.max(y, maxy);
      maxz = Math.max(z, maxz);
      array.push(x, y, z);
    }
  }
  array.trim();
  return {
    buffer: array.array.buffer,
    localBoundingBox: new Box3(new Vector3(minx, miny, minz), new Vector3(maxx, maxy, maxz))
  };
}
function fillBuffer(get, pointCount, stride, buffer, filters) {
  for (let i = 0; i < pointCount; i += stride) {
    if (evaluateFilters(filters, i)) {
      buffer.push(get(i));
    }
  }
}
export function readScalarAttribute(view, attribute, stride, filters) {
  const dimension = attribute.name;
  let readFn;
  switch (attribute.type) {
    case 'float':
      readFn = read(Float32Array);
      break;
    case 'signed':
      switch (attribute.size) {
        case 1:
          readFn = read(Int8Array);
          break;
        case 2:
          readFn = read(Int16Array);
          break;
        case 4:
          readFn = read(Int32Array);
          break;
        default:
          throw new Error('invalid attribute size for signed values: ' + attribute.size);
      }
      break;
    case 'unsigned':
      switch (attribute.size) {
        case 1:
          readFn = read(Uint8Array);
          break;
        case 2:
          readFn = read(Uint16Array);
          break;
        case 4:
          readFn = read(Uint32Array);
          break;
        default:
          throw new Error('invalid attribute size for unsigned values: ' + attribute.size);
      }
      break;
    default:
      throw new UnsupportedAttributeError(dimension);
  }
  return readFn(dimension, view, stride, filters);
}
export function createBufferAttribute(buffer, attribute, compressColors) {
  const dimension = attribute.name;

  // Special case for colors, since they can be either 8-bit or 16-bit
  // depending on the user's choice. Note that since they are normalized in both cases,
  // the shader will handle both cases the same way. The only (potential) difference is
  // for very high dynamic range colors, the 16-bit case might reduce banding and other
  // similar artifacts. However, in 99% using a 8-bit color buffer is enough.
  if (attribute.interpretation === 'color') {
    return compressColors ? new Uint8BufferAttribute(buffer, 3, true) : new Uint16BufferAttribute(buffer, 3, true);
  }
  switch (attribute.type) {
    case 'float':
      return new Float32BufferAttribute(buffer, attribute.dimension);
    case 'signed':
      {
        let result;
        switch (attribute.size) {
          case 1:
            result = new Int8BufferAttribute(buffer, attribute.dimension);
            break;
          case 2:
            result = new Int16BufferAttribute(buffer, attribute.dimension);
            break;
          case 4:
            result = new Int32BufferAttribute(buffer, attribute.dimension);
            break;
          default:
            throw new Error('invalid attribute size for signed values: ' + attribute.size);
        }
        result.gpuType = IntType;
        return result;
      }
    case 'unsigned':
      {
        let result;
        switch (attribute.size) {
          case 1:
            result = new Uint8BufferAttribute(buffer, attribute.dimension);
            break;
          case 2:
            result = new Uint16BufferAttribute(buffer, attribute.dimension);
            break;
          case 4:
            result = new Uint32BufferAttribute(buffer, attribute.dimension);
            break;
          default:
            throw new Error('invalid attribute size for unsigned values: ' + attribute.size);
        }
        result.gpuType = IntType;
        return result;
      }
    default:
      throw new UnsupportedAttributeError(dimension);
  }
}

/**
 * Reads an attribute from the view.
 */
function read(ctor) {
  return (dimension, view, stride, filters) => {
    const pointCount = view.pointCount;
    const array = new TypedArrayVector(pointCount, cap => new ctor(cap));
    fillBuffer(view.getter(dimension), pointCount, stride, array, filters);
    return array.getArray().buffer;
  };
}