import type { BufferGeometry, IUniform, Object3D, WebGLRenderer } from 'three';
import { Material } from 'three';
export type MemoryUsageReport = {
    cpuMemory: number;
    gpuMemory: number;
};
export type GetMemoryUsageContext = {
    renderer: WebGLRenderer;
    objects: Map<number | string, MemoryUsageReport>;
};
/**
 * Trait of objects that can report their memory usage.
 */
export default interface MemoryUsage {
    /** Readonly flag to indicate that his object implements {@link MemoryUsage}. */
    isMemoryUsage: true;
    /**
     * Returns an approximation of the memory used by this object, in bytes.
     * @param context - The graphics context.
     */
    getMemoryUsage(context: GetMemoryUsageContext): void;
}
export declare function isMemoryUsage(obj: unknown): obj is MemoryUsage;
export declare function aggregateMemoryUsage(context: GetMemoryUsageContext): MemoryUsageReport;
export declare const KILOBYTE = 1024;
export declare const MEGABYTE: number;
export declare const GIGABYTE: number;
/**
 * Formats the byte count into a readable string.
 * @param bytes - The number of bytes.
 * @param locale - The locale parameter. Default is the current locale.
 * @returns A formatted string using either the specified locale, or the current locale.
 */
export declare function format(bytes: number, locale?: string | undefined): string;
export declare function getObject3DMemoryUsage(context: GetMemoryUsageContext, object3d: Object3D): void;
export declare function getUniformMemoryUsage(context: GetMemoryUsageContext, uniform: IUniform): void;
export declare function getMaterialMemoryUsage(context: GetMemoryUsageContext, material: Material): void;
export declare function getGeometryMemoryUsage(context: GetMemoryUsageContext, geometry: BufferGeometry): void;
//# sourceMappingURL=MemoryUsage.d.ts.map