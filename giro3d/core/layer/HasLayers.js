/**
 * Interface for any object that can contain {@link Layer}.
 */

/**
 * Checks if the specified object implements the {@link HasLayers} interface.
 *
 * ```js
 * if (hasLayers(myObject)) {
 *    myObject.forEachLayer((layer) => console.log(layer));
 * }
 * ```
 * @param obj - The object to test.
 */
export function hasLayers(obj) {
  return obj.hasLayers ?? false;
}