import { EventDispatcher, WebGLRenderTarget } from 'three';
import NestedMap from '../utils/NestedMap';
import TextureGenerator from '../utils/TextureGenerator';
const createPool = () => [];

/**
 * A pool that manages {@link RenderTarget}s.
 */
export default class RenderTargetPool extends EventDispatcher {
  isMemoryUsage = true;
  // Note that we cannot share render targets between instances are they are tied to a single WebGLRenderer.
  _globalPool = new NestedMap();
  _renderTargets = new Map();
  _timeout = null;
  constructor(cleanupTimeoutMs, maxPoolSize) {
    super();
    this._cleanupTimeoutMs = cleanupTimeoutMs;
    this._maxPoolSize = maxPoolSize;
  }
  getMemoryUsage(context) {
    if (this._globalPool.size === 0) {
      return;
    }
    this._globalPool.forEach((targets, renderer) => {
      if (renderer === context.renderer) {
        targets.forEach(target => TextureGenerator.getMemoryUsage(context, target));
      }
    });
  }
  acquire(renderer, width, height, options) {
    const pool = this._globalPool.getOrCreate(renderer, options, createPool);
    if (pool.length > 0) {
      const cached = pool.pop();
      cached.setSize(width, height);
      return cached;
    }
    const result = new WebGLRenderTarget(width, height, options);
    this._renderTargets.set(result, options);
    return result;
  }
  get count() {
    return this._renderTargets.size;
  }
  release(obj, renderer) {
    const options = this._renderTargets.get(obj);
    if (options) {
      const pool = this._globalPool.getOrCreate(renderer, options, createPool);
      if (pool.length < this._maxPoolSize) {
        pool.push(obj);
      } else {
        obj.dispose();
        this._renderTargets.delete(obj);
      }
    }
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    this._timeout = setTimeout(() => this.cleanup(), this._cleanupTimeoutMs);
  }
  cleanup() {
    this._timeout = null;
    this._globalPool.forEach(list => {
      list.forEach(renderTarget => {
        renderTarget.dispose();
        this._renderTargets.delete(renderTarget);
      });
    });
    this._globalPool.clear();
    this.dispatchEvent({
      type: 'cleanup'
    });
  }
}
export const GlobalRenderTargetPool = new RenderTargetPool(50, 16);