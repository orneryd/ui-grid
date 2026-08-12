import { GridSavedState } from './grid.models';
import { normalizeGridSavedState } from './grid.core.state';

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
  sort?: GridSavedState['sort'];
  grouping?: string[];
  pagination?: {
    currentPage: number;
    pageSize: number;
  };
  expandable?: Record<string, boolean>;
  treeView?: Record<string, boolean>;
  pinning?: GridSavedState['pinning'];
}

export function createGridRestoreMutationPlan(state: GridSavedState): GridRestoreMutationPlan {
  const normalizedState = normalizeGridSavedState(state);
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

  if (normalizedState.pagination) {
    plan.pagination = {
      currentPage: normalizedState.pagination.paginationCurrentPage,
      pageSize: normalizedState.pagination.paginationPageSize,
    };
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

  return plan;
}
