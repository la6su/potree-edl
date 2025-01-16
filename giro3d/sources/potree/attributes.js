import { defined } from '../../utils/tsutils';
import { DEFAULT_VALUE_RANGES } from '../las/dimension';

/**
 * The names of attributes for legacy Potree point clouds (the ones with .bin files in a hierarchy).
 * For LAZ-based potree datasets, the names are the actual LAS dimension names.
 */

/**
 * A function that reads point at the given index, and fills the array with the point data.
 */
var PotreeDataType = /*#__PURE__*/function (PotreeDataType) {
  PotreeDataType[PotreeDataType["Uint8"] = 0] = "Uint8";
  PotreeDataType[PotreeDataType["Uint16"] = 1] = "Uint16";
  PotreeDataType[PotreeDataType["Uint32"] = 2] = "Uint32";
  PotreeDataType[PotreeDataType["Float"] = 3] = "Float";
  PotreeDataType[PotreeDataType["Double"] = 4] = "Double";
  return PotreeDataType;
}(PotreeDataType || {});
/**
 * Point cloud attribute for LAZ-based Potree datasets.
 */
/**
 * Point cloud attribute for BIN-based Potree datasets.
 */
function getDefaultMin(type) {
  switch (type) {
    case PotreeDataType.Uint8:
    case PotreeDataType.Uint16:
    case PotreeDataType.Uint32:
      return 0;
    case PotreeDataType.Float:
    case PotreeDataType.Double:
      return undefined;
  }
}
function attribute(type, dimension, normalized, interpretation, min, max) {
  return {
    type,
    dimension,
    normalized: normalized ?? false,
    interpretation: interpretation ?? 'unknown',
    min: min ?? getDefaultMin(type),
    max
  };
}
const POTREE_ATTRIBUTES = {
  POSITION_CARTESIAN: attribute(PotreeDataType.Float, 3),
  // Color attributes. We don't support the alpha component.
  COLOR_PACKED: attribute(PotreeDataType.Uint8, 4, true, 'color'),
  RGBA_PACKED: attribute(PotreeDataType.Uint8, 4, true, 'color'),
  RGB_PACKED: attribute(PotreeDataType.Uint8, 3, true, 'color'),
  // Normal attributes (unsupported)
  NORMAL_FLOATS: attribute(PotreeDataType.Float, 3),
  NORMAL: attribute(PotreeDataType.Float, 3),
  NORMAL_SPHEREMAPPED: attribute(PotreeDataType.Uint8, 2),
  NORMAL_OCT16: attribute(PotreeDataType.Uint8, 2),
  // LAS-like attributes
  INTENSITY: attribute(PotreeDataType.Uint16, 1),
  CLASSIFICATION: attribute(PotreeDataType.Uint8, 1, false, 'classification'),
  RETURN_NUMBER: attribute(PotreeDataType.Uint8, 1),
  NUMBER_OF_RETURNS: attribute(PotreeDataType.Uint8, 1),
  SOURCE_ID: attribute(PotreeDataType.Uint16, 1),
  GPS_TIME: attribute(PotreeDataType.Double, 1),
  // Misc
  SPACING: attribute(PotreeDataType.Float, 1),
  INDICES: attribute(PotreeDataType.Uint32, 1)
};

/** The list of attributes that we expose to the API. */
export const EXPOSED_ATTRIBUTES = new Set([
// BIN based potree clouds
'COLOR_PACKED', 'RGBA_PACKED', 'RGB_PACKED', 'INTENSITY', 'CLASSIFICATION', 'RETURN_NUMBER', 'NUMBER_OF_RETURNS', 'SOURCE_ID', 'GPS_TIME', 'SPACING', 'INDICES',
// LAZ-based potree clouds
'Color', 'Classification', 'Intensity', 'GpsTime', 'ReturnNumber', 'PointSourceId', 'NumberOfReturns', 'Z']);
const UNSUPPORTED_ATTRIBUTES = new Set(['NORMAL', 'NORMAL_FLOATS', 'NORMAL_OCT16', 'NORMAL_SPHEREMAPPED']);
function getSize(type) {
  switch (type) {
    case PotreeDataType.Uint8:
      return 1;
    case PotreeDataType.Uint16:
      return 2;
    case PotreeDataType.Uint32:
    case PotreeDataType.Float:
      return 4;
    case PotreeDataType.Double:
      return 8;
  }
}
function mapSize(type) {
  switch (type) {
    case PotreeDataType.Uint8:
      return 1;
    case PotreeDataType.Uint16:
      return 2;
    case PotreeDataType.Uint32:
    case PotreeDataType.Float:
    case PotreeDataType.Double:
      // We have to downcast 64-bit numbers to 32-bit.
      return 4;
  }
}
function mapType(type) {
  switch (type) {
    case PotreeDataType.Uint8:
    case PotreeDataType.Uint16:
    case PotreeDataType.Uint32:
      return 'unsigned';
    case PotreeDataType.Float:
    case PotreeDataType.Double:
      return 'float';
  }
}
function mapDimension(input) {
  switch (input) {
    case 4:
      // The point cloud source does not support 4-component vectors (i.e RGBA colors),
      // so we have to ignore the 4th component.
      return 3;
    case 2:
      // This should not happen since Vec2 attributes such as NORMAL_OCT16 are not exposed.
      throw new Error('not supported.');
    default:
      return input;
  }
}

/**
 * Generates a reader function from an attribute and a byte offset.
 *
 * Note: Potree .bin data has interleaved attributes: X0,Y0,Z0,R0,G0,B0,A0,[...],Xn,Yn,Zn,Rn,Gn,Bn,An
 */

const readScalar = (attribute, attributeOffset, pointByteSize) => {
  let readFn;
  switch (attribute.type) {
    case PotreeDataType.Uint8:
      readFn = (view, offset) => view.getUint8(offset);
      break;
    case PotreeDataType.Uint16:
      readFn = (view, offset) => view.getUint16(offset, true);
      break;
    case PotreeDataType.Uint32:
      readFn = (view, offset) => view.getUint32(offset, true);
      break;
    case PotreeDataType.Float:
      readFn = (view, offset) => view.getFloat32(offset, true);
      break;
    case PotreeDataType.Double:
      readFn = (view, offset) => view.getFloat64(offset, true);
      break;
  }
  return (view, pointIndex, target) => {
    target[pointIndex] = readFn(view, pointIndex * pointByteSize + attributeOffset);
  };
};
const readPositionCartesian = (_attribute, attributeOffset, pointByteSize) => {
  const itemSize = 4; // 4 bytes per component

  return (view, pointIndex, target) => {
    const offset = pointIndex * pointByteSize + attributeOffset;
    const x = view.getUint32(offset + 0 * itemSize, true);
    const y = view.getUint32(offset + 1 * itemSize, true);
    const z = view.getUint32(offset + 2 * itemSize, true);
    target[pointIndex * 3 + 0] = x;
    target[pointIndex * 3 + 1] = y;
    target[pointIndex * 3 + 2] = z;
  };
};
const readColor = (attribute, attributeOffset, pointByteSize) => {
  return (view, pointIndex, target) => {
    const offset = pointIndex * pointByteSize + attributeOffset;

    // Note that we ignore the alpha component (i.e RGBA_PACKED is equivalent to RGB_PACKED)
    const r = view.getUint8(offset + 0);
    const g = view.getUint8(offset + 1);
    const b = view.getUint8(offset + 2);
    target[pointIndex * 3 + 0] = r;
    target[pointIndex * 3 + 1] = g;
    target[pointIndex * 3 + 2] = b;
  };
};
export function createReader(attribute, pointByteSize) {
  const {
    name,
    offset,
    potreeAttribute
  } = attribute;
  if (name === 'POSITION_CARTESIAN') {
    return readPositionCartesian(potreeAttribute, offset, pointByteSize);
  }

  // Some special readers
  switch (attribute.interpretation) {
    case 'color':
      return readColor(potreeAttribute, offset, pointByteSize);
  }
  return readScalar(potreeAttribute, offset, pointByteSize);
}
export function processLazAttributes(boundingBox) {
  const result = [];
  function attr(name, dimension, size, type, interp) {
    const result = {
      name,
      dimension,
      size,
      type,
      interpretation: interp ?? 'unknown'
    };
    if (name === 'Color') {
      result.min = 0;
      result.max = 255;
    } else if (name === 'Z') {
      result.min = boundingBox.lz;
      result.max = boundingBox.uz;
    } else if (DEFAULT_VALUE_RANGES[name] != null) {
      const {
        min,
        max
      } = DEFAULT_VALUE_RANGES[name];
      result.min = min;
      result.max = max;
    }
    return result;
  }
  result.push(attr('Z', 1, 4, 'float'));
  result.push(attr('Color', 3, 1, 'unsigned', 'color'));
  result.push(attr('Intensity', 1, 2, 'unsigned'));
  result.push(attr('Classification', 1, 1, 'unsigned', 'classification'));
  result.push(attr('GpsTime', 1, 4, 'float'));
  result.push(attr('NumberOfReturns', 1, 1, 'unsigned'));
  result.push(attr('ReturnNumber', 1, 1, 'unsigned'));
  result.push(attr('PointSourceId', 1, 2, 'unsigned'));
  return result;
}

/**
 * Given a list of attribute names, returns a list of actual attributes.
 */
export function processAttributes(names) {
  let offset = 0;
  let pointByteSize = 0;
  const attributes = [];

  // Loop once to compute the total byte size of a single point, including all attributes.
  // This will be used to compute the byte offsets when reading the data buffer.
  for (const name of names) {
    const potreeAttribute = defined(POTREE_ATTRIBUTES, name);
    const sizeBytes = potreeAttribute.dimension * getSize(potreeAttribute.type);
    pointByteSize += sizeBytes;
  }
  for (const name of names) {
    if (UNSUPPORTED_ATTRIBUTES.has(name)) {
      continue;
    }
    const potreeAttribute = defined(POTREE_ATTRIBUTES, name);
    const sizeBytes = potreeAttribute.dimension * getSize(potreeAttribute.type);
    const minmax = getMinMax(name);
    const sourceAttribute = {
      name,
      normalized: potreeAttribute.normalized,
      interpretation: potreeAttribute.interpretation,
      dimension: mapDimension(potreeAttribute.dimension),
      size: mapSize(potreeAttribute.type),
      type: mapType(potreeAttribute.type),
      potreeAttribute,
      offset,
      min: minmax?.min,
      max: minmax?.max
    };
    attributes.push(sourceAttribute);
    offset += sizeBytes;
  }
  return {
    attributes,
    pointByteSize
  };
}
export function getTypedArray(type, size, dimension, itemCount) {
  const arrayLength = itemCount * dimension;
  switch (type) {
    case 'signed':
      switch (size) {
        case 1:
          return new Int8Array(arrayLength);
        case 2:
          return new Int16Array(arrayLength);
        case 4:
          return new Int32Array(arrayLength);
      }
      break;
    case 'unsigned':
      switch (size) {
        case 1:
          return new Uint8Array(arrayLength);
        case 2:
          return new Uint16Array(arrayLength);
        case 4:
          return new Uint32Array(arrayLength);
      }
      break;
    case 'float':
      return new Float32Array(arrayLength);
  }
}
function getMinMax(name) {
  switch (name) {
    case 'RGB_PACKED':
    case 'RGBA_PACKED':
    case 'COLOR_PACKED':
    case 'CLASSIFICATION':
      return {
        min: 0,
        max: 255
      };
    case 'INTENSITY':
      return {
        min: 0,
        max: 65535
      };
    case 'RETURN_NUMBER':
      return {
        min: 0,
        max: 7
      };
    case 'NUMBER_OF_RETURNS':
      return {
        min: 0,
        max: 7
      };
    default:
      return undefined;
  }
}