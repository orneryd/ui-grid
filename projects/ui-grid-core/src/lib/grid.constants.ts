export const SORT_DIRECTIONS = {
  asc: 'asc',
  desc: 'desc',
  none: 'none'
} as const;

export type SortDirection = (typeof SORT_DIRECTIONS)[keyof typeof SORT_DIRECTIONS];

export const FILTER_CONDITIONS = {
  contains: 'contains',
  startsWith: 'startsWith',
  endsWith: 'endsWith',
  exact: 'exact',
  notEqual: 'notEqual',
  greaterThan: 'greaterThan',
  greaterThanOrEqual: 'greaterThanOrEqual',
  lessThan: 'lessThan',
  lessThanOrEqual: 'lessThanOrEqual'
} as const;

export type FilterCondition = (typeof FILTER_CONDITIONS)[keyof typeof FILTER_CONDITIONS];
