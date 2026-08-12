import { GridRow } from './grid.models';

export function toggleGridRowExpanded(
  expandedRows: Readonly<Record<string, boolean>>,
  rowId: string
): { expanded: boolean; nextExpandedRows: Record<string, boolean> } {
  const expanded = !expandedRows[rowId];
  return {
    expanded,
    nextExpandedRows: {
      ...expandedRows,
      [rowId]: expanded
    }
  };
}

export function expandAllGridRows(rows: readonly GridRow[]): Record<string, boolean> {
  const nextExpandedRows: Record<string, boolean> = {};

  for (const row of rows) {
    nextExpandedRows[row.id] = true;
  }

  return nextExpandedRows;
}

export function areAllGridRowsExpanded(rows: readonly GridRow[], expandedRows: Readonly<Record<string, boolean>>): boolean {
  return rows.every((row) => expandedRows[row.id] === true);
}

export function setGridTreeRowExpanded(
  expandedTreeRows: Readonly<Record<string, boolean>>,
  rowId: string,
  expanded: boolean
): Record<string, boolean> {
  return {
    ...expandedTreeRows,
    [rowId]: expanded
  };
}

export function toggleGridTreeRowExpanded(
  expandedTreeRows: Readonly<Record<string, boolean>>,
  rowId: string
): { expanded: boolean; nextExpandedTreeRows: Record<string, boolean> } {
  const expanded = !expandedTreeRows[rowId];
  return {
    expanded,
    nextExpandedTreeRows: setGridTreeRowExpanded(expandedTreeRows, rowId, expanded)
  };
}

export function expandAllGridTreeRows(rows: readonly GridRow[]): Record<string, boolean> {
  const nextExpandedTreeRows: Record<string, boolean> = {};

  for (const row of rows) {
    if (row.hasChildren) {
      nextExpandedTreeRows[row.id] = true;
    }
  }

  return nextExpandedTreeRows;
}

export function getGridTreeRowChildren(rows: readonly GridRow[], rowId: string): GridRow[] {
  return rows.filter((candidate) => candidate.parentId === rowId);
}

export function addGridRowInvisibleReason(
  hiddenRowReasons: Readonly<Record<string, readonly string[]>>,
  rowId: string,
  reason: string
): Record<string, string[]> {
  const reasons = new Set(hiddenRowReasons[rowId] ?? []);
  reasons.add(reason);

  const nextHiddenRowReasons = Object.entries(hiddenRowReasons).reduce<Record<string, string[]>>((accumulator, [key, value]) => {
    accumulator[key] = [...value];
    return accumulator;
  }, {});
  nextHiddenRowReasons[rowId] = [...reasons];

  return nextHiddenRowReasons;
}

export function clearGridRowInvisibleReason(
  hiddenRowReasons: Readonly<Record<string, readonly string[]>>,
  rowId: string,
  reason: string
): Record<string, string[]> {
  const reasons = new Set(hiddenRowReasons[rowId] ?? []);
  reasons.delete(reason);

  const nextHiddenRowReasons = Object.entries(hiddenRowReasons).reduce<Record<string, string[]>>((accumulator, [key, value]) => {
    accumulator[key] = [...value];
    return accumulator;
  }, {});
  if (reasons.size === 0) {
    delete nextHiddenRowReasons[rowId];
  } else {
    nextHiddenRowReasons[rowId] = [...reasons];
  }

  return nextHiddenRowReasons;
}