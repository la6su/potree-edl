import { Float16BufferAttribute, Float32BufferAttribute, Int16BufferAttribute, Int32BufferAttribute, Int8BufferAttribute, Uint16BufferAttribute, Uint32BufferAttribute, Uint8BufferAttribute, Uint8ClampedBufferAttribute } from 'three';
/**
 * Sets or unsets a define directive according to the condition.
 * The material is updated only if the directive has changed, avoiding unnecessary recompilations.
 *
 * @param material - The material to update.
 * @param name - The name of the directive
 * @param condition - The condition to enable the directive.
 * @example
 *
 * setDefine(mat, 'ENABLE_FOO', true); // material.needsUpdate === true;
 * setDefine(mat, 'ENABLE_FOO', true); // material.needsUpdate === false;
 * setDefine(mat, 'ENABLE_FOO', false); // material.needsUpdate === true;
 */
function setDefine(material, name, condition) {
  condition = condition ?? false;
  if (material.defines == null) {
    throw new Error('material.defines is null');
  }
  const key = name;
  if (material.defines[key] === undefined) {
    if (condition) {
      material.defines[key] = 1;
      material.needsUpdate = true;
    }
  } else if (!condition) {
    delete material.defines[key];
    material.needsUpdate = true;
  }
}

/**
 * Sets or unsets a valued define directive.
 * The material is updated only if the value has changed, avoiding unnecessary recompilations.
 *
 * @param material - The material to update.
 * @param name - The name of the directive
 * @param value - The value of the define.
 * @returns `true` if the define value has actually changed, `false` otherwise.
 * @example
 *
 * setValueDefine(mat, 'FOO_COUNT', 5); // material.needsUpdate === true;
 * setValueDefine(mat, 'FOO_COUNT', 5); // material.needsUpdate === false;
 * setValueDefine(mat, 'FOO_COUNT', 4); // material.needsUpdate === true;
 */
function setDefineValue(material, name, value) {
  if (material.defines == null) {
    throw new Error('material.defines is null');
  }
  const key = name;
  const changed = material.defines[key] !== value;
  if (value != null) {
    material.defines[key] = value;
  } else {
    delete material.defines[key];
  }
  if (changed) {
    material.needsUpdate = true;
  }
  return changed;
}
/**
 * Returns the GLSL attribute type that most closely matches the type of the {@link BufferAttribute}.
 */
function getVertexAttributeType(attribute) {
  if (attribute instanceof Float32BufferAttribute || attribute instanceof Float16BufferAttribute) {
    return 'float';
  }
  if (attribute instanceof Int32BufferAttribute || attribute instanceof Int16BufferAttribute || attribute instanceof Int8BufferAttribute) {
    return 'int';
  }
  if (attribute instanceof Uint32BufferAttribute || attribute instanceof Uint16BufferAttribute || attribute instanceof Uint8BufferAttribute || attribute instanceof Uint8ClampedBufferAttribute) {
    return 'uint';
  }
  throw new Error('unsupported vertex attribute type');
}
export default {
  setDefine,
  setDefineValue,
  getVertexAttributeType
};