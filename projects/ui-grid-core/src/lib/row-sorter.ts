import { GridColumnDef, GridRecord, GridSortFn } from './grid.models';
import { getCellValue } from './grid.utils';

function handleNulls(left: unknown, right: unknown): number | null {
  if (left === undefined || left === null || right === undefined || right === null) {
    if ((left === undefined || left === null) && (right === undefined || right === null)) {
      return 0;
    }

    return left === undefined || left === null ? 1 : -1;
  }

  return null;
}

function basicSort(left: unknown, right: unknown): number {
  const nulls = handleNulls(left, right);
  if (nulls !== null) {
    return nulls;
  }

  if (left === right) {
    return 0;
  }

  return left! < right! ? -1 : 1;
}

function sortNumber(left: unknown, right: unknown): number {
  const nulls = handleNulls(left, right);
  if (nulls !== null) {
    return nulls;
  }

  return Number(left) - Number(right);
}

function parseNumberString(value: string): number {
  if (/^\s*-?Infinity\s*$/.test(value)) {
    return parseFloat(value);
  }

  return parseFloat(value.replace(/[^0-9.eE-]/g, ''));
}

function sortNumberString(left: unknown, right: unknown): number {
  const nulls = handleNulls(left, right);
  if (nulls !== null) {
    return nulls;
  }

  const parsedLeft = parseNumberString(String(left));
  const parsedRight = parseNumberString(String(right));
  const badLeft = Number.isNaN(parsedLeft);
  const badRight = Number.isNaN(parsedRight);

  if (badLeft || badRight) {
    return badLeft && badRight ? 0 : badLeft ? 1 : -1;
  }

  return parsedLeft - parsedRight;
}

function sortAlpha(left: unknown, right: unknown): number {
  const nulls = handleNulls(left, right);
  if (nulls !== null) {
    return nulls;
  }

  const leftValue = String(left).toLowerCase();
  const rightValue = String(right).toLowerCase();
  return leftValue === rightValue ? 0 : leftValue.localeCompare(rightValue);
}

function sortDate(left: unknown, right: unknown): number {
  const nulls = handleNulls(left, right);
  if (nulls !== null) {
    return nulls;
  }

  const leftTime = left instanceof Date ? left.getTime() : new Date(String(left)).getTime();
  const rightTime = right instanceof Date ? right.getTime() : new Date(String(right)).getTime();
  return leftTime === rightTime ? 0 : leftTime < rightTime ? -1 : 1;
}

function sortBoolean(left: unknown, right: unknown): number {
  const nulls = handleNulls(left, right);
  if (nulls !== null) {
    return nulls;
  }

  if ((Boolean(left) && Boolean(right)) || (!left && !right)) {
    return 0;
  }

  return left ? 1 : -1;
}

function guessSortFn(values: readonly unknown[]): GridSortFn {
  const firstNonNullValue = values.find((value) => value !== null && value !== undefined);

  if (typeof firstNonNullValue === 'number') {
    return sortNumber;
  }

  if (typeof firstNonNullValue === 'boolean') {
    return sortBoolean;
  }

  if (firstNonNullValue instanceof Date) {
    return sortDate;
  }

  if (typeof firstNonNullValue === 'string') {
    return /^[$£€]?\s*-?[\d,.]+$/.test(firstNonNullValue) ? sortNumberString : sortAlpha;
  }

  return basicSort;
}

export function getSortFn(column: GridColumnDef, rows: readonly GridRecord[]): GridSortFn {
  if (column.sortingAlgorithm) {
    return column.sortingAlgorithm;
  }

  const sampleValues = rows.map((row) => getCellValue(row, column));
  return guessSortFn(sampleValues);
}
