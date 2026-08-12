import { SortDirection } from './grid.constants';
import { GridBenchmarkResult, GridCellPosition, GridColumnDef, GridLabels, GridRecord, GridRow, GridRowColumn, GridSavedState } from './grid.models';
import {
  GridExporterColumnType,
  GridExporterExcelSheetData,
  GridExporterMenuItem,
  GridExporterOptions,
  GridExporterPdfDocDefinition,
  GridExporterRowType,
  GridLocaleCode,
  GridMenuItem,
  GridValidatorFactory,
  GridValidatorMessageFn,
  PinDirection,
  gridI18n,
} from './grid.core';

type Listener<Args extends unknown[]> = (...args: Args) => void;

class GridEvent<Args extends unknown[]> {
  private readonly listeners = new Set<Listener<Args>>();

  subscribe(listener: Listener<Args>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(...args: Args): void {
    for (const listener of this.listeners) {
      listener(...args);
    }
  }
}

export interface GridApiBindings {
  refresh: () => void;
  getVisibleRows: () => GridRow[];
  setRowInvisible: (row: GridRow | GridRecord | string, reason?: string) => void;
  clearRowInvisible: (row: GridRow | GridRecord | string, reason?: string) => void;
  setFilter: (columnName: string, value: string) => void;
  clearAllFilters: () => void;
  sortColumn: (columnName: string, direction?: SortDirection) => void;
  moveColumn: (fromIndex: number, toIndex: number) => void;
  pinColumn?: (columnName: string, direction: PinDirection) => void;
  toggleGrouping: (columnName: string) => void;
  clearGrouping: () => void;
  benchmark: (iterations?: number) => Promise<GridBenchmarkResult>;
  exportCsv: (rowType?: GridExporterRowType, colType?: GridExporterColumnType) => void;
  /** Returns the CSV string without triggering a download. Used by
   * consumers that want to post-process the CSV (e.g. upload it). */
  buildCsv?: (rowType?: GridExporterRowType, colType?: GridExporterColumnType) => string;
  pdfExport?: (rowType?: GridExporterRowType, colType?: GridExporterColumnType) => GridExporterPdfDocDefinition;
  buildPdfDocDefinition?: (
    rowType?: GridExporterRowType,
    colType?: GridExporterColumnType,
  ) => GridExporterPdfDocDefinition;
  excelExport?: (rowType?: GridExporterRowType, colType?: GridExporterColumnType) => GridExporterExcelSheetData;
  buildExcelSheetData?: (
    rowType?: GridExporterRowType,
    colType?: GridExporterColumnType,
  ) => GridExporterExcelSheetData;
  getExporterMenuItems?: () => GridExporterMenuItem[];
  getExporterOptions?: () => GridExporterOptions;
  setExporterOptions?: (options: GridExporterOptions) => void;
  paginationGetPage?: () => number;
  paginationGetTotalPages?: () => number;
  paginationGetFirstRowIndex?: () => number;
  paginationGetLastRowIndex?: () => number;
  paginationNextPage?: () => void;
  paginationPreviousPage?: () => void;
  paginationSeek?: (page: number) => void;
  paginationSetPageSize?: (pageSize: number) => void;
  toggleRowExpansion?: (row: GridRow | GridRecord | string) => void;
  expandAllRows?: () => void;
  collapseAllRows?: () => void;
  toggleAllRows?: () => void;
  treeExpandAllRows?: () => void;
  treeCollapseAllRows?: () => void;
  treeToggleRow?: (row: GridRow | GridRecord | string) => void;
  treeExpandRow?: (row: GridRow | GridRecord | string) => void;
  treeCollapseRow?: (row: GridRow | GridRecord | string) => void;
  treeGetRowChildren?: (row: GridRow | GridRecord | string) => GridRow[];
  treeGetState?: () => Record<string, boolean>;
  treeSetState?: (state: Record<string, boolean>) => void;
  infiniteScrollDataLoaded?: (scrollUp?: boolean, scrollDown?: boolean) => void | Promise<void>;
  infiniteScrollReset?: (scrollUp?: boolean, scrollDown?: boolean) => void;
  infiniteScrollSaveScrollPercentage?: () => void;
  infiniteScrollDataRemovedTop?: (scrollUp?: boolean, scrollDown?: boolean) => void;
  infiniteScrollDataRemovedBottom?: (scrollUp?: boolean, scrollDown?: boolean) => void;
  infiniteScrollSetDirections?: (scrollUp: boolean, scrollDown: boolean) => void;
  saveState?: () => GridSavedState;
  restoreState?: (state: GridSavedState) => void;
  beginCellEdit?: (row: GridRow | GridRecord | string, columnName: string, triggerEvent?: Event | KeyboardEvent | null) => void;
  endCellEdit?: () => void;
  cancelCellEdit?: () => void;
  getEditingCell?: () => GridCellPosition | null;

  // Selection — ported from ui.grid.selection public API.
  toggleRowSelection?: (rowEntity: GridRecord, evt?: Event | null) => void;
  selectRow?: (rowEntity: GridRecord, evt?: Event | null) => void;
  selectRowByVisibleIndex?: (rowNum: number, evt?: Event | null) => void;
  selectRowByKey?: (isInEntity: boolean, key: string, comparator: unknown, evt?: Event | null, lookInRows?: readonly GridRow[]) => void;
  unSelectRow?: (rowEntity: GridRecord, evt?: Event | null) => void;
  unSelectRowByVisibleIndex?: (rowNum: number, evt?: Event | null) => void;
  unSelectRowByKey?: (isInEntity: boolean, key: string, comparator: unknown, evt?: Event | null, lookInRows?: readonly GridRow[]) => void;
  selectAllRows?: (evt?: Event | null) => void;
  selectAllVisibleRows?: (evt?: Event | null) => void;
  clearSelectedRows?: (evt?: Event | null) => void;
  getSelectedRows?: () => GridRecord[];
  getUnSelectedRows?: () => GridRecord[];
  getSelectedGridRows?: () => GridRow[];
  getUnSelectedGridRows?: () => GridRow[];
  getSelectedCount?: () => number;
  setMultiSelect?: (multiSelect: boolean) => void;
  setModifierKeysToMultiSelect?: (value: boolean) => void;
  getSelectAllState?: () => boolean;
  shiftSelectRow?: (rowEntity: GridRecord, evt?: Event | null) => void;

  // cellNav bindings — ports ui.grid.cellNav public API.
  scrollToFocus?: (rowEntity: GridRecord | null, colDef: GridColumnDef | null) => Promise<void>;
  getFocusedCell?: () => GridRowColumn | null;
  getCurrentSelection?: () => GridRowColumn[];
  rowColSelectIndex?: (rowCol: GridRowColumn) => number;

  // importer bindings — ports ui.grid.importer public API.
  importerImportAFile?: () => void;
  importerImportThisFile?: (file: File) => Promise<void>;
  importerImportText?: (text: string, type?: 'json' | 'csv') => void;

  // validate bindings — ports ui.grid.validate public API.
  validateIsInvalid?: (rowEntity: GridRecord, colDef: GridColumnDef) => boolean;
  validateGetErrorMessages?: (rowEntity: GridRecord, colDef: GridColumnDef) => string[];
  validateGetFormattedErrors?: (rowEntity: GridRecord, colDef: GridColumnDef) => string;
  validateGetTitleFormattedErrors?: (rowEntity: GridRecord, colDef: GridColumnDef) => string;
  validateRunValidators?: (
    rowEntity: GridRecord,
    colDef: GridColumnDef,
    newValue: unknown,
    oldValue: unknown,
  ) => Promise<string[]>;
  validateSetValidator?: (
    name: string,
    validatorFactory: GridValidatorFactory,
    messageFunction: GridValidatorMessageFn,
  ) => void;
  validateGetInvalidRows?: () => Promise<GridRecord[]>;

  // rowEdit bindings — ports ui.grid.rowEdit public API. The consumer
  // resolves save promises via `setSavePromise()` and flushes dirty rows
  // either by timer (automatic) or explicitly via `flushDirtyRows()`.
  rowEditSetSavePromise?: (rowEntity: GridRecord, savePromise: Promise<void>) => void;
  rowEditGetDirtyRows?: () => GridRow[];
  rowEditGetErrorRows?: () => GridRow[];
  rowEditFlushDirtyRows?: () => Promise<void>;
  rowEditRetryErroredRows?: () => Promise<void>;
  rowEditSetRowsDirty?: (rowEntities: readonly GridRecord[]) => void;
  rowEditSetRowsClean?: (rowEntities: readonly GridRecord[]) => void;
  rowEditGetMenuItems?: () => GridMenuItem[];

  // importer menu binding — returns the shared-shape menu items the
  // importer contributes (just the single "Import" entry by default).
  importerGetMenuItems?: () => GridMenuItem[];
}

export interface UiGridApi {
  core: {
    on: {
      renderingComplete: (listener: Listener<[UiGridApi]>) => () => void;
      filterChanged: (listener: Listener<[Record<string, string>]>) => () => void;
      rowsVisibleChanged: (listener: Listener<[GridRow[]]>) => () => void;
      rowsRendered: (listener: Listener<[GridRow[]]>) => () => void;
      scrollBegin: (listener: Listener<[]>) => () => void;
      scrollEnd: (listener: Listener<[]>) => () => void;
      canvasHeightChanged: (listener: Listener<[number, number]>) => () => void;
      gridDimensionChanged: (listener: Listener<[number, number, number, number]>) => () => void;
      sortChanged: (listener: Listener<[string | null, SortDirection]>) => () => void;
      groupingChanged: (listener: Listener<[string[]]>) => () => void;
      columnOrderChanged: (listener: Listener<[string[]]>) => () => void;
      benchmarkComplete: (listener: Listener<[GridBenchmarkResult]>) => () => void;
    };
    raise: {
      renderingComplete: (gridApi: UiGridApi) => void;
      filterChanged: (filters: Record<string, string>) => void;
      rowsVisibleChanged: (rows: GridRow[]) => void;
      rowsRendered: (rows: GridRow[]) => void;
      scrollBegin: () => void;
      scrollEnd: () => void;
      canvasHeightChanged: (oldHeight: number, newHeight: number) => void;
      gridDimensionChanged: (oldHeight: number, oldWidth: number, newHeight: number, newWidth: number) => void;
      sortChanged: (columnName: string | null, direction: SortDirection) => void;
      groupingChanged: (groupBy: string[]) => void;
      columnOrderChanged: (order: string[]) => void;
      benchmarkComplete: (result: GridBenchmarkResult) => void;
    };
    refresh: () => void;
    queueGridRefresh: () => void;
    queueRefresh: () => void;
    refreshRows: () => void;
    getVisibleRows: () => GridRow[];
    setRowInvisible: (row: GridRow | GridRecord | string, reason?: string) => void;
    clearRowInvisible: (row: GridRow | GridRecord | string, reason?: string) => void;
    setFilter: (columnName: string, value: string) => void;
    clearAllFilters: () => void;
    sortColumn: (columnName: string, direction?: SortDirection) => void;
    moveColumn: (fromIndex: number, toIndex: number) => void;
    groupByColumn: (columnName: string) => void;
    clearGrouping: () => void;
    benchmark: (iterations?: number) => Promise<GridBenchmarkResult>;
    exportCsv: (rowType?: GridExporterRowType, colType?: GridExporterColumnType) => void;
  };
  exporter: {
    csvExport: (rowType?: GridExporterRowType, colType?: GridExporterColumnType) => void;
    buildCsv: (rowType?: GridExporterRowType, colType?: GridExporterColumnType) => string;
    /** Triggers a PDF export. Requires `window.pdfMake` (global provided
     * by the pdfmake library). If pdfMake is not available the method
     * returns the docDefinition so the caller can render it themselves. */
    pdfExport: (
      rowType?: GridExporterRowType,
      colType?: GridExporterColumnType,
    ) => GridExporterPdfDocDefinition;
    /** Returns a pdfMake-ready document definition without triggering
     * `pdfMake.createPdf(...)`. */
    buildPdfDocDefinition: (
      rowType?: GridExporterRowType,
      colType?: GridExporterColumnType,
    ) => GridExporterPdfDocDefinition;
    /** Menu items ("Export all / visible / selected as CSV/PDF/Excel").
     * Matches the old `addToGridMenu` shape — callers filter by `shown()`. */
    getMenuItems: () => GridExporterMenuItem[];
    /** Excel export — requires `window.ExcelBuilder` (global provided by
     * the ExcelBuilder library). Returns the raw sheet data even when
     * ExcelBuilder is missing so the caller can persist it their own way. */
    excelExport: (
      rowType?: GridExporterRowType,
      colType?: GridExporterColumnType,
    ) => GridExporterExcelSheetData;
    /** Returns the 2D sheet data without attempting to generate an xlsx. */
    buildExcelSheetData: (
      rowType?: GridExporterRowType,
      colType?: GridExporterColumnType,
    ) => GridExporterExcelSheetData;
    /** Re-exposed so consumers can read + override exporter options
     * without reaching into the underlying grid options. */
    getOptions: () => GridExporterOptions;
    setOptions: (options: GridExporterOptions) => void;
  };
  pagination: {
    on: {
      paginationChanged: (listener: Listener<[number, number]>) => () => void;
    };
    raise: {
      paginationChanged: (currentPage: number, pageSize: number) => void;
    };
    getPage: () => number;
    getTotalPages: () => number;
    getFirstRowIndex: () => number;
    getLastRowIndex: () => number;
    nextPage: () => void;
    previousPage: () => void;
    seek: (page: number) => void;
    setPageSize: (pageSize: number) => void;
  };
  expandable: {
    on: {
      rowExpandedStateChanged: (listener: Listener<[GridRow, boolean]>) => () => void;
    };
    raise: {
      rowExpandedStateChanged: (row: GridRow, expanded: boolean) => void;
    };
    toggleRowExpansion: (row: GridRow | GridRecord | string) => void;
    expandAllRows: () => void;
    collapseAllRows: () => void;
    toggleAllRows: () => void;
  };
  treeBase: {
    on: {
      rowExpanded: (listener: Listener<[GridRow]>) => () => void;
      rowCollapsed: (listener: Listener<[GridRow]>) => () => void;
    };
    raise: {
      rowExpanded: (row: GridRow) => void;
      rowCollapsed: (row: GridRow) => void;
    };
    expandAllRows: () => void;
    collapseAllRows: () => void;
    toggleRowTreeState: (row: GridRow | GridRecord | string) => void;
    expandRow: (row: GridRow | GridRecord | string) => void;
    collapseRow: (row: GridRow | GridRecord | string) => void;
    getRowChildren: (row: GridRow | GridRecord | string) => GridRow[];
  };
  treeView: {
    getTreeView: () => Record<string, boolean>;
    setTreeView: (state: Record<string, boolean>) => void;
  };
  pinning: {
    on: {
      columnPinned: (listener: Listener<[string, PinDirection]>) => () => void;
    };
    raise: {
      columnPinned: (columnName: string, direction: PinDirection) => void;
    };
    pinColumn: (columnName: string, direction: PinDirection) => void;
  };
  infiniteScroll: {
    on: {
      needLoadMoreData: (listener: Listener<[]>) => () => void;
      needLoadMoreDataTop: (listener: Listener<[]>) => () => void;
    };
    raise: {
      needLoadMoreData: () => void;
      needLoadMoreDataTop: () => void;
    };
    dataLoaded: (scrollUp?: boolean, scrollDown?: boolean) => void | Promise<void>;
    resetScroll: (scrollUp?: boolean, scrollDown?: boolean) => void;
    saveScrollPercentage: () => void;
    dataRemovedTop: (scrollUp?: boolean, scrollDown?: boolean) => void;
    dataRemovedBottom: (scrollUp?: boolean, scrollDown?: boolean) => void;
    setScrollDirections: (scrollUp: boolean, scrollDown: boolean) => void;
  };
  saveState: {
    save: () => GridSavedState;
    restore: (state: GridSavedState) => void;
  };
  edit: {
    on: {
      beginCellEdit: (listener: Listener<[GridRecord, GridColumnDef, Event | KeyboardEvent | null | undefined]>) => () => void;
      afterCellEdit: (listener: Listener<[GridRecord, GridColumnDef, unknown, unknown]>) => () => void;
      cancelCellEdit: (listener: Listener<[GridRecord, GridColumnDef]>) => () => void;
    };
    raise: {
      beginCellEdit: (rowEntity: GridRecord, colDef: GridColumnDef, triggerEvent?: Event | KeyboardEvent | null) => void;
      afterCellEdit: (rowEntity: GridRecord, colDef: GridColumnDef, newValue: unknown, oldValue: unknown) => void;
      cancelCellEdit: (rowEntity: GridRecord, colDef: GridColumnDef) => void;
    };
    beginCellEdit: (row: GridRow | GridRecord | string, columnName: string, triggerEvent?: Event | KeyboardEvent | null) => void;
    endCellEdit: () => void;
    cancelCellEdit: () => void;
    getEditingCell: () => GridCellPosition | null;
  };
  selection: {
    on: {
      rowSelectionChanged: (listener: Listener<[GridRow, Event | null | undefined]>) => () => void;
      rowSelectionChangedBatch: (listener: Listener<[GridRow[], Event | null | undefined]>) => () => void;
      rowFocusChanged: (listener: Listener<[GridRow, Event | null | undefined]>) => () => void;
    };
    raise: {
      rowSelectionChanged: (row: GridRow, evt?: Event | null) => void;
      rowSelectionChangedBatch: (rows: GridRow[], evt?: Event | null) => void;
      rowFocusChanged: (row: GridRow, evt?: Event | null) => void;
    };
    toggleRowSelection: (rowEntity: GridRecord, evt?: Event | null) => void;
    selectRow: (rowEntity: GridRecord, evt?: Event | null) => void;
    selectRowByVisibleIndex: (rowNum: number, evt?: Event | null) => void;
    selectRowByKey: (isInEntity: boolean, key: string, comparator: unknown, evt?: Event | null, lookInRows?: readonly GridRow[]) => void;
    unSelectRow: (rowEntity: GridRecord, evt?: Event | null) => void;
    unSelectRowByVisibleIndex: (rowNum: number, evt?: Event | null) => void;
    unSelectRowByKey: (isInEntity: boolean, key: string, comparator: unknown, evt?: Event | null, lookInRows?: readonly GridRow[]) => void;
    selectAllRows: (evt?: Event | null) => void;
    selectAllVisibleRows: (evt?: Event | null) => void;
    clearSelectedRows: (evt?: Event | null) => void;
    getSelectedRows: () => GridRecord[];
    getUnSelectedRows: () => GridRecord[];
    getSelectedGridRows: () => GridRow[];
    getUnSelectedGridRows: () => GridRow[];
    getSelectedCount: () => number;
    setMultiSelect: (multiSelect: boolean) => void;
    setModifierKeysToMultiSelect: (value: boolean) => void;
    getSelectAllState: () => boolean;
    shiftSelectRow: (rowEntity: GridRecord, evt?: Event | null) => void;
  };
  cellNav: {
    on: {
      navigate: (listener: Listener<[GridRowColumn | null, GridRowColumn | null]>) => () => void;
      viewPortKeyDown: (listener: Listener<[KeyboardEvent, GridRowColumn | null]>) => () => void;
      viewPortKeyPress: (listener: Listener<[KeyboardEvent, GridRowColumn | null]>) => () => void;
    };
    raise: {
      navigate: (newRowCol: GridRowColumn | null, oldRowCol: GridRowColumn | null) => void;
      viewPortKeyDown: (event: KeyboardEvent, rowCol: GridRowColumn | null) => void;
      viewPortKeyPress: (event: KeyboardEvent, rowCol: GridRowColumn | null) => void;
    };
    scrollToFocus: (rowEntity: GridRecord | null, colDef: GridColumnDef | null) => Promise<void>;
    getFocusedCell: () => GridRowColumn | null;
    getCurrentSelection: () => GridRowColumn[];
    rowColSelectIndex: (rowCol: GridRowColumn) => number;
  };
  i18n: {
    on: {
      /** Fires when the active language changes. Listeners typically
       * call `gridApi.core.refresh()` to repaint with the new strings. */
      languageChanged: (listener: Listener<[GridLocaleCode]>) => () => void;
    };
    /** Return the labels bundle for a language (merged onto the en-US
     * defaults). Mirrors the old `i18nService.get`. */
    get: (lang: GridLocaleCode) => GridLabels;
    /** Register / overwrite a locale. Missing keys fall back to en-US. */
    add: (lang: GridLocaleCode, labels: Partial<GridLabels>) => void;
    /** Change the active language — triggers the `languageChanged` event
     * so consumers can refresh the grid. */
    setCurrentLang: (lang: GridLocaleCode) => void;
    getCurrentLang: () => GridLocaleCode;
    /** Returns every registered locale code. */
    getSupportedLanguages: () => GridLocaleCode[];
  };
  importer: {
    /** Trigger the consumer's file-picker flow — the vanilla element
     * mounts a hidden `<input type="file">` and dispatches a click when
     * invoked. Parity with `gridApi.importer.importAFile()` from the old
     * module. */
    importAFile: () => void;
    /** Parse + add an already-acquired File object. Parity with
     * `gridApi.importer.importThisFile(fileObject)`. */
    importThisFile: (file: File) => Promise<void>;
    /** Parse + add an already-loaded text payload. `type` forces one
     * parser over auto-detection (JSON tried first, CSV fallback). */
    importText: (text: string, type?: 'json' | 'csv') => void;
    /** Menu items the importer contributes. Currently just the single
     * "Import" entry (matching the old `importerMenuItemContainer`
     * directive) but kept as an array so consumers can concat it with
     * other feature menus. */
    getMenuItems: () => GridMenuItem[];
  };
  validate: {
    on: {
      /** Raised when any validator rejects a cell edit. Matches the old
       * `validationFailed` event shape. */
      validationFailed: (
        listener: Listener<[GridRecord, GridColumnDef, unknown, unknown]>,
      ) => () => void;
    };
    raise: {
      validationFailed: (
        rowEntity: GridRecord,
        colDef: GridColumnDef,
        newValue: unknown,
        oldValue: unknown,
      ) => void;
    };
    /** Returns true when the cell (row, col) is currently invalid.
     * Reads the `$$invalid<col>` marker on the entity. */
    isInvalid: (rowEntity: GridRecord, colDef: GridColumnDef) => boolean;
    /** Returns the list of localized error messages for the cell. */
    getErrorMessages: (rowEntity: GridRecord, colDef: GridColumnDef) => string[];
    /** HTML-formatted error block (with heading) suitable for a cell
     * tooltip / popover. Matches the old `getFormattedErrors`. */
    getFormattedErrors: (rowEntity: GridRecord, colDef: GridColumnDef) => string;
    /** Plaintext error block for the `title` attribute on a cell. */
    getTitleFormattedErrors: (rowEntity: GridRecord, colDef: GridColumnDef) => string;
    /** Run all validators for a single cell. Resolves when sync + async
     * validators have all settled. */
    runValidators: (
      rowEntity: GridRecord,
      colDef: GridColumnDef,
      newValue: unknown,
      oldValue: unknown,
    ) => Promise<string[]>;
    /** Register a custom validator. The factory receives the argument
     * declared in `colDef.validators[name]` and returns a function that
     * validates `(oldValue, newValue, rowEntity, colDef)`. */
    setValidator: (
      name: string,
      validatorFactory: GridValidatorFactory,
      messageFunction: GridValidatorMessageFn,
    ) => void;
    /** Full-grid sweep — returns every row that currently has at least
     * one invalid cell. Useful for "Save only valid rows" flows. */
    getInvalidRows: () => Promise<GridRecord[]>;
  };
  rowEdit: {
    on: {
      /** Fired when the configured wait interval elapses (or
       * `flushDirtyRows` is called). Listeners must call `setSavePromise`
       * synchronously before returning so the grid can await the result. */
      saveRow: (listener: Listener<[GridRecord]>) => () => void;
    };
    raise: {
      saveRow: (rowEntity: GridRecord) => void;
    };
    setSavePromise: (rowEntity: GridRecord, savePromise: Promise<void>) => void;
    getDirtyRows: () => GridRow[];
    getErrorRows: () => GridRow[];
    flushDirtyRows: () => Promise<void>;
    /** Re-fires `saveRow` for every row currently in the error state. */
    retryErroredRows: () => Promise<void>;
    setRowsDirty: (rowEntities: readonly GridRecord[]) => void;
    setRowsClean: (rowEntities: readonly GridRecord[]) => void;
    /** Menu items the row-edit feature contributes: "Save changes" +
     * "Retry errored rows". Each entry is gated by `shown()` so items
     * only surface when there are dirty / errored rows. */
    getMenuItems: () => GridMenuItem[];
  };
}

export function createGridApi(bindings: GridApiBindings): UiGridApi {
  const renderingComplete = new GridEvent<[UiGridApi]>();
  const filterChanged = new GridEvent<[Record<string, string>]>();
  const rowsVisibleChanged = new GridEvent<[GridRow[]]>();
  const rowsRendered = new GridEvent<[GridRow[]]>();
  const scrollBegin = new GridEvent<[]>();
  const scrollEnd = new GridEvent<[]>();
  const canvasHeightChanged = new GridEvent<[number, number]>();
  const gridDimensionChanged = new GridEvent<[number, number, number, number]>();
  const sortChanged = new GridEvent<[string | null, SortDirection]>();
  const groupingChanged = new GridEvent<[string[]]>();
  const columnOrderChanged = new GridEvent<[string[]]>();
  const benchmarkComplete = new GridEvent<[GridBenchmarkResult]>();
  const paginationChanged = new GridEvent<[number, number]>();
  const rowExpandedStateChanged = new GridEvent<[GridRow, boolean]>();
  const treeRowExpanded = new GridEvent<[GridRow]>();
  const treeRowCollapsed = new GridEvent<[GridRow]>();
  const needLoadMoreData = new GridEvent<[]>();
  const needLoadMoreDataTop = new GridEvent<[]>();
  const beginCellEditEvent = new GridEvent<[GridRecord, GridColumnDef, Event | KeyboardEvent | null | undefined]>();
  const afterCellEditEvent = new GridEvent<[GridRecord, GridColumnDef, unknown, unknown]>();
  const cancelCellEditEvent = new GridEvent<[GridRecord, GridColumnDef]>();
  const columnPinnedEvent = new GridEvent<[string, PinDirection]>();
  const rowSelectionChangedEvent = new GridEvent<[GridRow, Event | null | undefined]>();
  const rowSelectionChangedBatchEvent = new GridEvent<[GridRow[], Event | null | undefined]>();
  const rowFocusChangedEvent = new GridEvent<[GridRow, Event | null | undefined]>();
  const navigateEvent = new GridEvent<[GridRowColumn | null, GridRowColumn | null]>();
  const viewPortKeyDownEvent = new GridEvent<[KeyboardEvent, GridRowColumn | null]>();
  const viewPortKeyPressEvent = new GridEvent<[KeyboardEvent, GridRowColumn | null]>();
  const saveRowEvent = new GridEvent<[GridRecord]>();
  const validationFailedEvent = new GridEvent<[GridRecord, GridColumnDef, unknown, unknown]>();

  const noop = (): void => {};
  const falseState = (): Record<string, boolean> => ({});
  const emptyRows = (): GridRow[] => [];
  const saveState = (): GridSavedState => ({});
  const emptyPdfDoc: GridExporterPdfDocDefinition = {
    pageOrientation: 'landscape',
    pageSize: 'A4',
    content: [],
    styles: { tableStyle: {}, tableHeader: {} },
    defaultStyle: {},
  };
  const paginationGetPage = bindings.paginationGetPage ?? (() => 1);
  const paginationGetTotalPages = bindings.paginationGetTotalPages ?? (() => 1);
  const paginationGetFirstRowIndex = bindings.paginationGetFirstRowIndex ?? (() => 0);
  const paginationGetLastRowIndex = bindings.paginationGetLastRowIndex ?? (() => 0);
  const paginationNextPage = bindings.paginationNextPage ?? noop;
  const paginationPreviousPage = bindings.paginationPreviousPage ?? noop;
  const paginationSeek = bindings.paginationSeek ?? noop;
  const paginationSetPageSize = bindings.paginationSetPageSize ?? noop;
  const toggleRowExpansion = bindings.toggleRowExpansion ?? noop;
  const expandAllRows = bindings.expandAllRows ?? noop;
  const collapseAllRows = bindings.collapseAllRows ?? noop;
  const toggleAllRows = bindings.toggleAllRows ?? noop;
  const treeExpandAllRows = bindings.treeExpandAllRows ?? noop;
  const treeCollapseAllRows = bindings.treeCollapseAllRows ?? noop;
  const treeToggleRow = bindings.treeToggleRow ?? noop;
  const treeExpandRow = bindings.treeExpandRow ?? noop;
  const treeCollapseRow = bindings.treeCollapseRow ?? noop;
  const treeGetRowChildren = bindings.treeGetRowChildren ?? emptyRows;
  const treeGetState = bindings.treeGetState ?? falseState;
  const treeSetState = bindings.treeSetState ?? noop;
  const infiniteScrollDataLoaded = bindings.infiniteScrollDataLoaded ?? noop;
  const infiniteScrollReset = bindings.infiniteScrollReset ?? noop;
  const infiniteScrollSaveScrollPercentage = bindings.infiniteScrollSaveScrollPercentage ?? noop;
  const infiniteScrollDataRemovedTop = bindings.infiniteScrollDataRemovedTop ?? noop;
  const infiniteScrollDataRemovedBottom = bindings.infiniteScrollDataRemovedBottom ?? noop;
  const infiniteScrollSetDirections = bindings.infiniteScrollSetDirections ?? noop;
  const saveStateBinding = bindings.saveState ?? saveState;
  const restoreState = bindings.restoreState ?? noop;
  const beginCellEdit = bindings.beginCellEdit ?? noop;
  const endCellEdit = bindings.endCellEdit ?? noop;
  const cancelCellEdit = bindings.cancelCellEdit ?? noop;
  const getEditingCell = bindings.getEditingCell ?? (() => null);
  const pinColumnBinding = bindings.pinColumn ?? (() => {});

  // Selection bindings — each one has a safe default so a wrapper that
  // doesn't opt into selection never throws on api.selection.xxx().
  const toggleRowSelectionBinding = bindings.toggleRowSelection ?? noop;
  const selectRowBinding = bindings.selectRow ?? noop;
  const selectRowByVisibleIndexBinding = bindings.selectRowByVisibleIndex ?? noop;
  const selectRowByKeyBinding = bindings.selectRowByKey ?? noop;
  const unSelectRowBinding = bindings.unSelectRow ?? noop;
  const unSelectRowByVisibleIndexBinding = bindings.unSelectRowByVisibleIndex ?? noop;
  const unSelectRowByKeyBinding = bindings.unSelectRowByKey ?? noop;
  const selectAllRowsBinding = bindings.selectAllRows ?? noop;
  const selectAllVisibleRowsBinding = bindings.selectAllVisibleRows ?? noop;
  const clearSelectedRowsBinding = bindings.clearSelectedRows ?? noop;
  const getSelectedRowsBinding = bindings.getSelectedRows ?? ((): GridRecord[] => []);
  const getUnSelectedRowsBinding = bindings.getUnSelectedRows ?? ((): GridRecord[] => []);
  const getSelectedGridRowsBinding = bindings.getSelectedGridRows ?? emptyRows;
  const getUnSelectedGridRowsBinding = bindings.getUnSelectedGridRows ?? emptyRows;
  const getSelectedCountBinding = bindings.getSelectedCount ?? (() => 0);
  const setMultiSelectBinding = bindings.setMultiSelect ?? noop;
  const setModifierKeysToMultiSelectBinding = bindings.setModifierKeysToMultiSelect ?? noop;
  const getSelectAllStateBinding = bindings.getSelectAllState ?? (() => false);
  const shiftSelectRowBinding = bindings.shiftSelectRow ?? noop;

  // Importer bindings — no-op defaults so consumers that skip `enableImporter`
  // can still read api.importer.* without throwing.
  const importerImportAFileBinding = bindings.importerImportAFile ?? noop;
  const importerImportThisFileBinding =
    bindings.importerImportThisFile ?? ((): Promise<void> => Promise.resolve());
  const importerImportTextBinding = bindings.importerImportText ?? noop;
  const emptyMenuItems = (): GridMenuItem[] => [];
  const importerGetMenuItemsBinding = bindings.importerGetMenuItems ?? emptyMenuItems;

  // Validate bindings — no-op defaults.
  const validateIsInvalidBinding =
    bindings.validateIsInvalid ?? ((): boolean => false);
  const emptyErrors = (): string[] => [];
  const emptyErrorBlock = (): string => '';
  const validateGetErrorMessagesBinding = bindings.validateGetErrorMessages ?? emptyErrors;
  const validateGetFormattedErrorsBinding =
    bindings.validateGetFormattedErrors ?? emptyErrorBlock;
  const validateGetTitleFormattedErrorsBinding =
    bindings.validateGetTitleFormattedErrors ?? emptyErrorBlock;
  const validateRunValidatorsBinding =
    bindings.validateRunValidators ?? ((): Promise<string[]> => Promise.resolve([]));
  const validateSetValidatorBinding = bindings.validateSetValidator ?? noop;
  const validateGetInvalidRowsBinding =
    bindings.validateGetInvalidRows ?? ((): Promise<GridRecord[]> => Promise.resolve([]));

  // rowEdit bindings — default implementations are no-ops / empty-array so
  // a consumer that doesn't wire rowEdit never throws on api.rowEdit.xxx().
  const rowEditSetSavePromiseBinding = bindings.rowEditSetSavePromise ?? noop;
  const rowEditGetDirtyRowsBinding = bindings.rowEditGetDirtyRows ?? emptyRows;
  const rowEditGetErrorRowsBinding = bindings.rowEditGetErrorRows ?? emptyRows;
  const rowEditFlushDirtyRowsBinding =
    bindings.rowEditFlushDirtyRows ?? ((): Promise<void> => Promise.resolve());
  const rowEditRetryErroredRowsBinding =
    bindings.rowEditRetryErroredRows ?? ((): Promise<void> => Promise.resolve());
  const rowEditSetRowsDirtyBinding = bindings.rowEditSetRowsDirty ?? noop;
  const rowEditSetRowsCleanBinding = bindings.rowEditSetRowsClean ?? noop;
  const rowEditGetMenuItemsBinding = bindings.rowEditGetMenuItems ?? emptyMenuItems;

  // cellNav bindings — defaults keep the API surface intact even when a
  // wrapper doesn't opt into cellnav.
  const scrollToFocusBinding =
    bindings.scrollToFocus ?? ((): Promise<void> => Promise.resolve());
  const getFocusedCellBinding = bindings.getFocusedCell ?? ((): GridRowColumn | null => null);
  const getCurrentSelectionBinding =
    bindings.getCurrentSelection ?? ((): GridRowColumn[] => []);
  const rowColSelectIndexBinding = bindings.rowColSelectIndex ?? ((): number => -1);

  const api: UiGridApi = {
    core: {
      on: {
        renderingComplete: (listener) => renderingComplete.subscribe(listener),
        filterChanged: (listener) => filterChanged.subscribe(listener),
        rowsVisibleChanged: (listener) => rowsVisibleChanged.subscribe(listener),
        rowsRendered: (listener) => rowsRendered.subscribe(listener),
        scrollBegin: (listener) => scrollBegin.subscribe(listener),
        scrollEnd: (listener) => scrollEnd.subscribe(listener),
        canvasHeightChanged: (listener) => canvasHeightChanged.subscribe(listener),
        gridDimensionChanged: (listener) => gridDimensionChanged.subscribe(listener),
        sortChanged: (listener) => sortChanged.subscribe(listener),
        groupingChanged: (listener) => groupingChanged.subscribe(listener),
        columnOrderChanged: (listener) => columnOrderChanged.subscribe(listener),
        benchmarkComplete: (listener) => benchmarkComplete.subscribe(listener)
      },
      raise: {
        renderingComplete: (gridApi) => renderingComplete.emit(gridApi),
        filterChanged: (filters) => filterChanged.emit(filters),
        rowsVisibleChanged: (rows) => rowsVisibleChanged.emit(rows),
        rowsRendered: (rows) => rowsRendered.emit(rows),
        scrollBegin: () => scrollBegin.emit(),
        scrollEnd: () => scrollEnd.emit(),
        canvasHeightChanged: (oldHeight, newHeight) => canvasHeightChanged.emit(oldHeight, newHeight),
        gridDimensionChanged: (oldHeight, oldWidth, newHeight, newWidth) =>
          gridDimensionChanged.emit(oldHeight, oldWidth, newHeight, newWidth),
        sortChanged: (columnName, direction) => sortChanged.emit(columnName, direction),
        groupingChanged: (groupBy) => groupingChanged.emit(groupBy),
        columnOrderChanged: (order) => columnOrderChanged.emit(order),
        benchmarkComplete: (result) => benchmarkComplete.emit(result)
      },
      refresh: bindings.refresh,
      queueGridRefresh: bindings.refresh,
      queueRefresh: bindings.refresh,
      refreshRows: bindings.refresh,
      getVisibleRows: bindings.getVisibleRows,
      setRowInvisible: bindings.setRowInvisible,
      clearRowInvisible: bindings.clearRowInvisible,
      setFilter: bindings.setFilter,
      clearAllFilters: bindings.clearAllFilters,
      sortColumn: bindings.sortColumn,
      moveColumn: bindings.moveColumn,
      groupByColumn: bindings.toggleGrouping,
      clearGrouping: bindings.clearGrouping,
      benchmark: bindings.benchmark,
      exportCsv: bindings.exportCsv
    },
    exporter: {
      csvExport: bindings.exportCsv,
      buildCsv:
        bindings.buildCsv ??
        ((): string => ''),
      pdfExport:
        bindings.pdfExport ??
        ((): GridExporterPdfDocDefinition => emptyPdfDoc),
      buildPdfDocDefinition:
        bindings.buildPdfDocDefinition ??
        ((): GridExporterPdfDocDefinition => emptyPdfDoc),
      excelExport:
        bindings.excelExport ??
        ((): GridExporterExcelSheetData => []),
      buildExcelSheetData:
        bindings.buildExcelSheetData ??
        ((): GridExporterExcelSheetData => []),
      getMenuItems: bindings.getExporterMenuItems ?? ((): GridExporterMenuItem[] => []),
      getOptions: bindings.getExporterOptions ?? ((): GridExporterOptions => ({})),
      setOptions: bindings.setExporterOptions ?? noop
    },
    pagination: {
      on: {
        paginationChanged: (listener) => paginationChanged.subscribe(listener)
      },
      raise: {
        paginationChanged: (currentPage, pageSize) => paginationChanged.emit(currentPage, pageSize)
      },
      getPage: paginationGetPage,
      getTotalPages: paginationGetTotalPages,
      getFirstRowIndex: paginationGetFirstRowIndex,
      getLastRowIndex: paginationGetLastRowIndex,
      nextPage: paginationNextPage,
      previousPage: paginationPreviousPage,
      seek: paginationSeek,
      setPageSize: paginationSetPageSize
    },
    expandable: {
      on: {
        rowExpandedStateChanged: (listener) => rowExpandedStateChanged.subscribe(listener)
      },
      raise: {
        rowExpandedStateChanged: (row, expanded) => rowExpandedStateChanged.emit(row, expanded)
      },
      toggleRowExpansion,
      expandAllRows,
      collapseAllRows,
      toggleAllRows
    },
    treeBase: {
      on: {
        rowExpanded: (listener) => treeRowExpanded.subscribe(listener),
        rowCollapsed: (listener) => treeRowCollapsed.subscribe(listener)
      },
      raise: {
        rowExpanded: (row) => treeRowExpanded.emit(row),
        rowCollapsed: (row) => treeRowCollapsed.emit(row)
      },
      expandAllRows: treeExpandAllRows,
      collapseAllRows: treeCollapseAllRows,
      toggleRowTreeState: treeToggleRow,
      expandRow: treeExpandRow,
      collapseRow: treeCollapseRow,
      getRowChildren: treeGetRowChildren
    },
    treeView: {
      getTreeView: treeGetState,
      setTreeView: treeSetState
    },
    pinning: {
      on: {
        columnPinned: (listener) => columnPinnedEvent.subscribe(listener)
      },
      raise: {
        columnPinned: (columnName, direction) => columnPinnedEvent.emit(columnName, direction)
      },
      pinColumn: pinColumnBinding
    },
    infiniteScroll: {
      on: {
        needLoadMoreData: (listener) => needLoadMoreData.subscribe(listener),
        needLoadMoreDataTop: (listener) => needLoadMoreDataTop.subscribe(listener)
      },
      raise: {
        needLoadMoreData: () => needLoadMoreData.emit(),
        needLoadMoreDataTop: () => needLoadMoreDataTop.emit()
      },
      dataLoaded: infiniteScrollDataLoaded,
      resetScroll: infiniteScrollReset,
      saveScrollPercentage: infiniteScrollSaveScrollPercentage,
      dataRemovedTop: infiniteScrollDataRemovedTop,
      dataRemovedBottom: infiniteScrollDataRemovedBottom,
      setScrollDirections: infiniteScrollSetDirections
    },
    saveState: {
      save: saveStateBinding,
      restore: restoreState
    },
    edit: {
      on: {
        beginCellEdit: (listener) => beginCellEditEvent.subscribe(listener),
        afterCellEdit: (listener) => afterCellEditEvent.subscribe(listener),
        cancelCellEdit: (listener) => cancelCellEditEvent.subscribe(listener)
      },
      raise: {
        beginCellEdit: (rowEntity, colDef, triggerEvent) => beginCellEditEvent.emit(rowEntity, colDef, triggerEvent),
        afterCellEdit: (rowEntity, colDef, newValue, oldValue) => afterCellEditEvent.emit(rowEntity, colDef, newValue, oldValue),
        cancelCellEdit: (rowEntity, colDef) => cancelCellEditEvent.emit(rowEntity, colDef)
      },
      beginCellEdit,
      endCellEdit,
      cancelCellEdit,
      getEditingCell
    },
    selection: {
      on: {
        rowSelectionChanged: (listener) => rowSelectionChangedEvent.subscribe(listener),
        rowSelectionChangedBatch: (listener) => rowSelectionChangedBatchEvent.subscribe(listener),
        rowFocusChanged: (listener) => rowFocusChangedEvent.subscribe(listener)
      },
      raise: {
        rowSelectionChanged: (row, evt) => rowSelectionChangedEvent.emit(row, evt),
        rowSelectionChangedBatch: (rows, evt) => rowSelectionChangedBatchEvent.emit(rows, evt),
        rowFocusChanged: (row, evt) => rowFocusChangedEvent.emit(row, evt)
      },
      toggleRowSelection: toggleRowSelectionBinding,
      selectRow: selectRowBinding,
      selectRowByVisibleIndex: selectRowByVisibleIndexBinding,
      selectRowByKey: selectRowByKeyBinding,
      unSelectRow: unSelectRowBinding,
      unSelectRowByVisibleIndex: unSelectRowByVisibleIndexBinding,
      unSelectRowByKey: unSelectRowByKeyBinding,
      selectAllRows: selectAllRowsBinding,
      selectAllVisibleRows: selectAllVisibleRowsBinding,
      clearSelectedRows: clearSelectedRowsBinding,
      getSelectedRows: getSelectedRowsBinding,
      getUnSelectedRows: getUnSelectedRowsBinding,
      getSelectedGridRows: getSelectedGridRowsBinding,
      getUnSelectedGridRows: getUnSelectedGridRowsBinding,
      getSelectedCount: getSelectedCountBinding,
      setMultiSelect: setMultiSelectBinding,
      setModifierKeysToMultiSelect: setModifierKeysToMultiSelectBinding,
      getSelectAllState: getSelectAllStateBinding,
      shiftSelectRow: shiftSelectRowBinding
    },
    cellNav: {
      on: {
        navigate: (listener) => navigateEvent.subscribe(listener),
        viewPortKeyDown: (listener) => viewPortKeyDownEvent.subscribe(listener),
        viewPortKeyPress: (listener) => viewPortKeyPressEvent.subscribe(listener)
      },
      raise: {
        navigate: (newRowCol, oldRowCol) => navigateEvent.emit(newRowCol, oldRowCol),
        viewPortKeyDown: (event, rowCol) => viewPortKeyDownEvent.emit(event, rowCol),
        viewPortKeyPress: (event, rowCol) => viewPortKeyPressEvent.emit(event, rowCol)
      },
      scrollToFocus: scrollToFocusBinding,
      getFocusedCell: getFocusedCellBinding,
      getCurrentSelection: getCurrentSelectionBinding,
      rowColSelectIndex: rowColSelectIndexBinding
    },
    i18n: {
      on: {
        languageChanged: (listener) => gridI18n.onLanguageChanged(listener)
      },
      get: (lang) => gridI18n.get(lang),
      add: (lang, labels) => gridI18n.add(lang, labels),
      setCurrentLang: (lang) => gridI18n.setCurrentLang(lang),
      getCurrentLang: () => gridI18n.getCurrentLang(),
      getSupportedLanguages: () => gridI18n.getSupportedLanguages()
    },
    importer: {
      importAFile: importerImportAFileBinding,
      importThisFile: importerImportThisFileBinding,
      importText: importerImportTextBinding,
      getMenuItems: importerGetMenuItemsBinding
    },
    validate: {
      on: {
        validationFailed: (listener) => validationFailedEvent.subscribe(listener)
      },
      raise: {
        validationFailed: (rowEntity, colDef, newValue, oldValue) =>
          validationFailedEvent.emit(rowEntity, colDef, newValue, oldValue)
      },
      isInvalid: validateIsInvalidBinding,
      getErrorMessages: validateGetErrorMessagesBinding,
      getFormattedErrors: validateGetFormattedErrorsBinding,
      getTitleFormattedErrors: validateGetTitleFormattedErrorsBinding,
      runValidators: validateRunValidatorsBinding,
      setValidator: validateSetValidatorBinding,
      getInvalidRows: validateGetInvalidRowsBinding
    },
    rowEdit: {
      on: {
        saveRow: (listener) => saveRowEvent.subscribe(listener)
      },
      raise: {
        saveRow: (rowEntity) => saveRowEvent.emit(rowEntity)
      },
      setSavePromise: rowEditSetSavePromiseBinding,
      getDirtyRows: rowEditGetDirtyRowsBinding,
      getErrorRows: rowEditGetErrorRowsBinding,
      flushDirtyRows: rowEditFlushDirtyRowsBinding,
      retryErroredRows: rowEditRetryErroredRowsBinding,
      setRowsDirty: rowEditSetRowsDirtyBinding,
      setRowsClean: rowEditSetRowsCleanBinding,
      getMenuItems: rowEditGetMenuItemsBinding
    }
  };

  return api;
}