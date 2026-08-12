import { SORT_DIRECTIONS, SortDirection } from './grid.constants';
import { DEFAULT_GRID_LABELS, GridColumnDef, GridLabels, GridOptions, GridRow } from './grid.models';
import { gridI18n } from './grid.core.i18n';

/**
 * Resolve the effective labels bundle. Fallback chain (most specific first):
 *  1. `options.labels` override supplied by the consumer.
 *  2. The current language registered with the i18n service.
 *  3. `DEFAULT_GRID_LABELS` (en-US) for anything still missing.
 *
 * The i18n service exposes `setCurrentLang()` + `add()` so consumers can
 * swap languages or register custom locales without touching the options.
 */
export function resolveGridLabels(overrides?: Partial<GridLabels>): GridLabels {
  const localeLabels = gridI18n.getCurrentLabels();
  if (!overrides) return localeLabels;
  return { ...localeLabels, ...overrides };
}

export function isGridTreeEnabled(options: GridOptions): boolean {
  return options.enableTreeView === true;
}

export function isGridGroupingEnabled(options: GridOptions): boolean {
  return options.enableGrouping === true && !isGridTreeEnabled(options);
}

export function canGridExpandRows(options: GridOptions): boolean {
  return options.enableExpandable === true && !!options.expandableRowTemplate;
}

export function isGridPaginationEnabled(options: GridOptions): boolean {
  return options.enablePagination === true || (options.paginationPageSize ?? 0) > 0;
}

export function shouldShowGridPaginationControls(options: GridOptions): boolean {
  return isGridPaginationEnabled(options) && options.enablePaginationControls !== false;
}

export function isGridInfiniteScrollEnabled(options: GridOptions): boolean {
  return options.infiniteScrollRowsFromEnd !== undefined
    || options.infiniteScrollUp === true
    || options.infiniteScrollDown !== undefined;
}

export function isGridSortingEnabled(options: GridOptions): boolean {
  return options.enableSorting !== false;
}

export function isGridFilteringEnabled(options: GridOptions): boolean {
  return options.enableFiltering !== false;
}

export function canGridMoveColumns(options: GridOptions): boolean {
  return options.enableColumnMoving === true;
}

export function isGridPrimaryColumn(visibleColumns: readonly GridColumnDef[], column: GridColumnDef): boolean {
  // The injected selection row-header (`selectionRowHeaderCol`) always sits
  // at index 0 when row selection is enabled — but it isn't a real data
  // column and shouldn't host the tree / expand toggle. Walk past it to
  // find the first actual data column.
  for (const candidate of visibleColumns) {
    if (candidate.name === 'selectionRowHeaderCol') continue;
    return candidate.name === column.name;
  }
  return false;
}

export function isGridColumnSortable(options: GridOptions, column: GridColumnDef): boolean {
  return isGridSortingEnabled(options) && column.sortable !== false && column.enableSorting !== false;
}

export function isGridColumnFilterable(options: GridOptions, column: GridColumnDef): boolean {
  return isGridFilteringEnabled(options) && column.filterable !== false && column.enableFiltering !== false;
}

export function shouldShowGridTreeToggle(
  options: GridOptions,
  visibleColumns: readonly GridColumnDef[],
  row: GridRow,
  column: GridColumnDef
): boolean {
  return isGridPrimaryColumn(visibleColumns, column)
    && isGridTreeEnabled(options)
    && (row.hasChildren || options.showTreeExpandNoChildren !== false);
}

export function shouldShowGridExpandToggle(
  options: GridOptions,
  visibleColumns: readonly GridColumnDef[],
  column: GridColumnDef
): boolean {
  return isGridPrimaryColumn(visibleColumns, column) && canGridExpandRows(options);
}

export function gridSortButtonLabel(direction: SortDirection, labels: GridLabels): string {
  switch (direction) {
    case SORT_DIRECTIONS.asc:
      return labels.sortAsc;
    case SORT_DIRECTIONS.desc:
      return labels.sortDesc;
    default:
      return labels.sortDefault;
  }
}

export function gridSortAriaSort(direction: SortDirection): string {
  switch (direction) {
    case SORT_DIRECTIONS.asc:
      return 'ascending';
    case SORT_DIRECTIONS.desc:
      return 'descending';
    default:
      return 'none';
  }
}

export function gridGroupingButtonLabel(isGrouped: boolean, labels: GridLabels): string {
  return isGrouped ? labels.ungroupColumn : labels.groupColumn;
}

export function gridFilterPlaceholder(isFilterable: boolean, labels: GridLabels): string {
  return isFilterable ? labels.filterPlaceholder : labels.filterDisabled;
}

export function gridGroupDisclosureLabel(collapsed: boolean, labels: GridLabels): string {
  return collapsed ? labels.groupExpand : labels.groupCollapse;
}

export function gridEditorInputType(column: GridColumnDef): string {
  switch (column.type) {
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    default:
      return 'text';
  }
}

export function gridColumnWidth(column: GridColumnDef): string {
  return column.width ?? 'minmax(11rem, 1fr)';
}

export function gridCellIndent(
  options: GridOptions,
  visibleColumns: readonly GridColumnDef[],
  row: GridRow,
  column: GridColumnDef
): string {
  if (!isGridPrimaryColumn(visibleColumns, column) || !isGridTreeEnabled(options)) {
    return '0px';
  }

  return `${row.treeLevel * (options.treeIndent ?? 10)}px`;
}

export function gridTreeToggleLabel(expanded: boolean, labels: GridLabels): string {
  return expanded ? labels.treeCollapse : labels.treeExpand;
}

export function gridExpandToggleLabel(expanded: boolean, labels: GridLabels): string {
  return expanded ? labels.collapseDetail : labels.expandDetail;
}

export function isGridColumnGrouped(groupByColumns: readonly string[], column: GridColumnDef): boolean {
  return groupByColumns.includes(column.name);
}

export function isGridTreeRowExpanded(expandedTreeRows: Readonly<Record<string, boolean>>, row: GridRow): boolean {
  return expandedTreeRows[row.id] === true;
}

export function gridTreeToggleLabelForRow(
  expandedTreeRows: Readonly<Record<string, boolean>>,
  row: GridRow,
  labels: GridLabels
): string {
  return gridTreeToggleLabel(isGridTreeRowExpanded(expandedTreeRows, row), labels);
}

export function gridExpandToggleLabelForRow(row: GridRow, labels: GridLabels): string {
  return gridExpandToggleLabel(row.expanded, labels);
}
