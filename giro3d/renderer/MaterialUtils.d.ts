import type { BufferAttribute } from 'three';
type HasDefines = {
    defines: Record<string, unknown>;
    needsUpdate: boolean;
};
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
declare function setDefine<M extends HasDefines, K extends keyof M['defines']>(material: M, name: K, condition: boolean | undefined | null): void;
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
declare function setDefineValue<M extends HasDefines, K extends keyof M['defines']>(material: M, name: K, value?: number | string): boolean;
export type VertexAttributeType = 'int' | 'uint' | 'float';
/**
 * Returns the GLSL attribute type that most closely matches the type of the {@link BufferAttribute}.
 */
declare function getVertexAttributeType(attribute: BufferAttribute): VertexAttributeType;
declare const _default: {
    setDefine: typeof setDefine;
    setDefineValue: typeof setDefineValue;
    getVertexAttributeType: typeof getVertexAttributeType;
};
export default _default;
//# sourceMappingURL=MaterialUtils.d.ts.map