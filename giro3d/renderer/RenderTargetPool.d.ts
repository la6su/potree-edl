import { EventDispatcher, WebGLRenderTarget, type RenderTargetOptions, type WebGLRenderer } from 'three';
import type MemoryUsage from '../core/MemoryUsage';
import { type GetMemoryUsageContext } from '../core/MemoryUsage';
export interface RenderTargetPoolEvents {
    cleanup: unknown;
}
/**
 * A pool that manages {@link RenderTarget}s.
 */
export default class RenderTargetPool extends EventDispatcher<RenderTargetPoolEvents> implements MemoryUsage {
    readonly isMemoryUsage: true;
    private readonly _globalPool;
    private readonly _renderTargets;
    private readonly _cleanupTimeoutMs;
    private _timeout;
    private _maxPoolSize;
    constructor(cleanupTimeoutMs: number, maxPoolSize: number);
    getMemoryUsage(context: GetMemoryUsageContext): void;
    acquire(renderer: WebGLRenderer, width: number, height: number, options: RenderTargetOptions): WebGLRenderTarget<import("three").Texture>;
    get count(): number;
    release(obj: WebGLRenderTarget, renderer: WebGLRenderer): void;
    cleanup(): void;
}
export declare const GlobalRenderTargetPool: RenderTargetPool;
//# sourceMappingURL=RenderTargetPool.d.ts.map