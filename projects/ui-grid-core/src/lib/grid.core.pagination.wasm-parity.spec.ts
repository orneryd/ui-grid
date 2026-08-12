/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  calculateVirtualWindow,
  getCurrentPageValue,
  getEffectivePageSize,
  getFirstRowIndexValue,
  getLastRowIndexValue,
  getTotalPagesValue,
  isVirtualizationEnabled,
  paginateGridRows,
  resolveGridPageSize,
  seekGridPage,
} from './grid.core.pagination';
import { GridOptions, GridRow } from './grid.models';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.pagination.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(
    process.execPath,
    ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return JSON.parse(output) as T;
}

const baseOptions: GridOptions = {
  id: 'g',
  data: [],
  columnDefs: [],
};

const paginated: GridOptions = {
  ...baseOptions,
  enablePagination: true,
};

const externallyPaginated: GridOptions = {
  ...baseOptions,
  enablePagination: true,
  useExternalPagination: true,
};

function makeRows(count: number): GridRow[] {
  return Array.from({ length: count }, (_, i) => new GridRow(`r${i}`, { id: `r${i}` }, i, 44));
}

function serializeRows(rows: GridRow[]) {
  return rows.map((r) => ({
    id: r.id,
    entity: r.entity,
    index: r.index,
    height: r.height,
    invisibleReasons: [...r.invisibleReasons],
    visible: r.visible,
    isSelected: r.isSelected,
    isFocused: r.isFocused,
    enableSelection: r.enableSelection,
    treeLevel: r.treeLevel,
    parentId: r.parentId,
    hasChildren: r.hasChildren,
    childCount: r.childCount,
    expanded: r.expanded,
    expandedRowHeight: r.expandedRowHeight,
  }));
}

describe('grid.core.pagination wasm parity', () => {
  it('matches getEffectivePageSize', { timeout: 30000 }, () => {
    const cases = [
      { options: paginated, pageSize: 10, totalItems: 100 },
      { options: paginated, pageSize: 0, totalItems: 100 },
      { options: { ...paginated, paginationPageSize: 25 }, pageSize: 0, totalItems: 100 },
      { options: baseOptions, pageSize: 10, totalItems: 100 }, // not paginated
    ];
    for (const c of cases) {
      expect(runWasm('getEffectivePageSize', c)).toBe(
        getEffectivePageSize(c.options, c.pageSize, c.totalItems),
      );
    }
  });

  it('matches getTotalPagesValue / getCurrentPageValue', { timeout: 30000 }, () => {
    const cases = [
      { options: paginated, currentPage: 1, totalItems: 100, pageSize: 25 },
      { options: paginated, currentPage: 5, totalItems: 100, pageSize: 25 },
      { options: paginated, currentPage: 0, totalItems: 100, pageSize: 25 },
      { options: paginated, currentPage: 99, totalItems: 100, pageSize: 25 },
      { options: baseOptions, currentPage: 1, totalItems: 100, pageSize: 25 },
    ];
    for (const c of cases) {
      expect(runWasm('getTotalPagesValue', c)).toBe(
        getTotalPagesValue(c.options, c.totalItems, c.pageSize),
      );
      expect(runWasm('getCurrentPageValue', c)).toBe(
        getCurrentPageValue(c.options, c.currentPage, c.totalItems, c.pageSize),
      );
    }
  });

  it('matches getFirstRowIndexValue / getLastRowIndexValue', { timeout: 30000 }, () => {
    const cases = [
      { options: paginated, currentPage: 1, totalItems: 100, pageSize: 25 },
      { options: paginated, currentPage: 4, totalItems: 100, pageSize: 25 },
      { options: paginated, currentPage: 1, totalItems: 0, pageSize: 25 },
      { options: externallyPaginated, currentPage: 1, totalItems: 100, pageSize: 25 },
      { options: baseOptions, currentPage: 1, totalItems: 100, pageSize: 25 },
    ];
    for (const c of cases) {
      expect(runWasm('getFirstRowIndexValue', c)).toBe(
        getFirstRowIndexValue(c.options, c.currentPage, c.totalItems, c.pageSize),
      );
      expect(runWasm('getLastRowIndexValue', c)).toBe(
        getLastRowIndexValue(c.options, c.currentPage, c.totalItems, c.pageSize),
      );
    }
  });

  it('matches paginateGridRows for first/middle/last pages and unpaginated', { timeout: 30000 }, () => {
    const rows = makeRows(50);
    const cases = [
      { options: paginated, currentPage: 1, totalItems: 50, pageSize: 10 },
      { options: paginated, currentPage: 3, totalItems: 50, pageSize: 10 },
      { options: paginated, currentPage: 5, totalItems: 50, pageSize: 10 },
      { options: baseOptions, currentPage: 1, totalItems: 50, pageSize: 10 },
      { options: externallyPaginated, currentPage: 2, totalItems: 50, pageSize: 10 },
    ];
    for (const c of cases) {
      const ts = paginateGridRows(rows, c.options, c.currentPage, c.pageSize, c.totalItems).map(
        (r) => r.id,
      );
      const wasm = runWasm<Array<{ id: string }>>('paginateGridRows', {
        rows: serializeRows(rows),
        options: c.options,
        currentPage: c.currentPage,
        pageSize: c.pageSize,
        totalItems: c.totalItems,
      }).map((r) => r.id);
      expect(wasm).toEqual(ts);
    }
  });

  it('matches isVirtualizationEnabled', { timeout: 30000 }, () => {
    const cases = [
      { options: baseOptions, itemCount: 100 },
      { options: { ...baseOptions, enableVirtualization: false }, itemCount: 100 },
      { options: { ...baseOptions, virtualizationThreshold: 10 }, itemCount: 5 },
      { options: { ...baseOptions, virtualizationThreshold: 10 }, itemCount: 25 },
    ];
    for (const c of cases) {
      expect(runWasm('isVirtualizationEnabled', c)).toBe(
        isVirtualizationEnabled(c.options, c.itemCount),
      );
    }
  });

  it('matches seekGridPage / resolveGridPageSize', { timeout: 30000 }, () => {
    for (const c of [
      { page: 0, totalPages: 5 },
      { page: 3, totalPages: 5 },
      { page: 10, totalPages: 5 },
      { page: 1, totalPages: 0 },
    ]) {
      expect(runWasm('seekGridPage', c)).toBe(seekGridPage(c.page, c.totalPages));
    }
    for (const pageSize of [0, 1, 25, 100]) {
      expect(runWasm('resolveGridPageSize', pageSize)).toEqual(resolveGridPageSize(pageSize));
    }
  });

  it('matches calculateVirtualWindow', { timeout: 30000 }, () => {
    const cases = [
      { itemCount: 100, itemSize: 44, viewportHeight: 400, scrollTop: 0 },
      { itemCount: 100, itemSize: 44, viewportHeight: 400, scrollTop: 500, overscan: 5 },
      { itemCount: 0, itemSize: 44, viewportHeight: 400, scrollTop: 0 },
      { itemCount: 100, itemSize: 0, viewportHeight: 400, scrollTop: 0 },
      { itemCount: 5, itemSize: 100, viewportHeight: 400, scrollTop: 0 }, // small itemCount
    ];
    for (const c of cases) {
      expect(runWasm('calculateVirtualWindow', c)).toEqual(calculateVirtualWindow(c));
    }
  });
});
