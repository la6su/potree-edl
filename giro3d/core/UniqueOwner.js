/**
 * Trait for objects that have a unique owner.
 */

/**
 * Creates an {@link UniqueOwner} object with the specified owner and payload.
 * @param object - The owned payload.
 * @param owner - The owner.
 */
export function intoUniqueOwner(object, owner) {
  return {
    payload: object,
    owner
  };
}