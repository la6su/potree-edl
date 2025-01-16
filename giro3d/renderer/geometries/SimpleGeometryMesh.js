/**
 * Interface for meshes that represent a single OpenLayers Geometry.
 */

export function isSimpleGeometryMesh(obj) {
  return obj?.isSimpleGeometryMesh ?? false;
}