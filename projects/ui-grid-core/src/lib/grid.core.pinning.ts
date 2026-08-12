import { GridColumnDef, GridLabels, GridOptions } from './grid.models';

export type PinDirection = 'left' | 'right' | 'none';

export interface PinnedColumnState {
  [columnName: string]: 'left' | 'right';
}

export function isPinningEnabled(options: GridOptions): boolean {
  return options.enablePinning === true;
}

export function isColumnPinnable(options: GridOptions, column: GridColumnDef): boolean {
  return isPinningEnabled(options) && column.enablePinning !== false;
}

export function getColumnPinDirection(
  pinnedColumns: Readonly<PinnedColumnState>,
  column: GridColumnDef,
): PinDirection {
  return pinnedColumns[column.name] ?? 'none';
}

export function pinColumnState(
  current: Readonly<PinnedColumnState>,
  columnName: string,
  direction: PinDirection,
): PinnedColumnState {
  const next: PinnedColumnState = { ...current };
  if (direction === 'none') {
    delete next[columnName];
  } else {
    next[columnName] = direction;
  }
  return next;
}

export function buildInitialPinnedState(columns: readonly GridColumnDef[]): PinnedColumnState {
  const state: PinnedColumnState = {};
  for (const col of columns) {
    if (col.pinnedLeft) state[col.name] = 'left';
    else if (col.pinnedRight) state[col.name] = 'right';
  }
  return state;
}

export function computePinnedOffset(
  visibleColumns: readonly GridColumnDef[],
  pinnedColumns: Readonly<PinnedColumnState>,
  column: GridColumnDef,
): { side: 'left' | 'right'; offset: string } | null {
  const direction = pinnedColumns[column.name];
  if (!direction) return null;

  function resolveColumnWidthForOffset(column: GridColumnDef): string {
    const w = column.width;
    if (!w) return '11rem';
    const minmaxMatch = w.match(/^minmax\((.+?),\s*(.+)\)$/i);
    if (minmaxMatch) {
      return minmaxMatch[1]?.trim() || '11rem';
    }
    if (w.includes('fr')) return '11rem';
    return w;
  }

  if (direction === 'left') {
    const offsetParts: string[] = [];
    for (const col of visibleColumns) {
      if (col.name === column.name) break;
      if (pinnedColumns[col.name] === 'left') {
        offsetParts.push(resolveColumnWidthForOffset(col));
      }
    }
    return {
      side: 'left',
      offset: offsetParts.length > 0 ? `calc(${offsetParts.join(' + ')})` : '0px',
    };
  }

  if (direction === 'right') {
    const offsetParts: string[] = [];
    const reversed = [...visibleColumns].reverse();
    for (const col of reversed) {
      if (col.name === column.name) break;
      if (pinnedColumns[col.name] === 'right') {
        offsetParts.push(resolveColumnWidthForOffset(col));
      }
    }
    return {
      side: 'right',
      offset: offsetParts.length > 0 ? `calc(${offsetParts.join(' + ')})` : '0px',
    };
  }

  return null;
}

export function pinningButtonLabel(
  pinnedColumns: Readonly<PinnedColumnState>,
  column: GridColumnDef,
  labels: GridLabels,
): string {
  const direction = pinnedColumns[column.name];
  if (direction === 'left' || direction === 'right') return labels.unpin;
  return labels.pinLeft;
}
