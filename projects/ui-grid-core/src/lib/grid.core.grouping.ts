import { DisplayItem } from './grid.core.types';
import { GridColumnDef, GridOptions, GridRow } from './grid.models';
import { getPathValue, stringifyCellValue } from './grid.utils';

function isGroupingEnabled(options: GridOptions): boolean {
  return options.enableGrouping === true && options.enableTreeView !== true;
}

function canExpandRows(options: GridOptions): boolean {
  return options.enableExpandable === true && !!options.expandableRowTemplate;
}

function buildRowDisplayItems(rows: readonly GridRow[], options: GridOptions): DisplayItem[] {
  const items: DisplayItem[] = [];
  rows.forEach((row, visibleIndex) => {
    items.push({ kind: 'row', id: row.id, row, visibleIndex });
    if (row.expanded && canExpandRows(options)) {
      items.push({ kind: 'expandable', id: `${row.id}:expandable`, row });
    }
  });

  return items;
}

function buildGroupedItems(
  rows: readonly GridRow[],
  columns: readonly GridColumnDef[],
  options: GridOptions,
  groupBy: readonly string[],
  collapsedGroups: Readonly<Record<string, boolean>>,
  depth: number,
  path: string
): DisplayItem[] {
  if (groupBy.length === 0) {
    return buildRowDisplayItems(rows, options);
  }

  const [currentField, ...rest] = groupBy;
  const groups = new Map<string, GridRow[]>();

  for (const row of rows) {
    const value = stringifyCellValue(getPathValue(row.entity, currentField));
    const key = value || 'Unassigned';
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  const items: DisplayItem[] = [];
  for (const [label, groupedRows] of groups) {
    const groupId = `${path}${currentField}:${label}`;
    const collapsed = collapsedGroups[groupId] ?? options.grouping?.startCollapsed ?? false;
    items.push({
      kind: 'group',
      id: groupId,
      depth,
      field: currentField,
      label,
      count: groupedRows.length,
      collapsed
    });

    if (!collapsed) {
      items.push(...buildGroupedItems(groupedRows, columns, options, rest, collapsedGroups, depth + 1, `${groupId}|`));
    }
  }

  return items;
}

export function buildGridDisplayItems(
  rows: readonly GridRow[],
  columns: readonly GridColumnDef[],
  options: GridOptions,
  groupBy: readonly string[],
  collapsedGroups: Readonly<Record<string, boolean>>
): DisplayItem[] {
  if (options.enableTreeView === true) {
    return buildRowDisplayItems(rows, options);
  }

  if (!isGroupingEnabled(options) || groupBy.length === 0) {
    return buildRowDisplayItems(rows, options);
  }

  return buildGroupedItems(rows, columns, options, groupBy, collapsedGroups, 0, '');
}