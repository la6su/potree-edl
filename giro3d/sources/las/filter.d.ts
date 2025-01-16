import type { View } from 'copc';
import type { DimensionName } from './dimension';
/** @internal */
export type FilterByIndex = (index: number) => boolean;
export type FilterOperator = 'equal' | 'less' | 'lessequal' | 'greater' | 'greaterequal' | 'not';
/**
 * A filter that can be applied to dimensions to filter out unwanted points during processing.
 */
export type DimensionFilter = {
    /**
     * The dimension this filter applies to.
     * If this dimension is not present in the source, the filter is ignored.
     */
    dimension: DimensionName;
    /**
     * The operator of the predicate to apply to a specific dimension value.
     */
    operator: FilterOperator;
    /**
     * The value to apply the predicate to.
     */
    value: number;
};
/**
 * For a given point index, evaluate all filters in series. Returns `true` if all filters return
 * `true`, otherwise returns `false`.
 */
export declare function evaluateFilters(filters: FilterByIndex[] | null, pointIndex: number): boolean;
export declare function createPredicateFromFilter(operator: FilterOperator, value: number): (value: number) => boolean;
/**
 * For a given set of dimension filters, return an array of ready-to-use functions to apply to each
 * point being read.
 */
export declare function getPerPointFilters(filters: DimensionFilter[], view: View): FilterByIndex[] | null;
//# sourceMappingURL=filter.d.ts.map