import { GridCellPosition, GridColumnDef, GridOptions, GridRow } from './grid.models';
import { GridMoveDirection } from './grid.core.types';

export function isGridCellPosition(position: GridCellPosition | null, rowId: string, columnName: string): boolean {
  return position?.rowId === rowId && position.columnName === columnName;
}

export function beginGridEditSession(rowId: string, columnName: string, editingValue: string): {
  focusedCell: GridCellPosition;
  editingCell: GridCellPosition;
  editingValue: string;
} {
  const position = { rowId, columnName };
  return {
    focusedCell: position,
    editingCell: position,
    editingValue
  };
}

export function shouldGridEditOnFocus(options: GridOptions, column: GridColumnDef): boolean {
  return column.enableCellEditOnFocus ?? options.enableCellEditOnFocus ?? false;
}

export function isPrintableGridKey(key: string, ctrlKey: boolean, metaKey: boolean, altKey: boolean): boolean {
  return key.length === 1 && !ctrlKey && !metaKey && !altKey;
}

export function isGridNavigationKey(key: string): boolean {
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ArrowUp':
    case 'ArrowDown':
    case 'Tab':
    case 'Enter':
    case 'F2':
    case 'Backspace':
    case 'Delete':
      return true;
    default:
      return false;
  }
}

export function buildGridFocusCellResult(context: {
  currentFocusedCell: GridCellPosition | null;
  currentEditingCell: GridCellPosition | null;
  rowId: string;
  columnName: string;
  shouldEditOnFocus: boolean;
  isCellEditable: boolean;
}): { focusedCell: GridCellPosition; shouldBeginEdit: boolean } {
  const focusedCell = { rowId: context.rowId, columnName: context.columnName };
  return {
    focusedCell,
    shouldBeginEdit: context.shouldEditOnFocus
      && context.isCellEditable
      && !isGridCellPosition(context.currentFocusedCell, context.rowId, context.columnName)
      && !isGridCellPosition(context.currentEditingCell, context.rowId, context.columnName)
  };
}

export function clearGridEditSession(): {
  editingCell: null;
  editingValue: string;
} {
  return {
    editingCell: null,
    editingValue: ''
  };
}

export function findNextGridCell(context: {
  rows: readonly GridRow[];
  columns: readonly GridColumnDef[];
  rowId: string;
  columnName: string;
  direction: GridMoveDirection;
  isCellAllowed?: (row: GridRow, column: GridColumnDef) => boolean;
}): { row: GridRow; column: GridColumnDef } | null {
  const rowIndex = context.rows.findIndex((candidate) => candidate.id === context.rowId);
  const columnIndex = context.columns.findIndex((candidate) => candidate.name === context.columnName);
  if (rowIndex === -1 || columnIndex === -1) {
    return null;
  }

  let nextRowIndex = rowIndex;
  let nextColumnIndex = columnIndex;

  while (true) {
    switch (context.direction) {
      case 'left':
        nextColumnIndex -= 1;
        if (nextColumnIndex < 0) {
          nextRowIndex -= 1;
          nextColumnIndex = context.columns.length - 1;
        }
        break;
      case 'right':
        nextColumnIndex += 1;
        if (nextColumnIndex >= context.columns.length) {
          nextRowIndex += 1;
          nextColumnIndex = 0;
        }
        break;
      case 'up':
        nextRowIndex -= 1;
        break;
      case 'down':
        nextRowIndex += 1;
        break;
    }

    if (
      nextRowIndex < 0
      || nextRowIndex >= context.rows.length
      || nextColumnIndex < 0
      || nextColumnIndex >= context.columns.length
    ) {
      return null;
    }

    const nextRow = context.rows[nextRowIndex];
    const nextColumn = context.columns[nextColumnIndex];
    if (!nextRow || !nextColumn) {
      return null;
    }

    if (!context.isCellAllowed || context.isCellAllowed(nextRow, nextColumn)) {
      return { row: nextRow, column: nextColumn };
    }
  }
}

export function stringifyGridEditorValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value === null || value === undefined ? '' : String(value);
}

export function parseGridEditedValue(column: GridColumnDef, value: string, oldValue: unknown): unknown {
  switch (column.type) {
    case 'number': {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? oldValue : parsed;
    }
    case 'boolean':
      return value === 'true';
    case 'date':
      return value;
    default:
      return value;
  }
}