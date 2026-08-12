/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { SORT_DIRECTIONS } from './grid.constants';
import {
  buildGridPipeline,
  clearGridPipelineRowsCache,
  getCachedGridPipelineRows,
} from './grid.core.pipeline';
import { BuildGridPipelineContext } from './grid.core.types';
import { GridColumnDef, GridOptions, GridRecord } from './grid.models';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.pipeline.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(
    process.execPath,
    ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return JSON.parse(output) as T;
}

function makeData(): GridRecord[] {
  return [
    { id: 'r1', name: 'Alpha', status: 'Active', revenue: 200 },
    { id: 'r2', name: 'Beta', status: 'Pilot', revenue: 100 },
    { id: 'r3', name: 'Gamma', status: 'Active', revenue: 300 },
    { id: 'r4', name: 'Delta', status: 'Active', revenue: 150 },
  ];
}

function makeColumns(): GridColumnDef[] {
  return [
    { name: 'name' },
    { name: 'status' },
    { name: 'revenue', type: 'number' },
  ];
}

function makeBaseContext(overrides: Partial<BuildGridPipelineContext> = {}): BuildGridPipelineContext {
  const data = overrides.options?.data ?? makeData();
  const options: GridOptions = {
    id: 'g',
    data,
    columnDefs: makeColumns(),
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: false,
    // No `rowIdentity` callback configured (subprocess strips it anyway). TS
    // and Rust both fall through to `${options.id}-${rowIndex}` in that case.
    ...(overrides.options ?? {}),
  };
  return {
    options,
    columns: makeColumns(),
    activeFilters: {},
    sortState: { columnName: null, direction: SORT_DIRECTIONS.none },
    groupByColumns: [],
    collapsedGroups: {},
    hiddenRowReasons: {},
    expandedRows: {},
    expandedTreeRows: {},
    currentPage: 1,
    pageSize: 0,
    rowSize: 44,
    now: () => 0,
    ...overrides,
  };
}

describe('grid.core.pipeline wasm parity', () => {
  it('matches an unfiltered, unsorted pipeline', { timeout: 30000 }, () => {
    const context = makeBaseContext();
    const ts = buildGridPipeline(context);
    const wasm = runWasm<{
      visibleRows: Array<{ id: string }>;
      totalItems: number;
      virtualizationEnabled: boolean;
    }>('buildGridPipeline', context);

    expect(wasm.visibleRows.map((r) => r.id)).toEqual(ts.visibleRows.map((r) => r.id));
    expect(wasm.totalItems).toBe(ts.totalItems);
    expect(wasm.virtualizationEnabled).toBe(ts.virtualizationEnabled);
  });

  it('matches filter + sort pipeline', { timeout: 30000 }, () => {
    const context = makeBaseContext({
      activeFilters: { status: 'Active' },
      sortState: { columnName: 'revenue', direction: SORT_DIRECTIONS.desc },
    });
    const ts = buildGridPipeline(context);
    const wasm = runWasm<{ visibleRows: Array<{ id: string }> }>(
      'buildGridPipeline',
      context,
    );
    // r1 (200), r3 (300), r4 (150) → sorted desc by revenue → r3, r1, r4.
    expect(wasm.visibleRows.map((r) => r.id)).toEqual(ts.visibleRows.map((r) => r.id));
    // Without rowIdentity configured, both implementations use the
    // `${options.id}-${rowIndex}` fallback. r1=g-0 (rev=200),
    // r2=g-1 (Pilot, filtered out), r3=g-2 (rev=300), r4=g-3 (rev=150).
    // Sorted desc by revenue: r3, r1, r4 → g-2, g-0, g-3.
    expect(ts.visibleRows.map((r) => r.id)).toEqual(['g-2', 'g-0', 'g-3']);
  });

  it('matches paginated pipeline', { timeout: 30000 }, () => {
    const context = makeBaseContext({
      sortState: { columnName: 'revenue', direction: SORT_DIRECTIONS.asc },
      pageSize: 2,
      currentPage: 2,
      options: {
        id: 'g',
        data: makeData(),
        columnDefs: makeColumns(),
        enableSorting: true,
        enablePagination: true,
      },
    });
    const ts = buildGridPipeline(context);
    const wasm = runWasm<{ visibleRows: Array<{ id: string }>; totalItems: number }>(
      'buildGridPipeline',
      context,
    );
    expect(wasm.visibleRows.map((r) => r.id)).toEqual(ts.visibleRows.map((r) => r.id));
    expect(wasm.totalItems).toBe(ts.totalItems);
  });

  it('matches getCachedGridPipelineRows shape across the cache shim', { timeout: 30000 }, () => {
    // Reset both caches so the call below is a fresh miss in each impl.
    clearGridPipelineRowsCache();
    const context = makeBaseContext();
    const ts = getCachedGridPipelineRows(context);
    const wasm = runWasm<Array<{ id: string; index: number; height: number }>>(
      'getCachedGridPipelineRows',
      context,
    );
    expect(wasm.length).toBe(ts.length);
    expect(wasm.map((r) => r.id)).toEqual(ts.map((r) => r.id));
    expect(wasm.map((r) => r.index)).toEqual(ts.map((r) => r.index));
    expect(wasm.map((r) => r.height)).toEqual(ts.map((r) => r.height));

    // A second call with the same context returns identical rows in TS
    // (cache hit) and identical shape over the wasm shim (cache miss
    // across the boundary, but the rebuilt rows must match).
    const tsAgain = getCachedGridPipelineRows(context);
    const wasmAgain = runWasm<Array<{ id: string }>>(
      'getCachedGridPipelineRows',
      context,
    );
    expect(tsAgain.map((r) => r.id)).toEqual(ts.map((r) => r.id));
    expect(wasmAgain.map((r) => r.id)).toEqual(wasm.map((r) => r.id));

    // clearGridPipelineRowsCache is a no-op shape-wise but must not throw
    // and must leave the next call producing the same rows again.
    clearGridPipelineRowsCache();
    runWasm<null>('clearGridPipelineRowsCache', null);
    const tsAfterClear = getCachedGridPipelineRows(context);
    const wasmAfterClear = runWasm<Array<{ id: string }>>(
      'getCachedGridPipelineRows',
      context,
    );
    expect(tsAfterClear.map((r) => r.id)).toEqual(ts.map((r) => r.id));
    expect(wasmAfterClear.map((r) => r.id)).toEqual(wasm.map((r) => r.id));
  });

  it('matches grouped pipeline', { timeout: 30000 }, () => {
    const context = makeBaseContext({
      groupByColumns: ['status'],
      options: {
        id: 'g',
        data: makeData(),
        columnDefs: makeColumns(),
        enableSorting: true,
        enableGrouping: true,
      },
    });
    const ts = buildGridPipeline(context);
    const wasm = runWasm<{
      displayItems: Array<{ kind: string; id?: string }>;
    }>('buildGridPipeline', context);
    expect(wasm.displayItems.map((d) => d.kind)).toEqual(
      ts.displayItems.map((d) => d.kind),
    );
  });
});
