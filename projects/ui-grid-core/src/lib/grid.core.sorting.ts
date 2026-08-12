import { SORT_DIRECTIONS } from './grid.constants';
import { GridColumnDef, GridOptions, GridRow, SortState } from './grid.models';
import { getCellValue } from './grid.utils';
import { getSortFn } from './row-sorter';

function isSortingEnabled(options: GridOptions): boolean {
  return options.enableSorting !== false;
}

export function sortGridRows(
  rows: readonly GridRow[],
  columns: readonly GridColumnDef[],
  options: GridOptions,
  sortState: SortState
): GridRow[] {
  if (!sortState.columnName || sortState.direction === SORT_DIRECTIONS.none || !isSortingEnabled(options)) {
    return [...rows];
  }

  const sortColumn = columns.find((column) => column.name === sortState.columnName);
  if (!sortColumn || sortColumn.sortable === false || sortColumn.enableSorting === false) {
    return [...rows];
  }

  const sortFn = getSortFn(sortColumn, rows.map((row) => row.entity));
  const directionMultiplier = sortState.direction === SORT_DIRECTIONS.desc ? -1 : 1;

  return [...rows].sort((left, right) => {
    const leftValue = getCellValue(left.entity, sortColumn);
    const rightValue = getCellValue(right.entity, sortColumn);
    return sortFn(leftValue, rightValue) * directionMultiplier;
  });
}