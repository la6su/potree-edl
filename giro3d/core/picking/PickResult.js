/**
 * Pick result.
 *
 * Provides information from
 * [Three.js raycasting](https://threejs.org/docs/#api/en/core/Raycaster)
 * augmented with Giro3D information.
 *
 * May be extended, depending on what have been picked.
 */

/**
 * Picked vector feature
 *
 * Returned in {@link PickResult} when `pickFeatures` is enabled,
 * on {@link entities.Map} for instance.
 */

/**
 * Tests whether an object implements {@link VectorPickFeature}.
 *
 * @param obj - Object
 * @returns `true` if the object implements the interface.
 */
export const isVectorPickFeature = obj => obj.isVectorPickFeature;