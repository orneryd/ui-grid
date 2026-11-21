import { describe, expect, it } from 'vitest';

import { SORT_DIRECTIONS } from './grid.constants';
import type { GridSavedState } from './grid.models';
import { createGridRestoreMutationPlan } from './ui-grid.state';

/**
 * Contract between the public `GridSavedState` declaration and the payload
 * `gridApi.saveState.save()` actually emits.
 *
 * `SAVE_PAYLOAD_KEYS` are the members the live controller writes into the
 * payload; `LEGACY_ALIAS_KEYS` are the older declarative members that
 * `restore()` still accepts. Both lists are `satisfies keyof GridSavedState`,
 * so a renamed or removed declaration member fails to compile, and the
 * classification map below fails to compile if a declared member is added
 * without being listed here.
 */
const SAVE_PAYLOAD_KEYS = [
  'sortState',
  'activeFilters',
  'groupByColumns',
  'collapsedGroups',
  'pinnedColumns',
  'columnOrder',
  'columnWidthOverrides',
  'currentPage',
  'pageSize',
  'selectedRowIds',
  'focusedCell',
  'expandedRows',
  'expandedTreeRows',
  'scrollTop',
  'scrollLeft',
] as const satisfies readonly (keyof GridSavedState)[];

const LEGACY_ALIAS_KEYS = [
  'sort',
  'filters',
  'grouping',
  'pagination',
  'expandable',
  'treeView',
  'pinning',
] as const satisfies readonly (keyof GridSavedState)[];

type DeclaredSavedStateKey = keyof GridSavedState;
type ListedSavedStateKey = (typeof SAVE_PAYLOAD_KEYS)[number] | (typeof LEGACY_ALIAS_KEYS)[number];

const DECLARED_KEY_CLASSIFICATION: Record<DeclaredSavedStateKey, ListedSavedStateKey> = {
  sortState: 'sortState',
  activeFilters: 'activeFilters',
  groupByColumns: 'groupByColumns',
  collapsedGroups: 'collapsedGroups',
  pinnedColumns: 'pinnedColumns',
  columnOrder: 'columnOrder',
  columnWidthOverrides: 'columnWidthOverrides',
  currentPage: 'currentPage',
  pageSize: 'pageSize',
  selectedRowIds: 'selectedRowIds',
  focusedCell: 'focusedCell',
  expandedRows: 'expandedRows',
  expandedTreeRows: 'expandedTreeRows',
  scrollTop: 'scrollTop',
  scrollLeft: 'scrollLeft',
  sort: 'sort',
  filters: 'filters',
  grouping: 'grouping',
  pagination: 'pagination',
  expandable: 'expandable',
  treeView: 'treeView',
  pinning: 'pinning',
};

const RUNTIME_PAYLOAD: GridSavedState = {
  sortState: { columnName: 'name', direction: SORT_DIRECTIONS.asc },
  activeFilters: { status: 'Active' },
  groupByColumns: ['status'],
  collapsedGroups: { 'status::Active': true },
  pinnedColumns: { name: 'left', status: 'right' },
  columnOrder: ['name', 'status'],
  columnWidthOverrides: { name: '240px' },
  currentPage: 3,
  pageSize: 25,
  selectedRowIds: ['r1', 'r2'],
  focusedCell: { rowId: 'r2', columnName: 'status' },
  expandedRows: { r1: true },
  expandedTreeRows: { r2: true },
  scrollTop: 120,
  scrollLeft: 40,
};

const RUNTIME_PLAN = {
  columnOrder: ['name', 'status'],
  filters: { status: 'Active' },
  sort: { columnName: 'name', direction: SORT_DIRECTIONS.asc },
  grouping: ['status'],
  pagination: { currentPage: 3, pageSize: 25 },
  expandable: { r1: true },
  treeView: { r2: true },
  pinning: { name: 'left', status: 'right' },
  collapsedGroups: { 'status::Active': true },
  columnWidthOverrides: { name: '240px' },
  selectedRowIds: ['r1', 'r2'],
  focusedCell: { rowId: 'r2', columnName: 'status' },
  scrollTop: 120,
  scrollLeft: 40,
};

describe('GridSavedState contract', () => {
  it('classifies every declared member as either a saved field or a legacy alias', () => {
    expect(Object.keys(DECLARED_KEY_CLASSIFICATION).sort()).toEqual(
      [...SAVE_PAYLOAD_KEYS, ...LEGACY_ALIAS_KEYS].sort(),
    );
  });

  it('maps the canonical runtime payload onto restore mutations', () => {
    expect(createGridRestoreMutationPlan(RUNTIME_PAYLOAD)).toEqual(RUNTIME_PLAN);
  });

  it('produces the same mutations from the legacy declarative payload', () => {
    const legacyPayload: GridSavedState = {
      sort: { columnName: 'name', direction: SORT_DIRECTIONS.asc },
      filters: { status: 'Active' },
      grouping: ['status'],
      pagination: { paginationCurrentPage: 3, paginationPageSize: 25 },
      expandable: { r1: true },
      treeView: { r2: true },
      pinning: { name: 'left', status: 'right' },
      columnOrder: ['name', 'status'],
    };

    const canonicalPayload: GridSavedState = {
      sortState: { columnName: 'name', direction: SORT_DIRECTIONS.asc },
      activeFilters: { status: 'Active' },
      groupByColumns: ['status'],
      pagination: { paginationCurrentPage: 3, paginationPageSize: 25 },
      expandedRows: { r1: true },
      expandedTreeRows: { r2: true },
      pinnedColumns: { name: 'left', status: 'right' },
      columnOrder: ['name', 'status'],
    };

    expect(createGridRestoreMutationPlan(legacyPayload)).toEqual(
      createGridRestoreMutationPlan(canonicalPayload),
    );
  });

  it('prefers canonical members when a payload carries both shapes', () => {
    const plan = createGridRestoreMutationPlan({
      activeFilters: { status: 'Active' },
      filters: { status: 'Draft' },
      groupByColumns: ['name'],
      grouping: ['status'],
      pinnedColumns: { name: 'left' },
      pinning: { status: 'right' },
      currentPage: 4,
      pagination: { paginationCurrentPage: 9, paginationPageSize: 50 },
    });

    expect(plan.filters).toEqual({ status: 'Active' });
    expect(plan.grouping).toEqual(['name']);
    expect(plan.pinning).toEqual({ name: 'left' });
    expect(plan.pagination).toEqual({ currentPage: 4 });
  });

  it('leaves omitted pagination members alone', () => {
    expect(createGridRestoreMutationPlan({ pageSize: 10 }).pagination).toEqual({ pageSize: 10 });
    expect(createGridRestoreMutationPlan({ currentPage: 2 }).pagination).toEqual({
      currentPage: 2,
    });
    expect(createGridRestoreMutationPlan({})).toEqual({});
  });

  it('clamps out-of-range pagination and scroll values', () => {
    expect(createGridRestoreMutationPlan({ currentPage: 0 }).pagination).toBeUndefined();
    expect(createGridRestoreMutationPlan({ currentPage: -3 }).pagination).toBeUndefined();
    expect(createGridRestoreMutationPlan({ pageSize: -1 }).pagination).toBeUndefined();
    expect(createGridRestoreMutationPlan({ scrollTop: -20 }).scrollTop).toBe(0);
    expect(createGridRestoreMutationPlan({ scrollLeft: Number.NaN }).scrollLeft).toBeUndefined();
  });

  it('drops unsafe keys and unknown pin directions', () => {
    const unsafeFilters = JSON.parse(
      '{"status":"Active","__proto__":"polluted","constructor":"nope"}',
    ) as Record<string, string>;
    const plan = createGridRestoreMutationPlan({
      activeFilters: unsafeFilters,
      grouping: ['status', 42 as unknown as string],
      pinning: { name: 'left', status: 'none' } as unknown as GridSavedState['pinning'],
      columnWidthOverrides: { name: '240px', constructor: '80px' },
      selectedRowIds: ['r1', 7 as unknown as string],
    });

    expect(plan.filters).toEqual({ status: 'Active' });
    expect(Object.prototype.hasOwnProperty.call(plan.filters, '__proto__')).toBe(false);
    expect(plan.grouping).toEqual(['status']);
    expect(plan.pinning).toEqual({ name: 'left' });
    expect(plan.columnWidthOverrides).toEqual({ name: '240px' });
    expect(plan.selectedRowIds).toEqual(['r1']);
  });

  it('only clears focus when the payload says so explicitly', () => {
    expect('focusedCell' in createGridRestoreMutationPlan({})).toBe(false);
    expect(createGridRestoreMutationPlan({ focusedCell: null }).focusedCell).toBeNull();
    expect(
      createGridRestoreMutationPlan({ focusedCell: { rowId: 'r1', columnName: 'name' } })
        .focusedCell,
    ).toEqual({
      rowId: 'r1',
      columnName: 'name',
    });
    expect(
      createGridRestoreMutationPlan({
        focusedCell: { rowId: 1 } as unknown as GridSavedState['focusedCell'],
      }).focusedCell,
    ).toBeNull();
  });

  it('preserves valid row identifiers that are object property names', () => {
    const plan = createGridRestoreMutationPlan({
      selectedRowIds: ['__proto__', 'constructor'],
      focusedCell: { rowId: '__proto__', columnName: 'name' },
    });
    expect(plan.selectedRowIds).toEqual(['__proto__', 'constructor']);
    expect(plan.focusedCell).toEqual({ rowId: '__proto__', columnName: 'name' });
  });

  it('survives a JSON round-trip unchanged', () => {
    const parsed = JSON.parse(JSON.stringify(RUNTIME_PAYLOAD)) as GridSavedState;
    expect(createGridRestoreMutationPlan(parsed)).toEqual(RUNTIME_PLAN);
  });
});
