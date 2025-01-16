/**
 * A generic octree spatial structure.
 */

/**
 * Creates an octree node with the given volume and parent.
 */
export function create(value, volume, parent) {
  return {
    parent,
    volume,
    ...value
  };
}

/**
 * Performs a depth-first traversal of the octree, applying the callback to each traversed node.
 * If the callback returns `false` for a given node, the children of this node are not traversed.
 */
export function traverse(root, callback) {
  if (!callback(root)) {
    // Stop traversal
    return;
  }
  if (root.children != null) {
    for (let i = 0; i < 8; i++) {
      const child = root.children[i];
      if (child) {
        traverse(child, callback);
      }
    }
  }
}

/**
 * Traverse the root node, populating the children list of the node, then recursively populating
 * the children list of each newly created children, and so on.
 */
export function populate(node, callback) {
  node.children = callback(node);
  if (node.children != null) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child != null) {
        child.parent = node;
        populate(child, callback);
      }
    }
  }
  return node;
}