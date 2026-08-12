/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import { SORT_DIRECTIONS } from './grid.constants';
import { sortGridRows } from './grid.core.sorting';
import { GridColumnDef, GridOptions, GridRow, SortState } from './grid.models';
// In-process wasm-web import for the sortingAlgorithm callback case —
// subprocess argv runners drop function-typed properties via JSON.stringify,
// so the deferred-sort flag would never surface through that path.
import * as wasmModule from '../../../../dist/ui-grid-wasm-web/ui_grid_wasm.js';

const wasmBinaryPath = fileURLToPath(
  new URL('../../../../dist/ui-grid-wasm-web/ui_grid_wasm_bg.wasm', import.meta.url),
);

beforeAll(async () => {
  await (wasmModule as unknown as { default: (input: ArrayBuffer) => Promise<unknown> }).default(
    readFileSync(wasmBinaryPath).buffer as ArrayBuffer,
  );
});

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.sorting.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(
    process.execPath,
    ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return JSON.parse(output) as T;
}

function col(name: string, extra: Partial<GridColumnDef> = {}): GridColumnDef {
  return { name, ...extra };
}

function row(id: string, entity: Record<string, unknown>): GridRow {
  return new GridRow(id, { id, ...entity }, 0, 44);
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

describe('grid.core.sorting wasm parity', () => {
  it('matches sortGridRows for asc / desc / no-sort across types', { timeout: 30000 }, () => {
    const options: GridOptions = { id: 'g', data: [], columnDefs: [] };
    const columns = [col('name'), col('revenue', { type: 'number' })];
    const rows = [
      row('r1', { name: 'Charlie', revenue: 200 }),
      row('r2', { name: 'alpha', revenue: 100 }),
      row('r3', { name: 'Beta', revenue: 300 }),
    ];

    const cases: SortState[] = [
      { columnName: 'name', direction: SORT_DIRECTIONS.asc },
      { columnName: 'name', direction: SORT_DIRECTIONS.desc },
      { columnName: 'revenue', direction: SORT_DIRECTIONS.asc },
      { columnName: 'revenue', direction: SORT_DIRECTIONS.desc },
      { columnName: null, direction: SORT_DIRECTIONS.asc },
      { columnName: 'name', direction: SORT_DIRECTIONS.none },
    ];

    for (const sortState of cases) {
      const ts = sortGridRows(rows, columns, options, sortState).map((r) => r.id);
      const wasm = runWasm<Array<{ id: string }>>('sortGridRows', {
        rows: serializeRows(rows),
        columns,
        options,
        sortState,
      }).map((r) => r.id);
      expect(wasm).toEqual(ts);
    }
  });

  it('respects column.sortable / column.enableSorting / options.enableSorting flags', { timeout: 30000 }, () => {
    const rows = [
      row('r1', { name: 'Charlie' }),
      row('r2', { name: 'alpha' }),
    ];

    // column.sortable = false → no sort applied
    {
      const columns = [col('name', { sortable: false })];
      const options: GridOptions = { id: 'g', data: [], columnDefs: [] };
      const sortState: SortState = { columnName: 'name', direction: SORT_DIRECTIONS.asc };
      const ts = sortGridRows(rows, columns, options, sortState).map((r) => r.id);
      const wasm = runWasm<Array<{ id: string }>>('sortGridRows', {
        rows: serializeRows(rows),
        columns,
        options,
        sortState,
      }).map((r) => r.id);
      expect(wasm).toEqual(ts);
    }

    // options.enableSorting = false → no sort applied
    {
      const columns = [col('name')];
      const options: GridOptions = {
        id: 'g',
        data: [],
        columnDefs: [],
        enableSorting: false,
      };
      const sortState: SortState = { columnName: 'name', direction: SORT_DIRECTIONS.asc };
      const ts = sortGridRows(rows, columns, options, sortState).map((r) => r.id);
      const wasm = runWasm<Array<{ id: string }>>('sortGridRows', {
        rows: serializeRows(rows),
        columns,
        options,
        sortState,
      }).map((r) => r.id);
      expect(wasm).toEqual(ts);
    }
  });

  it('defers to host when a column declares a sortingAlgorithm callback', { timeout: 30000 }, () => {
    // Column with a JS sortingAlgorithm callback. The Rust core can't
    // invoke JS closures, so the wasm shim flags the column with
    // has_sorting_algorithm=true and the sorter returns rows in input
    // order (`SortKind::DeferToHost`). The TS sortGridRows path uses
    // the callback directly so it produces a fully sorted result.
    const options: GridOptions = { id: 'g', data: [], columnDefs: [] };
    const reverseAlpha = (left: unknown, right: unknown) => {
      const ls = String(left ?? '');
      const rs = String(right ?? '');
      if (ls < rs) return 1;
      if (ls > rs) return -1;
      return 0;
    };
    const columns = [col('name', { sortingAlgorithm: reverseAlpha })];
    const rows = [
      row('r1', { name: 'Charlie' }),
      row('r2', { name: 'Alpha' }),
      row('r3', { name: 'Bravo' }),
    ];
    const sortState: SortState = { columnName: 'name', direction: SORT_DIRECTIONS.asc };

    const ts = sortGridRows(rows, columns, options, sortState).map((r) => r.id);
    // TS uses the callback; reverseAlpha sorts desc → r1 (Charlie),
    // r3 (Bravo), r2 (Alpha).
    expect(ts).toEqual(['r1', 'r3', 'r2']);

    const wasm = (
      wasmModule as unknown as {
        sort_grid_rows_js: (input: unknown) => Array<{ id: string }>;
      }
    ).sort_grid_rows_js({
      // Pass live columns array — the wasm shim uses Reflect.get to
      // detect function-typed sortingAlgorithm before serde drops it.
      rows: serializeRows(rows),
      columns,
      options,
      sortState,
    });
    // Wasm defers to the host: stable sort with all-equal compare → input order preserved.
    expect(wasm.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
  });

  it('handles nullish values consistently (push to end on asc)', { timeout: 30000 }, () => {
    const options: GridOptions = { id: 'g', data: [], columnDefs: [] };
    const columns = [col('revenue', { type: 'number' })];
    const rows = [
      row('r1', { revenue: 100 }),
      row('r2', { revenue: null }),
      row('r3', { revenue: 50 }),
    ];
    const sortState: SortState = { columnName: 'revenue', direction: SORT_DIRECTIONS.asc };

    const ts = sortGridRows(rows, columns, options, sortState).map((r) => r.id);
    const wasm = runWasm<Array<{ id: string }>>('sortGridRows', {
      rows: serializeRows(rows),
      columns,
      options,
      sortState,
    }).map((r) => r.id);
    expect(wasm).toEqual(ts);
  });
});
