import { EventDispatcher, MathUtils } from 'three';

/**
 * A dataset CRS definition. Useful when loading datasets from unknown sources, where we don't
 * have this information beforehand.
 */

/**
 * Contains lightweight metadata about the source, such as point count.
 */

/**
 * A point cloud hierarchy node.
 */

/**
 * Performs a depth-first traversal of the node hierarchy, applying the callback to each traversed node.
 * If the callback returns `false` for a given node, the children of this node are not traversed.
 */
export function traverseNode(root, callback) {
  if (!root) {
    return;
  }
  if (!callback(root)) {
    // Stop traversal
    return;
  }
  if (root.children != null) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      if (child) {
        traverseNode(child, callback);
      }
    }
  }
}

/**
 * Contains data for a single {@link PointCloudNode}.
 */

/**
 * Default event map.
 */

/**
 * Provides point cloud data.
 */

/**
 * Base class for sources that provide point cloud data.
 */
export class PointCloudSourceBase extends EventDispatcher {
  isMemoryUsage = true;
  /** Read-only flag to indicate that this object is a PointCloudSource. */
  isPointCloudSource = true;

  /** An auto-generated UUID used internally to create unique keys for various purposes. */
  id = MathUtils.generateUUID();
  _initializePromise = null;
  _ready = false;
  get ready() {
    return this._ready;
  }

  /**
   * Initialize this source.
   * As long as this source is not initialized, it cannot be used.
   */
  initialize() {
    if (!this._initializePromise) {
      this._initializePromise = this.initializeOnce();
      this._initializePromise.then(() => {
        this._ready = true;
        // @ts-expect-error stange issue with typing here
        this.dispatchEvent({
          type: 'initialized'
        });
      });
    }
    return this._initializePromise;
  }

  /**
   * Implement by subclasses to initialize the source. This is automatically called by {@link initialize}.
   */

  /**
   * Gets the hierarchy of this point cloud.
   *
   * Note: this does not provide point cloud data itself.
   */

  /**
   * Gets the metadata of this source.
   */

  /**
   * Loads buffer data for the specific {@link PointCloudNode}.
   * @param params - Options.
   */
}