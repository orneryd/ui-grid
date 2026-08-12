import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildGridTemplateColumns,
  computeViewportHeightPx,
  computeViewportRows,
  formatPaginationSummary,
  orderVisibleColumns,
  resolveBenchmarkIterations,
} from './gridStateMath';
import {
  createGridApi,
  UiGridApi,
  GridApiBindings,
  GridOptions,
  GridColumnDef,
  GridRow,
  GridRecord,
  GridBenchmarkResult,
  GridCellPosition,
  GridLabels,
  SortState,
  GridSavedState,
  GridCellEditableContext,
  getCellValue,
  setPathValue,
  SORT_DIRECTIONS,
  defaultGridEngine,
  resolveGridLabels,
  gridColumnWidth,
  headerLabel as coreHeaderLabel,
  gridSortButtonLabel,
  gridSortAriaSort,
  gridGroupingButtonLabel,
  gridFilterPlaceholder,
  gridGroupDisclosureLabel,
  gridEditorInputType,
  gridCellIndent,
  gridTreeToggleLabelForRow,
  gridExpandToggleLabelForRow,
  isGridTreeRowExpanded,
  isGridColumnSortable,
  isGridColumnFilterable,
  isGridColumnGrouped,
  isGridGroupingEnabled,
  isGridTreeEnabled,
  isGridPaginationEnabled,
  isGridSortingEnabled,
  isGridFilteringEnabled,
  canGridMoveColumns,
  isGridPrimaryColumn,
  shouldShowGridTreeToggle,
  shouldShowGridExpandToggle,
  shouldShowGridPaginationControls,
  buildGridCellContext,
  formatGridCellDisplayValue,
  buildGridFocusCellResult,
  findNextGridCell,
  isPrintableGridKey,
  isGridNavigationKey,
  isGridCellPosition,
  exportCsvRows,
  buildGridRows,
  resolveGridRowId as coreResolveGridRowId,
  findGridRowById as coreFindGridRowById,
  getEffectivePageSize as coreGetEffectivePageSize,
  getCurrentPageValue as coreGetCurrentPageValue,
  getTotalPagesValue as coreGetTotalPagesValue,
  getFirstRowIndexValue as coreGetFirstRowIndexValue,
  getLastRowIndexValue as coreGetLastRowIndexValue,
  isVirtualizationEnabled as coreIsVirtualizationEnabled,
  buildGridSavedState,
  sanitizeDownloadFilename,
  parseGridEditedValue,
  stringifyGridEditorValue,
  canGridExpandRows,
  areAllGridRowsExpanded,
  addGridRowInvisibleReason,
  clearGridRowInvisibleReason,
  FEATURE_SORTING,
  FEATURE_FILTERING,
  FEATURE_GROUPING,
  FEATURE_PAGINATION,
  FEATURE_CELL_EDIT,
  FEATURE_EXPANDABLE,
  FEATURE_TREE_VIEW,
  FEATURE_INFINITE_SCROLL,
  FEATURE_COLUMN_MOVING,
  FEATURE_CSV_EXPORT,
  FEATURE_AUTO_RESIZE,
  FEATURE_SAVE_STATE,
  FEATURE_PINNING,
  buildInitialPinnedState,
  computePinnedOffset,
  isColumnPinnable,
  isPinningEnabled,
  applyGridSortStateCommand,
  updateGridFilterCommand,
  clearGridFiltersCommand,
  clearGridGroupingCommand,
  moveGridColumnCommand,
  moveGridVisibleColumnCommand,
  seekGridPaginationCommand,
  setGridPaginationPageSizeCommand,
  sortGridColumnCommand,
  toggleGridRowExpansionCommand,
  expandAllGridRowsCommand,
  collapseAllGridRowsCommand,
  toggleGridTreeRowCommand,
  setGridTreeRowExpandedCommand,
  expandAllGridTreeRowsCommand,
  collapseAllGridTreeRowsCommand,
  beginGridCellEditCommand,
  commitGridCellEditCommand,
  cancelGridCellEditCommand,
  maybeRequestInfiniteScrollCommand,
  completeGridInfiniteScrollDataLoadCommand,
  resetGridInfiniteScrollCommand,
  saveGridInfiniteScrollPercentageCommand,
  setGridInfiniteScrollDirectionsCommand,
  restoreGridStateCommand,
  pinGridColumnCommand,
  raiseGridRenderingComplete,
  raiseGridRowsRendered,
  raiseGridRowsVisibleChanged,
  raiseGridCanvasHeightChanged,
  raiseGridDimensionChanged,
  raiseGridScrollBegin,
  raiseGridScrollEnd,
  raiseGridBenchmarkComplete,
  downloadGridCsvFile,
  observeGridHostSize,
} from '@ornery/ui-grid-core';
import type {
  DisplayItem,
  GroupItem,
  ExpandableItem,
  RowItem,
  PipelineResult,
  GridInfiniteScrollState,
  GridMoveDirection,
  GridCellTemplateContext,
  GridExpandableTemplateContext,
  PinDirection,
  PinnedColumnState,
} from '@ornery/ui-grid-core';

function escapeCssSelectorValue(value: string): string {
  const nativeEscape = globalThis.CSS?.escape;
  if (typeof nativeEscape === 'function') {
    return nativeEscape(value);
  }

  let output = '';
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);
    const character = value.charAt(index);

    if (codePoint === 0x0000) {
      output += '\uFFFD';
      continue;
    }

    const isControlCharacter = (codePoint >= 0x0001 && codePoint <= 0x001f) || codePoint === 0x007f;
    const startsWithDigit = index === 0 && codePoint >= 0x0030 && codePoint <= 0x0039;
    const secondCharDigitAfterHyphen =
      index === 1 && codePoint >= 0x0030 && codePoint <= 0x0039 && value.charCodeAt(0) === 0x002d;

    if (isControlCharacter || startsWithDigit || secondCharDigitAfterHyphen) {
      output += `\\${codePoint.toString(16)} `;
      continue;
    }

    if (index === 0 && value.length === 1 && codePoint === 0x002d) {
      output += `\\${character}`;
      continue;
    }

    const isSafeCharacter =
      codePoint >= 0x0080 ||
      codePoint === 0x002d ||
      codePoint === 0x005f ||
      (codePoint >= 0x0030 && codePoint <= 0x0039) ||
      (codePoint >= 0x0041 && codePoint <= 0x005a) ||
      (codePoint >= 0x0061 && codePoint <= 0x007a);

    output += isSafeCharacter ? character : `\\${character}`;
  }

  return output;
}

export interface UseGridStateResult {
  pipeline: PipelineResult;
  visibleColumns: GridColumnDef[];
  labels: GridLabels;
  gridTemplateColumns: string;
  gridApi: UiGridApi;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;

  // State
  activeFilters: Record<string, string>;
  groupByColumns: string[];
  collapsedGroups: Record<string, boolean>;
  sortState: SortState;
  focusedCell: GridCellPosition | null;
  editingCell: GridCellPosition | null;
  editingValue: string;
  expandedRows: Record<string, boolean>;
  expandedTreeRows: Record<string, boolean>;
  currentPage: number;
  pageSize: number;
  benchmarkResult: GridBenchmarkResult | null;
  infiniteScrollState: GridInfiniteScrollState;

  // Computed
  totalRows: number;
  visibleRowCount: number;
  displayItems: DisplayItem[];
  virtualizationEnabled: boolean;
  pipelineMs: number;
  paginationCurrentPage: number;
  paginationTotalPages: number;
  paginationSelectedPageSize: number;
  rowSize: number;
  viewportHeightPx: string;
  autoViewportHeight: number | null;

  // Display helpers
  headerLabel: (column: GridColumnDef) => string;
  isGroupItem: (item: DisplayItem) => item is GroupItem;
  isExpandableItem: (item: DisplayItem) => item is ExpandableItem;
  isRowItem: (item: DisplayItem) => item is RowItem;
  isOddStripedRow: (item: DisplayItem) => boolean;
  sortButtonLabel: (column: GridColumnDef) => string;
  sortAriaSort: (column: GridColumnDef) => string;
  sortDirection: (column: GridColumnDef) => string;
  groupingButtonLabel: (column: GridColumnDef) => string;
  filterValue: (columnName: string) => string;
  filterPlaceholder: (column: GridColumnDef) => string;
  isFilterInputDisabled: (column: GridColumnDef) => boolean;
  groupDisclosureLabel: (item: GroupItem) => string;
  displayValue: (row: GridRow, column: GridColumnDef) => string;
  isFocusedCell: (row: GridRow, column: GridColumnDef) => boolean;
  isFocusedRow: (row: GridRow) => boolean;
  isEditingCell: (row: GridRow, column: GridColumnDef) => boolean;
  editorInputType: (column: GridColumnDef) => string;
  cellContext: (row: GridRow, column: GridColumnDef) => GridCellTemplateContext;
  expandedContext: (row: GridRow) => GridExpandableTemplateContext & Record<string, unknown>;
  columnWidth: (column: GridColumnDef) => string;
  isColumnSortable: (column: GridColumnDef) => boolean;
  isColumnFilterable: (column: GridColumnDef) => boolean;
  cellIndent: (row: GridRow, column: GridColumnDef) => string;
  treeToggleLabel: (row: GridRow) => string;
  isTreeRowExpanded: (row: GridRow) => boolean;
  expandToggleLabel: (row: GridRow) => string;
  isGrouped: (column: GridColumnDef) => boolean;
  showTreeToggle: (row: GridRow, column: GridColumnDef) => boolean;
  showExpandToggle: (row: GridRow, column: GridColumnDef) => boolean;
  showPaginationControls: () => boolean;
  paginationSummary: () => string;
  pageSizeOptions: () => number[];
  isCellEditable: (
    row: GridRow,
    column: GridColumnDef,
    triggerEvent?: Event | KeyboardEvent | null,
  ) => boolean;
  shouldEditOnFocus: (column: GridColumnDef) => boolean;

  // Pinning
  isPinned: (column: GridColumnDef) => boolean;
  pinnedOffset: (column: GridColumnDef) => { side: 'left' | 'right'; offset: string } | null;
  isPinningEnabled: () => boolean;
  isColumnPinnable: (column: GridColumnDef) => boolean;
  togglePin: (column: GridColumnDef) => void;
  pinningFeature: boolean;

  // Feature flags
  sortingFeature: boolean;
  filteringFeature: boolean;
  groupingFeature: boolean;
  paginationFeature: boolean;
  cellEditFeature: boolean;
  expandableFeature: boolean;
  treeViewFeature: boolean;
  infiniteScrollFeature: boolean;
  columnMovingFeature: boolean;
  csvExportFeature: boolean;

  // Feature check helpers
  isGroupingEnabled: () => boolean;
  isFilteringEnabled: () => boolean;

  // Actions
  toggleSort: (column: GridColumnDef) => void;
  updateFilter: (columnName: string, value: string) => void;
  clearAllFilters: () => void;
  toggleGrouping: (column: GridColumnDef, event?: React.MouseEvent) => void;
  toggleGroup: (item: GroupItem) => void;
  focusCell: (
    row: GridRow,
    column: GridColumnDef,
    triggerEvent?: Event | KeyboardEvent | null,
  ) => void;
  handleCellKeyDown: (row: GridRow, column: GridColumnDef, event: React.KeyboardEvent) => void;
  handleCellDoubleClick: (row: GridRow, column: GridColumnDef, event: React.MouseEvent) => void;
  updateEditingValue: (value: string) => void;
  handleEditorKeyDown: (event: React.KeyboardEvent) => void;
  handleEditorBlur: (event: React.FocusEvent) => void;
  toggleRowExpansion: (row: GridRow, event?: React.MouseEvent) => void;
  toggleTreeRow: (row: GridRow, event?: React.MouseEvent) => void;
  moveColumn: (fromIndex: number, toIndex: number) => void;
  moveVisibleColumn: (columnName: string, targetColumnName: string) => void;
  canResizeColumns: () => boolean;
  handleHeaderResizeMouseDown: (column: GridColumnDef, event: React.MouseEvent) => void;
  autoSizeColumn: (column: GridColumnDef, event: React.MouseEvent) => void;
  nextPage: () => void;
  previousPage: () => void;
  onPageSizeChange: (value: string) => void;
  runBenchmark: (iterations?: number) => Promise<GridBenchmarkResult>;
  exportCsv: () => void;
  onViewportScroll: (startIndex: number) => void;
}

export function useGridState(
  options: GridOptions,
  onRegisterApi?: (api: UiGridApi) => void,
): UseGridStateResult {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [groupByColumns, setGroupByColumns] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [hiddenRowReasons, setHiddenRowReasons] = useState<Record<string, string[]>>({});
  const [sortState, setSortState] = useState<SortState>({
    columnName: null,
    direction: SORT_DIRECTIONS.none,
  });
  const [focusedCell, setFocusedCell] = useState<GridCellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<GridCellPosition | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [expandedTreeRows, setExpandedTreeRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(0);
  const [benchmarkResult, setBenchmarkResult] = useState<GridBenchmarkResult | null>(null);
  const [infiniteScrollState, setInfiniteScrollState] = useState<GridInfiniteScrollState>({
    scrollUp: false,
    scrollDown: true,
    dataLoading: false,
    previousVisibleRows: 0,
  });
  const [autoViewportHeight, setAutoViewportHeight] = useState<number | null>(null);
  const [pinnedColumns, setPinnedColumns] = useState<PinnedColumnState>({});
  const [columnWidthOverrides, setColumnWidthOverrides] = useState<Record<string, string>>({});

  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const initializedGridIdRef = useRef<string | null>(null);
  const lastCanvasHeightRef = useRef(0);
  const lastGridHeightRef = useRef(0);
  const lastGridWidthRef = useRef(0);
  const scrollEndHandleRef = useRef<number | undefined>(undefined);
  const scrollingRef = useRef(false);
  const editorFocusTokenRef = useRef(0);
  const renderedCellFocusTokenRef = useRef(0);

  // Refs for current state (used inside gridApi bindings which are created once)
  const activeFiltersRef = useRef(activeFilters);
  activeFiltersRef.current = activeFilters;
  const groupByColumnsRef = useRef(groupByColumns);
  groupByColumnsRef.current = groupByColumns;
  const collapsedGroupsRef = useRef(collapsedGroups);
  collapsedGroupsRef.current = collapsedGroups;
  const columnOrderRef = useRef(columnOrder);
  columnOrderRef.current = columnOrder;
  const hiddenRowReasonsRef = useRef(hiddenRowReasons);
  hiddenRowReasonsRef.current = hiddenRowReasons;
  const sortStateRef = useRef(sortState);
  sortStateRef.current = sortState;
  const focusedCellRef = useRef(focusedCell);
  focusedCellRef.current = focusedCell;
  const editingCellRef = useRef(editingCell);
  editingCellRef.current = editingCell;
  const editingValueRef = useRef(editingValue);
  editingValueRef.current = editingValue;
  const expandedRowsRef = useRef(expandedRows);
  expandedRowsRef.current = expandedRows;
  const expandedTreeRowsRef = useRef(expandedTreeRows);
  expandedTreeRowsRef.current = expandedTreeRows;
  const pinnedColumnsRef = useRef(pinnedColumns);
  pinnedColumnsRef.current = pinnedColumns;
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;

  const setEditingCellState = useCallback((nextEditingCell: GridCellPosition | null): void => {
    editingCellRef.current = nextEditingCell;
    setEditingCell(nextEditingCell);
  }, []);

  const setEditingValueState = useCallback((nextEditingValue: string): void => {
    editingValueRef.current = nextEditingValue;
    setEditingValue(nextEditingValue);
  }, []);
  const infiniteScrollStateRef = useRef(infiniteScrollState);
  infiniteScrollStateRef.current = infiniteScrollState;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const rowSize = options.rowHeight ?? 44;

  const visibleColumns = useMemo(() => {
    const orderedColumns = orderVisibleColumns(options.columnDefs, columnOrder);
    const applyWidthOverrides = (columns: GridColumnDef[]): GridColumnDef[] =>
      columns.map((col) => {
        const override = columnWidthOverrides[col.name];
        return override == null ? col : { ...col, width: override };
      });

    const pinnedEntries = Object.entries(pinnedColumns);
    if (pinnedEntries.length === 0) {
      return applyWidthOverrides(orderedColumns);
    }

    const columnByName = new Map(orderedColumns.map((column) => [column.name, column]));
    const pinnedLeft = pinnedEntries
      .filter(([, direction]) => direction === 'left')
      .map(([columnName]) => columnByName.get(columnName))
      .filter((column): column is GridColumnDef => column !== undefined);
    const pinnedRight = pinnedEntries
      .filter(([, direction]) => direction === 'right')
      .map(([columnName]) => columnByName.get(columnName))
      .filter((column): column is GridColumnDef => column !== undefined);
    const centerColumns = orderedColumns.filter(
      (column) => pinnedColumns[column.name] === undefined,
    );

    return applyWidthOverrides([...pinnedLeft, ...centerColumns, ...pinnedRight]);
  }, [options.columnDefs, columnOrder, pinnedColumns, columnWidthOverrides]);

  const visibleColumnsRef = useRef(visibleColumns);
  visibleColumnsRef.current = visibleColumns;

  const pipeline = useMemo<PipelineResult>(() => {
    return defaultGridEngine.buildPipeline({
      options,
      columns: visibleColumns,
      activeFilters,
      sortState,
      groupByColumns,
      collapsedGroups,
      hiddenRowReasons,
      expandedRows,
      expandedTreeRows,
      currentPage,
      pageSize,
      rowSize,
    });
  }, [
    options,
    visibleColumns,
    activeFilters,
    sortState,
    groupByColumns,
    collapsedGroups,
    hiddenRowReasons,
    expandedRows,
    expandedTreeRows,
    currentPage,
    pageSize,
    rowSize,
  ]);

  const pipelineRef = useRef(pipeline);
  pipelineRef.current = pipeline;

  const labels = useMemo(() => resolveGridLabels(options.labels), [options.labels]);

  const gridTemplateColumns = useMemo(
    () => buildGridTemplateColumns(visibleColumns),
    [visibleColumns],
  );

  const isPinningEnabledFn = useCallback((): boolean => {
    return isPinningEnabled(optionsRef.current);
  }, []);

  const isColumnPinnableFn = useCallback((column: GridColumnDef): boolean => {
    return isColumnPinnable(optionsRef.current, column);
  }, []);

  const isPinnedFn = useCallback((column: GridColumnDef): boolean => {
    return pinnedColumnsRef.current[column.name] !== undefined;
  }, []);

  const pinnedOffsetFn = useCallback((column: GridColumnDef) => {
    return computePinnedOffset(visibleColumnsRef.current, pinnedColumnsRef.current, column);
  }, []);

  // --- Helper functions (all pure, no state closures needed beyond refs) ---

  const resolveRowId = useCallback((row: GridRow | GridRecord | string): string => {
    return coreResolveGridRowId(optionsRef.current, row);
  }, []);

  const buildRowsFromData = useCallback((data: readonly GridRecord[]): GridRow[] => {
    return buildGridRows(
      { ...optionsRef.current, data },
      optionsRef.current.rowHeight ?? 44,
      hiddenRowReasonsRef.current,
      expandedRowsRef.current,
    );
  }, []);

  const findRowById = useCallback(
    (rowId: string): GridRow | null => {
      return coreFindGridRowById(buildRowsFromData(optionsRef.current.data), rowId);
    },
    [buildRowsFromData],
  );

  const canExpandRowsFn = useCallback((): boolean => {
    return FEATURE_EXPANDABLE && canGridExpandRows(optionsRef.current);
  }, []);

  const effectivePageSizeFn = useCallback((totalItems: number): number => {
    return coreGetEffectivePageSize(optionsRef.current, pageSizeRef.current, totalItems);
  }, []);

  const getCurrentPageValueFn = useCallback((totalItems?: number): number => {
    const ti = totalItems ?? pipelineRef.current.totalItems;
    return coreGetCurrentPageValue(
      optionsRef.current,
      currentPageRef.current,
      ti,
      pageSizeRef.current,
    );
  }, []);

  const getTotalPagesValueFn = useCallback((totalItems?: number): number => {
    const ti = totalItems ?? pipelineRef.current.totalItems;
    return coreGetTotalPagesValue(optionsRef.current, ti, pageSizeRef.current);
  }, []);

  const getFirstRowIndexValueFn = useCallback((totalItems?: number): number => {
    const ti = totalItems ?? pipelineRef.current.totalItems;
    return coreGetFirstRowIndexValue(
      optionsRef.current,
      currentPageRef.current,
      ti,
      pageSizeRef.current,
    );
  }, []);

  const getLastRowIndexValueFn = useCallback((totalItems?: number): number => {
    const ti = totalItems ?? pipelineRef.current.totalItems;
    return coreGetLastRowIndexValue(
      optionsRef.current,
      currentPageRef.current,
      ti,
      pageSizeRef.current,
    );
  }, []);

  const isCellEditable = useCallback(
    (row: GridRow, column: GridColumnDef, triggerEvent?: Event | KeyboardEvent | null): boolean => {
      if (!FEATURE_CELL_EDIT) return false;
      const editable = column.enableCellEdit ?? optionsRef.current.enableCellEdit ?? false;
      if (!editable) return false;

      const condition =
        column.cellEditableCondition ?? optionsRef.current.cellEditableCondition ?? true;
      if (typeof condition === 'boolean') return condition;

      const context: GridCellEditableContext = {
        row: row.entity,
        column,
        rowIndex: row.index,
        triggerEvent,
      };
      return condition(context);
    },
    [],
  );

  const shouldEditOnFocusFn = useCallback((column: GridColumnDef): boolean => {
    return column.enableCellEditOnFocus ?? optionsRef.current.enableCellEditOnFocus ?? false;
  }, []);

  // --- Focus helpers ---

  const focusRenderedCell = useCallback((position: GridCellPosition): void => {
    const focusToken = ++renderedCellFocusTokenRef.current;
    const selector = `.body-cell[data-row-id="${escapeCssSelectorValue(position.rowId)}"][data-col-name="${escapeCssSelectorValue(position.columnName)}"]`;

    const doFocus = (retry = true): void => {
      if (focusToken !== renderedCellFocusTokenRef.current) return;
      const container = gridContainerRef.current;
      if (!container) return;
      const target = container.querySelector(selector) as HTMLElement | null;
      if (!target) {
        if (retry) requestAnimationFrame(() => doFocus(false));
        return;
      }
      target.focus({ preventScroll: true });
      if (retry && container.ownerDocument.activeElement !== target) {
        requestAnimationFrame(() => doFocus(false));
      }
    };

    // Attempt synchronous focus first to avoid the browser scrolling the viewport
    // (e.g. when ArrowDown is pressed) before async focus runs.
    doFocus(true);
    queueMicrotask(() => doFocus(true));
  }, []);

  const focusEditorInput = useCallback((focusToken: number): void => {
    if (focusToken !== editorFocusTokenRef.current) return;
    const ec = editingCellRef.current;
    if (!ec) return;

    const selector = `.cell-editor[data-row-id="${escapeCssSelectorValue(ec.rowId)}"][data-col-name="${escapeCssSelectorValue(ec.columnName)}"]`;

    const doFocus = (retry = true): void => {
      if (focusToken !== editorFocusTokenRef.current) return;
      const currentEc = editingCellRef.current;
      if (!currentEc || currentEc.rowId !== ec.rowId || currentEc.columnName !== ec.columnName)
        return;

      const container = gridContainerRef.current;
      if (!container) return;
      const input = container.querySelector(selector) as HTMLInputElement | null;
      if (!input) {
        if (retry) requestAnimationFrame(() => doFocus(false));
        return;
      }
      input.focus();
      input.select();
    };

    doFocus(true);
  }, []);

  // --- Create grid API once ---

  const gridApiRef = useRef<UiGridApi | null>(null);
  if (!gridApiRef.current) {
    const bindings: GridApiBindings = {
      refresh: () => setActiveFilters((current) => ({ ...current })),
      getVisibleRows: () => pipelineRef.current.visibleRows,
      setRowInvisible: (row, reason = 'user') => {
        const rowId = coreResolveGridRowId(optionsRef.current, row);
        setHiddenRowReasons((current) => addGridRowInvisibleReason(current, rowId, reason));
      },
      clearRowInvisible: (row, reason = 'user') => {
        const rowId = coreResolveGridRowId(optionsRef.current, row);
        setHiddenRowReasons((current) => clearGridRowInvisibleReason(current, rowId, reason));
      },
      setFilter: (columnName, value) => {
        setActiveFilters((current) => {
          const next = { ...current, [columnName]: value };
          activeFiltersRef.current = next;
          queueMicrotask(() => gridApiRef.current!.core.raise.filterChanged(next));
          return next;
        });
      },
      clearAllFilters: () => {
        const nextFilters: Record<string, string> = {};
        activeFiltersRef.current = nextFilters;
        setActiveFilters(nextFilters);
        queueMicrotask(() => gridApiRef.current!.core.raise.filterChanged(nextFilters));
      },
      sortColumn: (columnName, direction) => {
        sortGridColumnCommand(gridApiRef.current!, (s) => setSortState(s), columnName, direction);
      },
      moveColumn: (fromIndex, toIndex) => {
        moveGridColumnCommand(
          gridApiRef.current!,
          FEATURE_COLUMN_MOVING && optionsRef.current.enableColumnMoving === true,
          (updater) => setColumnOrder((current) => updater(current)),
          fromIndex,
          toIndex,
        );
      },
      toggleGrouping: (columnName) => {
        if (!(FEATURE_GROUPING && isGridGroupingEnabled(optionsRef.current))) return;
        const current = groupByColumnsRef.current;
        const next = current.includes(columnName)
          ? current.filter((n) => n !== columnName)
          : [...current, columnName];
        groupByColumnsRef.current = next;
        setGroupByColumns(next);
        gridApiRef.current!.core.raise.groupingChanged(next);
      },
      clearGrouping: () => {
        clearGridGroupingCommand(
          gridApiRef.current!,
          (grouping) => setGroupByColumns(grouping),
          false,
        );
      },
      benchmark: (iterations) => {
        return runBenchmarkFn(iterations);
      },
      exportCsv: () => {
        exportCsvFn();
      },
      paginationGetPage: () => getCurrentPageValueFn(),
      paginationGetTotalPages: () => getTotalPagesValueFn(),
      paginationGetFirstRowIndex: () => getFirstRowIndexValueFn(),
      paginationGetLastRowIndex: () => getLastRowIndexValueFn(),
      paginationNextPage: () => seekPageFn(getCurrentPageValueFn() + 1),
      paginationPreviousPage: () => seekPageFn(getCurrentPageValueFn() - 1),
      paginationSeek: (page) => seekPageFn(page),
      paginationSetPageSize: (ps) => setPaginationPageSizeFn(ps),
      toggleRowExpansion: (row) => toggleRowExpansionByRefFn(row),
      expandAllRows: () => expandAllRowsFn(),
      collapseAllRows: () => {
        collapseAllGridRowsCommand((e) => setExpandedRows(e));
      },
      toggleAllRows: () => toggleAllRowsFn(),
      treeExpandAllRows: () => {
        expandAllGridTreeRowsCommand(
          (data) => buildRowsFromData(data),
          optionsRef.current.data,
          (e) => setExpandedTreeRows(e),
        );
      },
      treeCollapseAllRows: () => {
        collapseAllGridTreeRowsCommand((e) => setExpandedTreeRows(e));
      },
      treeToggleRow: (row) => toggleTreeRowByRefFn(row),
      treeExpandRow: (row) => expandTreeRowByRefFn(row),
      treeCollapseRow: (row) => collapseTreeRowByRefFn(row),
      treeGetRowChildren: (row) => {
        const rowId = coreResolveGridRowId(optionsRef.current, row);
        return buildRowsFromData(optionsRef.current.data).filter((r) => r.parentId === rowId);
      },
      treeGetState: () => expandedTreeRowsRef.current,
      treeSetState: (state) => setExpandedTreeRows({ ...state }),
      infiniteScrollDataLoaded: (scrollUp, scrollDown) => {
        return completeGridInfiniteScrollDataLoadCommand(
          infiniteScrollStateRef.current,
          (s) => setInfiniteScrollState(s),
          scrollUp ?? infiniteScrollStateRef.current.scrollUp,
          scrollDown ?? infiniteScrollStateRef.current.scrollDown,
        );
      },
      infiniteScrollReset: (scrollUp, scrollDown) => {
        resetGridInfiniteScrollCommand(
          (s) => setInfiniteScrollState(s),
          scrollUp ?? infiniteScrollStateRef.current.scrollUp,
          scrollDown ?? infiniteScrollStateRef.current.scrollDown,
        );
      },
      infiniteScrollSaveScrollPercentage: () => {
        saveGridInfiniteScrollPercentageCommand(
          infiniteScrollStateRef.current,
          pipelineRef.current.visibleRows.length,
          (s) => setInfiniteScrollState(s),
        );
      },
      infiniteScrollDataRemovedTop: (scrollUp, scrollDown) => {
        resetGridInfiniteScrollCommand(
          (s) => setInfiniteScrollState(s),
          scrollUp ?? infiniteScrollStateRef.current.scrollUp,
          scrollDown ?? infiniteScrollStateRef.current.scrollDown,
        );
      },
      infiniteScrollDataRemovedBottom: (scrollUp, scrollDown) => {
        resetGridInfiniteScrollCommand(
          (s) => setInfiniteScrollState(s),
          scrollUp ?? infiniteScrollStateRef.current.scrollUp,
          scrollDown ?? infiniteScrollStateRef.current.scrollDown,
        );
      },
      infiniteScrollSetDirections: (scrollUp, scrollDown) => {
        setGridInfiniteScrollDirectionsCommand(
          infiniteScrollStateRef.current,
          (s) => setInfiniteScrollState(s),
          scrollUp,
          scrollDown,
        );
      },
      saveState: () => {
        return buildGridSavedState({
          columnOrder: columnOrderRef.current,
          activeFilters: activeFiltersRef.current,
          sortState: sortStateRef.current,
          groupByColumns: groupByColumnsRef.current,
          currentPage: currentPageRef.current,
          pageSize: pageSizeRef.current,
          totalItems: pipelineRef.current.totalItems,
          expandedRows: expandedRowsRef.current,
          expandedTreeRows: expandedTreeRowsRef.current,
          pinnedColumns: pinnedColumnsRef.current,
        });
      },
      restoreState: (state) => {
        restoreGridStateCommand(gridApiRef.current!, state, {
          setColumnOrder: (order) => setColumnOrder(order),
          setActiveFilters: (filters) => setActiveFilters(filters),
          setSortState: (s) => setSortState(s),
          setGroupByColumns: (grouping) => setGroupByColumns(grouping),
          setCurrentPage: (page) => setCurrentPage(page),
          setPageSize: (ps) => setPageSize(ps),
          setExpandedRows: (e) => setExpandedRows(e),
          setExpandedTreeRows: (e) => setExpandedTreeRows(e),
          setPinnedColumns: (p) => setPinnedColumns(p),
          getEffectivePageSize: () => effectivePageSizeFn(pipelineRef.current.totalItems),
        });
      },
      beginCellEdit: (row, columnName, triggerEvent) => {
        const rowId = coreResolveGridRowId(optionsRef.current, row);
        const gridRow = coreFindGridRowById(buildRowsFromData(optionsRef.current.data), rowId);
        const column = visibleColumnsRef.current.find((c) => c.name === columnName);
        if (!gridRow || !column || !isCellEditable(gridRow, column, triggerEvent)) return;
        startCellEditFn(gridRow, column, triggerEvent);
      },
      endCellEdit: () => commitCellEditFn(),
      cancelCellEdit: () => cancelCellEditFn(),
      getEditingCell: () => editingCellRef.current,
      pinColumn: (columnName: string, direction: PinDirection) => {
        pinGridColumnCommand(
          gridApiRef.current!,
          isPinningEnabledFn(),
          (v) => setPinnedColumns(v),
          () => pinnedColumnsRef.current,
          columnName,
          direction,
        );
      },
    };

    gridApiRef.current = createGridApi(bindings);
  }

  const gridApi = gridApiRef.current!;

  // --- Memoized action functions ---

  const seekPageFn = useCallback(
    (page: number): void => {
      seekGridPaginationCommand(
        gridApiRef.current!,
        (nextPage) => setCurrentPage(nextPage),
        () => getTotalPagesValueFn(),
        () => effectivePageSizeFn(pipelineRef.current.totalItems),
        page,
      );
    },
    [getTotalPagesValueFn, effectivePageSizeFn],
  );

  const togglePinFn = useCallback((column: GridColumnDef): void => {
    const current = pinnedColumnsRef.current[column.name];
    const next: PinDirection = current === 'left' ? 'right' : current === 'right' ? 'none' : 'left';
    pinGridColumnCommand(
      gridApiRef.current!,
      isPinningEnabledFn(),
      (v) => setPinnedColumns(v),
      () => pinnedColumnsRef.current,
      column.name,
      next,
    );
  }, []);

  const setPaginationPageSizeFn = useCallback((ps: number): void => {
    setGridPaginationPageSizeCommand(
      gridApiRef.current!,
      (nextPageSize) => setPageSize(nextPageSize),
      (nextPage) => setCurrentPage(nextPage),
      ps,
    );
  }, []);

  const toggleRowExpansionByRefFn = useCallback(
    (row: GridRow | GridRecord | string): void => {
      const rowId = coreResolveGridRowId(optionsRef.current, row);
      toggleGridRowExpansionCommand(
        gridApiRef.current!,
        FEATURE_EXPANDABLE && canGridExpandRows(optionsRef.current),
        expandedRowsRef.current,
        rowId,
        (e) => setExpandedRows(e),
        (resolvedRowId) =>
          coreFindGridRowById(buildRowsFromData(optionsRef.current.data), resolvedRowId),
      );
    },
    [buildRowsFromData],
  );

  const expandAllRowsFn = useCallback((): void => {
    if (!canGridExpandRows(optionsRef.current)) return;
    expandAllGridRowsCommand(
      (data) => buildRowsFromData(data),
      optionsRef.current.data,
      (e) => setExpandedRows(e),
    );
  }, [buildRowsFromData]);

  const toggleAllRowsFn = useCallback((): void => {
    const allExpanded = areAllGridRowsExpanded(
      buildRowsFromData(optionsRef.current.data),
      expandedRowsRef.current,
    );
    if (allExpanded) {
      collapseAllGridRowsCommand((e) => setExpandedRows(e));
    } else {
      expandAllRowsFn();
    }
  }, [buildRowsFromData, expandAllRowsFn]);

  const toggleTreeRowByRefFn = useCallback(
    (row: GridRow | GridRecord | string): void => {
      const rowId = coreResolveGridRowId(optionsRef.current, row);
      toggleGridTreeRowCommand(
        gridApiRef.current!,
        expandedTreeRowsRef.current,
        rowId,
        (e) => setExpandedTreeRows(e),
        (resolvedRowId) =>
          coreFindGridRowById(buildRowsFromData(optionsRef.current.data), resolvedRowId),
      );
    },
    [buildRowsFromData],
  );

  const expandTreeRowByRefFn = useCallback(
    (row: GridRow | GridRecord | string): void => {
      const rowId = coreResolveGridRowId(optionsRef.current, row);
      setGridTreeRowExpandedCommand(
        gridApiRef.current!,
        expandedTreeRowsRef.current,
        rowId,
        true,
        (e) => setExpandedTreeRows(e),
        (resolvedRowId) =>
          coreFindGridRowById(buildRowsFromData(optionsRef.current.data), resolvedRowId),
      );
    },
    [buildRowsFromData],
  );

  const collapseTreeRowByRefFn = useCallback(
    (row: GridRow | GridRecord | string): void => {
      const rowId = coreResolveGridRowId(optionsRef.current, row);
      setGridTreeRowExpandedCommand(
        gridApiRef.current!,
        expandedTreeRowsRef.current,
        rowId,
        false,
        (e) => setExpandedTreeRows(e),
        (resolvedRowId) =>
          coreFindGridRowById(buildRowsFromData(optionsRef.current.data), resolvedRowId),
      );
    },
    [buildRowsFromData],
  );

  const startCellEditFn = useCallback(
    (
      row: GridRow,
      column: GridColumnDef,
      triggerEvent?: Event | KeyboardEvent | null,
      initialValue?: string,
    ): void => {
      const currentValue = getCellValue(row.entity, column);
      const focusToken = ++editorFocusTokenRef.current;
      const ec = beginGridCellEditCommand(
        gridApiRef.current!,
        {
          setFocusedCell: (fc) => setFocusedCell(fc),
          setEditingCell: setEditingCellState,
          setEditingValue: setEditingValueState,
        },
        row,
        column,
        currentValue,
        triggerEvent,
        initialValue,
      );

      if (ec) {
        queueMicrotask(() => focusEditorInput(focusToken));
      }
    },
    [focusEditorInput, setEditingCellState, setEditingValueState],
  );

  const commitCellEditFn = useCallback(
    (direction?: GridMoveDirection, restoreFocus = true): void => {
      const result = commitGridCellEditCommand(gridApiRef.current!, {
        getEditingCell: () => editingCellRef.current,
        getEditingValue: () => editingValueRef.current,
        setEditingCell: setEditingCellState,
        setEditingValue: setEditingValueState,
        findRowById: (rowId) =>
          coreFindGridRowById(buildRowsFromData(optionsRef.current.data), rowId),
        findColumnByName: (columnName) =>
          visibleColumnsRef.current.find((c) => c.name === columnName),
        parseEditedValue: (column, value, oldValue) =>
          parseGridEditedValue(column, value, oldValue),
        setCellValue: (rowEntity, column, value) => {
          const fieldPath = column.editModelField ?? column.field ?? column.name;
          setPathValue(rowEntity, fieldPath, value);
        },
      });

      if (!result.committed || !result.row || !result.column || !result.focusTarget) return;

      editorFocusTokenRef.current += 1;

      if (direction) {
        const moved = moveFocusFn(result.row, result.column, direction);
        if (!moved) focusRenderedCell(result.focusTarget);
      } else if (restoreFocus) {
        focusRenderedCell(result.focusTarget);
      }
    },
    [buildRowsFromData, focusRenderedCell, setEditingCellState, setEditingValueState],
  );

  const cancelCellEditFn = useCallback((): void => {
    const hadEditingCell = editingCellRef.current !== null;
    const result = cancelGridCellEditCommand(gridApiRef.current!, {
      getEditingCell: () => editingCellRef.current,
      setEditingCell: setEditingCellState,
      setEditingValue: setEditingValueState,
      findRowById: (rowId) =>
        coreFindGridRowById(buildRowsFromData(optionsRef.current.data), rowId),
      findColumnByName: (columnName) =>
        visibleColumnsRef.current.find((c) => c.name === columnName),
    });

    if (!hadEditingCell) return;
    editorFocusTokenRef.current += 1;
    if (result.focusTarget) focusRenderedCell(result.focusTarget);
  }, [buildRowsFromData, focusRenderedCell, setEditingCellState, setEditingValueState]);

  const moveFocusFn = useCallback(
    (
      row: GridRow,
      column: GridColumnDef,
      direction: GridMoveDirection,
      triggerEvent?: Event | KeyboardEvent | null,
    ): boolean => {
      const nextCell = findNextGridCell({
        rows: pipelineRef.current.displayItems
          .filter((item) => item.kind === 'row')
          .map((item) => (item as RowItem).row),
        columns: visibleColumnsRef.current,
        rowId: row.id,
        columnName: column.name,
        direction,
      });
      if (!nextCell) return false;

      setFocusedCell({ rowId: nextCell.row.id, columnName: nextCell.column.name });
      focusRenderedCell({ rowId: nextCell.row.id, columnName: nextCell.column.name });

      if (
        shouldEditOnFocusFn(nextCell.column) &&
        isCellEditable(nextCell.row, nextCell.column, triggerEvent)
      ) {
        startCellEditFn(nextCell.row, nextCell.column, triggerEvent);
      }

      return true;
    },
    [focusRenderedCell, isCellEditable, shouldEditOnFocusFn, startCellEditFn],
  );

  const runBenchmarkFn = useCallback(async (iterations?: number): Promise<GridBenchmarkResult> => {
    const safeIterations = resolveBenchmarkIterations(
      iterations,
      optionsRef.current.benchmark?.iterations,
    );
    const nextFrame = () =>
      new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame === 'undefined') {
          setTimeout(resolve, 0);
          return;
        }
        requestAnimationFrame(() => resolve());
      });
    const startedAt = performance.now();
    let lastResult = defaultGridEngine.buildPipeline({
      options: optionsRef.current,
      columns: visibleColumnsRef.current,
      activeFilters: activeFiltersRef.current,
      sortState: sortStateRef.current,
      groupByColumns: groupByColumnsRef.current,
      collapsedGroups: collapsedGroupsRef.current,
      hiddenRowReasons: hiddenRowReasonsRef.current,
      expandedRows: expandedRowsRef.current,
      expandedTreeRows: expandedTreeRowsRef.current,
      currentPage: currentPageRef.current,
      pageSize: pageSizeRef.current,
      rowSize: optionsRef.current.rowHeight ?? 44,
    });

    for (let i = 1; i < safeIterations; i++) {
      lastResult = defaultGridEngine.buildPipeline({
        options: optionsRef.current,
        columns: visibleColumnsRef.current,
        activeFilters: activeFiltersRef.current,
        sortState: sortStateRef.current,
        groupByColumns: groupByColumnsRef.current,
        collapsedGroups: collapsedGroupsRef.current,
        hiddenRowReasons: hiddenRowReasonsRef.current,
        expandedRows: expandedRowsRef.current,
        expandedTreeRows: expandedTreeRowsRef.current,
        currentPage: currentPageRef.current,
        pageSize: pageSizeRef.current,
        rowSize: optionsRef.current.rowHeight ?? 44,
      });
    }

    const totalMs = performance.now() - startedAt;
    const result: GridBenchmarkResult = {
      iterations: safeIterations,
      totalMs,
      averageMs: totalMs / safeIterations,
      visibleRows: lastResult.visibleRows.length,
      renderedItems: lastResult.displayItems.length,
    };

    setBenchmarkResult(result);
    await nextFrame();
    raiseGridBenchmarkComplete(gridApiRef.current!, result);
    return result;
  }, []);

  const exportCsvFn = useCallback((): void => {
    if (!FEATURE_CSV_EXPORT) return;
    const columns = visibleColumnsRef.current;
    const csv = exportCsvRows(columns, pipelineRef.current.visibleRows);
    downloadGridCsvFile(csv, `${sanitizeDownloadFilename(optionsRef.current.id)}.csv`);
  }, []);

  // --- Initialization effect: reset state when options.id changes ---

  useEffect(() => {
    if (initializedGridIdRef.current === options.id) return;
    initializedGridIdRef.current = options.id;

    setActiveFilters({});
    setHiddenRowReasons({});
    setCollapsedGroups({});
    setFocusedCell(null);
    setEditingCellState(null);
    setEditingValueState('');
    setExpandedRows({});
    setExpandedTreeRows({});
    setColumnOrder(options.columnDefs.map((column) => column.name));
    setGroupByColumns(options.grouping?.groupBy ?? []);
    setPinnedColumns(buildInitialPinnedState(options.columnDefs));
    setCurrentPage(options.paginationCurrentPage ?? 1);
    setPageSize(coreGetEffectivePageSize(options, 0, options.data.length));

    setInfiniteScrollState({
      scrollUp: options.infiniteScrollUp === true,
      scrollDown: options.infiniteScrollDown !== false,
      dataLoading: false,
      previousVisibleRows: 0,
    });

    const initialSort = options.columnDefs.find(
      (column) => column.sort?.direction && !column.sort.ignoreSort,
    );
    setSortState({
      columnName: initialSort?.name ?? null,
      direction: initialSort?.sort?.direction ?? SORT_DIRECTIONS.none,
    });

    onRegisterApi?.(gridApi);
    raiseGridRenderingComplete(gridApi);
  }, [options.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Pipeline side-effects ---

  useEffect(() => {
    raiseGridRowsRendered(gridApi, pipeline.visibleRows);
    raiseGridRowsVisibleChanged(gridApi, pipeline.visibleRows);

    const newHeight = pipeline.displayItems.length * rowSize;
    if (newHeight !== lastCanvasHeightRef.current) {
      raiseGridCanvasHeightChanged(gridApi, lastCanvasHeightRef.current, newHeight);
      lastCanvasHeightRef.current = newHeight;
    }
  }, [pipeline, gridApi, rowSize]);

  // --- Auto resize effect ---

  // Auto-resize is on by default so the grid fills its container. The
  // ResizeObserver measures the host element and writes `autoViewportHeight`
  // so the grid always fills available space (matching the old ui-grid).
  useEffect(() => {
    if (!FEATURE_AUTO_RESIZE) return;

    const container = gridContainerRef.current;
    if (!container) return;

    const observer = observeGridHostSize(container, ({ height: nextHeight, width: nextWidth }) => {
      if (nextHeight === lastGridHeightRef.current && nextWidth === lastGridWidthRef.current)
        return;

      raiseGridDimensionChanged(
        gridApi,
        lastGridHeightRef.current,
        lastGridWidthRef.current,
        nextHeight,
        nextWidth,
      );
      lastGridHeightRef.current = nextHeight;
      lastGridWidthRef.current = nextWidth;

      if (nextHeight > 0) {
        setAutoViewportHeight(nextHeight);
      }
    });

    if (!observer) return;
    return () => observer.disconnect();
  }, [options.enableAutoResize, gridApi]);

  // --- Computed values ---

  const totalRows = pipeline.totalItems;
  const visibleRowCount = pipeline.visibleRows.length;
  const displayItems = pipeline.displayItems;
  const virtualizationEnabled = pipeline.virtualizationEnabled;
  const pipelineMsVal = pipeline.pipelineMs;
  const paginationCurrentPage = getCurrentPageValueFn();
  const paginationTotalPages = getTotalPagesValueFn();
  const paginationSelectedPageSize = effectivePageSizeFn(pipeline.totalItems);
  const viewportHeightPx = computeViewportHeightPx(autoViewportHeight, options.minRowsToShow, options.rowHeight);

  // --- Display helper functions ---

  const headerLabelFn = useCallback((column: GridColumnDef): string => coreHeaderLabel(column), []);
  const isGroupItemFn = useCallback(
    (item: DisplayItem): item is GroupItem => item.kind === 'group',
    [],
  );
  const isExpandableItemFn = useCallback(
    (item: DisplayItem): item is ExpandableItem => item.kind === 'expandable',
    [],
  );
  const isRowItemFn = useCallback((item: DisplayItem): item is RowItem => item.kind === 'row', []);
  const isOddStripedRowFn = useCallback(
    (item: DisplayItem): boolean => item.kind === 'row' && item.visibleIndex % 2 === 0,
    [],
  );

  const sortDirectionFn = useCallback((column: GridColumnDef): string => {
    return sortStateRef.current.columnName === column.name
      ? sortStateRef.current.direction
      : SORT_DIRECTIONS.none;
  }, []);

  const sortButtonLabelFn = useCallback(
    (column: GridColumnDef): string => {
      return gridSortButtonLabel(sortDirectionFn(column) as any, labels);
    },
    [labels, sortDirectionFn],
  );

  const sortAriaSortFn = useCallback(
    (column: GridColumnDef): string => {
      return gridSortAriaSort(sortDirectionFn(column) as any);
    },
    [sortDirectionFn],
  );

  const groupingButtonLabelFn = useCallback(
    (column: GridColumnDef): string => {
      return gridGroupingButtonLabel(
        isGridColumnGrouped(groupByColumnsRef.current, column),
        labels,
      );
    },
    [labels],
  );

  const filterValueFn = useCallback((columnName: string): string => {
    return activeFiltersRef.current[columnName] ?? '';
  }, []);

  const filterPlaceholderFn = useCallback(
    (column: GridColumnDef): string => {
      return gridFilterPlaceholder(isGridColumnFilterable(optionsRef.current, column), labels);
    },
    [labels],
  );

  const isFilterInputDisabledFn = useCallback((column: GridColumnDef): boolean => {
    return !isGridColumnFilterable(optionsRef.current, column);
  }, []);

  const groupDisclosureLabelFn = useCallback(
    (item: GroupItem): string => {
      return gridGroupDisclosureLabel(item.collapsed, labels);
    },
    [labels],
  );

  const cellContextFn = useCallback(
    (row: GridRow, column: GridColumnDef): GridCellTemplateContext => {
      return buildGridCellContext(row, column);
    },
    [],
  );

  const displayValueFn = useCallback(
    (row: GridRow, column: GridColumnDef): string => {
      return formatGridCellDisplayValue(cellContextFn(row, column));
    },
    [cellContextFn],
  );

  const isFocusedCellFn = useCallback((row: GridRow, column: GridColumnDef): boolean => {
    return isGridCellPosition(focusedCellRef.current, row.id, column.name);
  }, []);

  const isFocusedRowFn = useCallback((row: GridRow): boolean => {
    return (
      focusedCellRef.current?.rowId === row.id || editingCellRef.current?.rowId === row.id
    );
  }, []);

  const isEditingCellFn = useCallback((row: GridRow, column: GridColumnDef): boolean => {
    return isGridCellPosition(editingCellRef.current, row.id, column.name);
  }, []);

  const editorInputTypeFn = useCallback((column: GridColumnDef): string => {
    return gridEditorInputType(column);
  }, []);

  const expandedContextFn = useCallback(
    (row: GridRow): GridExpandableTemplateContext & Record<string, unknown> => {
      return {
        $implicit: row.entity,
        row: row.entity,
        rowIndex: row.index,
        expanded: true,
        ...(optionsRef.current.expandableRowScope ?? {}),
      };
    },
    [],
  );

  const columnWidthFn = useCallback((column: GridColumnDef): string => gridColumnWidth(column), []);

  const isColumnSortableFn = useCallback((column: GridColumnDef): boolean => {
    return isGridColumnSortable(optionsRef.current, column);
  }, []);

  const isColumnFilterableFn = useCallback((column: GridColumnDef): boolean => {
    return isGridColumnFilterable(optionsRef.current, column);
  }, []);

  const cellIndentFn = useCallback((row: GridRow, column: GridColumnDef): string => {
    return gridCellIndent(optionsRef.current, visibleColumnsRef.current, row, column);
  }, []);

  const treeToggleLabelFn = useCallback(
    (row: GridRow): string => {
      return gridTreeToggleLabelForRow(expandedTreeRowsRef.current, row, labels);
    },
    [labels],
  );

  const isTreeRowExpandedFn = useCallback((row: GridRow): boolean => {
    return isGridTreeRowExpanded(expandedTreeRowsRef.current, row);
  }, []);

  const expandToggleLabelFn = useCallback(
    (row: GridRow): string => {
      return gridExpandToggleLabelForRow(row, labels);
    },
    [labels],
  );

  const isGroupedFn = useCallback((column: GridColumnDef): boolean => {
    return isGridColumnGrouped(groupByColumnsRef.current, column);
  }, []);

  const showTreeToggleFn = useCallback((row: GridRow, column: GridColumnDef): boolean => {
    return shouldShowGridTreeToggle(optionsRef.current, visibleColumnsRef.current, row, column);
  }, []);

  const showExpandToggleFn = useCallback((row: GridRow, column: GridColumnDef): boolean => {
    return shouldShowGridExpandToggle(optionsRef.current, visibleColumnsRef.current, column);
  }, []);

  const showPaginationControlsFn = useCallback((): boolean => {
    return FEATURE_PAGINATION && shouldShowGridPaginationControls(optionsRef.current);
  }, []);

  const paginationSummaryFn = useCallback((): string => {
    const ti = pipelineRef.current.totalItems;
    return formatPaginationSummary(ti, getFirstRowIndexValueFn(ti), getLastRowIndexValueFn(ti));
  }, [getFirstRowIndexValueFn, getLastRowIndexValueFn]);

  const pageSizeOptionsFn = useCallback((): number[] => {
    return optionsRef.current.paginationPageSizes ?? [];
  }, []);

  const isGroupingEnabledFn = useCallback((): boolean => {
    return FEATURE_GROUPING && isGridGroupingEnabled(optionsRef.current);
  }, []);

  const isFilteringEnabledFn = useCallback((): boolean => {
    return FEATURE_FILTERING && isGridFilteringEnabled(optionsRef.current);
  }, []);

  // --- Action dispatchers ---

  const toggleSortFn = useCallback((column: GridColumnDef): void => {
    if (!FEATURE_SORTING || !isGridColumnSortable(optionsRef.current, column)) return;

    const currentDirection =
      sortStateRef.current.columnName === column.name
        ? sortStateRef.current.direction
        : SORT_DIRECTIONS.none;
    const nextDirection =
      currentDirection === SORT_DIRECTIONS.none
        ? SORT_DIRECTIONS.asc
        : currentDirection === SORT_DIRECTIONS.asc
          ? SORT_DIRECTIONS.desc
          : SORT_DIRECTIONS.none;

    applyGridSortStateCommand(gridApiRef.current!, (state) => setSortState(state), {
      columnName: nextDirection === SORT_DIRECTIONS.none ? null : column.name,
      direction: nextDirection,
    });
  }, []);

  const updateFilterFn = useCallback((columnName: string, value: string): void => {
    updateGridFilterCommand(
      gridApiRef.current!,
      (updater) => setActiveFilters((current) => updater(current)),
      () => activeFiltersRef.current,
      columnName,
      value,
    );
  }, []);

  const clearAllFiltersFn = useCallback((): void => {
    clearGridFiltersCommand(gridApiRef.current!, (filters) => setActiveFilters(filters));
  }, []);

  const toggleGroupingFn = useCallback((column: GridColumnDef, event?: React.MouseEvent): void => {
    event?.stopPropagation();
    if (!(FEATURE_GROUPING && isGridGroupingEnabled(optionsRef.current))) return;
    const current = groupByColumnsRef.current;
    const next = current.includes(column.name)
      ? current.filter((n) => n !== column.name)
      : [...current, column.name];
    groupByColumnsRef.current = next;
    setGroupByColumns(next);
    gridApiRef.current!.core.raise.groupingChanged(next);
  }, []);

  const toggleGroupFn = useCallback((item: GroupItem): void => {
    setCollapsedGroups((current) => ({
      ...current,
      [item.id]: !current[item.id],
    }));
  }, []);

  const focusCellFn = useCallback(
    (row: GridRow, column: GridColumnDef, triggerEvent?: Event | KeyboardEvent | null): void => {
      const nextFocusResult = buildGridFocusCellResult({
        currentFocusedCell: focusedCellRef.current,
        currentEditingCell: editingCellRef.current,
        rowId: row.id,
        columnName: column.name,
        shouldEditOnFocus: shouldEditOnFocusFn(column),
        isCellEditable: isCellEditable(row, column, triggerEvent),
      });
      setFocusedCell(nextFocusResult.focusedCell);

      if (nextFocusResult.shouldBeginEdit) {
        startCellEditFn(row, column, triggerEvent);
      }
    },
    [isCellEditable, shouldEditOnFocusFn, startCellEditFn],
  );

  const handleCellKeyDownFn = useCallback(
    (row: GridRow, column: GridColumnDef, event: React.KeyboardEvent): void => {
      if (isGridNavigationKey(event.key)) {
        setFocusedCell({ rowId: row.id, columnName: column.name });
      } else {
        focusCellFn(row, column, event.nativeEvent);
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          event.stopPropagation();
          moveFocusFn(row, column, 'left', event.nativeEvent);
          return;
        case 'ArrowRight':
          event.preventDefault();
          event.stopPropagation();
          moveFocusFn(row, column, 'right', event.nativeEvent);
          return;
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          moveFocusFn(row, column, 'up', event.nativeEvent);
          return;
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          moveFocusFn(row, column, 'down', event.nativeEvent);
          return;
        case 'Tab':
          event.preventDefault();
          event.stopPropagation();
          moveFocusFn(row, column, event.shiftKey ? 'left' : 'right', event.nativeEvent);
          return;
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          moveFocusFn(row, column, event.shiftKey ? 'up' : 'down', event.nativeEvent);
          return;
        case 'F2':
          event.preventDefault();
          event.stopPropagation();
          if (isCellEditable(row, column, event.nativeEvent)) {
            startCellEditFn(row, column, event.nativeEvent);
          }
          return;
        case 'Backspace':
        case 'Delete':
          if (isCellEditable(row, column, event.nativeEvent)) {
            event.preventDefault();
            event.stopPropagation();
            startCellEditFn(row, column, event.nativeEvent, '');
          }
          return;
        default:
          break;
      }

      if (
        isPrintableGridKey(event.key, event.ctrlKey, event.metaKey, event.altKey) &&
        isCellEditable(row, column, event.nativeEvent)
      ) {
        event.preventDefault();
        event.stopPropagation();
        startCellEditFn(row, column, event.nativeEvent, event.key);
      }
    },
    [focusCellFn, moveFocusFn, isCellEditable, startCellEditFn],
  );

  const handleCellDoubleClickFn = useCallback(
    (row: GridRow, column: GridColumnDef, event: React.MouseEvent): void => {
      focusCellFn(row, column, event.nativeEvent);
      if (isCellEditable(row, column, event.nativeEvent)) {
        startCellEditFn(row, column, event.nativeEvent);
      }
    },
    [focusCellFn, isCellEditable, startCellEditFn],
  );

  const updateEditingValueFn = useCallback((value: string): void => {
    setEditingValueState(value);
  }, [setEditingValueState]);

  const handleEditorKeyDownFn = useCallback(
    (event: React.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancelCellEditFn();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        commitCellEditFn(event.shiftKey ? 'up' : 'down');
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        commitCellEditFn(event.shiftKey ? 'left' : 'right');
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        commitCellEditFn(event.key === 'ArrowUp' ? 'up' : 'down');
      }
    },
    [cancelCellEditFn, commitCellEditFn],
  );

  const handleEditorBlurFn = useCallback(
    (event: React.FocusEvent): void => {
      const ec = editingCellRef.current;
      const target = event.target as HTMLElement | null;
      if (!ec || !target) return;
      if (target.dataset['rowId'] !== ec.rowId || target.dataset['colName'] !== ec.columnName)
        return;
      commitCellEditFn(undefined, false);
    },
    [commitCellEditFn],
  );

  const toggleRowExpansionFn = useCallback(
    (row: GridRow, event?: React.MouseEvent): void => {
      event?.stopPropagation();
      toggleRowExpansionByRefFn(row);
    },
    [toggleRowExpansionByRefFn],
  );

  const toggleTreeRowFn = useCallback(
    (row: GridRow, event?: React.MouseEvent): void => {
      event?.stopPropagation();
      toggleTreeRowByRefFn(row);
    },
    [toggleTreeRowByRefFn],
  );

  const moveColumnFn = useCallback((fromIndex: number, toIndex: number): void => {
    moveGridColumnCommand(
      gridApiRef.current!,
      FEATURE_COLUMN_MOVING && optionsRef.current.enableColumnMoving === true,
      (updater) => setColumnOrder((current) => updater(current)),
      fromIndex,
      toIndex,
    );
  }, []);

  const moveVisibleColumnFn = useCallback((columnName: string, targetColumnName: string): void => {
    moveGridVisibleColumnCommand(
      gridApiRef.current!,
      FEATURE_COLUMN_MOVING && optionsRef.current.enableColumnMoving === true,
      columnOrderRef.current,
      visibleColumnsRef.current.map((column) => column.name),
      columnName,
      targetColumnName,
      (order) => setColumnOrder(order),
    );
  }, []);

  const nextPageFn = useCallback((): void => {
    seekPageFn(getCurrentPageValueFn() + 1);
  }, [seekPageFn, getCurrentPageValueFn]);

  const previousPageFn = useCallback((): void => {
    seekPageFn(getCurrentPageValueFn() - 1);
  }, [seekPageFn, getCurrentPageValueFn]);

  const onPageSizeChangeFn = useCallback(
    (value: string): void => {
      setPaginationPageSizeFn(Number(value));
    },
    [setPaginationPageSizeFn],
  );

  // --- Column resizing ---

  const canResizeColumnsFn = useCallback((): boolean => {
    return optionsRef.current.enableColumnResizing !== false;
  }, []);

  const setColumnWidthOverrideFn = useCallback((columnName: string, widthPx: number): void => {
    const nextWidth = `${Math.max(88, Math.round(widthPx))}px`;
    setColumnWidthOverrides((current) => ({ ...current, [columnName]: nextWidth }));
  }, []);

  const measureAutoColumnWidthFn = useCallback((columnName: string): number => {
    const container = gridContainerRef.current;
    if (container == null) return 176;
    const escaped = CSS.escape ? CSS.escape(columnName) : columnName.replace(/([\\".#:[\](){}+~> ])/g, '\\$1');
    const selectors = [
      `.header-cell[data-col-name="${escaped}"]`,
      `.filter-cell[data-col-name="${escaped}"]`,
      `.body-cell[data-col-name="${escaped}"] .cell-shell`,
    ];
    let maxWidth = 0;
    for (const selector of selectors) {
      const elements = container.querySelectorAll<HTMLElement>(selector);
      for (const element of elements) {
        maxWidth = Math.max(maxWidth, element.scrollWidth);
      }
    }
    return maxWidth + 12;
  }, []);

  const handleHeaderResizeMouseDownFn = useCallback(
    (column: GridColumnDef, event: React.MouseEvent): void => {
      if (!canResizeColumnsFn()) return;
      event.preventDefault();
      event.stopPropagation();

      const headerCell = (event.currentTarget as HTMLElement).closest<HTMLElement>('.header-cell');
      if (headerCell == null) return;

      const startX = event.clientX;
      const startWidth = headerCell.getBoundingClientRect().width;
      let lastWidth = startWidth;

      const handleMove = (moveEvent: MouseEvent): void => {
        lastWidth = Math.max(88, startWidth + (moveEvent.clientX - startX));

        // Compute the new column template directly — no React state, no re-render.
        // This keeps virtualized resize smooth since the pipeline never re-runs mid-drag.
        const widthStr = `${Math.round(lastWidth)}px`;
        const newTemplate = buildGridTemplateColumns(
          visibleColumnsRef.current.map((c) =>
            c.name === column.name ? { ...c, width: widthStr } : c,
          ),
        );
        gridContainerRef.current
          ?.querySelectorAll<HTMLElement>('.header-grid, .filter-grid, .body-grid')
          .forEach((el) => {
            el.style.gridTemplateColumns = newTemplate;
          });
      };

      const handleUp = (): void => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        // Commit the final width to React state once — triggers one clean re-render.
        setColumnWidthOverrideFn(column.name, lastWidth);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [canResizeColumnsFn, setColumnWidthOverrideFn],
  );

  const autoSizeColumnFn = useCallback(
    (column: GridColumnDef, event: React.MouseEvent): void => {
      if (!canResizeColumnsFn()) return;
      event.preventDefault();
      event.stopPropagation();
      setColumnWidthOverrideFn(column.name, measureAutoColumnWidthFn(column.name));
    },
    [canResizeColumnsFn, setColumnWidthOverrideFn, measureAutoColumnWidthFn],
  );

  const onViewportScrollFn = useCallback((startIndex: number): void => {
    if (!scrollingRef.current) {
      scrollingRef.current = true;
      raiseGridScrollBegin(gridApiRef.current!);
    }

    if (scrollEndHandleRef.current) {
      window.clearTimeout(scrollEndHandleRef.current);
    }

    scrollEndHandleRef.current = window.setTimeout(() => {
      scrollingRef.current = false;
      raiseGridScrollEnd(gridApiRef.current!);
    }, 120);

    const isInfiniteScrollEnabled =
      FEATURE_INFINITE_SCROLL &&
      (optionsRef.current.infiniteScrollRowsFromEnd !== undefined ||
        optionsRef.current.infiniteScrollUp === true ||
        optionsRef.current.infiniteScrollDown !== undefined);

    maybeRequestInfiniteScrollCommand(gridApiRef.current!, {
      enabled: isInfiniteScrollEnabled,
      virtualizationEnabled: pipelineRef.current.virtualizationEnabled,
      state: infiniteScrollStateRef.current,
      startIndex,
      visibleRows: pipelineRef.current.visibleRows.length,
      viewportRows: computeViewportRows(
        autoViewportHeight,
        optionsRef.current.rowHeight,
        optionsRef.current.minRowsToShow,
      ),
      threshold: optionsRef.current.infiniteScrollRowsFromEnd ?? 20,
      setState: (state) => setInfiniteScrollState(state),
    });
  }, []);

  return {
    pipeline,
    visibleColumns,
    labels,
    gridTemplateColumns,
    gridApi,
    gridContainerRef,

    activeFilters,
    groupByColumns,
    collapsedGroups,
    sortState,
    focusedCell,
    editingCell,
    editingValue,
    expandedRows,
    expandedTreeRows,
    currentPage,
    pageSize,
    benchmarkResult,
    infiniteScrollState,

    totalRows,
    visibleRowCount,
    displayItems,
    virtualizationEnabled,
    pipelineMs: pipelineMsVal,
    paginationCurrentPage,
    paginationTotalPages,
    paginationSelectedPageSize,
    rowSize,
    viewportHeightPx,
    autoViewportHeight,

    headerLabel: headerLabelFn,
    isGroupItem: isGroupItemFn,
    isExpandableItem: isExpandableItemFn,
    isRowItem: isRowItemFn,
    isOddStripedRow: isOddStripedRowFn,
    sortButtonLabel: sortButtonLabelFn,
    sortAriaSort: sortAriaSortFn,
    sortDirection: sortDirectionFn,
    groupingButtonLabel: groupingButtonLabelFn,
    filterValue: filterValueFn,
    filterPlaceholder: filterPlaceholderFn,
    isFilterInputDisabled: isFilterInputDisabledFn,
    groupDisclosureLabel: groupDisclosureLabelFn,
    displayValue: displayValueFn,
    isFocusedCell: isFocusedCellFn,
    isFocusedRow: isFocusedRowFn,
    isEditingCell: isEditingCellFn,
    editorInputType: editorInputTypeFn,
    cellContext: cellContextFn,
    expandedContext: expandedContextFn,
    columnWidth: columnWidthFn,
    isColumnSortable: isColumnSortableFn,
    isColumnFilterable: isColumnFilterableFn,
    cellIndent: cellIndentFn,
    treeToggleLabel: treeToggleLabelFn,
    isTreeRowExpanded: isTreeRowExpandedFn,
    expandToggleLabel: expandToggleLabelFn,
    isGrouped: isGroupedFn,
    showTreeToggle: showTreeToggleFn,
    showExpandToggle: showExpandToggleFn,
    showPaginationControls: showPaginationControlsFn,
    paginationSummary: paginationSummaryFn,
    pageSizeOptions: pageSizeOptionsFn,
    isCellEditable,
    shouldEditOnFocus: shouldEditOnFocusFn,

    sortingFeature: FEATURE_SORTING,
    filteringFeature: FEATURE_FILTERING,
    groupingFeature: FEATURE_GROUPING,
    paginationFeature: FEATURE_PAGINATION,
    cellEditFeature: FEATURE_CELL_EDIT,
    expandableFeature: FEATURE_EXPANDABLE,
    treeViewFeature: FEATURE_TREE_VIEW,
    infiniteScrollFeature: FEATURE_INFINITE_SCROLL,
    columnMovingFeature: FEATURE_COLUMN_MOVING,
    csvExportFeature: FEATURE_CSV_EXPORT,

    isGroupingEnabled: isGroupingEnabledFn,
    isFilteringEnabled: isFilteringEnabledFn,

    toggleSort: toggleSortFn,
    updateFilter: updateFilterFn,
    clearAllFilters: clearAllFiltersFn,
    toggleGrouping: toggleGroupingFn,
    toggleGroup: toggleGroupFn,
    focusCell: focusCellFn,
    handleCellKeyDown: handleCellKeyDownFn,
    handleCellDoubleClick: handleCellDoubleClickFn,
    updateEditingValue: updateEditingValueFn,
    handleEditorKeyDown: handleEditorKeyDownFn,
    handleEditorBlur: handleEditorBlurFn,
    toggleRowExpansion: toggleRowExpansionFn,
    toggleTreeRow: toggleTreeRowFn,
    moveColumn: moveColumnFn,
    moveVisibleColumn: moveVisibleColumnFn,
    canResizeColumns: canResizeColumnsFn,
    handleHeaderResizeMouseDown: handleHeaderResizeMouseDownFn,
    autoSizeColumn: autoSizeColumnFn,
    nextPage: nextPageFn,
    previousPage: previousPageFn,
    onPageSizeChange: onPageSizeChangeFn,
    runBenchmark: runBenchmarkFn,
    exportCsv: exportCsvFn,
    onViewportScroll: onViewportScrollFn,
    // Pinning
    isPinned: isPinnedFn,
    pinnedOffset: pinnedOffsetFn,
    isPinningEnabled: isPinningEnabledFn,
    isColumnPinnable: isColumnPinnableFn,
    togglePin: togglePinFn,
    pinningFeature: FEATURE_PINNING,
  };
}
