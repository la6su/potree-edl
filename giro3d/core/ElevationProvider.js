/**
 * Represents an object that can provide elevations at given coordinates.
 *
 * Note: to combine multiple providers into one, you can use the {@link aggregateElevationProviders} function.
 */

/** @internal */
class AggregateProvider {
  constructor(providers) {
    this._providers = providers;
  }
  getElevation(options, result) {
    result = result ?? {
      coordinates: options.coordinates,
      samples: []
    };

    // Accumulate elevation samples from all providers.
    for (let i = 0; i < this._providers.length; i++) {
      const provider = this._providers[i];
      provider.getElevation(options, result);
    }
    return result;
  }
}

/**
 * Returns an {@link ElevationProvider} that aggregates multiple providers into one.
 * The {@link ElevationProvider.getElevation | getElevation} method will then sample
 * all underlying providers and return a single {@link GetElevationResult} containing
 * samples from all providers.
 *
 * This can be useful if a scene contains multiple overlapping terrains for example.
 *
 * @param providers - The providers to aggregate.
 */
export function aggregateElevationProviders(...providers) {
  if (providers == null || providers.length === 0) {
    throw new Error('expected at least one provider');
  }
  if (providers.length === 1) {
    return providers[0];
  }
  return new AggregateProvider(providers);
}