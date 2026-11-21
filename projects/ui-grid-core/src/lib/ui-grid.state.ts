import { GridCellPosition, GridSavedState, SortState } from './grid.models';
import { isSafeStateKey, normalizeBooleanMap, normalizeGridSavedState } from './grid.core.state';

function moveArrayItem(items: readonly string[], fromIndex: number, toIndex: number): string[] {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) {
    return next;
  }

  next.splice(toIndex, 0, item);
  return next;
}

export function toggleGridGroupingState(current: readonly string[], columnName: string): string[] {
  return current.includes(columnName)
    ? current.filter((name) => name !== columnName)
    : [...current, columnName];
}

export function moveGridColumnOrderState(
  current: readonly string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  return moveArrayItem(current, fromIndex, toIndex);
}

export function moveGridVisibleColumnOrderState(
  currentOrder: readonly string[],
  visibleColumnNames: readonly string[],
  columnName: string,
  targetColumnName: string,
): string[] | null {
  const visibleNames = new Set(visibleColumnNames);
  const visibleOrder = currentOrder.filter((name) => visibleNames.has(name));
  const fromIndex = visibleOrder.indexOf(columnName);
  const toIndex = visibleOrder.indexOf(targetColumnName);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return null;
  }

  const movedVisibleOrder = moveArrayItem(visibleOrder, fromIndex, toIndex);
  const nextOrder: string[] = [];
  let visibleCursor = 0;

  for (const name of currentOrder) {
    if (visibleNames.has(name)) {
      nextOrder.push(movedVisibleOrder[visibleCursor++] ?? name);
    } else {
      nextOrder.push(name);
    }
  }

  return nextOrder;
}

export interface GridRestoreMutationPlan {
  columnOrder?: string[];
  filters?: Record<string, string>;
  sort?: SortState;
  grouping?: string[];
  /** Optional members so a partial payload only rewrites the slice it carries. */
  pagination?: {
    currentPage?: number;
    pageSize?: number;
  };
  expandable?: Record<string, boolean>;
  treeView?: Record<string, boolean>;
  pinning?: Record<string, 'left' | 'right'>;
  collapsedGroups?: Record<string, boolean>;
  columnWidthOverrides?: Record<string, string>;
  selectedRowIds?: string[];
  focusedCell?: GridCellPosition | null;
  scrollTop?: number;
  scrollLeft?: number;
}

/**
 * Project a saved payload onto the declarative shape `normalizeGridSavedState`
 * understands, so a payload saved by the live controller (canonical members)
 * and one saved by `buildGridSavedState` (legacy aliases) normalise the same
 * way. Canonical members win when both are present.
 */
function toDeclarativeSavedState(state: GridSavedState): GridSavedState {
  return {
    columnOrder: state.columnOrder,
    filters: state.activeFilters ?? state.filters,
    sort: state.sortState ?? state.sort,
    grouping: state.groupByColumns ?? state.grouping,
    expandable: state.expandedRows ?? state.expandable,
    treeView: state.expandedTreeRows ?? state.treeView,
    pinning: state.pinnedColumns ?? state.pinning,
  };
}

export function createGridRestoreMutationPlan(state: GridSavedState): GridRestoreMutationPlan {
  const normalizedState = normalizeGridSavedState(toDeclarativeSavedState(state));
  const plan: GridRestoreMutationPlan = {};

  if (normalizedState.columnOrder) {
    plan.columnOrder = normalizedState.columnOrder;
  }

  if (normalizedState.filters) {
    plan.filters = normalizedState.filters;
  }

  if (normalizedState.sort) {
    plan.sort = normalizedState.sort;
  }

  if (normalizedState.grouping) {
    plan.grouping = normalizedState.grouping;
  }

  const pagination = resolveSavedPagination(state);
  if (pagination) {
    plan.pagination = pagination;
  }

  if (normalizedState.expandable) {
    plan.expandable = normalizedState.expandable;
  }

  if (normalizedState.treeView) {
    plan.treeView = normalizedState.treeView;
  }

  if (normalizedState.pinning) {
    plan.pinning = normalizedState.pinning;
  }

  if (state.collapsedGroups) {
    plan.collapsedGroups = normalizeBooleanMap(state.collapsedGroups);
  }

  if (state.columnWidthOverrides) {
    plan.columnWidthOverrides = normalizeStringMap(state.columnWidthOverrides);
  }

  if (state.selectedRowIds) {
    plan.selectedRowIds = normalizeStringList(state.selectedRowIds);
  }

  if (state.focusedCell !== undefined) {
    plan.focusedCell = normalizeCellPosition(state.focusedCell);
  }

  const scrollTop = normalizeScrollOffset(state.scrollTop);
  if (scrollTop !== undefined) {
    plan.scrollTop = scrollTop;
  }

  const scrollLeft = normalizeScrollOffset(state.scrollLeft);
  if (scrollLeft !== undefined) {
    plan.scrollLeft = scrollLeft;
  }

  return plan;
}

function resolveSavedPagination(
  state: GridSavedState,
): GridRestoreMutationPlan['pagination'] | undefined {
  const hasCanonicalSlice = state.currentPage !== undefined || state.pageSize !== undefined;

  if (hasCanonicalSlice) {
    const pagination: NonNullable<GridRestoreMutationPlan['pagination']> = {};
    const currentPage = normalizeCurrentPage(state.currentPage);
    const pageSize = normalizePageSize(state.pageSize);

    if (currentPage !== undefined) {
      pagination.currentPage = currentPage;
    }

    if (pageSize !== undefined) {
      pagination.pageSize = pageSize;
    }

    return Object.keys(pagination).length > 0 ? pagination : undefined;
  }

  if (state.pagination) {
    return {
      currentPage: normalizeCurrentPage(state.pagination.paginationCurrentPage) ?? 1,
      pageSize: normalizePageSize(state.pagination.paginationPageSize) ?? 0,
    };
  }

  return undefined;
}

function normalizeCurrentPage(value: number | undefined): number | undefined {
  const currentPage = Number(value);
  return Number.isFinite(currentPage) && currentPage > 0 ? Math.floor(currentPage) : undefined;
}

function normalizePageSize(value: number | undefined): number | undefined {
  const pageSize = Number(value);
  return Number.isFinite(pageSize) && pageSize >= 0 ? Math.floor(pageSize) : undefined;
}

function normalizeStringMap(value: Record<string, string>): Record<string, string> {
  return Object.entries(value).reduce<Record<string, string>>((accumulator, [key, entry]) => {
    if (typeof key === 'string' && isSafeStateKey(key) && typeof entry === 'string') {
      accumulator[key] = entry;
    }

    return accumulator;
  }, {});
}

function normalizeStringList(value: readonly string[]): string[] {
  return value.filter(
    (entry): entry is string => typeof entry === 'string',
  );
}

function normalizeCellPosition(value: GridCellPosition | null): GridCellPosition | null {
  if (!value) {
    return null;
  }

  const rowId = (value as { rowId?: unknown }).rowId;
  const columnName = (value as { columnName?: unknown }).columnName;

  if (
    typeof rowId !== 'string' ||
    typeof columnName !== 'string' ||
    !isSafeStateKey(columnName)
  ) {
    return null;
  }

  return { rowId, columnName };
}

function normalizeScrollOffset(value: number | undefined): number | undefined {
  const offset = Number(value);
  return Number.isFinite(offset) ? Math.max(0, offset) : undefined;
}
