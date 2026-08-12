/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { FILTER_CONDITIONS } from './grid.constants';
import {
  clearGridFilterReasons,
  matchesGridRowFilters,
  matchesGridRowPreparedFilters,
  prepareGridColumnFilters,
} from './grid.core.filtering';
import { GridColumnDef, GridOptions, GridRow } from './grid.models';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.filtering.wasm-runner.mjs', import.meta.url),
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

function makeRow(id: string, entity: Record<string, unknown>): GridRow {
  return new GridRow(id, { id, ...entity }, 0, 44);
}

function serializeRow(row: GridRow) {
  return {
    id: row.id,
    entity: row.entity,
    index: row.index,
    height: row.height,
    invisibleReasons: [...row.invisibleReasons],
    visible: row.visible,
    isSelected: row.isSelected,
    isFocused: row.isFocused,
    enableSelection: row.enableSelection,
    treeLevel: row.treeLevel,
    parentId: row.parentId,
    hasChildren: row.hasChildren,
    childCount: row.childCount,
    expanded: row.expanded,
    expandedRowHeight: row.expandedRowHeight,
  };
}

describe('grid.core.filtering wasm parity', () => {
  it('matches matchesGridRowFilters across contains / starts-with / equals', { timeout: 30000 }, () => {
    const options: GridOptions = { id: 'g', data: [], columnDefs: [] };
    const columns = [
      col('name', { filter: { condition: FILTER_CONDITIONS.contains } }),
      col('status', { filter: { condition: FILTER_CONDITIONS.exact } }),
      col('revenue', {
        type: 'number',
        filter: { condition: FILTER_CONDITIONS.greaterThan },
      }),
    ];

    const cases: Array<{
      row: GridRow;
      activeFilters: Record<string, string>;
      expected: boolean;
    }> = [
      {
        row: makeRow('r1', { name: 'Alpha', status: 'Active', revenue: 200 }),
        activeFilters: { name: 'Alp' },
        expected: true,
      },
      {
        row: makeRow('r2', { name: 'Beta', status: 'Active', revenue: 100 }),
        activeFilters: { name: 'Alp' },
        expected: false,
      },
      {
        row: makeRow('r3', { name: 'Alpha', status: 'Active', revenue: 200 }),
        activeFilters: { status: 'Active' },
        expected: true,
      },
      {
        row: makeRow('r4', { name: 'Alpha', status: 'Pilot', revenue: 200 }),
        activeFilters: { status: 'Active' },
        expected: false,
      },
      {
        row: makeRow('r5', { name: 'Alpha', revenue: 250 }),
        activeFilters: { revenue: '200' },
        expected: true,
      },
      {
        row: makeRow('r6', { name: 'Alpha', revenue: 100 }),
        activeFilters: { revenue: '200' },
        expected: false,
      },
      {
        row: makeRow('r7', { name: 'Alpha' }),
        activeFilters: {},
        expected: true,
      },
    ];

    for (const c of cases) {
      // Cloned row instances per implementation since both mutate visibility.
      const tsRow = makeRow(c.row.id, c.row.entity as Record<string, unknown>);
      const ts = matchesGridRowFilters(tsRow, columns, options, c.activeFilters);
      expect(ts).toBe(c.expected);

      const wasm = runWasm<{ matches: boolean; row: { invisibleReasons: string[]; visible: boolean } }>(
        'matchesGridRowFilters',
        {
          row: serializeRow(c.row),
          columns,
          options,
          activeFilters: c.activeFilters,
        },
      );
      expect(wasm.matches).toBe(c.expected);
    }
  });

  it('matches matchesGridRowsPreparedFilters across the batch shim', { timeout: 30000 }, () => {
    const options: GridOptions = { id: 'g', data: [], columnDefs: [] };
    const columns = [
      col('name', { filter: { condition: FILTER_CONDITIONS.contains } }),
      col('status', { filter: { condition: FILTER_CONDITIONS.exact } }),
      col('revenue', {
        type: 'number',
        filter: { condition: FILTER_CONDITIONS.greaterThan },
      }),
    ];
    const activeFilters = { name: 'Alp', revenue: '150' };

    const inputRows = [
      makeRow('r1', { name: 'Alpha', status: 'Active', revenue: 200 }),
      makeRow('r2', { name: 'Beta', status: 'Active', revenue: 200 }),
      makeRow('r3', { name: 'Alpha', status: 'Pilot', revenue: 100 }),
      makeRow('r4', { name: 'Alpha', status: 'Active', revenue: 250 }),
    ];

    // Seed every row with a stale `filter:status` reason. The batch shim
    // mirrors `matchesGridRowFilters`'s contract — it clears stale
    // `filter:<col>` reasons for columns that no longer have an active
    // filter, then evaluates prepared specs. Both implementations should
    // arrive at the same matches + reasons set.
    for (const row of inputRows) row.setThisRowInvisible('filter:status');

    const tsRows = inputRows.map((r) => {
      const cloned = makeRow(r.id, r.entity as Record<string, unknown>);
      cloned.setThisRowInvisible('filter:status');
      return cloned;
    });
    const tsMatches = tsRows.map((row) =>
      matchesGridRowFilters(row, columns, options, activeFilters),
    );

    const wasm = runWasm<{
      rows: Array<{ invisibleReasons: string[]; visible: boolean }>;
      matches: boolean[];
    }>('matchesGridRowsPreparedFilters', {
      rows: inputRows.map(serializeRow),
      columns,
      options,
      activeFilters,
    });

    expect(wasm.matches).toEqual(tsMatches);
    expect(wasm.rows.map((r) => [...r.invisibleReasons].sort())).toEqual(
      tsRows.map((r) => [...r.invisibleReasons].sort()),
    );

    // Also verify the prepared helper produces identical results when the
    // caller has already cleared stale reasons (mirroring the pipeline's
    // own usage).
    const tsRowsPrepared = inputRows.map((r) =>
      makeRow(r.id, r.entity as Record<string, unknown>),
    );
    const prepared = prepareGridColumnFilters(columns, activeFilters);
    expect(prepared.length).toBe(2);
    const preparedMatches = tsRowsPrepared.map((row) =>
      matchesGridRowPreparedFilters(row, prepared),
    );
    expect(preparedMatches).toEqual(tsMatches);
  });

  it('matches clearGridFilterReasons (drops only filter:* reasons)', { timeout: 30000 }, () => {
    const row = makeRow('r1', { name: 'Alpha' });
    row.setThisRowInvisible('filter:status');
    row.setThisRowInvisible('filter:name');
    row.setThisRowInvisible('user:custom');

    const ts = makeRow('r1', { name: 'Alpha' });
    ts.setThisRowInvisible('filter:status');
    ts.setThisRowInvisible('filter:name');
    ts.setThisRowInvisible('user:custom');
    clearGridFilterReasons(ts);

    const wasm = runWasm<{ invisibleReasons: string[]; visible: boolean }>(
      'clearGridFilterReasons',
      serializeRow(row),
    );

    expect([...ts.invisibleReasons].sort()).toEqual(['user:custom']);
    expect([...wasm.invisibleReasons].sort()).toEqual(['user:custom']);
    expect(wasm.visible).toBe(ts.visible);
  });
});
