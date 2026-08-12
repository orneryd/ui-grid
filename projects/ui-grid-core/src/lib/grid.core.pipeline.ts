import { FEATURE_FILTERING, FEATURE_GROUPING, FEATURE_PAGINATION, FEATURE_SORTING, FEATURE_TREE_VIEW } from './grid.features';
import { BuildGridPipelineContext, PipelineResult } from './grid.core.types';
import { GridRow } from './grid.models';
import { isVirtualizationEnabled, paginateGridRows } from './grid.core.pagination';
import { matchesGridRowPreparedFilters, prepareGridColumnFilters } from './grid.core.filtering';
import { buildGridDisplayItems } from './grid.core.grouping';
import { sortGridRows } from './grid.core.sorting';
import { buildGridRows, filterAndFlattenGridTreeRows, isTreeEnabled } from './grid.core.tree';

// Cache built GridRow[] by the tuple of inputs buildGridRows actually reads.
// The benchmark loop and unchanged-data refreshes hit this cache and skip the
// 100K GridRow + 100K Set allocation per pass. When any input identity
// changes (new data array, hidden-reasons edit, expansion toggle, row-size
// change) the cache misses and a fresh set is built.
interface RowsCacheEntry {
  dataRef: unknown;
  optionsRef: unknown;
  hiddenRef: unknown;
  expandedRef: unknown;
  rowSize: number;
  rows: GridRow[];
}
let rowsCache: RowsCacheEntry | null = null;

function buildGridRowsCached(context: BuildGridPipelineContext): GridRow[] {
  const dataRef = context.options.data;
  const optionsRef = context.options;
  const hiddenRef = context.hiddenRowReasons;
  const expandedRef = context.expandedRows;
  const rowSize = context.rowSize;

  if (
    rowsCache &&
    rowsCache.dataRef === dataRef &&
    rowsCache.optionsRef === optionsRef &&
    rowsCache.hiddenRef === hiddenRef &&
    rowsCache.expandedRef === expandedRef &&
    rowsCache.rowSize === rowSize
  ) {
    return rowsCache.rows;
  }

  const rows = buildGridRows(optionsRef, rowSize, hiddenRef, expandedRef);
  rowsCache = { dataRef, optionsRef, hiddenRef, expandedRef, rowSize, rows };
  return rows;
}

export function getCachedGridPipelineRows(context: BuildGridPipelineContext): GridRow[] {
  return buildGridRowsCached(context);
}

export function clearGridPipelineRowsCache(): void {
  rowsCache = null;
}

function resetFilterReasons(rows: readonly GridRow[]): void {
  for (const row of rows) {
    const reasons = row.invisibleReasons;
    if (reasons.size === 0) continue;
    let hadFilter = false;
    for (const reason of reasons) {
      if (reason.startsWith('filter:')) {
        reasons.delete(reason);
        hadFilter = true;
      }
    }
    if (hadFilter && reasons.size === 0) {
      row.visible = true;
    }
  }
}

export function buildGridPipeline(context: BuildGridPipelineContext): PipelineResult {
  const startedAt = (context.now ?? performance.now.bind(performance))();
  const rows = buildGridRowsCached(context);

  let visibleRows: GridRow[];

  if (FEATURE_TREE_VIEW && isTreeEnabled(context.options)) {
    visibleRows = filterAndFlattenGridTreeRows(
      rows,
      context.columns,
      context.options,
      context.activeFilters,
      context.expandedTreeRows,
      context.sortState
    );
  } else {
    let filtered: GridRow[];
    if (!FEATURE_FILTERING || context.options.enableFiltering === false) {
      // Rows are cached across pipeline passes, so clear any stale
      // `filter:*` reasons before using persisted `row.visible` state when
      // filtering is disabled or unavailable.
      resetFilterReasons(rows);
      filtered = rows.filter((row) => row.visible);
    } else {
      // Prepare filter specs once per column — the per-row loop then never
      // compiles regex / allocates filter config. When no filters are active
      // (common idle state), skip the whole per-row filter invocation.
      const prepared = prepareGridColumnFilters(context.columns, context.activeFilters);
      // Clear any stale `filter:*` reasons left over from a previous pipeline
      // pass (rows are cached by identity, so their invisibleReasons persist
      // across invocations). Doing this once up-front keeps
      // matchesGridRowPreparedFilters allocation-free in the hot loop.
      resetFilterReasons(rows);
      if (prepared.length === 0) {
        filtered = rows.filter((row) => row.visible);
      } else {
        filtered = rows.filter((row) => row.visible && matchesGridRowPreparedFilters(row, prepared));
      }
    }

    visibleRows = FEATURE_SORTING
      ? sortGridRows(filtered, context.columns, context.options, context.sortState)
      : filtered;
  }

  const totalItems = context.options.useExternalPagination === true
    ? context.options.totalItems ?? visibleRows.length
    : visibleRows.length;

  const pagedRows = FEATURE_PAGINATION
    ? paginateGridRows(visibleRows, context.options, context.currentPage, context.pageSize, totalItems)
    : visibleRows;

  const displayItems = FEATURE_GROUPING
    ? buildGridDisplayItems(pagedRows, context.columns, context.options, context.groupByColumns, context.collapsedGroups)
    : buildGridDisplayItems(pagedRows, context.columns, context.options, [], context.collapsedGroups);

  const virtualizationEnabled = isVirtualizationEnabled(context.options, displayItems.length);

  return {
    visibleRows: pagedRows,
    displayItems,
    virtualizationEnabled,
    pipelineMs: ((context.now ?? performance.now.bind(performance))() - startedAt),
    totalItems
  };
}
