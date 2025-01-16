export type ComponentType = 'BYTE' | 'UNSIGNED_BYTE' | 'SHORT' | 'UNSIGNED_SHORT' | 'INT' | 'UNSIGNED_INT' | 'FLOAT' | 'DOUBLE';
export type ElementType = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4';
export type Accessor<Type extends ElementType = ElementType, Component extends ComponentType = ComponentType> = {
    byteOffset: number;
    type: Type;
    componentType: Component;
};
export type BatchTable = Record<string, Accessor>;
declare const _default: {
    /**
     * Parse batch table buffer and convert to JSON
     *
     * @param buffer - the batch table buffer.
     * @returns a promise that resolves with a JSON object.
     */
    parse(buffer: ArrayBuffer): Promise<BatchTable>;
};
export default _default;
//# sourceMappingURL=BatchTableParser.d.ts.map