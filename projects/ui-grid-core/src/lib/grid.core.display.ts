import { GridCellTemplateContext, GridColumnDef, GridRow } from './grid.models';
import { getCellValue, stringifyCellValue } from './grid.utils';

export function buildGridCellContext(row: GridRow, column: GridColumnDef): GridCellTemplateContext {
  const value = getCellValue(row.entity, column);
  return {
    $implicit: value,
    value,
    row: row.entity,
    column,
    rowIndex: row.index
  };
}

export function formatGridCellDisplayValue(context: GridCellTemplateContext): string {
  if (context.column.cellRenderer) {
    return context.column.cellRenderer(context);
  }

  return context.column.formatter
    ? context.column.formatter(context.value, context.row)
    : stringifyCellValue(context.value);
}