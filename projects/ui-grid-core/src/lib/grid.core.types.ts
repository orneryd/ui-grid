import { GridColumnDef, GridOptions, GridRow, SortState } from './grid.models';

export interface GroupItem {
  kind: 'group';
  id: string;
  depth: number;
  field: string;
  label: string;
  count: number;
  collapsed: boolean;
}

export interface RowItem {
  kind: 'row';
  id: string;
  row: GridRow;
  visibleIndex: number;
}

export interface ExpandableItem {
  kind: 'expandable';
  id: string;
  row: GridRow;
}

export type DisplayItem = GroupItem | RowItem | ExpandableItem;

export interface PipelineResult {
  visibleRows: GridRow[];
  displayItems: DisplayItem[];
  virtualizationEnabled: boolean;
  pipelineMs: number;
  totalItems: number;
}

export interface BuildGridPipelineContext {
  options: GridOptions;
  columns: readonly GridColumnDef[];
  activeFilters: Readonly<Record<string, string>>;
  sortState: SortState;
  groupByColumns: readonly string[];
  collapsedGroups: Readonly<Record<string, boolean>>;
  hiddenRowReasons: Readonly<Record<string, readonly string[]>>;
  expandedRows: Readonly<Record<string, boolean>>;
  expandedTreeRows: Readonly<Record<string, boolean>>;
  currentPage: number;
  pageSize: number;
  rowSize: number;
  now?: () => number;
}

export interface GridInfiniteScrollState {
  scrollUp: boolean;
  scrollDown: boolean;
  dataLoading: boolean;
  previousVisibleRows: number;
}

export type GridMoveDirection = 'left' | 'right' | 'up' | 'down';