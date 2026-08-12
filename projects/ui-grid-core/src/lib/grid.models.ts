import { FilterCondition, SortDirection } from './grid.constants';
import { nextUid } from './grid.utils';
import defaultLabels from './i18n/en-US.json';

export interface GridTemplateRefLike<Context = unknown> {
  createEmbeddedView?(context: Context): unknown;
}

export type GridRecord = Record<string, unknown>;

export type GridSortFn = (left: unknown, right: unknown) => number;

export type GridFilterPredicate = (
  term: unknown,
  value: unknown,
  row: GridRecord,
  column: GridColumnDef,
) => boolean;

export type GridFilterOperator = FilterCondition | RegExp | GridFilterPredicate;

export interface GridFilterFlags {
  caseSensitive?: boolean;
  date?: boolean;
}

export interface GridFilterDescriptor {
  term?: unknown;
  condition?: GridFilterOperator;
  flags?: GridFilterFlags;
  rawTerm?: boolean;
  noTerm?: boolean;
}

export interface GridCellTemplateContext {
  $implicit: unknown;
  value: unknown;
  row: GridRecord;
  column: GridColumnDef;
  rowIndex: number;
}

export interface GridHeaderTemplateContext {
  $implicit: string;
  value: string;
  column: GridColumnDef;
}

export interface GridCellEditableContext {
  row: GridRecord;
  column: GridColumnDef;
  rowIndex: number;
  triggerEvent?: Event | KeyboardEvent | null;
}

export interface GridCellPosition {
  rowId: string;
  columnName: string;
}

/**
 * Key event override descriptor — ports the old grid's
 * `keyDownOverrides[i]` shape. When a keydown matches every field that's
 * specified, cellnav emits `viewPortKeyDown` instead of handling the key
 * itself. Unspecified fields are wildcards (match any value).
 */
export interface GridKeyEventOverride {
  keyCode?: number;
  key?: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

/** Snapshot of a (row, col) focus target. Exposed through the cellNav
 * public API so consumers can read `.row.entity` / `.col.name` the same
 * way they did with the old grid. */
export interface GridRowColumn {
  row: GridRow;
  col: GridColumnDef;
}

export type GridCellEditableCondition = boolean | ((context: GridCellEditableContext) => boolean);
export type GridColumnType = 'string' | 'number' | 'boolean' | 'date' | 'object';

export interface GridExpandableTemplateContext {
  $implicit: GridRecord;
  row: GridRecord;
  rowIndex: number;
  expanded: boolean;
}

export interface GridSortDescriptor {
  direction?: SortDirection;
  priority?: number;
  ignoreSort?: boolean;
}

export interface GridColumnDef {
  name: string;
  displayName?: string;
  field?: string;
  type?: GridColumnType;
  visible?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableGrouping?: boolean;
  enableCellEdit?: boolean;
  enableCellEditOnFocus?: boolean;
  /** Pinning */
  pinnedLeft?: boolean;
  pinnedRight?: boolean;
  enablePinning?: boolean;
  /** Validators — matches the old `colDef.validators` shape: each key is
   * the validator name registered with `uiGridValidateService`, each value
   * is the argument passed to the factory. Built-in names are `required`,
   * `minLength`, `maxLength`; consumers register additional validators
   * with `gridApi.validate.setValidator()`. */
  validators?: Record<string, unknown>;
  /** Exporter — if true the exporter skips this column entirely. Ports the
   * old grid's `colDef.exporterSuppressExport`. */
  exporterSuppressExport?: boolean;
  /** Per-column override for PDF alignment. Ports `colDef.exporterPdfAlign`. */
  exporterPdfAlign?: 'left' | 'right' | 'center' | string;
  cellEditableCondition?: GridCellEditableCondition;
  editModelField?: string;
  width?: string;
  minWidth?: number;
  maxWidth?: number;
  enableColumnResizing?: boolean;
  enableColumnMoving?: boolean;
  align?: 'start' | 'center' | 'end';
  sort?: GridSortDescriptor;
  filter?: GridFilterDescriptor;
  sortingAlgorithm?: GridSortFn;
  valueGetter?: (row: GridRecord) => unknown;
  formatter?: (value: unknown, row: GridRecord) => string;
  headerRenderer?: (context: GridHeaderTemplateContext) => string;
  cellTemplate?: GridTemplateRefLike<GridCellTemplateContext>;
  cellRenderer?: (context: GridCellTemplateContext) => string;
}

export interface GridGroupingOptions {
  groupBy?: string[];
  startCollapsed?: boolean;
}

export interface GridBenchmarkOptions {
  iterations?: number;
}

export interface GridSavedState {
  columnOrder?: string[];
  filters?: Record<string, string>;
  sort?: SortState;
  grouping?: string[];
  pagination?: {
    paginationCurrentPage: number;
    paginationPageSize: number;
  };
  expandable?: Record<string, boolean>;
  treeView?: Record<string, boolean>;
  pinning?: Record<string, 'left' | 'right'>;
}

export interface GridLabels {
  /** Sort button – unsorted state */
  sortDefault: string;
  /** Sort button – ascending */
  sortAsc: string;
  /** Sort button – descending */
  sortDesc: string;
  /** Group toggle – not grouped */
  groupColumn: string;
  /** Group toggle – grouped */
  ungroupColumn: string;
  /** Group row – collapse */
  groupCollapse: string;
  /** Group row – expand */
  groupExpand: string;
  /** Tree toggle – collapse */
  treeCollapse: string;
  /** Tree toggle – expand */
  treeExpand: string;
  /** Expand detail row */
  expandDetail: string;
  /** Collapse detail row */
  collapseDetail: string;
  /** Filter input placeholder */
  filterPlaceholder: string;
  /** Filter input placeholder when disabled */
  filterDisabled: string;
  /** Filter column sr-only prefix ("Filter" in "Filter {column}") */
  filterColumn: string;
  /** Pagination – previous page */
  paginationPrevious: string;
  /** Pagination – next page */
  paginationNext: string;
  /** Pagination – "Page" prefix in "Page X of Y" */
  paginationPage: string;
  /** Pagination – "of" in "Page X of Y" */
  paginationOf: string;
  /** Pagination – page size label */
  paginationRows: string;
  /** Empty state heading (fallback if emptyMessage not set) */
  emptyHeading: string;
  /** Empty state description */
  emptyDescription: string;
  /** Toolbar – "of" in "X of Y rows" */
  toolbarOf: string;
  /** Toolbar – "rows" */
  toolbarRows: string;
  /** Stats card – "visible rows" */
  statsVisibleRows: string;
  /** Group row – "rows" suffix */
  groupRowsSuffix: string;
  /** Pin trigger for choosing left or right */
  pinColumn: string;
  /** Pin left action */
  pinLeft: string;
  /** Pin right action */
  pinRight: string;
  /** Unpin action */
  unpin: string;
  /** Exporter menu — "Export all data as csv" */
  exporterAllAsCsv: string;
  /** Exporter menu — "Export visible data as csv" */
  exporterVisibleAsCsv: string;
  /** Exporter menu — "Export selected data as csv" */
  exporterSelectedAsCsv: string;
  /** Exporter menu — "Export all data as pdf" */
  exporterAllAsPdf: string;
  /** Exporter menu — "Export visible data as pdf" */
  exporterVisibleAsPdf: string;
  /** Exporter menu — "Export selected data as pdf" */
  exporterSelectedAsPdf: string;
  /** Exporter menu — "Export all data as excel" */
  exporterAllAsExcel: string;
  /** Exporter menu — "Export visible data as excel" */
  exporterVisibleAsExcel: string;
  /** Exporter menu — "Export selected data as excel" */
  exporterSelectedAsExcel: string;
  /** Importer menu — "Import" */
  importerTitle: string;
  /** Importer menu — "File" */
  importerFileLabel: string;
  /** Importer error — "File could not be processed as JSON" */
  importerInvalidJson: string;
  /** Importer error — "Import failed, file is not an array" */
  importerJsonNotArray: string;
  /** Importer error — "File could not be processed as CSV" */
  importerInvalidCsv: string;
  /** Importer error — "Objects could not be derived from the imported file" */
  importerNoObjects: string;
  /** Importer error — "Column names could not be derived" */
  importerNoHeaders: string;
  /** Validate — error heading when rendering error messages. */
  validateError: string;
  /** Validate — "required" validator message. */
  validateRequired: string;
  /** Validate — "minLength" validator message, with `THRESHOLD` token. */
  validateMinLength: string;
  /** Validate — "maxLength" validator message, with `THRESHOLD` token. */
  validateMaxLength: string;
  /** Row-edit menu — "Save changes" action. */
  rowEditFlushAll: string;
  /** Row-edit menu — "Retry errored rows" action (re-fires saveRow for
   * every row currently in the error state). */
  rowEditRetryErrors: string;
}

/**
 * Default English (en-US) labels loaded from `i18n/en-US.json`.
 * A future build step can swap in a different JSON file at compile time.
 * At runtime, consumers can pass `labels: Partial<GridLabels>` in GridOptions
 * to override individual keys — missing keys are backfilled from this default.
 */
export const DEFAULT_GRID_LABELS: Readonly<GridLabels> = defaultLabels;

export interface GridOptions {
  id: string;
  title?: string;
  data: readonly GridRecord[];
  columnDefs: readonly GridColumnDef[];
  labels?: Partial<GridLabels>;
  rowHeight?: number;
  headerRowHeight?: number;
  emptyMessage?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableGrouping?: boolean;
  enableColumnMoving?: boolean;
  enableColumnResizing?: boolean;
  enableVirtualization?: boolean;
  enableCellEdit?: boolean;
  enableCellEditOnFocus?: boolean;
  cellEditableCondition?: GridCellEditableCondition;
  enablePagination?: boolean;
  enablePaginationControls?: boolean;
  useExternalPagination?: boolean;
  paginationPageSizes?: number[] | null;
  paginationPageSize?: number;
  paginationCurrentPage?: number;
  totalItems?: number;
  enableExpandable?: boolean;
  expandableRowHeight?: number;
  expandableRowHeaderWidth?: number;
  expandableRowTemplate?: GridTemplateRefLike<GridExpandableTemplateContext>;
  /** Internal bridge hint used only for JS↔wasm parity. Mirrors whether
   * an expandable template is actually available after function-valued
   * fields are stripped from the wasm payload. */
  hasExpandableRowTemplate?: boolean;
  expandableRowScope?: Record<string, unknown>;
  enableTreeView?: boolean;
  treeChildrenField?: string;
  treeIndent?: number;
  showTreeExpandNoChildren?: boolean;
  treeRowHeaderAlwaysVisible?: boolean;
  enableAutoResize?: boolean;
  /** Master toggle for infinite-scroll. When false, `needLoadMoreData` /
   * `needLoadMoreDataTop` never fire regardless of the direction flags. */
  enableInfiniteScroll?: boolean;
  infiniteScrollRowsFromEnd?: number;
  infiniteScrollUp?: boolean;
  infiniteScrollDown?: boolean;
  virtualizationThreshold?: number;
  minRowsToShow?: number;
  enableMinHeightCheck?: boolean;
  grouping?: GridGroupingOptions;
  /** Enable column pinning (freeze left/right) */
  enablePinning?: boolean;
  /** Selection — ports ui.grid.selection options. Defaults match the
   * original module so existing consumers get identical behaviour. */
  enableRowSelection?: boolean;
  multiSelect?: boolean;
  noUnselect?: boolean;
  modifierKeysToMultiSelect?: boolean;
  enableRowHeaderSelection?: boolean;
  enableFullRowSelection?: boolean;
  enableFocusRowOnRowHeaderClick?: boolean;
  enableSelectRowOnFocus?: boolean;
  enableSelectAll?: boolean;
  enableSelectionBatchEvent?: boolean;
  selectionRowHeaderWidth?: number;
  enableFooterTotalSelected?: boolean;
  isRowSelectable?: (row: GridRow) => boolean;
  /** saveState — opt-in/out per field. Defaults mirror the old grid:
   * true for saveWidths/saveOrder/saveVisible/saveSort/saveFilter/
   * saveSelection/saveGrouping/savePinning/saveTreeView; false for
   * saveScroll/saveGroupingExpandedStates; saveFocus defaults true unless
   * saveScroll is true. */
  saveWidths?: boolean;
  saveOrder?: boolean;
  saveScroll?: boolean;
  saveFocus?: boolean;
  saveVisible?: boolean;
  saveSort?: boolean;
  saveFilter?: boolean;
  saveSelection?: boolean;
  saveGrouping?: boolean;
  saveGroupingExpandedStates?: boolean;
  savePinning?: boolean;
  saveTreeView?: boolean;
  savePagination?: boolean;
  /** Exporter — field-for-field parity with the old `ui.grid.exporter` options.
   * See `GridExporterOptions` in grid.core.export.ts for full docs. */
  exporterCsvColumnSeparator?: string;
  exporterCsvFilename?: string | ((rowType: 'all' | 'visible' | 'selected', colType: 'all' | 'visible') => string);
  exporterHeaderFilterUseName?: boolean;
  exporterHeaderFilter?: (displayName: string, column: GridColumnDef) => string;
  exporterHeaderTemplate?: string;
  exporterShowHeader?: boolean;
  exporterFieldCallback?: (row: GridRow, column: GridColumnDef, value: unknown) => unknown;
  exporterFieldFormatCallback?: (
    row: GridRow,
    column: GridColumnDef,
    value: unknown,
  ) => string | undefined | null;
  exporterFieldApplyFilters?: boolean;
  exporterSuppressColumns?: readonly string[];
  exporterOlderExcelCompatibility?: boolean;
  exporterIsExcelCompatible?: boolean;
  exporterAllDataFn?: () => readonly GridRow[] | Promise<readonly GridRow[]>;
  exporterExcelFilename?: string | ((rowType: 'all' | 'visible' | 'selected', colType: 'all' | 'visible') => string);
  exporterExcelSheetName?: string | ((rowType: 'all' | 'visible' | 'selected', colType: 'all' | 'visible') => string);
  exporterExcelHeader?: unknown;
  exporterColumnScaleFactor?: number;
  exporterExcelCustomFormatters?: (context: { workbook?: unknown; docDefinition: { styles: Record<string, unknown> } }) => {
    styles: Record<string, unknown>;
  };
  exporterCsvLinkElement?: HTMLElement | null;
  exporterSuppressMenu?: boolean;
  exporterMenuLabel?: string;
  exporterMenuItemOrder?: number;
  exporterMenuCsv?: boolean;
  exporterMenuPdf?: boolean;
  exporterMenuExcel?: boolean;
  exporterMenuAllData?: boolean;
  exporterMenuVisibleData?: boolean;
  exporterMenuSelectedData?: boolean;
  /** PDF options. See `GridExporterPdfOptions` in grid.core.export.ts for
   * the full shape. All are pdfMake-format (pageSize/orientation strings,
   * style objects, etc.) so the resulting doc definition plugs straight
   * into `pdfMake.createPdf(...)`. */
  exporterPdfFilename?: string | ((rowType: 'all' | 'visible' | 'selected', colType: 'all' | 'visible') => string);
  exporterPdfOrientation?: string;
  exporterPdfPageSize?: string;
  exporterPdfMaxGridWidth?: number;
  exporterPdfDefaultStyle?: unknown;
  exporterPdfTableStyle?: unknown;
  exporterPdfTableHeaderStyle?: unknown;
  exporterPdfLayout?: unknown;
  exporterPdfHeader?: unknown;
  exporterPdfFooter?: unknown;
  exporterPdfCustomFormatter?: (doc: unknown) => unknown;
  /** Cellnav — ports ui.grid.cellNav options. */
  modifierKeysToMultiSelectCells?: boolean;
  /** Key events that bypass cellNav's default handling and bubble up as
   * viewPortKeyDown / viewPortKeyPress instead. Mirrors the old grid's
   * keyDownOverrides array — each entry specifies the key + modifier
   * combination that should be overridden. */
  keyDownOverrides?: readonly GridKeyEventOverride[];
  /** Importer — ports the `importer*` option bundle from
   * `ui.grid.importer`. See `GridImporterOptions` in grid.core.importer.ts
   * for the detailed shape. */
  enableImporter?: boolean;
  importerShowMenu?: boolean;
  importerProcessHeaders?: (headerRow: readonly string[]) => ReadonlyArray<string | null>;
  importerHeaderFilter?: (displayName: string) => string;
  importerErrorCallback?: (
    errorKey:
      | 'importer.invalidJson'
      | 'importer.jsonNotarray'
      | 'importer.invalidCsv'
      | 'importer.noObjects'
      | 'importer.noHeaders',
    consoleMessage: string,
    context: unknown,
  ) => void;
  importerDataAddCallback?: (newObjects: readonly GridRecord[]) => void;
  importerNewObject?: new () => GridRecord;
  importerObjectCallback?: (newObject: GridRecord) => GridRecord;
  /** Importer gridMenu entry — an "Import" item that triggers the file
   * picker. `importerMenuItemOrder` defaults to 400 so the entry lands
   * after the exporter (base 200) + row-edit (base 300) groups. */
  importerMenuItemOrder?: number;
  /** Row-edit gridMenu entries. `rowEditMenuFlushDirtyRows` wires a
   * "Save dirty rows" action; `rowEditMenuCancelDirtyRows` wires a
   * "Discard changes" action. `rowEditMenuItemOrder` defaults to 300. */
  rowEditMenuItemOrder?: number;
  rowEditMenuFlushDirtyRows?: boolean;
  rowEditMenuCancelDirtyRows?: boolean;
  /** Row-edit — ports `ui.grid.rowEdit.GridOptions`. `rowEditWaitInterval`
   * controls how long the grid waits for additional edits on the same row
   * before firing the save event. -1 disables the timer so consumers must
   * call `flushDirtyRows()` manually. Default: 2000 ms. */
  rowEditWaitInterval?: number;
  benchmark?: GridBenchmarkOptions;
  onRegisterApi?: (gridApi: unknown) => void;
  rowIdentity?: (row: GridRecord, index: number) => string;
}

export interface SortState {
  columnName: string | null;
  direction: SortDirection;
}

export interface GridBenchmarkResult {
  iterations: number;
  totalMs: number;
  averageMs: number;
  visibleRows: number;
  renderedItems: number;
}

export class GridRow {
  readonly uid = nextUid('row');
  readonly invisibleReasons = new Set<string>();
  visible = true;
  isSelected = false;
  /** Whether this row is the one currently drawing row-level focus. Ported
   * from ui.grid.selection's `isFocused`. Mutually exclusive across rows. */
  isFocused = false;
  /** False disables all selection mechanics for this row (mouse, keyboard,
   * programmatic). Populated from `options.isRowSelectable(row)` before
   * each render cycle. */
  enableSelection = true;
  treeLevel = 0;
  parentId: string | null = null;
  hasChildren = false;
  childCount = 0;
  expanded = false;
  expandedRowHeight = 0;
  /** Ports `GridRow.exporterEnableExporting` from the old grid — when false
   * the exporter skips this row. */
  exporterEnableExporting = true;
  /** Row-edit flags. Ports `GridRow.isDirty` / `isError` / `isSaving` from
   * the old `ui.grid.rowEdit` module. The controller flips these in response
   * to edit events + save-promise resolution; the template uses them to add
   * `ui-grid-row-dirty`, `ui-grid-row-saving`, `ui-grid-row-error`. */
  isDirty = false;
  isError = false;
  isSaving = false;

  constructor(
    readonly id: string,
    readonly entity: GridRecord,
    readonly index: number,
    readonly height = 44,
  ) {}

  /** Mirrors ui.grid.selection's GridRow.setSelected — the ONLY supported
   * path to flip isSelected, because it also keeps the grid-level selected
   * count in sync through the controller that owns this row. */
  setSelected(selected: boolean): void {
    if (selected !== this.isSelected) this.isSelected = selected;
  }

  setFocused(focused: boolean): void {
    if (focused !== this.isFocused) this.isFocused = focused;
  }

  setThisRowInvisible(reason: string): void {
    this.invisibleReasons.add(reason);
    this.visible = false;
  }

  clearThisRowInvisible(reason: string): void {
    this.invisibleReasons.delete(reason);
    this.visible = this.invisibleReasons.size === 0;
  }
}
