import { GridOptions, GridRow } from './grid.models';

export interface VirtualWindowRequest {
  itemCount: number;
  itemSize: number;
  viewportHeight: number;
  overscan?: number;
  scrollTop: number;
}

export interface VirtualWindowResult {
  visibleRange: { start: number; end: number };
  totalHeight: number;
  offsetY: number;
}

function isPaginationEnabled(options: GridOptions): boolean {
  return options.enablePagination === true || (options.paginationPageSize ?? 0) > 0;
}

function initialPageSize(options: GridOptions): number {
  if (options.paginationPageSize) {
    return options.paginationPageSize;
  }

  if (options.paginationPageSizes && options.paginationPageSizes.length > 0) {
    return options.paginationPageSizes[0];
  }

  return options.data.length;
}

export function getEffectivePageSize(options: GridOptions, pageSize: number, totalItems: number): number {
  if (!isPaginationEnabled(options)) {
    return totalItems;
  }

  const resolvedPageSize = pageSize || initialPageSize(options);
  return resolvedPageSize > 0 ? resolvedPageSize : totalItems;
}

export function getTotalPagesValue(options: GridOptions, totalItems: number, pageSize: number): number {
  if (!isPaginationEnabled(options) || getEffectivePageSize(options, pageSize, totalItems) <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(totalItems / getEffectivePageSize(options, pageSize, totalItems)));
}

export function getCurrentPageValue(
  options: GridOptions,
  currentPage: number,
  totalItems: number,
  pageSize: number
): number {
  return Math.min(Math.max(currentPage, 1), getTotalPagesValue(options, totalItems, pageSize));
}

export function getFirstRowIndexValue(
  options: GridOptions,
  currentPage: number,
  totalItems: number,
  pageSize: number
): number {
  if (!isPaginationEnabled(options) || totalItems === 0 || options.useExternalPagination === true) {
    return 0;
  }

  return (getCurrentPageValue(options, currentPage, totalItems, pageSize) - 1) * getEffectivePageSize(options, pageSize, totalItems);
}

export function getLastRowIndexValue(
  options: GridOptions,
  currentPage: number,
  totalItems: number,
  pageSize: number
): number {
  if (totalItems === 0) {
    return 0;
  }

  if (!isPaginationEnabled(options) || options.useExternalPagination === true) {
    return totalItems - 1;
  }

  return Math.min(
    getFirstRowIndexValue(options, currentPage, totalItems, pageSize) + getEffectivePageSize(options, pageSize, totalItems),
    totalItems
  ) - 1;
}

export function paginateGridRows(
  rows: readonly GridRow[],
  options: GridOptions,
  currentPage: number,
  pageSize: number,
  totalItems: number
): GridRow[] {
  if (!isPaginationEnabled(options) || options.useExternalPagination === true) {
    return [...rows];
  }

  const resolvedPageSize = getEffectivePageSize(options, pageSize, totalItems);
  const firstRow = getFirstRowIndexValue(options, currentPage, totalItems, pageSize);
  return [...rows].slice(firstRow, firstRow + resolvedPageSize);
}

export function isVirtualizationEnabled(options: GridOptions, itemCount: number): boolean {
  return options.enableVirtualization !== false
    && itemCount >= (options.virtualizationThreshold ?? 40);
}

export function calculateVirtualWindow(request: VirtualWindowRequest): VirtualWindowResult {
  const overscan = request.overscan ?? 3;

  if (request.itemCount <= 0 || request.itemSize <= 0) {
    return {
      visibleRange: { start: 0, end: 0 },
      totalHeight: Math.max(0, request.itemCount) * Math.max(0, request.itemSize),
      offsetY: 0,
    };
  }

  const rawStart = Math.floor(request.scrollTop / request.itemSize) - overscan;
  const start = Math.max(0, rawStart);
  const rawEnd = rawStart + Math.ceil(request.viewportHeight / request.itemSize) + 2 * overscan;
  const end = Math.min(request.itemCount, Math.max(start + 1, rawEnd));

  return {
    visibleRange: { start, end },
    totalHeight: request.itemCount * request.itemSize,
    offsetY: start * request.itemSize,
  };
}

export function seekGridPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

export function resolveGridPageSize(pageSize: number): number | null {
  return Number.isFinite(pageSize) && pageSize > 0 ? pageSize : null;
}