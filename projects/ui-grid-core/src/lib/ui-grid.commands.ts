import { UiGridApi } from './grid.api';
import { SortDirection } from './grid.constants';
import {
  beginGridEditSession,
  pinColumnState,
  buildGridSortState,
  clearGridEditSession,
  completeInfiniteScrollDataLoad,
  expandAllGridRows,
  expandAllGridTreeRows,
  GridInfiniteScrollState,
  GridMoveDirection,
  maybeRequestInfiniteScrollData,
  resetInfiniteScrollState,
  resolveGridPageSize,
  saveInfiniteScrollPercentage,
  seekGridPage,
  setGridTreeRowExpanded,
  setInfiniteScrollDirectionsState,
  stringifyGridEditorValue,
  toggleGridRowExpanded,
  toggleGridTreeRowExpanded,
} from './grid.core';
import { PinDirection, PinnedColumnState } from './grid.core';
import {
  GridCellPosition,
  GridColumnDef,
  GridRecord,
  GridRow,
  GridSavedState,
  SortState,
} from './grid.models';
import { getCellValue } from './grid.utils';
import {
  raiseGridAfterCellEdit,
  raiseGridBeginCellEdit,
  raiseGridCancelCellEdit,
  raiseGridColumnOrderChanged,
  raiseGridExpandableRowStateChanged,
  raiseGridFilterChanged,
  raiseGridGroupingChanged,
  raiseGridNeedMoreData,
  raiseGridPaginationChanged,
  raiseGridSortChanged,
  raiseGridTreeRowStateChanged,
  raiseGridColumnPinned,
} from './ui-grid.events';
import {
  createGridRestoreMutationPlan,
  moveGridColumnOrderState,
  moveGridVisibleColumnOrderState,
  toggleGridGroupingState,
} from './ui-grid.state';

type SetState<T> = (value: T) => void;
type UpdateState<T> = (updater: (current: T) => T) => void;

export function applyGridSortStateCommand(
  gridApi: UiGridApi,
  setSortState: SetState<SortState>,
  sortState: SortState,
): void {
  setSortState(sortState);
  raiseGridSortChanged(gridApi, sortState);
}

export function sortGridColumnCommand(
  gridApi: UiGridApi,
  setSortState: SetState<SortState>,
  columnName: string,
  direction?: SortDirection,
): void {
  applyGridSortStateCommand(gridApi, setSortState, buildGridSortState(columnName, direction));
}

export function updateGridFilterCommand(
  gridApi: UiGridApi,
  updateFilters: UpdateState<Record<string, string>>,
  getFilters: () => Record<string, string>,
  columnName: string,
  value: string,
): void {
  updateFilters((current) => ({
    ...current,
    [columnName]: value,
  }));
  raiseGridFilterChanged(gridApi, getFilters());
}

export function clearGridFiltersCommand(
  gridApi: UiGridApi,
  setFilters: SetState<Record<string, string>>,
): void {
  const nextFilters: Record<string, string> = {};
  setFilters(nextFilters);
  raiseGridFilterChanged(gridApi, nextFilters);
}

export function toggleGridGroupingCommand(
  gridApi: UiGridApi,
  isGroupingEnabled: boolean,
  updateGroupByColumns: UpdateState<string[]>,
  getGroupByColumns: () => string[],
  columnName: string,
): void {
  if (!isGroupingEnabled) {
    return;
  }

  updateGroupByColumns((current) => toggleGridGroupingState(current, columnName));
  raiseGridGroupingChanged(gridApi, getGroupByColumns());
}

export function clearGridGroupingCommand(
  gridApi: UiGridApi,
  setGroupByColumns: SetState<string[]>,
  shouldRaise = true,
): void {
  const nextGrouping: string[] = [];
  setGroupByColumns(nextGrouping);

  if (shouldRaise) {
    raiseGridGroupingChanged(gridApi, nextGrouping);
  }
}

export function moveGridColumnCommand(
  gridApi: UiGridApi,
  canMoveColumns: boolean,
  updateColumnOrder: UpdateState<string[]>,
  fromIndex: number,
  toIndex: number,
): void {
  if (!canMoveColumns) {
    return;
  }

  updateColumnOrder((current) => {
    const next = moveGridColumnOrderState(current, fromIndex, toIndex);
    raiseGridColumnOrderChanged(gridApi, next);
    return next;
  });
}

export function moveGridVisibleColumnCommand(
  gridApi: UiGridApi,
  canMoveColumns: boolean,
  currentOrder: string[],
  visibleColumnNames: string[],
  columnName: string,
  targetColumnName: string,
  setColumnOrder: SetState<string[]>,
): void {
  if (!canMoveColumns) {
    return;
  }

  const nextOrder = moveGridVisibleColumnOrderState(
    currentOrder,
    visibleColumnNames,
    columnName,
    targetColumnName,
  );
  if (!nextOrder) {
    return;
  }

  setColumnOrder(nextOrder);
  raiseGridColumnOrderChanged(gridApi, nextOrder);
}

export function pinGridColumnCommand(
  gridApi: UiGridApi,
  isPinningEnabled: boolean,
  setPinnedColumns: SetState<PinnedColumnState>,
  getCurrentPinnedColumns: () => PinnedColumnState,
  columnName: string,
  direction: PinDirection,
): void {
  if (!isPinningEnabled) return;
  const next = pinColumnState(getCurrentPinnedColumns(), columnName, direction);
  setPinnedColumns(next);
  raiseGridColumnPinned(gridApi, columnName, direction);
}

export function seekGridPaginationCommand(
  gridApi: UiGridApi,
  setCurrentPage: SetState<number>,
  getTotalPages: () => number,
  getEffectivePageSize: () => number,
  page: number,
): void {
  const nextPage = seekGridPage(page, getTotalPages());
  setCurrentPage(nextPage);
  raiseGridPaginationChanged(gridApi, nextPage, getEffectivePageSize());
}

export function setGridPaginationPageSizeCommand(
  gridApi: UiGridApi,
  setPageSize: SetState<number>,
  setCurrentPage: SetState<number>,
  pageSize: number,
): void {
  const nextPageSize = resolveGridPageSize(pageSize);
  if (nextPageSize === null) {
    return;
  }

  setPageSize(nextPageSize);
  setCurrentPage(1);
  raiseGridPaginationChanged(gridApi, 1, nextPageSize);
}

export interface GridRestoreCommandAccess {
  setColumnOrder: SetState<string[]>;
  setActiveFilters: SetState<Record<string, string>>;
  setSortState: SetState<SortState>;
  setGroupByColumns: SetState<string[]>;
  setCurrentPage: SetState<number>;
  setPageSize: SetState<number>;
  setExpandedRows: SetState<Record<string, boolean>>;
  setExpandedTreeRows: SetState<Record<string, boolean>>;
  setPinnedColumns?: SetState<PinnedColumnState>;
  getEffectivePageSize: () => number;
}

export function restoreGridStateCommand(
  gridApi: UiGridApi,
  state: GridSavedState,
  access: GridRestoreCommandAccess,
): void {
  const restorePlan = createGridRestoreMutationPlan(state);

  if (restorePlan.columnOrder) {
    access.setColumnOrder(restorePlan.columnOrder);
  }

  if (restorePlan.filters) {
    access.setActiveFilters(restorePlan.filters);
    raiseGridFilterChanged(gridApi, restorePlan.filters);
  }

  if (restorePlan.sort) {
    access.setSortState(restorePlan.sort);
  }

  if (restorePlan.grouping) {
    access.setGroupByColumns(restorePlan.grouping);
    raiseGridGroupingChanged(gridApi, restorePlan.grouping);
  }

  if (restorePlan.pagination) {
    access.setCurrentPage(restorePlan.pagination.currentPage);
    access.setPageSize(restorePlan.pagination.pageSize);
    raiseGridPaginationChanged(
      gridApi,
      restorePlan.pagination.currentPage,
      access.getEffectivePageSize(),
    );
  }

  if (restorePlan.expandable) {
    access.setExpandedRows(restorePlan.expandable);
  }

  if (restorePlan.treeView) {
    access.setExpandedTreeRows(restorePlan.treeView);
  }

  if (restorePlan.pinning && typeof access.setPinnedColumns === 'function') {
    access.setPinnedColumns(restorePlan.pinning as PinnedColumnState);
    // raise events for each pinned column so consumers can react
    for (const [col, dir] of Object.entries(restorePlan.pinning)) {
      raiseGridColumnPinned(gridApi, col, dir as PinDirection);
    }
  }
}

export function toggleGridRowExpansionCommand(
  gridApi: UiGridApi,
  canExpandRows: boolean,
  currentExpandedRows: Record<string, boolean>,
  rowId: string,
  setExpandedRows: SetState<Record<string, boolean>>,
  findRowById: (rowId: string) => GridRow | null | undefined,
): void {
  if (!canExpandRows) {
    return;
  }

  const { expanded, nextExpandedRows } = toggleGridRowExpanded(currentExpandedRows, rowId);
  setExpandedRows(nextExpandedRows);

  const gridRow = findRowById(rowId);
  if (!gridRow) {
    return;
  }

  gridRow.expanded = expanded;
  raiseGridExpandableRowStateChanged(gridApi, gridRow, expanded);
}

export function expandAllGridRowsCommand(
  buildRows: (data: readonly GridRecord[]) => GridRow[],
  data: readonly GridRecord[],
  setExpandedRows: SetState<Record<string, boolean>>,
): void {
  setExpandedRows(expandAllGridRows(buildRows(data)));
}

export function collapseAllGridRowsCommand(
  setExpandedRows: SetState<Record<string, boolean>>,
): void {
  setExpandedRows({});
}

export function toggleGridTreeRowCommand(
  gridApi: UiGridApi,
  currentExpandedTreeRows: Record<string, boolean>,
  rowId: string,
  setExpandedTreeRows: SetState<Record<string, boolean>>,
  findRowById: (rowId: string) => GridRow | null | undefined,
): void {
  const { expanded, nextExpandedTreeRows } = toggleGridTreeRowExpanded(
    currentExpandedTreeRows,
    rowId,
  );
  setExpandedTreeRows(nextExpandedTreeRows);

  const gridRow = findRowById(rowId);
  if (gridRow) {
    raiseGridTreeRowStateChanged(gridApi, gridRow, expanded);
  }
}

export function setGridTreeRowExpandedCommand(
  gridApi: UiGridApi,
  currentExpandedTreeRows: Record<string, boolean>,
  rowId: string,
  expanded: boolean,
  setExpandedTreeRows: SetState<Record<string, boolean>>,
  findRowById: (rowId: string) => GridRow | null | undefined,
): void {
  setExpandedTreeRows(setGridTreeRowExpanded(currentExpandedTreeRows, rowId, expanded));

  const gridRow = findRowById(rowId);
  if (gridRow) {
    raiseGridTreeRowStateChanged(gridApi, gridRow, expanded);
  }
}

export function expandAllGridTreeRowsCommand(
  buildRows: (data: readonly GridRecord[]) => GridRow[],
  data: readonly GridRecord[],
  setExpandedTreeRows: SetState<Record<string, boolean>>,
): void {
  setExpandedTreeRows(expandAllGridTreeRows(buildRows(data)));
}

export function collapseAllGridTreeRowsCommand(
  setExpandedTreeRows: SetState<Record<string, boolean>>,
): void {
  setExpandedTreeRows({});
}

export interface BeginGridCellEditCommandAccess {
  setFocusedCell: SetState<GridCellPosition | null>;
  setEditingCell: SetState<GridCellPosition | null>;
  setEditingValue: SetState<string>;
}

export function beginGridCellEditCommand(
  gridApi: UiGridApi,
  access: BeginGridCellEditCommandAccess,
  row: GridRow,
  column: GridColumnDef,
  currentValue: unknown,
  triggerEvent?: Event | KeyboardEvent | null,
  initialValue?: string,
): GridCellPosition | null {
  const nextEditSession = beginGridEditSession(
    row.id,
    column.name,
    initialValue ?? stringifyGridEditorValue(currentValue),
  );

  access.setFocusedCell(nextEditSession.focusedCell);
  access.setEditingCell(nextEditSession.editingCell);
  access.setEditingValue(nextEditSession.editingValue);
  raiseGridBeginCellEdit(gridApi, row.entity, column, triggerEvent);
  return nextEditSession.editingCell;
}

export interface CommitGridCellEditCommandAccess {
  getEditingCell: () => GridCellPosition | null;
  getEditingValue: () => string;
  setEditingCell: SetState<GridCellPosition | null>;
  setEditingValue: SetState<string>;
  findRowById: (rowId: string) => GridRow | null;
  findColumnByName: (columnName: string) => GridColumnDef | undefined;
  parseEditedValue: (column: GridColumnDef, value: string, oldValue: unknown) => unknown;
  setCellValue: (rowEntity: GridRecord, column: GridColumnDef, value: unknown) => void;
}

export interface CommitGridCellEditCommandResult {
  committed: boolean;
  focusTarget?: GridCellPosition;
  row?: GridRow;
  column?: GridColumnDef;
}

export function commitGridCellEditCommand(
  gridApi: UiGridApi,
  access: CommitGridCellEditCommandAccess,
): CommitGridCellEditCommandResult {
  const editingCell = access.getEditingCell();
  if (!editingCell) {
    return { committed: false };
  }

  const row = access.findRowById(editingCell.rowId);
  const column = access.findColumnByName(editingCell.columnName);
  if (!row || !column) {
    access.setEditingCell(null);
    return { committed: false };
  }

  const oldValue = getCellValue(row.entity, column);
  const newValue = access.parseEditedValue(column, access.getEditingValue(), oldValue);
  access.setCellValue(row.entity, column, newValue);

  const clearedEditSession = clearGridEditSession();
  access.setEditingCell(clearedEditSession.editingCell);
  raiseGridAfterCellEdit(gridApi, row.entity, column, newValue, oldValue);
  access.setEditingValue(clearedEditSession.editingValue);

  return {
    committed: true,
    focusTarget: { rowId: row.id, columnName: column.name },
    row,
    column,
  };
}

export interface CancelGridCellEditCommandAccess {
  getEditingCell: () => GridCellPosition | null;
  setEditingCell: SetState<GridCellPosition | null>;
  setEditingValue: SetState<string>;
  findRowById: (rowId: string) => GridRow | null;
  findColumnByName: (columnName: string) => GridColumnDef | undefined;
}

export interface CancelGridCellEditCommandResult {
  focusTarget?: GridCellPosition;
}

export function cancelGridCellEditCommand(
  gridApi: UiGridApi,
  access: CancelGridCellEditCommandAccess,
): CancelGridCellEditCommandResult {
  const editingCell = access.getEditingCell();
  if (!editingCell) {
    return {};
  }

  const row = access.findRowById(editingCell.rowId);
  const column = access.findColumnByName(editingCell.columnName);
  const clearedEditSession = clearGridEditSession();
  access.setEditingCell(clearedEditSession.editingCell);
  access.setEditingValue(clearedEditSession.editingValue);

  if (!row || !column) {
    return {};
  }

  raiseGridCancelCellEdit(gridApi, row.entity, column);
  return { focusTarget: editingCell };
}

export interface MaybeRequestInfiniteScrollCommandAccess {
  enabled: boolean;
  virtualizationEnabled: boolean;
  state: GridInfiniteScrollState;
  startIndex: number;
  visibleRows: number;
  viewportRows: number;
  threshold: number;
  setState: SetState<GridInfiniteScrollState>;
}

export function maybeRequestInfiniteScrollCommand(
  gridApi: UiGridApi,
  access: MaybeRequestInfiniteScrollCommandAccess,
): void {
  if (!access.enabled || !access.virtualizationEnabled) {
    return;
  }

  const { request, nextState } = maybeRequestInfiniteScrollData({
    state: access.state,
    startIndex: access.startIndex,
    visibleRows: access.visibleRows,
    viewportRows: access.viewportRows,
    threshold: access.threshold,
  });

  if (request === 'top' || request === 'bottom') {
    access.setState(nextState);
    raiseGridNeedMoreData(gridApi, request);
  }
}

export function completeGridInfiniteScrollDataLoadCommand(
  currentState: GridInfiniteScrollState,
  setState: SetState<GridInfiniteScrollState>,
  scrollUp: boolean,
  scrollDown: boolean,
): Promise<void> {
  setState(completeInfiniteScrollDataLoad(currentState, scrollUp, scrollDown));
  return Promise.resolve();
}

export function resetGridInfiniteScrollCommand(
  setState: SetState<GridInfiniteScrollState>,
  scrollUp: boolean,
  scrollDown: boolean,
): void {
  setState(resetInfiniteScrollState(scrollUp, scrollDown));
}

export function saveGridInfiniteScrollPercentageCommand(
  currentState: GridInfiniteScrollState,
  visibleRows: number,
  setState: SetState<GridInfiniteScrollState>,
): void {
  setState(saveInfiniteScrollPercentage(currentState, visibleRows));
}

export function setGridInfiniteScrollDirectionsCommand(
  currentState: GridInfiniteScrollState,
  setState: SetState<GridInfiniteScrollState>,
  scrollUp: boolean,
  scrollDown: boolean,
): void {
  setState(setInfiniteScrollDirectionsState(currentState, scrollUp, scrollDown));
}
