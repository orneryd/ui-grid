import type {
  BuildGridPipelineContext,
  DisplayItem,
  ExpandableItem,
  GridInfiniteScrollState,
  GridMoveDirection,
  GroupItem,
  PipelineResult,
  RowItem,
} from './grid.core.types';
import * as tsDisplay from './grid.core.display';
import * as tsEdit from './grid.core.edit';
import * as tsExport from './grid.core.export';
import * as tsExporterMenu from './grid.core.exporter-menu';
import * as tsImporter from './grid.core.importer';
import * as tsImporterMenu from './grid.core.importer-menu';
import * as tsRowEditMenu from './grid.core.row-edit-menu';
import * as tsValidate from './grid.core.validate';
import * as tsI18n from './grid.core.i18n';
import * as tsFiltering from './grid.core.filtering';
import * as tsGrouping from './grid.core.grouping';
import * as tsIdentity from './grid.core.identity';
import * as tsInfiniteScroll from './grid.core.infinite-scroll';
import * as tsPagination from './grid.core.pagination';
import * as tsPinning from './grid.core.pinning';
import * as tsPipeline from './grid.core.pipeline';
import * as tsRowEdit from './grid.core.row-edit';
import * as tsRowState from './grid.core.row-state';
import * as tsSelection from './grid.core.selection';
import * as tsSorting from './grid.core.sorting';
import * as tsState from './grid.core.state';
import * as tsTree from './grid.core.tree';
import * as tsViewmodel from './grid.core.viewmodel';
import { getUiGridWasmBinaryPath, getUiGridWasmModulePath } from './ui-grid.wasm-path';
import {
  GridRow,
  type GridCellPosition,
  type GridColumnDef,
  type GridOptions,
} from './grid.models';

export type {
  BuildGridPipelineContext,
  DisplayItem,
  ExpandableItem,
  GridInfiniteScrollState,
  GridMoveDirection,
  GroupItem,
  PipelineResult,
  RowItem,
} from './grid.core.types';

export type { PinDirection, PinnedColumnState } from './grid.core.pinning';

type CalculateVirtualWindowRequest = Parameters<typeof tsPagination.calculateVirtualWindow>[0];
type CalculateVirtualWindowResult = ReturnType<typeof tsPagination.calculateVirtualWindow>;
type GetEffectivePageSizeInput = {
  options: Parameters<typeof tsPagination.getEffectivePageSize>[0];
  pageSize: Parameters<typeof tsPagination.getEffectivePageSize>[1];
  totalItems: Parameters<typeof tsPagination.getEffectivePageSize>[2];
};
type GetTotalPagesValueInput = {
  options: Parameters<typeof tsPagination.getTotalPagesValue>[0];
  totalItems: Parameters<typeof tsPagination.getTotalPagesValue>[1];
  pageSize: Parameters<typeof tsPagination.getTotalPagesValue>[2];
};
type GetCurrentPageValueInput = {
  options: Parameters<typeof tsPagination.getCurrentPageValue>[0];
  currentPage: Parameters<typeof tsPagination.getCurrentPageValue>[1];
  totalItems: Parameters<typeof tsPagination.getCurrentPageValue>[2];
  pageSize: Parameters<typeof tsPagination.getCurrentPageValue>[3];
};
type GetFirstRowIndexValueInput = {
  options: Parameters<typeof tsPagination.getFirstRowIndexValue>[0];
  currentPage: Parameters<typeof tsPagination.getFirstRowIndexValue>[1];
  totalItems: Parameters<typeof tsPagination.getFirstRowIndexValue>[2];
  pageSize: Parameters<typeof tsPagination.getFirstRowIndexValue>[3];
};
type GetLastRowIndexValueInput = {
  options: Parameters<typeof tsPagination.getLastRowIndexValue>[0];
  currentPage: Parameters<typeof tsPagination.getLastRowIndexValue>[1];
  totalItems: Parameters<typeof tsPagination.getLastRowIndexValue>[2];
  pageSize: Parameters<typeof tsPagination.getLastRowIndexValue>[3];
};
type PaginateGridRowsInput = {
  rows: Parameters<typeof tsPagination.paginateGridRows>[0];
  options: Parameters<typeof tsPagination.paginateGridRows>[1];
  currentPage: Parameters<typeof tsPagination.paginateGridRows>[2];
  pageSize: Parameters<typeof tsPagination.paginateGridRows>[3];
  totalItems: Parameters<typeof tsPagination.paginateGridRows>[4];
};
type IsVirtualizationEnabledInput = {
  options: Parameters<typeof tsPagination.isVirtualizationEnabled>[0];
  itemCount: Parameters<typeof tsPagination.isVirtualizationEnabled>[1];
};
type SeekGridPageInput = {
  page: Parameters<typeof tsPagination.seekGridPage>[0];
  totalPages: Parameters<typeof tsPagination.seekGridPage>[1];
};
type SortGridRowsInput = {
  rows: Parameters<typeof tsSorting.sortGridRows>[0];
  columns: Parameters<typeof tsSorting.sortGridRows>[1];
  options: Parameters<typeof tsSorting.sortGridRows>[2];
  sortState: Parameters<typeof tsSorting.sortGridRows>[3];
};
type SortGridRowsResult = ReturnType<typeof tsSorting.sortGridRows>;
type HeaderLabelInput = {
  column: Parameters<typeof tsExport.headerLabel>[0];
};
type WasmRowFilterState = {
  visible: boolean;
  invisibleReasons: string[];
};
type MatchesGridRowFiltersInput = {
  row: Parameters<typeof tsFiltering.matchesGridRowFilters>[0];
  columns: Parameters<typeof tsFiltering.matchesGridRowFilters>[1];
  options: Parameters<typeof tsFiltering.matchesGridRowFilters>[2];
  activeFilters: Parameters<typeof tsFiltering.matchesGridRowFilters>[3];
};
type MatchesGridRowFiltersResult = {
  row: WasmRowFilterState;
  matches: ReturnType<typeof tsFiltering.matchesGridRowFilters>;
};
type BuildGridRowsInput = {
  options: Parameters<typeof tsTree.buildGridRows>[0];
  rowSize: Parameters<typeof tsTree.buildGridRows>[1];
  hiddenRowReasons: Parameters<typeof tsTree.buildGridRows>[2];
  expandedRows: Parameters<typeof tsTree.buildGridRows>[3];
};
type BuildGridRowsResult = ReturnType<typeof tsTree.buildGridRows>;
type ExpandedRowsRowIdInput = {
  expandedRows: Parameters<typeof tsRowState.toggleGridRowExpanded>[0];
  rowId: Parameters<typeof tsRowState.toggleGridRowExpanded>[1];
};
type RowsExpandedRowsInput = {
  rows: Parameters<typeof tsRowState.areAllGridRowsExpanded>[0];
  expandedRows: Parameters<typeof tsRowState.areAllGridRowsExpanded>[1];
};
type ExpandedTreeRowsRowIdExpandedInput = {
  expandedTreeRows: Parameters<typeof tsRowState.setGridTreeRowExpanded>[0];
  rowId: Parameters<typeof tsRowState.setGridTreeRowExpanded>[1];
  expanded: Parameters<typeof tsRowState.setGridTreeRowExpanded>[2];
};
type HiddenRowReasonInput = {
  hiddenRowReasons: Parameters<typeof tsRowState.addGridRowInvisibleReason>[0];
  rowId: Parameters<typeof tsRowState.addGridRowInvisibleReason>[1];
  reason: Parameters<typeof tsRowState.addGridRowInvisibleReason>[2];
};
type OptionsColumnInput = {
  options: Parameters<typeof tsPinning.isColumnPinnable>[0];
  column: Parameters<typeof tsPinning.isColumnPinnable>[1];
};
type PinnedColumnsColumnInput = {
  pinnedColumns: Parameters<typeof tsPinning.getColumnPinDirection>[0];
  column: Parameters<typeof tsPinning.getColumnPinDirection>[1];
};
type PinColumnStateInput = {
  current: Parameters<typeof tsPinning.pinColumnState>[0];
  columnName: Parameters<typeof tsPinning.pinColumnState>[1];
  direction: Parameters<typeof tsPinning.pinColumnState>[2];
};
type VisibleColumnsPinnedColumnsColumnInput = {
  visibleColumns: Parameters<typeof tsPinning.computePinnedOffset>[0];
  pinnedColumns: Parameters<typeof tsPinning.computePinnedOffset>[1];
  column: Parameters<typeof tsPinning.computePinnedOffset>[2];
};
type PinnedColumnsColumnLabelsInput = {
  pinnedColumns: Parameters<typeof tsPinning.pinningButtonLabel>[0];
  column: Parameters<typeof tsPinning.pinningButtonLabel>[1];
  labels: Parameters<typeof tsPinning.pinningButtonLabel>[2];
};
type IsTreeEnabledOptions = Parameters<typeof tsTree.isTreeEnabled>[0];
type FilterAndFlattenGridTreeRowsInput = {
  rows: Parameters<typeof tsTree.filterAndFlattenGridTreeRows>[0];
  columns: Parameters<typeof tsTree.filterAndFlattenGridTreeRows>[1];
  options: Parameters<typeof tsTree.filterAndFlattenGridTreeRows>[2];
  activeFilters: Parameters<typeof tsTree.filterAndFlattenGridTreeRows>[3];
  expandedTreeRows: Parameters<typeof tsTree.filterAndFlattenGridTreeRows>[4];
  sortState: Parameters<typeof tsTree.filterAndFlattenGridTreeRows>[5];
};
type FilterAndFlattenGridTreeRowsResult = ReturnType<typeof tsTree.filterAndFlattenGridTreeRows>;
type BuildGridDisplayItemsInput = {
  rows: Parameters<typeof tsGrouping.buildGridDisplayItems>[0];
  columns: Parameters<typeof tsGrouping.buildGridDisplayItems>[1];
  options: Parameters<typeof tsGrouping.buildGridDisplayItems>[2];
  groupBy: Parameters<typeof tsGrouping.buildGridDisplayItems>[3];
  collapsedGroups: Parameters<typeof tsGrouping.buildGridDisplayItems>[4];
};
type BuildGridDisplayItemsResult = ReturnType<typeof tsGrouping.buildGridDisplayItems>;
type ExportCsvRowsColumns = Parameters<typeof tsExport.exportCsvRows>[0];
type ExportCsvRowsRows = Parameters<typeof tsExport.exportCsvRows>[1];
type ExportCsvRowsResult = ReturnType<typeof tsExport.exportCsvRows>;
type BuildGridSavedStateContext = Parameters<typeof tsState.buildGridSavedState>[0];
type NormalizeGridSavedStateInput = Parameters<typeof tsState.normalizeGridSavedState>[0];
type NormalizeGridSavedStateResult = ReturnType<typeof tsState.normalizeGridSavedState>;
type NormalizeBooleanMapInput = Parameters<typeof tsState.normalizeBooleanMap>[0];
type NormalizeBooleanMapResult = ReturnType<typeof tsState.normalizeBooleanMap>;
type FindGridRowByIdInput = {
  rows: Parameters<typeof tsIdentity.findGridRowById>[0];
  rowId: Parameters<typeof tsIdentity.findGridRowById>[1];
};
type BuildGridSortStateInput = {
  columnName: Parameters<typeof tsIdentity.buildGridSortState>[0];
  direction: Parameters<typeof tsIdentity.buildGridSortState>[1] | null;
};
type ResolveGridRowIdInput = {
  options: Parameters<typeof tsIdentity.resolveGridRowId>[0];
  row: Parameters<typeof tsIdentity.resolveGridRowId>[1];
};
type MaybeRequestInfiniteScrollDataInput = Parameters<typeof tsInfiniteScroll.maybeRequestInfiniteScrollData>[0];
type InfiniteScrollLoadInput = {
  state: Parameters<typeof tsInfiniteScroll.completeInfiniteScrollDataLoad>[0];
  scrollUp: Parameters<typeof tsInfiniteScroll.completeInfiniteScrollDataLoad>[1];
  scrollDown: Parameters<typeof tsInfiniteScroll.completeInfiniteScrollDataLoad>[2];
};
type InfiniteScrollVisibleRowsInput = {
  state: Parameters<typeof tsInfiniteScroll.saveInfiniteScrollPercentage>[0];
  visibleRows: Parameters<typeof tsInfiniteScroll.saveInfiniteScrollPercentage>[1];
};
type InfiniteScrollDirectionsInput = {
  state: GridInfiniteScrollState;
  scrollUp: Parameters<typeof tsInfiniteScroll.resetInfiniteScrollState>[0];
  scrollDown: Parameters<typeof tsInfiniteScroll.resetInfiniteScrollState>[1];
};
type CellPositionMatchInput = {
  position: Parameters<typeof tsEdit.isGridCellPosition>[0];
  rowId: Parameters<typeof tsEdit.isGridCellPosition>[1];
  columnName: Parameters<typeof tsEdit.isGridCellPosition>[2];
};
type BeginEditSessionInput = {
  rowId: Parameters<typeof tsEdit.beginGridEditSession>[0];
  columnName: Parameters<typeof tsEdit.beginGridEditSession>[1];
  editingValue: Parameters<typeof tsEdit.beginGridEditSession>[2];
};
type BuildGridFocusCellResultInput = Parameters<typeof tsEdit.buildGridFocusCellResult>[0];
type FindNextGridCellInput = Parameters<typeof tsEdit.findNextGridCell>[0];
type ParseGridEditedValueInput = {
  column: Parameters<typeof tsEdit.parseGridEditedValue>[0];
  value: Parameters<typeof tsEdit.parseGridEditedValue>[1];
  oldValue: Parameters<typeof tsEdit.parseGridEditedValue>[2];
};
type PrintableGridKeyInput = {
  key: Parameters<typeof tsEdit.isPrintableGridKey>[0];
  ctrlKey: Parameters<typeof tsEdit.isPrintableGridKey>[1];
  metaKey: Parameters<typeof tsEdit.isPrintableGridKey>[2];
  altKey: Parameters<typeof tsEdit.isPrintableGridKey>[3];
};
type ResolveGridLabelsInput = {
  currentLabels: ReturnType<typeof tsI18n.gridI18n.getCurrentLabels>;
  overrides: Parameters<typeof tsViewmodel.resolveGridLabels>[0];
};
type PrimaryColumnInput = {
  visibleColumns: Parameters<typeof tsViewmodel.isGridPrimaryColumn>[0];
  column: Parameters<typeof tsViewmodel.isGridPrimaryColumn>[1];
};
type SortDirectionLabelsInput = {
  direction: Parameters<typeof tsViewmodel.gridSortButtonLabel>[0];
  labels: Parameters<typeof tsViewmodel.gridSortButtonLabel>[1];
};
type GroupedLabelsInput = {
  isGrouped: Parameters<typeof tsViewmodel.gridGroupingButtonLabel>[0];
  labels: Parameters<typeof tsViewmodel.gridGroupingButtonLabel>[1];
};
type FilterableLabelsInput = {
  isFilterable: Parameters<typeof tsViewmodel.gridFilterPlaceholder>[0];
  labels: Parameters<typeof tsViewmodel.gridFilterPlaceholder>[1];
};
type CollapsedLabelsInput = {
  collapsed: Parameters<typeof tsViewmodel.gridGroupDisclosureLabel>[0];
  labels: Parameters<typeof tsViewmodel.gridGroupDisclosureLabel>[1];
};
type CellIndentInput = {
  options: Parameters<typeof tsViewmodel.gridCellIndent>[0];
  visibleColumns: Parameters<typeof tsViewmodel.gridCellIndent>[1];
  row: Parameters<typeof tsViewmodel.gridCellIndent>[2];
  column: Parameters<typeof tsViewmodel.gridCellIndent>[3];
};
type ExpandedLabelsInput = {
  expanded: Parameters<typeof tsViewmodel.gridTreeToggleLabel>[0];
  labels: Parameters<typeof tsViewmodel.gridTreeToggleLabel>[1];
};
type GroupByColumnsColumnInput = {
  groupByColumns: Parameters<typeof tsViewmodel.isGridColumnGrouped>[0];
  column: Parameters<typeof tsViewmodel.isGridColumnGrouped>[1];
};
type ExpandedTreeRowsRowInput = {
  expandedTreeRows: Parameters<typeof tsViewmodel.isGridTreeRowExpanded>[0];
  row: Parameters<typeof tsViewmodel.isGridTreeRowExpanded>[1];
};
type ExpandedTreeRowsRowLabelsInput = {
  expandedTreeRows: Parameters<typeof tsViewmodel.gridTreeToggleLabelForRow>[0];
  row: Parameters<typeof tsViewmodel.gridTreeToggleLabelForRow>[1];
  labels: Parameters<typeof tsViewmodel.gridTreeToggleLabelForRow>[2];
};
type RowLabelsInput = {
  row: Parameters<typeof tsViewmodel.gridExpandToggleLabelForRow>[0];
  labels: Parameters<typeof tsViewmodel.gridExpandToggleLabelForRow>[1];
};
type UiGridWasmCoreModule = {
  default(input?: string | URL | Request): Promise<unknown>;
  calculate_virtual_window_js(request: CalculateVirtualWindowRequest): CalculateVirtualWindowResult;
  get_effective_page_size_js(input: GetEffectivePageSizeInput): ReturnType<typeof tsPagination.getEffectivePageSize>;
  get_total_pages_value_js(input: GetTotalPagesValueInput): ReturnType<typeof tsPagination.getTotalPagesValue>;
  get_current_page_value_js(input: GetCurrentPageValueInput): ReturnType<typeof tsPagination.getCurrentPageValue>;
  get_first_row_index_value_js(input: GetFirstRowIndexValueInput): ReturnType<typeof tsPagination.getFirstRowIndexValue>;
  get_last_row_index_value_js(input: GetLastRowIndexValueInput): ReturnType<typeof tsPagination.getLastRowIndexValue>;
  paginate_grid_rows_js(input: PaginateGridRowsInput): ReturnType<typeof tsPagination.paginateGridRows>;
  is_virtualization_enabled_js(input: IsVirtualizationEnabledInput): ReturnType<typeof tsPagination.isVirtualizationEnabled>;
  seek_grid_page_js(input: SeekGridPageInput): ReturnType<typeof tsPagination.seekGridPage>;
  resolve_grid_page_size_js(pageSize: Parameters<typeof tsPagination.resolveGridPageSize>[0]): ReturnType<typeof tsPagination.resolveGridPageSize>;
  build_grid_saved_state_js(context: BuildGridSavedStateContext): ReturnType<typeof tsState.buildGridSavedState>;
  normalize_grid_saved_state_js(state: NormalizeGridSavedStateInput): NormalizeGridSavedStateResult;
  sanitize_download_filename_js(value: string): ReturnType<typeof tsState.sanitizeDownloadFilename>;
  normalize_boolean_map_js(input: { value: NormalizeBooleanMapInput }): NormalizeBooleanMapResult;
  is_safe_state_key_js(value: string): ReturnType<typeof tsState.isSafeStateKey>;
  find_grid_row_by_id_js(input: FindGridRowByIdInput): ReturnType<typeof tsIdentity.findGridRowById>;
  build_grid_sort_state_js(input: BuildGridSortStateInput): ReturnType<typeof tsIdentity.buildGridSortState>;
  resolve_grid_row_id_js(input: ResolveGridRowIdInput): ReturnType<typeof tsIdentity.resolveGridRowId>;
  maybe_request_infinite_scroll_data_js(input: MaybeRequestInfiniteScrollDataInput): ReturnType<typeof tsInfiniteScroll.maybeRequestInfiniteScrollData>;
  complete_infinite_scroll_data_load_js(input: InfiniteScrollLoadInput): ReturnType<typeof tsInfiniteScroll.completeInfiniteScrollDataLoad>;
  reset_infinite_scroll_state_js(input: InfiniteScrollDirectionsInput): ReturnType<typeof tsInfiniteScroll.resetInfiniteScrollState>;
  save_infinite_scroll_percentage_js(input: InfiniteScrollVisibleRowsInput): ReturnType<typeof tsInfiniteScroll.saveInfiniteScrollPercentage>;
  set_infinite_scroll_directions_state_js(input: InfiniteScrollDirectionsInput): ReturnType<typeof tsInfiniteScroll.setInfiniteScrollDirectionsState>;
  clear_grid_filter_reasons_js(row: GridRow): WasmRowFilterState;
  matches_grid_row_filters_js(input: MatchesGridRowFiltersInput): MatchesGridRowFiltersResult;
  sort_grid_rows_js(input: SortGridRowsInput): SortGridRowsResult;
  build_grid_rows_js(input: BuildGridRowsInput): BuildGridRowsResult;
  toggle_grid_row_expanded_js(input: ExpandedRowsRowIdInput): ReturnType<typeof tsRowState.toggleGridRowExpanded>;
  expand_all_grid_rows_js(rows: Parameters<typeof tsRowState.expandAllGridRows>[0]): ReturnType<typeof tsRowState.expandAllGridRows>;
  are_all_grid_rows_expanded_js(input: RowsExpandedRowsInput): ReturnType<typeof tsRowState.areAllGridRowsExpanded>;
  set_grid_tree_row_expanded_js(input: ExpandedTreeRowsRowIdExpandedInput): ReturnType<typeof tsRowState.setGridTreeRowExpanded>;
  toggle_grid_tree_row_expanded_js(input: ExpandedRowsRowIdInput): ReturnType<typeof tsRowState.toggleGridTreeRowExpanded>;
  expand_all_grid_tree_rows_js(rows: Parameters<typeof tsRowState.expandAllGridTreeRows>[0]): ReturnType<typeof tsRowState.expandAllGridTreeRows>;
  get_grid_tree_row_children_js(input: FindGridRowByIdInput): ReturnType<typeof tsRowState.getGridTreeRowChildren>;
  add_grid_row_invisible_reason_js(input: HiddenRowReasonInput): ReturnType<typeof tsRowState.addGridRowInvisibleReason>;
  clear_grid_row_invisible_reason_js(input: HiddenRowReasonInput): ReturnType<typeof tsRowState.clearGridRowInvisibleReason>;
  is_pinning_enabled_js(options: GridOptions): ReturnType<typeof tsPinning.isPinningEnabled>;
  is_column_pinnable_js(input: OptionsColumnInput): ReturnType<typeof tsPinning.isColumnPinnable>;
  get_column_pin_direction_js(input: PinnedColumnsColumnInput): ReturnType<typeof tsPinning.getColumnPinDirection>;
  pin_column_state_js(input: PinColumnStateInput): ReturnType<typeof tsPinning.pinColumnState>;
  build_initial_pinned_state_js(columns: Parameters<typeof tsPinning.buildInitialPinnedState>[0]): ReturnType<typeof tsPinning.buildInitialPinnedState>;
  compute_pinned_offset_js(input: VisibleColumnsPinnedColumnsColumnInput): ReturnType<typeof tsPinning.computePinnedOffset>;
  pinning_button_label_js(input: PinnedColumnsColumnLabelsInput): ReturnType<typeof tsPinning.pinningButtonLabel>;
  is_grid_cell_position_js(input: CellPositionMatchInput): ReturnType<typeof tsEdit.isGridCellPosition>;
  begin_grid_edit_session_js(input: BeginEditSessionInput): ReturnType<typeof tsEdit.beginGridEditSession>;
  should_grid_edit_on_focus_js(input: OptionsColumnInput): ReturnType<typeof tsEdit.shouldGridEditOnFocus>;
  build_grid_focus_cell_result_js(input: BuildGridFocusCellResultInput): ReturnType<typeof tsEdit.buildGridFocusCellResult>;
  clear_grid_edit_session_js(): ReturnType<typeof tsEdit.clearGridEditSession>;
  find_next_grid_cell_js(input: FindNextGridCellInput): ReturnType<typeof tsEdit.findNextGridCell>;
  stringify_grid_editor_value_js(value: unknown): ReturnType<typeof tsEdit.stringifyGridEditorValue>;
  parse_grid_edited_value_js(input: ParseGridEditedValueInput): ReturnType<typeof tsEdit.parseGridEditedValue>;
  is_printable_grid_key_js(input: PrintableGridKeyInput): ReturnType<typeof tsEdit.isPrintableGridKey>;
  resolve_grid_labels_js(input: ResolveGridLabelsInput): ReturnType<typeof tsViewmodel.resolveGridLabels>;
  is_grid_tree_enabled_js(options: GridOptions): ReturnType<typeof tsViewmodel.isGridTreeEnabled>;
  is_grid_grouping_enabled_js(options: GridOptions): ReturnType<typeof tsViewmodel.isGridGroupingEnabled>;
  can_grid_expand_rows_js(options: GridOptions): ReturnType<typeof tsViewmodel.canGridExpandRows>;
  is_grid_pagination_enabled_js(options: GridOptions): ReturnType<typeof tsViewmodel.isGridPaginationEnabled>;
  should_show_grid_pagination_controls_js(options: GridOptions): ReturnType<typeof tsViewmodel.shouldShowGridPaginationControls>;
  is_grid_infinite_scroll_enabled_js(options: GridOptions): ReturnType<typeof tsViewmodel.isGridInfiniteScrollEnabled>;
  is_grid_sorting_enabled_js(options: GridOptions): ReturnType<typeof tsViewmodel.isGridSortingEnabled>;
  is_grid_filtering_enabled_js(options: GridOptions): ReturnType<typeof tsViewmodel.isGridFilteringEnabled>;
  can_grid_move_columns_js(options: GridOptions): ReturnType<typeof tsViewmodel.canGridMoveColumns>;
  is_grid_primary_column_js(input: PrimaryColumnInput): ReturnType<typeof tsViewmodel.isGridPrimaryColumn>;
  is_grid_column_sortable_js(input: OptionsColumnInput): ReturnType<typeof tsViewmodel.isGridColumnSortable>;
  is_grid_column_filterable_js(input: OptionsColumnInput): ReturnType<typeof tsViewmodel.isGridColumnFilterable>;
  should_show_grid_tree_toggle_js(input: CellIndentInput): ReturnType<typeof tsViewmodel.shouldShowGridTreeToggle>;
  should_show_grid_expand_toggle_js(input: {
    options: Parameters<typeof tsViewmodel.shouldShowGridExpandToggle>[0];
    visibleColumns: Parameters<typeof tsViewmodel.shouldShowGridExpandToggle>[1];
    column: Parameters<typeof tsViewmodel.shouldShowGridExpandToggle>[2];
  }): ReturnType<typeof tsViewmodel.shouldShowGridExpandToggle>;
  grid_sort_button_label_js(input: SortDirectionLabelsInput): ReturnType<typeof tsViewmodel.gridSortButtonLabel>;
  grid_sort_aria_sort_js(direction: Parameters<typeof tsViewmodel.gridSortAriaSort>[0]): ReturnType<typeof tsViewmodel.gridSortAriaSort>;
  grid_grouping_button_label_js(input: GroupedLabelsInput): ReturnType<typeof tsViewmodel.gridGroupingButtonLabel>;
  grid_filter_placeholder_js(input: FilterableLabelsInput): ReturnType<typeof tsViewmodel.gridFilterPlaceholder>;
  grid_group_disclosure_label_js(input: CollapsedLabelsInput): ReturnType<typeof tsViewmodel.gridGroupDisclosureLabel>;
  grid_editor_input_type_js(column: Parameters<typeof tsViewmodel.gridEditorInputType>[0]): ReturnType<typeof tsViewmodel.gridEditorInputType>;
  grid_column_width_js(column: Parameters<typeof tsViewmodel.gridColumnWidth>[0]): ReturnType<typeof tsViewmodel.gridColumnWidth>;
  grid_cell_indent_js(input: CellIndentInput): ReturnType<typeof tsViewmodel.gridCellIndent>;
  grid_tree_toggle_label_js(input: ExpandedLabelsInput): ReturnType<typeof tsViewmodel.gridTreeToggleLabel>;
  grid_expand_toggle_label_js(input: ExpandedLabelsInput): ReturnType<typeof tsViewmodel.gridExpandToggleLabel>;
  is_grid_column_grouped_js(input: GroupByColumnsColumnInput): ReturnType<typeof tsViewmodel.isGridColumnGrouped>;
  is_grid_tree_row_expanded_js(input: ExpandedTreeRowsRowInput): ReturnType<typeof tsViewmodel.isGridTreeRowExpanded>;
  grid_tree_toggle_label_for_row_js(input: ExpandedTreeRowsRowLabelsInput): ReturnType<typeof tsViewmodel.gridTreeToggleLabelForRow>;
  grid_expand_toggle_label_for_row_js(input: RowLabelsInput): ReturnType<typeof tsViewmodel.gridExpandToggleLabelForRow>;
  is_tree_enabled_js(options: IsTreeEnabledOptions): ReturnType<typeof tsTree.isTreeEnabled>;
  filter_and_flatten_grid_tree_rows_js(
    input: FilterAndFlattenGridTreeRowsInput,
  ): FilterAndFlattenGridTreeRowsResult;
  build_grid_display_items_js(input: BuildGridDisplayItemsInput): BuildGridDisplayItemsResult;
  header_label_js(input: HeaderLabelInput): ReturnType<typeof tsExport.headerLabel>;
  export_csv_rows_js(columns: ExportCsvRowsColumns, rows: ExportCsvRowsRows): ExportCsvRowsResult;
};

export interface WasmSerializationAuditOptions {
  enabled: boolean;
  maxDepth: number;
  sizeThresholdBytes: number;
  warnOnce: boolean;
}

export interface WasmSerializationIssue {
  path: string;
  kind: string;
  constructorName?: string;
}

export interface WasmSerializationAuditResult {
  estimatedBytes: number;
  issues: WasmSerializationIssue[];
}

const defaultWasmSerializationAuditOptions: WasmSerializationAuditOptions = {
  enabled: true,
  maxDepth: 4,
  sizeThresholdBytes: 8_192,
  warnOnce: true,
};

let wasmCore: UiGridWasmCoreModule | null = null;
let wasmInitPromise: Promise<boolean> | null = null;
let auditedWasmCore: UiGridWasmCoreModule | null = null;
let auditedWasmCoreSource: UiGridWasmCoreModule | null = null;
let wasmSerializationAuditOptions: WasmSerializationAuditOptions = {
  ...defaultWasmSerializationAuditOptions,
};
const warnedWasmAuditKeys = new Set<string>();

export async function initWasmCore(): Promise<boolean> {
  if (wasmCore) {
    return true;
  }

  if (!wasmInitPromise) {
    wasmInitPromise = import(/* @vite-ignore */ getUiGridWasmModulePath())
      .then(async (module) => {
        await module.default(getUiGridWasmBinaryPath());
        wasmCore = module;
        return true;
      })
      .catch(() => {
        wasmInitPromise = null;
        return false;
      });
  }

  return wasmInitPromise;
}

export function isWasmReady(): boolean {
  return wasmCore !== null;
}

export function configureWasmSerializationAudit(
  options: Partial<WasmSerializationAuditOptions>,
): WasmSerializationAuditOptions {
  wasmSerializationAuditOptions = {
    ...wasmSerializationAuditOptions,
    ...options,
  };

  if (options.warnOnce === false || options.enabled === false) {
    warnedWasmAuditKeys.clear();
  }

  return { ...wasmSerializationAuditOptions };
}

function readGlobalWasmSerializationAuditFlag(): boolean {
  if (typeof globalThis === 'undefined') {
    return false;
  }

  const globalScope = globalThis as typeof globalThis & {
    __UI_GRID_WASM_AUDIT__?: boolean;
    localStorage?: Storage;
  };

  if (globalScope.__UI_GRID_WASM_AUDIT__ === true) {
    return true;
  }

  try {
    return globalScope.localStorage?.getItem('ui-grid:wasm-audit') === '1';
  } catch {
    return false;
  }
}

function isWasmSerializationAuditEnabled(): boolean {
  return wasmSerializationAuditOptions.enabled || readGlobalWasmSerializationAuditFlag();
}

function estimateSerializedBytes(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return 0;
  }
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function collectWasmSerializationIssues(
  value: unknown,
  path: string,
  maxDepth: number,
  issues: WasmSerializationIssue[],
  seen: WeakSet<object>,
): void {
  if (value == null || maxDepth < 0) {
    return;
  }

  const valueType = typeof value;
  if (valueType === 'function') {
    issues.push({ path, kind: 'function' });
    return;
  }
  if (valueType !== 'object') {
    return;
  }

  if (seen.has(value as object)) {
    issues.push({ path, kind: 'circular-reference' });
    return;
  }
  seen.add(value as object);

  if (value instanceof Date) {
    issues.push({ path, kind: 'date', constructorName: 'Date' });
    return;
  }
  if (value instanceof RegExp) {
    issues.push({ path, kind: 'regexp', constructorName: 'RegExp' });
    return;
  }
  if (value instanceof Map) {
    issues.push({ path, kind: 'map', constructorName: 'Map' });
    return;
  }
  if (value instanceof Set) {
    issues.push({ path, kind: 'set', constructorName: 'Set' });
    return;
  }
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    issues.push({
      path,
      kind: 'binary',
      constructorName: (value as { constructor?: { name?: string } }).constructor?.name,
    });
    return;
  }
  if (value instanceof Error) {
    issues.push({ path, kind: 'error', constructorName: value.constructor.name });
    return;
  }
  if (value instanceof Promise) {
    issues.push({ path, kind: 'promise', constructorName: 'Promise' });
    return;
  }

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      collectWasmSerializationIssues(entry, `${path}[${index}]`, maxDepth - 1, issues, seen);
      if (issues.length >= 25) {
        return;
      }
    }
    return;
  }

  if (!isPlainObject(value as object)) {
    issues.push({
      path,
      kind: 'class-instance',
      constructorName: (value as { constructor?: { name?: string } }).constructor?.name,
    });
  }

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    collectWasmSerializationIssues(entry, `${path}.${key}`, maxDepth - 1, issues, seen);
    if (issues.length >= 25) {
      return;
    }
  }
}

export function inspectWasmSerializationPayload(
  args: readonly unknown[],
  options: Partial<Pick<WasmSerializationAuditOptions, 'maxDepth'>> = {},
): WasmSerializationAuditResult {
  const issues: WasmSerializationIssue[] = [];
  const maxDepth = options.maxDepth ?? wasmSerializationAuditOptions.maxDepth;
  const seen = new WeakSet<object>();

  args.forEach((arg, index) => {
    collectWasmSerializationIssues(arg, `arg${index}`, maxDepth, issues, seen);
  });

  return {
    estimatedBytes: args.reduce<number>((total, arg) => total + estimateSerializedBytes(arg), 0),
    issues,
  };
}

function emitWasmSerializationAudit(
  methodName: string,
  result: WasmSerializationAuditResult,
  extra: Record<string, unknown> = {},
): void {
  const shouldWarn =
    result.issues.length > 0
    || result.estimatedBytes >= wasmSerializationAuditOptions.sizeThresholdBytes;

  if (!shouldWarn) {
    return;
  }

  const signature = JSON.stringify({
    methodName,
    estimatedBytesBucket: Math.floor(result.estimatedBytes / 1024),
    issues: result.issues.map((issue) => `${issue.path}:${issue.kind}:${issue.constructorName ?? ''}`),
  });

  if (wasmSerializationAuditOptions.warnOnce && warnedWasmAuditKeys.has(signature)) {
    return;
  }
  warnedWasmAuditKeys.add(signature);

  console.warn('[ui-grid][wasm-audit]', methodName, {
    estimatedBytes: result.estimatedBytes,
    thresholdBytes: wasmSerializationAuditOptions.sizeThresholdBytes,
    issues: result.issues,
    ...extra,
  });
}

function maybeLogWasmSerializationAudit(
  methodName: string,
  args: readonly unknown[],
  extra: Record<string, unknown> = {},
): void {
  emitWasmSerializationAudit(methodName, inspectWasmSerializationPayload(args), extra);
}

function getWasmInvocationModule(): UiGridWasmCoreModule | null {
  if (!wasmCore) {
    return null;
  }
  if (!isWasmSerializationAuditEnabled()) {
    return wasmCore;
  }
  if (auditedWasmCore && auditedWasmCoreSource === wasmCore) {
    return auditedWasmCore;
  }

  auditedWasmCoreSource = wasmCore;
  auditedWasmCore = new Proxy(wasmCore, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver) as unknown;
      if (typeof value !== 'function') {
        return value;
      }

      return (...args: unknown[]) => {
        maybeLogWasmSerializationAudit(String(property), args);
        return Reflect.apply(value, target, args);
      };
    },
  }) as UiGridWasmCoreModule;

  return auditedWasmCore;
}

function withWasm<T>(invoke: (module: UiGridWasmCoreModule) => T, fallback: () => T): T {
  const module = getWasmInvocationModule();
  if (!module) {
    return fallback();
  }

  try {
    return invoke(module);
  } catch {
    return fallback();
  }
}

function hasColumnCallbacks(column: GridColumnDef): boolean {
  return typeof column.valueGetter === 'function' || typeof column.sortingAlgorithm === 'function';
}

function hasUnsupportedFilterCondition(column: GridColumnDef): boolean {
  const condition = column.filter?.condition;
  return condition instanceof RegExp || typeof condition === 'function';
}

function shouldFallbackFiltering(columns: readonly GridColumnDef[]): boolean {
  return columns.some((column) => hasColumnCallbacks(column) || hasUnsupportedFilterCondition(column));
}

function requiresTemplateFallback(options: GridOptions): boolean {
  return options.enableExpandable === true && !options.expandableRowTemplate;
}

function normalizeColumnForWasm(column: GridColumnDef): GridColumnDef {
  return {
    ...column,
    sortingAlgorithm: undefined,
    valueGetter: undefined,
    formatter: undefined,
    headerRenderer: undefined,
    cellTemplate: undefined,
    cellRenderer: undefined,
    cellEditableCondition: undefined,
  };
}

function normalizeOptionsForWasm(options: GridOptions): GridOptions {
  return {
    ...options,
    data: [],
    columnDefs: options.columnDefs.map((column) => normalizeColumnForWasm(column)),
    labels: tsViewmodel.resolveGridLabels(options.labels),
    hasExpandableRowTemplate: Boolean(options.expandableRowTemplate),
    onRegisterApi: undefined,
    rowIdentity: undefined,
    expandableRowTemplate: undefined,
    cellEditableCondition: undefined,
  };
}

function shouldFallbackPipeline(context: BuildGridPipelineContext): boolean {
  return shouldFallbackFiltering(context.columns);
}

function shouldFallbackTree(options: GridOptions, columns: readonly GridColumnDef[]): boolean {
  return shouldFallbackFiltering(columns);
}

function shouldFallbackSorting(columns: readonly GridColumnDef[]): boolean {
  return columns.some(
    (column) =>
      typeof column.valueGetter === 'function' || typeof column.sortingAlgorithm === 'function',
  );
}

function shouldFallbackResolveRowId(
  options: GridOptions,
  row: Parameters<typeof tsIdentity.resolveGridRowId>[1],
): boolean {
  return typeof options.rowIdentity === 'function' && typeof row === 'object' && row !== null && !('entity' in row);
}

function findRowAndColumn(
  rows: readonly GridRow[],
  columns: readonly GridColumnDef[],
  position: GridCellPosition | null,
): { row: GridRow; column: GridColumnDef } | null {
  if (!position) {
    return null;
  }

  const row = rows.find((candidate) => candidate.id === position.rowId);
  const column = columns.find((candidate) => candidate.name === position.columnName);
  return row && column ? { row, column } : null;
}

function syncGridRowFilterState(row: GridRow, nextState: WasmRowFilterState): void {
  row.invisibleReasons.clear();
  for (const reason of nextState.invisibleReasons) {
    row.invisibleReasons.add(reason);
  }
  row.visible = nextState.visible;
}

export const buildGridCellContext: typeof tsDisplay.buildGridCellContext = (...args) =>
  tsDisplay.buildGridCellContext(...args);

export const formatGridCellDisplayValue: typeof tsDisplay.formatGridCellDisplayValue = (...args) =>
  tsDisplay.formatGridCellDisplayValue(...args);

export const buildGridHeaderContext: typeof tsExport.buildGridHeaderContext = (...args) =>
  tsExport.buildGridHeaderContext(...args);

export const formatGridHeaderDisplayValue: typeof tsExport.formatGridHeaderDisplayValue =
  (...args) => tsExport.formatGridHeaderDisplayValue(...args);

export const buildGridPipeline: typeof tsPipeline.buildGridPipeline = (context) =>
  tsPipeline.buildGridPipeline(context);

export const resolveGridLabels: typeof tsViewmodel.resolveGridLabels = (overrides) =>
  withWasm(
    (wasm) =>
      wasm.resolve_grid_labels_js({
        currentLabels: tsI18n.gridI18n.getCurrentLabels(),
        overrides,
      }),
    () => tsViewmodel.resolveGridLabels(overrides),
  );
export const isGridTreeEnabled: typeof tsViewmodel.isGridTreeEnabled = (options) =>
  tsViewmodel.isGridTreeEnabled(options);
export const isGridGroupingEnabled: typeof tsViewmodel.isGridGroupingEnabled = (options) =>
  tsViewmodel.isGridGroupingEnabled(options);
export const canGridExpandRows: typeof tsViewmodel.canGridExpandRows = (options) =>
  tsViewmodel.canGridExpandRows(options);
export const isGridPaginationEnabled: typeof tsViewmodel.isGridPaginationEnabled = (options) =>
  tsViewmodel.isGridPaginationEnabled(options);
export const shouldShowGridPaginationControls: typeof tsViewmodel.shouldShowGridPaginationControls =
  (options) => tsViewmodel.shouldShowGridPaginationControls(options);
export const isGridInfiniteScrollEnabled: typeof tsViewmodel.isGridInfiniteScrollEnabled = (
  options,
) =>
  tsViewmodel.isGridInfiniteScrollEnabled(options);
export const isGridSortingEnabled: typeof tsViewmodel.isGridSortingEnabled = (options) =>
  tsViewmodel.isGridSortingEnabled(options);
export const isGridFilteringEnabled: typeof tsViewmodel.isGridFilteringEnabled = (options) =>
  tsViewmodel.isGridFilteringEnabled(options);
export const canGridMoveColumns: typeof tsViewmodel.canGridMoveColumns = (options) =>
  tsViewmodel.canGridMoveColumns(options);
export const isGridPrimaryColumn: typeof tsViewmodel.isGridPrimaryColumn = (
  visibleColumns,
  column,
) =>
  withWasm(
    (wasm) => wasm.is_grid_primary_column_js({ visibleColumns, column }),
    () => tsViewmodel.isGridPrimaryColumn(visibleColumns, column),
  );
export const isGridColumnSortable: typeof tsViewmodel.isGridColumnSortable = (options, column) =>
  tsViewmodel.isGridColumnSortable(options, column);
export const isGridColumnFilterable: typeof tsViewmodel.isGridColumnFilterable = (
  options,
  column,
) =>
  tsViewmodel.isGridColumnFilterable(options, column);
export const shouldShowGridTreeToggle: typeof tsViewmodel.shouldShowGridTreeToggle = (
  options,
  visibleColumns,
  row,
  column,
) =>
  tsViewmodel.shouldShowGridTreeToggle(options, visibleColumns, row, column);
export const shouldShowGridExpandToggle: typeof tsViewmodel.shouldShowGridExpandToggle = (
  options,
  visibleColumns,
  column,
) =>
  tsViewmodel.shouldShowGridExpandToggle(options, visibleColumns, column);
export const gridSortButtonLabel: typeof tsViewmodel.gridSortButtonLabel = (direction, labels) =>
  tsViewmodel.gridSortButtonLabel(direction, labels);
export const gridSortAriaSort: typeof tsViewmodel.gridSortAriaSort = (direction) =>
  withWasm(
    (wasm) => wasm.grid_sort_aria_sort_js(direction),
    () => tsViewmodel.gridSortAriaSort(direction),
  );
export const gridGroupingButtonLabel: typeof tsViewmodel.gridGroupingButtonLabel = (
  isGrouped,
  labels,
) =>
  tsViewmodel.gridGroupingButtonLabel(isGrouped, labels);
export const gridFilterPlaceholder: typeof tsViewmodel.gridFilterPlaceholder = (
  isFilterable,
  labels,
) =>
  tsViewmodel.gridFilterPlaceholder(isFilterable, labels);
export const gridGroupDisclosureLabel: typeof tsViewmodel.gridGroupDisclosureLabel = (
  collapsed,
  labels,
) =>
  tsViewmodel.gridGroupDisclosureLabel(collapsed, labels);
export const gridEditorInputType: typeof tsViewmodel.gridEditorInputType = (column) =>
  withWasm(
    (wasm) => wasm.grid_editor_input_type_js(column),
    () => tsViewmodel.gridEditorInputType(column),
  );
export const gridColumnWidth: typeof tsViewmodel.gridColumnWidth = (column) =>
  withWasm(
    (wasm) => wasm.grid_column_width_js(column),
    () => tsViewmodel.gridColumnWidth(column),
  );
export const gridCellIndent: typeof tsViewmodel.gridCellIndent = (
  options,
  visibleColumns,
  row,
  column,
) =>
  tsViewmodel.gridCellIndent(options, visibleColumns, row, column);
export const gridTreeToggleLabel: typeof tsViewmodel.gridTreeToggleLabel = (expanded, labels) =>
  withWasm(
    (wasm) => wasm.grid_tree_toggle_label_js({ expanded, labels }),
    () => tsViewmodel.gridTreeToggleLabel(expanded, labels),
  );
export const gridExpandToggleLabel: typeof tsViewmodel.gridExpandToggleLabel = (expanded, labels) =>
  withWasm(
    (wasm) => wasm.grid_expand_toggle_label_js({ expanded, labels }),
    () => tsViewmodel.gridExpandToggleLabel(expanded, labels),
  );
export const isGridColumnGrouped: typeof tsViewmodel.isGridColumnGrouped = (
  groupByColumns,
  column,
) =>
  tsViewmodel.isGridColumnGrouped(groupByColumns, column);
export const isGridTreeRowExpanded: typeof tsViewmodel.isGridTreeRowExpanded = (
  expandedTreeRows,
  row,
) =>
  tsViewmodel.isGridTreeRowExpanded(expandedTreeRows, row);
export const gridTreeToggleLabelForRow: typeof tsViewmodel.gridTreeToggleLabelForRow = (
  expandedTreeRows,
  row,
  labels,
) =>
  tsViewmodel.gridTreeToggleLabelForRow(expandedTreeRows, row, labels);
export const gridExpandToggleLabelForRow: typeof tsViewmodel.gridExpandToggleLabelForRow = (
  row,
  labels,
) =>
  tsViewmodel.gridExpandToggleLabelForRow(row, labels);

export const isPinningEnabled: typeof tsPinning.isPinningEnabled = (options) =>
  tsPinning.isPinningEnabled(options);
export const isColumnPinnable: typeof tsPinning.isColumnPinnable = (options, column) =>
  tsPinning.isColumnPinnable(options, column);
export const getColumnPinDirection: typeof tsPinning.getColumnPinDirection = (
  pinnedColumns,
  column,
) =>
  withWasm(
    (wasm) => wasm.get_column_pin_direction_js({ pinnedColumns, column }),
    () => tsPinning.getColumnPinDirection(pinnedColumns, column),
  );
export const pinColumnState: typeof tsPinning.pinColumnState = (current, columnName, direction) =>
  withWasm(
    (wasm) => wasm.pin_column_state_js({ current, columnName, direction }),
    () => tsPinning.pinColumnState(current, columnName, direction),
  );
export const buildInitialPinnedState: typeof tsPinning.buildInitialPinnedState = (columns) =>
  withWasm(
    (wasm) => wasm.build_initial_pinned_state_js(columns),
    () => tsPinning.buildInitialPinnedState(columns),
  );
export const computePinnedOffset: typeof tsPinning.computePinnedOffset = (
  visibleColumns,
  pinnedColumns,
  column,
) =>
  withWasm(
    (wasm) => wasm.compute_pinned_offset_js({ visibleColumns, pinnedColumns, column }),
    () => tsPinning.computePinnedOffset(visibleColumns, pinnedColumns, column),
  );
export const pinningButtonLabel: typeof tsPinning.pinningButtonLabel = (
  pinnedColumns,
  column,
  labels,
) =>
  withWasm(
    (wasm) => wasm.pinning_button_label_js({ pinnedColumns, column, labels }),
    () => tsPinning.pinningButtonLabel(pinnedColumns, column, labels),
  );

export const isGridCellPosition: typeof tsEdit.isGridCellPosition = (position, rowId, columnName) =>
  withWasm(
    (wasm) => wasm.is_grid_cell_position_js({ position, rowId, columnName }),
    () => tsEdit.isGridCellPosition(position, rowId, columnName),
  );
export const beginGridEditSession: typeof tsEdit.beginGridEditSession = (
  rowId,
  columnName,
  editingValue,
) =>
  withWasm(
    (wasm) => wasm.begin_grid_edit_session_js({ rowId, columnName, editingValue }),
    () => tsEdit.beginGridEditSession(rowId, columnName, editingValue),
  );
export const shouldGridEditOnFocus: typeof tsEdit.shouldGridEditOnFocus = (options, column) =>
  withWasm(
    (wasm) => wasm.should_grid_edit_on_focus_js({ options: normalizeOptionsForWasm(options), column }),
    () => tsEdit.shouldGridEditOnFocus(options, column),
  );
export const isPrintableGridKey: typeof tsEdit.isPrintableGridKey = (
  key,
  ctrlKey,
  metaKey,
  altKey,
) =>
  withWasm(
    (wasm) => wasm.is_printable_grid_key_js({ key, ctrlKey, metaKey, altKey }),
    () => tsEdit.isPrintableGridKey(key, ctrlKey, metaKey, altKey),
  );
export const isGridNavigationKey: typeof tsEdit.isGridNavigationKey = (key) =>
  tsEdit.isGridNavigationKey(key);
export const buildGridFocusCellResult: typeof tsEdit.buildGridFocusCellResult = (context) =>
  withWasm(
    (wasm) => wasm.build_grid_focus_cell_result_js(context),
    () => tsEdit.buildGridFocusCellResult(context),
  );
export const clearGridEditSession: typeof tsEdit.clearGridEditSession = () =>
  withWasm(
    (wasm) => wasm.clear_grid_edit_session_js(),
    () => tsEdit.clearGridEditSession(),
  );
export const findNextGridCell: typeof tsEdit.findNextGridCell = (context) =>
  withWasm(
    (wasm) => {
      if (context.isCellAllowed) {
        return tsEdit.findNextGridCell(context);
      }

      return wasm.find_next_grid_cell_js(context);
    },
    () => tsEdit.findNextGridCell(context),
  );
export const stringifyGridEditorValue: typeof tsEdit.stringifyGridEditorValue = (value) =>
  withWasm(
    (wasm) => wasm.stringify_grid_editor_value_js(value),
    () => tsEdit.stringifyGridEditorValue(value),
  );
export const parseGridEditedValue: typeof tsEdit.parseGridEditedValue = (column, value, oldValue) =>
  withWasm(
    (wasm) => wasm.parse_grid_edited_value_js({ column, value, oldValue }),
    () => tsEdit.parseGridEditedValue(column, value, oldValue),
  );

export const toggleGridRowExpanded: typeof tsRowState.toggleGridRowExpanded = (
  expandedRows,
  rowId,
) =>
  withWasm(
    (wasm) => wasm.toggle_grid_row_expanded_js({ expandedRows, rowId }),
    () => tsRowState.toggleGridRowExpanded(expandedRows, rowId),
  );
export const expandAllGridRows: typeof tsRowState.expandAllGridRows = (rows) =>
  withWasm(
    (wasm) => wasm.expand_all_grid_rows_js(rows),
    () => tsRowState.expandAllGridRows(rows),
  );
export const areAllGridRowsExpanded: typeof tsRowState.areAllGridRowsExpanded = (
  rows,
  expandedRows,
) =>
  withWasm(
    (wasm) => wasm.are_all_grid_rows_expanded_js({ rows, expandedRows }),
    () => tsRowState.areAllGridRowsExpanded(rows, expandedRows),
  );
export const setGridTreeRowExpanded: typeof tsRowState.setGridTreeRowExpanded = (
  expandedTreeRows,
  rowId,
  expanded,
) =>
  withWasm(
    (wasm) => wasm.set_grid_tree_row_expanded_js({ expandedTreeRows, rowId, expanded }),
    () => tsRowState.setGridTreeRowExpanded(expandedTreeRows, rowId, expanded),
  );
export const toggleGridTreeRowExpanded: typeof tsRowState.toggleGridTreeRowExpanded = (
  expandedTreeRows,
  rowId,
) =>
  withWasm(
    (wasm) => wasm.toggle_grid_tree_row_expanded_js({ expandedRows: expandedTreeRows, rowId }),
    () => tsRowState.toggleGridTreeRowExpanded(expandedTreeRows, rowId),
  );
export const expandAllGridTreeRows: typeof tsRowState.expandAllGridTreeRows = (rows) =>
  withWasm(
    (wasm) => wasm.expand_all_grid_tree_rows_js(rows),
    () => tsRowState.expandAllGridTreeRows(rows),
  );
export const getGridTreeRowChildren: typeof tsRowState.getGridTreeRowChildren = (rows, rowId) =>
  withWasm(
    (wasm) => wasm.get_grid_tree_row_children_js({ rows, rowId }),
    () => tsRowState.getGridTreeRowChildren(rows, rowId),
  );
export const addGridRowInvisibleReason: typeof tsRowState.addGridRowInvisibleReason = (
  hiddenRowReasons,
  rowId,
  reason,
) =>
  withWasm(
    (wasm) => wasm.add_grid_row_invisible_reason_js({ hiddenRowReasons, rowId, reason }),
    () => tsRowState.addGridRowInvisibleReason(hiddenRowReasons, rowId, reason),
  );
export const clearGridRowInvisibleReason: typeof tsRowState.clearGridRowInvisibleReason = (
  hiddenRowReasons,
  rowId,
  reason,
) =>
  withWasm(
    (wasm) => wasm.clear_grid_row_invisible_reason_js({ hiddenRowReasons, rowId, reason }),
    () => tsRowState.clearGridRowInvisibleReason(hiddenRowReasons, rowId, reason),
  );

export const getEffectivePageSize: typeof tsPagination.getEffectivePageSize = (
  options,
  pageSize,
  totalItems,
) =>
  tsPagination.getEffectivePageSize(options, pageSize, totalItems);
export const getTotalPagesValue: typeof tsPagination.getTotalPagesValue = (
  options,
  totalItems,
  pageSize,
) =>
  tsPagination.getTotalPagesValue(options, totalItems, pageSize);
export const getCurrentPageValue: typeof tsPagination.getCurrentPageValue = (
  options,
  currentPage,
  totalItems,
  pageSize,
) =>
  tsPagination.getCurrentPageValue(options, currentPage, totalItems, pageSize);
export const getFirstRowIndexValue: typeof tsPagination.getFirstRowIndexValue = (
  options,
  currentPage,
  totalItems,
  pageSize,
) =>
  tsPagination.getFirstRowIndexValue(options, currentPage, totalItems, pageSize);
export const getLastRowIndexValue: typeof tsPagination.getLastRowIndexValue = (
  options,
  currentPage,
  totalItems,
  pageSize,
) =>
  tsPagination.getLastRowIndexValue(options, currentPage, totalItems, pageSize);
export const paginateGridRows: typeof tsPagination.paginateGridRows = (
  rows,
  options,
  currentPage,
  pageSize,
  totalItems,
) =>
  withWasm(
    (wasm) =>
      wasm.paginate_grid_rows_js({
        rows,
        options: normalizeOptionsForWasm(options),
        currentPage,
        pageSize,
        totalItems,
      }),
    () => tsPagination.paginateGridRows(rows, options, currentPage, pageSize, totalItems),
  );
export const isVirtualizationEnabled: typeof tsPagination.isVirtualizationEnabled = (
  options,
  itemCount,
) =>
  withWasm(
    (wasm) =>
      wasm.is_virtualization_enabled_js({
        options: normalizeOptionsForWasm(options),
        itemCount,
      }),
    () => tsPagination.isVirtualizationEnabled(options, itemCount),
  );
export const calculateVirtualWindow: typeof tsPagination.calculateVirtualWindow = (request) =>
  withWasm(
    (wasm) => wasm.calculate_virtual_window_js(request),
    () => tsPagination.calculateVirtualWindow(request),
  );
export const seekGridPage: typeof tsPagination.seekGridPage = (page, totalPages) =>
  withWasm(
    (wasm) => wasm.seek_grid_page_js({ page, totalPages }),
    () => tsPagination.seekGridPage(page, totalPages),
  );
export const resolveGridPageSize: typeof tsPagination.resolveGridPageSize = (pageSize) =>
  withWasm(
    (wasm) => wasm.resolve_grid_page_size_js(pageSize),
    () => tsPagination.resolveGridPageSize(pageSize),
  );

export const buildGridSavedState: typeof tsState.buildGridSavedState = (context) =>
  withWasm(
    (wasm) => wasm.build_grid_saved_state_js(context),
    () => tsState.buildGridSavedState(context),
  );
export const normalizeGridSavedState: typeof tsState.normalizeGridSavedState = (state) =>
  withWasm(
    (wasm) => wasm.normalize_grid_saved_state_js(state),
    () => tsState.normalizeGridSavedState(state),
  );
export const sanitizeDownloadFilename: typeof tsState.sanitizeDownloadFilename = (value) =>
  withWasm(
    (wasm) => wasm.sanitize_download_filename_js(value),
    () => tsState.sanitizeDownloadFilename(value),
  );
export const normalizeBooleanMap: typeof tsState.normalizeBooleanMap = (value) =>
  withWasm(
    (wasm) => wasm.normalize_boolean_map_js({ value }),
    () => tsState.normalizeBooleanMap(value),
  );
export const isSafeStateKey: typeof tsState.isSafeStateKey = (value) =>
  withWasm(
    (wasm) => wasm.is_safe_state_key_js(value),
    () => tsState.isSafeStateKey(value),
  );

export const findGridRowById: typeof tsIdentity.findGridRowById = (rows, rowId) =>
  withWasm(
    (wasm) => wasm.find_grid_row_by_id_js({ rows, rowId }),
    () => tsIdentity.findGridRowById(rows, rowId),
  );
export const buildGridSortState: typeof tsIdentity.buildGridSortState = (columnName, direction) =>
  withWasm(
    (wasm) => wasm.build_grid_sort_state_js({ columnName, direction: direction ?? null }),
    () => tsIdentity.buildGridSortState(columnName, direction),
  );
export const resolveGridRowId: typeof tsIdentity.resolveGridRowId = (options, row) =>
  withWasm(
    (wasm) => {
      if (shouldFallbackResolveRowId(options, row)) {
        return tsIdentity.resolveGridRowId(options, row);
      }

      return wasm.resolve_grid_row_id_js({
        options: normalizeOptionsForWasm(options),
        row,
      });
    },
    () => tsIdentity.resolveGridRowId(options, row),
  );

export const maybeRequestInfiniteScrollData: typeof tsInfiniteScroll.maybeRequestInfiniteScrollData =
  (context) =>
    withWasm(
      (wasm) => wasm.maybe_request_infinite_scroll_data_js(context),
      () => tsInfiniteScroll.maybeRequestInfiniteScrollData(context),
    );
export const completeInfiniteScrollDataLoad: typeof tsInfiniteScroll.completeInfiniteScrollDataLoad =
  (state, scrollUp, scrollDown) =>
    withWasm(
      (wasm) => wasm.complete_infinite_scroll_data_load_js({ state, scrollUp, scrollDown }),
      () => tsInfiniteScroll.completeInfiniteScrollDataLoad(state, scrollUp, scrollDown),
    );
export const resetInfiniteScrollState: typeof tsInfiniteScroll.resetInfiniteScrollState = (
  scrollUp,
  scrollDown,
) =>
  withWasm(
    (wasm) =>
      wasm.reset_infinite_scroll_state_js({
        state: {
          scrollUp: false,
          scrollDown: false,
          dataLoading: false,
          previousVisibleRows: 0,
        },
        scrollUp,
        scrollDown,
      }),
    () => tsInfiniteScroll.resetInfiniteScrollState(scrollUp, scrollDown),
  );
export const saveInfiniteScrollPercentage: typeof tsInfiniteScroll.saveInfiniteScrollPercentage = (
  state,
  visibleRows,
) =>
  withWasm(
    (wasm) => wasm.save_infinite_scroll_percentage_js({ state, visibleRows }),
    () => tsInfiniteScroll.saveInfiniteScrollPercentage(state, visibleRows),
  );
export const setInfiniteScrollDirectionsState: typeof tsInfiniteScroll.setInfiniteScrollDirectionsState =
  (state, scrollUp, scrollDown) =>
    withWasm(
      (wasm) => wasm.set_infinite_scroll_directions_state_js({ state, scrollUp, scrollDown }),
      () => tsInfiniteScroll.setInfiniteScrollDirectionsState(state, scrollUp, scrollDown),
    );

export const clearGridFilterReasons: typeof tsFiltering.clearGridFilterReasons = (row) =>
  withWasm(
    (wasm) => {
      syncGridRowFilterState(row, wasm.clear_grid_filter_reasons_js(row));
    },
    () => tsFiltering.clearGridFilterReasons(row),
  );
export const matchesGridRowFilters: typeof tsFiltering.matchesGridRowFilters = (
  row,
  columns,
  options,
  activeFilters,
) =>
  shouldFallbackFiltering(columns)
    ? tsFiltering.matchesGridRowFilters(row, columns, options, activeFilters)
    : withWasm(
        (wasm) => {
          const result = wasm.matches_grid_row_filters_js({
            row,
            columns: columns.map((column) => normalizeColumnForWasm(column)),
            options: normalizeOptionsForWasm(options),
            activeFilters,
          });
          syncGridRowFilterState(row, result.row);
          return result.matches;
        },
        () => tsFiltering.matchesGridRowFilters(row, columns, options, activeFilters),
      );

export const sortGridRows: typeof tsSorting.sortGridRows = (rows, columns, options, sortState) =>
  shouldFallbackSorting(columns)
    ? tsSorting.sortGridRows(rows, columns, options, sortState)
    : withWasm(
        (wasm) =>
          wasm.sort_grid_rows_js({
            rows,
            columns,
            options: normalizeOptionsForWasm(options),
            sortState,
          }),
        () => tsSorting.sortGridRows(rows, columns, options, sortState),
      );

export const buildGridRows: typeof tsTree.buildGridRows = (
  options,
  rowSize,
  hiddenRowReasons,
  expandedRows,
) =>
  shouldFallbackTree(options, options.columnDefs)
    ? tsTree.buildGridRows(options, rowSize, hiddenRowReasons, expandedRows)
    : withWasm(
        (wasm) =>
          wasm.build_grid_rows_js({
            options: normalizeOptionsForWasm(options),
            rowSize,
            hiddenRowReasons,
            expandedRows,
          }),
        () => tsTree.buildGridRows(options, rowSize, hiddenRowReasons, expandedRows),
      );
export const isTreeEnabled: typeof tsTree.isTreeEnabled = (options) =>
  withWasm(
    (wasm) => wasm.is_tree_enabled_js(normalizeOptionsForWasm(options)),
    () => tsTree.isTreeEnabled(options),
  );
export const filterAndFlattenGridTreeRows: typeof tsTree.filterAndFlattenGridTreeRows = (
  rows,
  columns,
  options,
  activeFilters,
  expandedTreeRows,
  sortState,
) =>
  shouldFallbackTree(options, columns)
    ? tsTree.filterAndFlattenGridTreeRows(
        rows,
        columns,
        options,
        activeFilters,
        expandedTreeRows,
        sortState,
      )
    : withWasm(
        (wasm) =>
          wasm.filter_and_flatten_grid_tree_rows_js({
            rows,
            columns: columns.map((column) => normalizeColumnForWasm(column)),
            options: normalizeOptionsForWasm(options),
            activeFilters,
            expandedTreeRows,
            sortState,
          }),
        () =>
          tsTree.filterAndFlattenGridTreeRows(
            rows,
            columns,
            options,
            activeFilters,
            expandedTreeRows,
            sortState,
          ),
      );

export const buildGridDisplayItems: typeof tsGrouping.buildGridDisplayItems = (
  rows,
  columns,
  options,
  groupBy,
  collapsedGroups,
) =>
  requiresTemplateFallback(options)
    ? tsGrouping.buildGridDisplayItems(rows, columns, options, groupBy, collapsedGroups)
    : withWasm(
        (wasm) =>
          wasm.build_grid_display_items_js({
            rows,
            columns: columns.map((column) => normalizeColumnForWasm(column)),
            options: normalizeOptionsForWasm(options),
            groupBy,
            collapsedGroups,
          }),
        () => tsGrouping.buildGridDisplayItems(rows, columns, options, groupBy, collapsedGroups),
      );

// ---- Selection ---------------------------------------------------------
export type {
  GridSelectionState,
  GridSelectionResolvedOptions,
  SelectionChange,
} from './grid.core.selection';
export const createGridSelectionState = tsSelection.createGridSelectionState;
export const resolveGridSelectionOptions = tsSelection.resolveGridSelectionOptions;
export const toggleGridRowSelection = tsSelection.toggleGridRowSelection;
export const shiftGridRowSelection = tsSelection.shiftGridRowSelection;
export const selectAllGridRows = tsSelection.selectAllGridRows;
export const selectAllVisibleGridRows = tsSelection.selectAllVisibleGridRows;
export const clearAllGridSelection = tsSelection.clearAllGridSelection;
export const findGridRowByKey = tsSelection.findGridRowByKey;
export const reconcileGridSelection = tsSelection.reconcileGridSelection;
export const mapSelectedRowsToEntities = tsSelection.mapSelectedRowsToEntities;

export const headerLabel: typeof tsExport.headerLabel = (column) =>
  withWasm(
    (wasm) => wasm.header_label_js({ column: normalizeColumnForWasm(column) }),
    () => tsExport.headerLabel(column),
  );
export const buildGridCsv = tsExport.buildGridCsv;
export const resolveGridExporterOptions = tsExport.resolveGridExporterOptions;
export const filterExporterColumns = tsExport.filterExporterColumns;
export const resolveExporterFilename = tsExport.resolveExporterFilename;
export const GRID_EXPORTER_CONSTANTS = tsExport.GRID_EXPORTER_CONSTANTS;
export const buildGridPdfDocDefinition = tsExport.buildGridPdfDocDefinition;
export const calculateGridPdfColumnWidths = tsExport.calculateGridPdfColumnWidths;
export const formatGridPdfField = tsExport.formatGridPdfField;
export const resolveGridExporterPdfOptions = tsExport.resolveGridExporterPdfOptions;
export const buildGridExporterMenuItems = tsExporterMenu.buildGridExporterMenuItems;
export const buildGridExcelSheetData = tsExport.buildGridExcelSheetData;
export const formatGridExcelField = tsExport.formatGridExcelField;
export const resolveGridExporterExcelOptions = tsExport.resolveGridExporterExcelOptions;
export type {
  GridExporterOptions,
  GridExporterRowType,
  GridExporterColumnType,
  GridExporterPdfCell,
  GridExporterPdfDocDefinition,
  GridExporterPdfOptions,
  GridExporterExcelCell,
  GridExporterExcelSheetData,
  GridExporterExcelOptions,
} from './grid.core.export';
export type {
  GridExporterMenuItem,
  GridExporterMenuLabels,
  GridExporterMenuActions,
} from './grid.core.exporter-menu';
// Importer — pure state-free helpers. The vanilla element owns the DOM
// (file picker) and FileReader, then hands the raw text to these parsers.
export const resolveGridImporterOptions = tsImporter.resolveGridImporterOptions;
export const flattenGridColumnDefsForImport = tsImporter.flattenGridColumnDefsForImport;
export const defaultGridImporterProcessHeaders = tsImporter.defaultGridImporterProcessHeaders;
export const createGridImporterNewObject = tsImporter.createGridImporterNewObject;
export const applyGridImporterObjectCallback = tsImporter.applyGridImporterObjectCallback;
export const parseGridImporterJson = tsImporter.parseGridImporterJson;
export const parseGridImporterCsv = tsImporter.parseGridImporterCsv;
export const buildGridImporterObjectsFromCsv = tsImporter.buildGridImporterObjectsFromCsv;
export const buildGridImporterObjectsFromJson = tsImporter.buildGridImporterObjectsFromJson;
export type {
  GridImporterOptions,
  GridImporterHeaderMapping,
  GridImporterErrorKey,
} from './grid.core.importer';

// Importer + row-edit menu builders. Separate files from the feature
// modules because menu shape + gating is distinct from the feature logic.
export const buildGridImporterMenuItems = tsImporterMenu.buildGridImporterMenuItems;
export const buildGridRowEditMenuItems = tsRowEditMenu.buildGridRowEditMenuItems;
export type {
  GridImporterMenuActions,
  GridImporterMenuLabels,
} from './grid.core.importer-menu';
export type {
  GridRowEditMenuActions,
  GridRowEditMenuLabels,
} from './grid.core.row-edit-menu';
export type { GridMenuItem } from './grid.core.menu';

// i18n service — singleton + class export. Ports `ui.grid.i18n.i18nService`.
export const GridI18nService = tsI18n.GridI18nService;
export const gridI18n = tsI18n.gridI18n;
export const resolveLabelsFromI18n = tsI18n.resolveLabelsFromI18n;
export type { GridLocaleCode, GridI18nLanguageListener } from './grid.core.i18n';

// Validate — pure cell-validation helpers. Ports `ui.grid.validate`.
export const GridValidatorRegistry = tsValidate.GridValidatorRegistry;
// Type alias so consumers can write `GridValidatorRegistry` in a type
// position (parameter / return / class-field annotation). The `const`
// export above covers value-position usage (`new GridValidatorRegistry()`).
export type GridValidatorRegistry = InstanceType<typeof tsValidate.GridValidatorRegistry>;
export const createGridValidatorRegistry = tsValidate.createGridValidatorRegistry;
export const isGridCellInvalid = tsValidate.isGridCellInvalid;
export const setGridCellInvalid = tsValidate.setGridCellInvalid;
export const setGridCellValid = tsValidate.setGridCellValid;
export const setGridCellError = tsValidate.setGridCellError;
export const clearGridCellError = tsValidate.clearGridCellError;
export const getGridCellErrorNames = tsValidate.getGridCellErrorNames;
export const getGridCellErrorMessages = tsValidate.getGridCellErrorMessages;
export const runGridCellValidators = tsValidate.runGridCellValidators;
export const validateAllGridRows = tsValidate.validateAllGridRows;
export const invalidFieldFor = tsValidate.invalidFieldFor;
export const errorsFieldFor = tsValidate.errorsFieldFor;
export type {
  GridValidatorFn,
  GridValidatorFactory,
  GridValidatorMessageFn,
  GridValidatorRegistration,
} from './grid.core.validate';

// Row-edit pure helpers. All of these are DOM-free — the vanilla controller
// wires them to edit events + a timer for auto-save.
export const createGridRowEditState = tsRowEdit.createGridRowEditState;
export const markGridRowDirty = tsRowEdit.markGridRowDirty;
export const markGridRowClean = tsRowEdit.markGridRowClean;
export const markGridRowSaving = tsRowEdit.markGridRowSaving;
export const markGridRowError = tsRowEdit.markGridRowError;
export const isGridRowEditTimerEnabled = tsRowEdit.isGridRowEditTimerEnabled;
export const resolveGridRowEditWaitInterval = tsRowEdit.resolveGridRowEditWaitInterval;
export const collectGridRowEntities = tsRowEdit.collectGridRowEntities;
export type { GridRowEditState } from './grid.core.row-edit';

export const exportCsvRows: typeof tsExport.exportCsvRows = (columns, rows, formatCell) => {
  if (
    formatCell ||
    columns.some(
      (column) =>
        typeof column.valueGetter === 'function' ||
        typeof column.formatter === 'function' ||
        typeof column.cellRenderer === 'function',
    )
  ) {
    return tsExport.exportCsvRows(columns, rows, formatCell);
  }

  return withWasm(
    (wasm) => wasm.export_csv_rows_js(columns, rows),
    () => tsExport.exportCsvRows(columns, rows, formatCell),
  );
};
