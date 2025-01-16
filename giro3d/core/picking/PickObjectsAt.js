import { Color, Raycaster, Vector2 } from 'three';
import traversePickingCircle from './PickingCircle';
const BLACK = new Color(0, 0, 0);
const raycaster = new Raycaster();
function findEntityInParent(obj) {
  if (obj.userData?.parentEntity != null) {
    return obj.userData.parentEntity;
  }
  if (obj.parent) {
    return findEntityInParent(obj.parent);
  }
  return null;
}

/**
 * Default picking object. Uses RayCaster
 *
 * @param instance - Instance to pick from
 * @param canvasCoords - Coordinates on the rendering canvas
 * @param object - Object to pick from
 * @param options - Options
 * @returns Array of picked objects
 */
function pickObjectsAt(instance, canvasCoords, object, options = {}) {
  const radius = Math.max(options.radius ?? 0, 0);
  const limit = options.limit ?? Infinity;
  const filter = options.filter;
  const target = [];
  let pixels;
  const clearColor = BLACK;
  const clearR = Math.round(255 * clearColor.r);
  const clearG = Math.round(255 * clearColor.g);
  const clearB = Math.round(255 * clearColor.b);
  if (options.gpuPicking === true) {
    // Instead of doing N raycast (1 per x,y returned by traversePickingCircle),
    // we force render the zone of interest.
    // Then we'll only do raycasting for the pixels where something was drawn.
    const zone = {
      x: canvasCoords.x - radius,
      y: canvasCoords.y - radius,
      width: 1 + radius * 2,
      height: 1 + radius * 2
    };
    pixels = instance.engine.renderToBuffer({
      scene: object,
      camera: instance.view.camera,
      zone,
      clearColor
    });
  }

  // Raycaster use NDC coordinate
  const vec2 = new Vector2();
  const normalized = instance.canvasToNormalizedCoords(canvasCoords, vec2);
  const tmp = normalized.clone();
  traversePickingCircle(radius, (x, y) => {
    // x, y are offset from the center of the picking circle,
    // and pixels is a square where 0, 0 is the top-left corner.
    // So we need to shift x,y by radius.

    const offset = ((y + radius) * (radius * 2 + 1) + (x + radius)) * 4;
    if (options.gpuPicking === true) {
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      // Use approx. test to avoid rounding error or to behave
      // differently depending on hardware rounding mode.
      if (Math.abs(clearR - r) <= 1 && Math.abs(clearG - g) <= 1 && Math.abs(clearB - b) <= 1) {
        // skip because nothing has been rendered here
        return null;
      }
    }

    // Perform raycasting
    tmp.setX(normalized.x + x / instance.view.width).setY(normalized.y + y / instance.view.height);
    raycaster.setFromCamera(tmp, instance.view.camera);
    const intersects = raycaster.intersectObject(object, true);
    for (const inter of intersects) {
      inter.entity = findEntityInParent(inter.object);
      if (!filter || filter(inter)) {
        target.push(inter);
        if (target.length >= limit) {
          return false;
        }
      }
    }

    // Stop at first hit
    return target.length === 0;
  });
  return target;
}
export default pickObjectsAt;