import { SORT_DIRECTIONS } from './grid.constants';
import { GridSavedState, SortState } from './grid.models';

export function buildGridSavedState(context: {
  columnOrder: readonly string[];
  activeFilters: Readonly<Record<string, string>>;
  sortState: SortState;
  groupByColumns: readonly string[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  expandedRows: Readonly<Record<string, boolean>>;
  expandedTreeRows: Readonly<Record<string, boolean>>;
  pinnedColumns?: Readonly<Record<string, 'left' | 'right'>>;
}): GridSavedState {
  return {
    columnOrder: [...context.columnOrder],
    filters: { ...context.activeFilters },
    sort: { ...context.sortState },
    grouping: [...context.groupByColumns],
    pagination: {
      paginationCurrentPage: currentPageValue(context.currentPage),
      paginationPageSize: effectivePageSize(context.pageSize, context.totalItems),
    },
    expandable: { ...context.expandedRows },
    treeView: { ...context.expandedTreeRows },
    pinning: context.pinnedColumns ? { ...context.pinnedColumns } : undefined,
  };
}

export function normalizeGridSavedState(state: GridSavedState): GridSavedState {
  const normalized: GridSavedState = {};

  if (Array.isArray(state.columnOrder)) {
    normalized.columnOrder = state.columnOrder.filter(
      (columnName): columnName is string =>
        typeof columnName === 'string' && isSafeStateKey(columnName),
    );
  }

  if (state.filters && typeof state.filters === 'object') {
    normalized.filters = Object.entries(state.filters).reduce<Record<string, string>>(
      (accumulator, [key, value]) => {
        if (typeof key === 'string' && isSafeStateKey(key) && typeof value === 'string') {
          accumulator[key] = value;
        }

        return accumulator;
      },
      {},
    );
  }

  if (state.sort && typeof state.sort === 'object') {
    normalized.sort = {
      columnName:
        typeof state.sort.columnName === 'string' && isSafeStateKey(state.sort.columnName)
          ? state.sort.columnName
          : null,
      direction:
        state.sort.direction === SORT_DIRECTIONS.asc ||
        state.sort.direction === SORT_DIRECTIONS.desc
          ? state.sort.direction
          : SORT_DIRECTIONS.none,
    };
  }

  if (Array.isArray(state.grouping)) {
    normalized.grouping = state.grouping.filter(
      (columnName): columnName is string =>
        typeof columnName === 'string' && isSafeStateKey(columnName),
    );
  }

  if (state.pagination && typeof state.pagination === 'object') {
    const paginationCurrentPage = Number(state.pagination.paginationCurrentPage);
    const paginationPageSize = Number(state.pagination.paginationPageSize);

    normalized.pagination = {
      paginationCurrentPage:
        Number.isFinite(paginationCurrentPage) && paginationCurrentPage > 0
          ? Math.floor(paginationCurrentPage)
          : 1,
      paginationPageSize:
        Number.isFinite(paginationPageSize) && paginationPageSize >= 0
          ? Math.floor(paginationPageSize)
          : 0,
    };
  }

  if (state.expandable && typeof state.expandable === 'object') {
    normalized.expandable = normalizeBooleanMap(state.expandable);
  }

  if (state.treeView && typeof state.treeView === 'object') {
    normalized.treeView = normalizeBooleanMap(state.treeView);
  }

  if (state.pinning && typeof state.pinning === 'object') {
    normalized.pinning = Object.entries(state.pinning).reduce<Record<string, 'left' | 'right'>>(
      (acc, [key, value]) => {
        if (
          typeof key === 'string' &&
          isSafeStateKey(key) &&
          (value === 'left' || value === 'right')
        ) {
          acc[key] = value;
        }
        return acc;
      },
      {},
    );
  }

  return normalized;
}

function currentPageValue(currentPage: number): number {
  return Math.max(1, Math.floor(currentPage));
}

function effectivePageSize(pageSize: number, totalItems: number): number {
  const resolvedPageSize = Math.floor(pageSize);
  return Number.isFinite(resolvedPageSize) && resolvedPageSize > 0 ? resolvedPageSize : totalItems;
}

export function sanitizeDownloadFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'ui-grid';
}

export function normalizeBooleanMap(value: Record<string, unknown>): Record<string, boolean> {
  return Object.entries(value).reduce<Record<string, boolean>>((accumulator, [key, entry]) => {
    if (typeof key === 'string' && isSafeStateKey(key) && typeof entry === 'boolean') {
      accumulator[key] = entry;
    }

    return accumulator;
  }, {});
}

export function isSafeStateKey(value: string): boolean {
  return value !== '__proto__' && value !== 'constructor' && value !== 'prototype';
}
