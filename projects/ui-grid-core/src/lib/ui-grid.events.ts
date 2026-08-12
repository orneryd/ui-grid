import { UiGridApi } from './grid.api';
import { GridBenchmarkResult, GridColumnDef, GridRecord, GridRow, SortState } from './grid.models';
import { PinDirection } from './grid.core';

export function raiseGridRenderingComplete(gridApi: UiGridApi): void {
  gridApi.core.raise.renderingComplete(gridApi);
}

export function raiseGridRowsRendered(gridApi: UiGridApi, rows: GridRow[]): void {
  gridApi.core.raise.rowsRendered(rows);
}

export function raiseGridRowsVisibleChanged(gridApi: UiGridApi, rows: GridRow[]): void {
  gridApi.core.raise.rowsVisibleChanged(rows);
}

export function raiseGridCanvasHeightChanged(gridApi: UiGridApi, oldHeight: number, newHeight: number): void {
  gridApi.core.raise.canvasHeightChanged(oldHeight, newHeight);
}

export function raiseGridDimensionChanged(
  gridApi: UiGridApi,
  oldHeight: number,
  oldWidth: number,
  newHeight: number,
  newWidth: number
): void {
  gridApi.core.raise.gridDimensionChanged(oldHeight, oldWidth, newHeight, newWidth);
}

export function raiseGridScrollBegin(gridApi: UiGridApi): void {
  gridApi.core.raise.scrollBegin();
}

export function raiseGridScrollEnd(gridApi: UiGridApi): void {
  gridApi.core.raise.scrollEnd();
}

export function raiseGridSortChanged(gridApi: UiGridApi, sortState: SortState): void {
  gridApi.core.raise.sortChanged(sortState.columnName, sortState.direction);
}

export function raiseGridFilterChanged(gridApi: UiGridApi, filters: Record<string, string>): void {
  gridApi.core.raise.filterChanged(filters);
}

export function raiseGridGroupingChanged(gridApi: UiGridApi, groupByColumns: string[]): void {
  gridApi.core.raise.groupingChanged(groupByColumns);
}

export function raiseGridColumnOrderChanged(gridApi: UiGridApi, order: string[]): void {
  gridApi.core.raise.columnOrderChanged(order);
}

export function raiseGridBenchmarkComplete(gridApi: UiGridApi, result: GridBenchmarkResult): void {
  gridApi.core.raise.benchmarkComplete(result);
}

export function raiseGridPaginationChanged(gridApi: UiGridApi, currentPage: number, pageSize: number): void {
  gridApi.pagination.raise.paginationChanged(currentPage, pageSize);
}

export function raiseGridExpandableRowStateChanged(gridApi: UiGridApi, row: GridRow, expanded: boolean): void {
  gridApi.expandable.raise.rowExpandedStateChanged(row, expanded);
}

export function raiseGridTreeRowStateChanged(gridApi: UiGridApi, row: GridRow, expanded: boolean): void {
  if (expanded) {
    gridApi.treeBase.raise.rowExpanded(row);
    return;
  }

  gridApi.treeBase.raise.rowCollapsed(row);
}

export function raiseGridNeedMoreData(gridApi: UiGridApi, request: 'top' | 'bottom'): void {
  if (request === 'top') {
    gridApi.infiniteScroll.raise.needLoadMoreDataTop();
    return;
  }

  gridApi.infiniteScroll.raise.needLoadMoreData();
}

export function raiseGridBeginCellEdit(
  gridApi: UiGridApi,
  rowEntity: GridRecord,
  column: GridColumnDef,
  triggerEvent?: Event | KeyboardEvent | null
): void {
  gridApi.edit.raise.beginCellEdit(rowEntity, column, triggerEvent);
}

export function raiseGridAfterCellEdit(
  gridApi: UiGridApi,
  rowEntity: GridRecord,
  column: GridColumnDef,
  newValue: unknown,
  oldValue: unknown
): void {
  gridApi.edit.raise.afterCellEdit(rowEntity, column, newValue, oldValue);
}

export function raiseGridCancelCellEdit(gridApi: UiGridApi, rowEntity: GridRecord, column: GridColumnDef): void {
  gridApi.edit.raise.cancelCellEdit(rowEntity, column);
}

export function raiseGridColumnPinned(gridApi: UiGridApi, columnName: string, direction: PinDirection): void {
  gridApi.pinning.raise.columnPinned(columnName, direction);
}