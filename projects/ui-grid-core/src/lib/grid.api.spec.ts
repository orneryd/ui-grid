import { vi } from 'vitest';
import { SORT_DIRECTIONS } from './grid.constants';
import { createGridApi } from './grid.api';
import { GridRow } from './grid.models';

describe('createGridApi', () => {
  it('delegates core methods to the provided bindings', async () => {
    const refresh = vi.fn();
    const getVisibleRows = vi.fn(() => [new GridRow('row-1', { id: 1 }, 0)]);
    const setRowInvisible = vi.fn();
    const clearRowInvisible = vi.fn();
    const setFilter = vi.fn();
    const clearAllFilters = vi.fn();
    const sortColumn = vi.fn();
    const moveColumn = vi.fn();
    const toggleGrouping = vi.fn();
    const clearGrouping = vi.fn();
    const benchmark = vi.fn(async () => ({
      iterations: 2,
      totalMs: 6,
      averageMs: 3,
      visibleRows: 1,
      renderedItems: 1
    }));
    const exportCsv = vi.fn();
    const paginationGetPage = vi.fn(() => 2);
    const paginationGetTotalPages = vi.fn(() => 4);
    const paginationGetFirstRowIndex = vi.fn(() => 10);
    const paginationGetLastRowIndex = vi.fn(() => 19);
    const paginationNextPage = vi.fn();
    const paginationPreviousPage = vi.fn();
    const paginationSeek = vi.fn();
    const paginationSetPageSize = vi.fn();
    const toggleRowExpansion = vi.fn();
    const expandAllRows = vi.fn();
    const collapseAllRows = vi.fn();
    const toggleAllRows = vi.fn();
    const treeExpandAllRows = vi.fn();
    const treeCollapseAllRows = vi.fn();
    const treeToggleRow = vi.fn();
    const treeExpandRow = vi.fn();
    const treeCollapseRow = vi.fn();
    const treeGetRowChildren = vi.fn(() => [new GridRow('child-1', { id: 'child-1' }, 1)]);
    const treeGetState = vi.fn(() => ({ 'row-1': true }));
    const treeSetState = vi.fn();
    const infiniteScrollDataLoaded = vi.fn(() => Promise.resolve());
    const infiniteScrollReset = vi.fn();
    const infiniteScrollSaveScrollPercentage = vi.fn();
    const infiniteScrollDataRemovedTop = vi.fn();
    const infiniteScrollDataRemovedBottom = vi.fn();
    const infiniteScrollSetDirections = vi.fn();
    const saveState = vi.fn(() => ({ filters: { status: 'Active' } }));
    const restoreState = vi.fn();

    const api = createGridApi({
      refresh,
      getVisibleRows,
      setRowInvisible,
      clearRowInvisible,
      setFilter,
      clearAllFilters,
      sortColumn,
      moveColumn,
      toggleGrouping,
      clearGrouping,
      benchmark,
      exportCsv,
      paginationGetPage,
      paginationGetTotalPages,
      paginationGetFirstRowIndex,
      paginationGetLastRowIndex,
      paginationNextPage,
      paginationPreviousPage,
      paginationSeek,
      paginationSetPageSize,
      toggleRowExpansion,
      expandAllRows,
      collapseAllRows,
      toggleAllRows,
      treeExpandAllRows,
      treeCollapseAllRows,
      treeToggleRow,
      treeExpandRow,
      treeCollapseRow,
      treeGetRowChildren,
      treeGetState,
      treeSetState,
      infiniteScrollDataLoaded,
      infiniteScrollReset,
      infiniteScrollSaveScrollPercentage,
      infiniteScrollDataRemovedTop,
      infiniteScrollDataRemovedBottom,
      infiniteScrollSetDirections,
      saveState,
      restoreState
    });

    api.core.refresh();
    api.core.queueGridRefresh();
    api.core.queueRefresh();
    api.core.refreshRows();
    expect(refresh).toHaveBeenCalledTimes(4);

    expect(api.core.getVisibleRows()).toHaveLength(1);
    expect(getVisibleRows).toHaveBeenCalledTimes(1);

    api.core.setRowInvisible('row-1', 'manual');
    api.core.clearRowInvisible('row-1', 'manual');
    api.core.setFilter('status', 'Active');
    api.core.clearAllFilters();
    api.core.sortColumn('name', SORT_DIRECTIONS.desc);
    api.core.moveColumn(0, 2);
    api.core.groupByColumn('status');
    api.core.clearGrouping();
    await expect(api.core.benchmark(2)).resolves.toEqual({
      iterations: 2,
      totalMs: 6,
      averageMs: 3,
      visibleRows: 1,
      renderedItems: 1
    });
    api.core.exportCsv();

    expect(setRowInvisible).toHaveBeenCalledWith('row-1', 'manual');
    expect(clearRowInvisible).toHaveBeenCalledWith('row-1', 'manual');
    expect(setFilter).toHaveBeenCalledWith('status', 'Active');
    expect(clearAllFilters).toHaveBeenCalledTimes(1);
    expect(sortColumn).toHaveBeenCalledWith('name', SORT_DIRECTIONS.desc);
    expect(moveColumn).toHaveBeenCalledWith(0, 2);
    expect(toggleGrouping).toHaveBeenCalledWith('status');
    expect(clearGrouping).toHaveBeenCalledTimes(1);
    expect(benchmark).toHaveBeenCalledWith(2);
    expect(exportCsv).toHaveBeenCalledTimes(1);

    expect(api.pagination.getPage()).toBe(2);
    expect(api.pagination.getTotalPages()).toBe(4);
    expect(api.pagination.getFirstRowIndex()).toBe(10);
    expect(api.pagination.getLastRowIndex()).toBe(19);
    api.pagination.nextPage();
    api.pagination.previousPage();
    api.pagination.seek(3);
    api.pagination.setPageSize(25);
    expect(paginationNextPage).toHaveBeenCalledTimes(1);
    expect(paginationPreviousPage).toHaveBeenCalledTimes(1);
    expect(paginationSeek).toHaveBeenCalledWith(3);
    expect(paginationSetPageSize).toHaveBeenCalledWith(25);

    api.expandable.toggleRowExpansion('row-1');
    api.expandable.expandAllRows();
    api.expandable.collapseAllRows();
    api.expandable.toggleAllRows();
    expect(toggleRowExpansion).toHaveBeenCalledWith('row-1');
    expect(expandAllRows).toHaveBeenCalledTimes(1);
    expect(collapseAllRows).toHaveBeenCalledTimes(1);
    expect(toggleAllRows).toHaveBeenCalledTimes(1);

    api.treeBase.expandAllRows();
    api.treeBase.collapseAllRows();
    api.treeBase.toggleRowTreeState('row-1');
    api.treeBase.expandRow('row-1');
    api.treeBase.collapseRow('row-1');
    expect(api.treeBase.getRowChildren('row-1')).toHaveLength(1);
    expect(treeExpandAllRows).toHaveBeenCalledTimes(1);
    expect(treeCollapseAllRows).toHaveBeenCalledTimes(1);
    expect(treeToggleRow).toHaveBeenCalledWith('row-1');
    expect(treeExpandRow).toHaveBeenCalledWith('row-1');
    expect(treeCollapseRow).toHaveBeenCalledWith('row-1');
    expect(treeGetRowChildren).toHaveBeenCalledWith('row-1');
    expect(api.treeView.getTreeView()).toEqual({ 'row-1': true });
    api.treeView.setTreeView({ 'row-2': false });
    expect(treeSetState).toHaveBeenCalledWith({ 'row-2': false });

    api.infiniteScroll.dataLoaded(true, false);
    api.infiniteScroll.resetScroll(false, true);
    api.infiniteScroll.saveScrollPercentage();
    api.infiniteScroll.dataRemovedTop(true, true);
    api.infiniteScroll.dataRemovedBottom(false, false);
    api.infiniteScroll.setScrollDirections(true, false);
    expect(infiniteScrollDataLoaded).toHaveBeenCalledWith(true, false);
    expect(infiniteScrollReset).toHaveBeenCalledWith(false, true);
    expect(infiniteScrollSaveScrollPercentage).toHaveBeenCalledTimes(1);
    expect(infiniteScrollDataRemovedTop).toHaveBeenCalledWith(true, true);
    expect(infiniteScrollDataRemovedBottom).toHaveBeenCalledWith(false, false);
    expect(infiniteScrollSetDirections).toHaveBeenCalledWith(true, false);

    expect(api.saveState.save()).toEqual({ filters: { status: 'Active' } });
    api.saveState.restore({ grouping: ['status'] });
    expect(saveState).toHaveBeenCalledTimes(1);
    expect(restoreState).toHaveBeenCalledWith({ grouping: ['status'] });
  });

  it('raises events and supports unsubscribe semantics', () => {
    const api = createGridApi({
      refresh: vi.fn(),
      getVisibleRows: vi.fn(() => []),
      setRowInvisible: vi.fn(),
      clearRowInvisible: vi.fn(),
      setFilter: vi.fn(),
      clearAllFilters: vi.fn(),
      sortColumn: vi.fn(),
      moveColumn: vi.fn(),
      toggleGrouping: vi.fn(),
      clearGrouping: vi.fn(),
      benchmark: vi.fn(async () => ({
        iterations: 1,
        totalMs: 0,
        averageMs: 0,
        visibleRows: 0,
        renderedItems: 0
      })),
      exportCsv: vi.fn()
    });

    const filterChanged = vi.fn();
    const renderingComplete = vi.fn();
    const rowsVisibleChanged = vi.fn();
    const rowsRendered = vi.fn();
    const scrollBegin = vi.fn();
    const scrollEnd = vi.fn();
    const paginationChanged = vi.fn();
    const rowExpandedStateChanged = vi.fn();
    const treeRowExpanded = vi.fn();
    const treeRowCollapsed = vi.fn();
    const sortChanged = vi.fn();
    const canvasHeightChanged = vi.fn();
    const gridDimensionChanged = vi.fn();
    const groupingChanged = vi.fn();
    const columnOrderChanged = vi.fn();
    const benchmarkComplete = vi.fn();
    const needLoadMoreData = vi.fn();
    const needLoadMoreDataTop = vi.fn();
    const unsubscribeFilter = api.core.on.filterChanged(filterChanged);
    api.core.on.renderingComplete(renderingComplete);
    api.core.on.rowsVisibleChanged(rowsVisibleChanged);
    api.core.on.rowsRendered(rowsRendered);
    api.core.on.scrollBegin(scrollBegin);
    api.core.on.scrollEnd(scrollEnd);
    api.pagination.on.paginationChanged(paginationChanged);
    api.expandable.on.rowExpandedStateChanged(rowExpandedStateChanged);
    api.treeBase.on.rowExpanded(treeRowExpanded);
    api.treeBase.on.rowCollapsed(treeRowCollapsed);
    api.core.on.sortChanged(sortChanged);
    api.core.on.canvasHeightChanged(canvasHeightChanged);
    api.core.on.gridDimensionChanged(gridDimensionChanged);
    api.core.on.groupingChanged(groupingChanged);
    api.core.on.columnOrderChanged(columnOrderChanged);
    api.core.on.benchmarkComplete(benchmarkComplete);
    api.infiniteScroll.on.needLoadMoreData(needLoadMoreData);
    api.infiniteScroll.on.needLoadMoreDataTop(needLoadMoreDataTop);

    const row = new GridRow('row-1', { id: 'row-1' }, 0);

    api.core.raise.renderingComplete(api);
    api.core.raise.filterChanged({ status: 'Pilot' });
    api.core.raise.rowsVisibleChanged([]);
    api.core.raise.rowsRendered([]);
    api.core.raise.scrollBegin();
    api.core.raise.scrollEnd();
    api.pagination.raise.paginationChanged(2, 25);
    api.expandable.raise.rowExpandedStateChanged(row, true);
    api.treeBase.raise.rowExpanded(row);
    api.treeBase.raise.rowCollapsed(row);
    api.core.raise.sortChanged('name', SORT_DIRECTIONS.asc);
    api.core.raise.canvasHeightChanged(10, 50);
    api.core.raise.gridDimensionChanged(10, 20, 30, 40);
    api.core.raise.groupingChanged(['status']);
    api.core.raise.columnOrderChanged(['status', 'name']);
    api.core.raise.benchmarkComplete({
      iterations: 2,
      totalMs: 6,
      averageMs: 3,
      visibleRows: 1,
      renderedItems: 1
    });
    api.infiniteScroll.raise.needLoadMoreData();
    api.infiniteScroll.raise.needLoadMoreDataTop();

    expect(renderingComplete).toHaveBeenCalledWith(api);
    expect(filterChanged).toHaveBeenCalledWith({ status: 'Pilot' });
    expect(rowsVisibleChanged).toHaveBeenCalledWith([]);
    expect(rowsRendered).toHaveBeenCalledWith([]);
    expect(scrollBegin).toHaveBeenCalledTimes(1);
    expect(scrollEnd).toHaveBeenCalledTimes(1);
    expect(paginationChanged).toHaveBeenCalledWith(2, 25);
    expect(rowExpandedStateChanged).toHaveBeenCalledWith(row, true);
    expect(treeRowExpanded).toHaveBeenCalledWith(row);
    expect(treeRowCollapsed).toHaveBeenCalledWith(row);
    expect(sortChanged).toHaveBeenCalledWith('name', SORT_DIRECTIONS.asc);
    expect(canvasHeightChanged).toHaveBeenCalledWith(10, 50);
    expect(gridDimensionChanged).toHaveBeenCalledWith(10, 20, 30, 40);
    expect(groupingChanged).toHaveBeenCalledWith(['status']);
    expect(columnOrderChanged).toHaveBeenCalledWith(['status', 'name']);
    expect(benchmarkComplete).toHaveBeenCalledWith({
      iterations: 2,
      totalMs: 6,
      averageMs: 3,
      visibleRows: 1,
      renderedItems: 1
    });
    expect(needLoadMoreData).toHaveBeenCalledTimes(1);
    expect(needLoadMoreDataTop).toHaveBeenCalledTimes(1);

    unsubscribeFilter();
    api.core.raise.filterChanged({ status: 'Active' });
    expect(filterChanged).toHaveBeenCalledTimes(1);
  });

  it('provides safe default implementations for optional feature namespaces', async () => {
    const api = createGridApi({
      refresh: vi.fn(),
      getVisibleRows: vi.fn(() => []),
      setRowInvisible: vi.fn(),
      clearRowInvisible: vi.fn(),
      setFilter: vi.fn(),
      clearAllFilters: vi.fn(),
      sortColumn: vi.fn(),
      moveColumn: vi.fn(),
      toggleGrouping: vi.fn(),
      clearGrouping: vi.fn(),
      benchmark: vi.fn(async () => ({
        iterations: 1,
        totalMs: 0,
        averageMs: 0,
        visibleRows: 0,
        renderedItems: 0
      })),
      exportCsv: vi.fn()
    });

    expect(api.pagination.getPage()).toBe(1);
    expect(api.pagination.getTotalPages()).toBe(1);
    expect(api.pagination.getFirstRowIndex()).toBe(0);
    expect(api.pagination.getLastRowIndex()).toBe(0);
    expect(() => api.pagination.nextPage()).not.toThrow();
    expect(() => api.pagination.previousPage()).not.toThrow();
    expect(() => api.pagination.seek(3)).not.toThrow();
    expect(() => api.pagination.setPageSize(25)).not.toThrow();

    expect(() => api.expandable.toggleRowExpansion('row-1')).not.toThrow();
    expect(() => api.expandable.expandAllRows()).not.toThrow();
    expect(() => api.expandable.collapseAllRows()).not.toThrow();
    expect(() => api.expandable.toggleAllRows()).not.toThrow();

    expect(() => api.treeBase.expandAllRows()).not.toThrow();
    expect(() => api.treeBase.collapseAllRows()).not.toThrow();
    expect(() => api.treeBase.toggleRowTreeState('row-1')).not.toThrow();
    expect(() => api.treeBase.expandRow('row-1')).not.toThrow();
    expect(() => api.treeBase.collapseRow('row-1')).not.toThrow();
    expect(api.treeBase.getRowChildren('row-1')).toEqual([]);
    expect(api.treeView.getTreeView()).toEqual({});
    expect(() => api.treeView.setTreeView({ row: true })).not.toThrow();

    expect(api.infiniteScroll.dataLoaded()).toBeUndefined();
    expect(() => api.infiniteScroll.resetScroll()).not.toThrow();
    expect(() => api.infiniteScroll.saveScrollPercentage()).not.toThrow();
    expect(() => api.infiniteScroll.dataRemovedTop()).not.toThrow();
    expect(() => api.infiniteScroll.dataRemovedBottom()).not.toThrow();
    expect(() => api.infiniteScroll.setScrollDirections(true, false)).not.toThrow();

    expect(api.saveState.save()).toEqual({});
    expect(() => api.saveState.restore({})).not.toThrow();
  });
});