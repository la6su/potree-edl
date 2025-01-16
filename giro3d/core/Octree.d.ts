import type { Box3 } from 'three';
export type ChildrenList<T> = [
    T | undefined,
    T | undefined,
    T | undefined,
    T | undefined,
    T | undefined,
    T | undefined,
    T | undefined,
    T | undefined
];
/**
 * A generic octree spatial structure.
 */
export type Octree<T extends object = object> = T & {
    volume: Box3;
    parent?: Octree<T>;
    children?: ChildrenList<Octree<T>>;
};
/**
 * Creates an octree node with the given volume and parent.
 */
export declare function create<T extends object>(value: T, volume: Box3, parent?: Octree<T>): Octree<T>;
/**
 * Performs a depth-first traversal of the octree, applying the callback to each traversed node.
 * If the callback returns `false` for a given node, the children of this node are not traversed.
 */
export declare function traverse<T extends object>(root: Octree<T>, callback: (value: Octree<T>) => boolean): void;
/**
 * Traverse the root node, populating the children list of the node, then recursively populating
 * the children list of each newly created children, and so on.
 */
export declare function populate<T extends object>(node: Octree<T>, callback: (node: Octree<T>) => ChildrenList<Octree<T>> | undefined): Octree<T>;
//# sourceMappingURL=Octree.d.ts.map