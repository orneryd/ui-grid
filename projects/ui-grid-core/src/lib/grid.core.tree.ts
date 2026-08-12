import { GridColumnDef, GridOptions, GridRecord, GridRow, SortState } from './grid.models';
import { getPathValue } from './grid.utils';
import { clearGridFilterReasons, matchesGridRowFilters } from './grid.core.filtering';
import { sortGridRows } from './grid.core.sorting';

export function isTreeEnabled(options: GridOptions): boolean {
  return options.enableTreeView === true;
}

function getTreeChildren(options: GridOptions, entity: GridRecord): GridRecord[] {
  if (!isTreeEnabled(options)) {
    return [];
  }

  const treeChildren = getPathValue(entity, options.treeChildrenField ?? 'children');
  return Array.isArray(treeChildren) ? treeChildren as GridRecord[] : [];
}

function createRow(
  options: GridOptions,
  entity: GridRecord,
  index: number,
  rowSize: number,
  hiddenRowReasons: Readonly<Record<string, readonly string[]>>,
  treeLevel = 0,
  parentId: string | null = null,
  childCount = 0,
  expanded = false
): GridRow {
  const rowIdentity = options.rowIdentity?.(entity, index) ?? `${options.id}-${index}`;
  const row = new GridRow(rowIdentity, entity, index, rowSize);
  const reasons = hiddenRowReasons[row.id] ?? [];

  row.treeLevel = treeLevel;
  row.parentId = parentId;
  row.childCount = childCount;
  row.hasChildren = childCount > 0;
  row.expanded = expanded;
  row.expandedRowHeight = options.expandableRowHeight ?? 150;

  for (const reason of reasons) {
    row.setThisRowInvisible(reason);
  }

  return row;
}

export function buildGridRows(
  options: GridOptions,
  rowSize: number,
  hiddenRowReasons: Readonly<Record<string, readonly string[]>>,
  expandedRows: Readonly<Record<string, boolean>>
): GridRow[] {
  const rows: GridRow[] = [];
  let nextIndex = 0;

  const visit = (entities: readonly GridRecord[], treeLevel: number, parentId: string | null): void => {
    for (const entity of entities) {
      const childEntities = getTreeChildren(options, entity);
      const row = createRow(
        options,
        entity,
        nextIndex,
        rowSize,
        hiddenRowReasons,
        treeLevel,
        parentId,
        childEntities.length,
        expandedRows[options.rowIdentity?.(entity, nextIndex) ?? `${options.id}-${nextIndex}`] === true
      );

      nextIndex += 1;
      rows.push(row);

      if (isTreeEnabled(options) && childEntities.length > 0) {
        visit(childEntities, treeLevel + 1, row.id);
      }
    }
  };

  visit(options.data, 0, null);
  return rows;
}

export function filterAndFlattenGridTreeRows(
  rows: readonly GridRow[],
  columns: readonly GridColumnDef[],
  options: GridOptions,
  activeFilters: Readonly<Record<string, string>>,
  expandedTreeRows: Readonly<Record<string, boolean>>,
  sortState: SortState
): GridRow[] {
  const rowsByParent = new Map<string | null, GridRow[]>();
  for (const row of rows) {
    const bucket = rowsByParent.get(row.parentId) ?? [];
    bucket.push(row);
    rowsByParent.set(row.parentId, bucket);
  }

  const included = new Set<string>();
  const visit = (row: GridRow): boolean => {
    const manuallyHidden = !row.visible && [...row.invisibleReasons].some((reason) => !reason.startsWith('filter:'));
    if (manuallyHidden) {
      return false;
    }

    const children = rowsByParent.get(row.id) ?? [];
    let childIncluded = false;
    for (const child of children) {
      childIncluded = visit(child) || childIncluded;
    }

    const selfIncluded = matchesGridRowFilters(row, columns, options, activeFilters);
    if (childIncluded) {
      clearGridFilterReasons(row);
    }

    const include = row.visible && (selfIncluded || childIncluded);
    if (include) {
      included.add(row.id);
    }

    return include;
  };

  for (const rootRow of rowsByParent.get(null) ?? []) {
    visit(rootRow);
  }

  const flattened: GridRow[] = [];
  const flatten = (parentId: string | null): void => {
    const siblings = sortGridRows(
      (rowsByParent.get(parentId) ?? []).filter((row) => included.has(row.id)),
      columns,
      options,
      sortState
    );
    for (const row of siblings) {
      flattened.push(row);
      if (row.hasChildren && expandedTreeRows[row.id]) {
        flatten(row.id);
      }
    }
  };

  flatten(null);
  return flattened;
}