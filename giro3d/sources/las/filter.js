// A dimension filter wrapped into an index accessor.
/** @internal */

/**
 * A filter that can be applied to dimensions to filter out unwanted points during processing.
 */

/**
 * For a given point index, evaluate all filters in series. Returns `true` if all filters return
 * `true`, otherwise returns `false`.
 */
export function evaluateFilters(filters, pointIndex) {
  if (filters == null || filters.length === 0) {
    return true;
  }
  return filters.every(f => f(pointIndex));
}
export function createPredicateFromFilter(operator, value) {
  switch (operator) {
    case 'equal':
      return x => x === value;
    case 'less':
      return x => x < value;
    case 'lessequal':
      return x => x <= value;
    case 'greater':
      return x => x > value;
    case 'greaterequal':
      return x => x >= value;
    case 'not':
      return x => x !== value;
    default:
      throw new Error(`invalid filter operator: '${operator}'`);
  }
}

/**
 * For a given set of dimension filters, return an array of ready-to-use functions to apply to each
 * point being read.
 */
export function getPerPointFilters(filters, view) {
  if (filters.length === 0) {
    return null;
  }
  const result = [];
  for (const filter of filters) {
    const predicate = createPredicateFromFilter(filter.operator, filter.value);
    if (view.dimensions[filter.dimension] != null) {
      const getter = view.getter(filter.dimension);
      result.push(i => predicate(getter(i)));
    }
  }
  if (result.length > 0) {
    return result;
  }
  return null;
}