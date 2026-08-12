/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  addGridRowInvisibleReason,
  areAllGridRowsExpanded,
  clearGridRowInvisibleReason,
  expandAllGridRows,
  expandAllGridTreeRows,
  getGridTreeRowChildren,
  setGridTreeRowExpanded,
  toggleGridRowExpanded,
  toggleGridTreeRowExpanded,
} from './grid.core.row-state';
import { GridRow } from './grid.models';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.row-state.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(
    process.execPath,
    ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return JSON.parse(output) as T;
}

function makeRow(id: string, opts: { hasChildren?: boolean; parentId?: string } = {}): GridRow {
  const row = new GridRow(id, { id }, 0, 44);
  if (opts.hasChildren) row.hasChildren = true;
  if (opts.parentId) row.parentId = opts.parentId;
  return row;
}

function serializeRows(rows: GridRow[]) {
  return rows.map((row) => ({
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
  }));
}

describe('grid.core.row-state wasm parity', () => {
  it('matches toggleGridRowExpanded for absent and present rows', () => {
    const expandedRows = { r1: true };
    for (const rowId of ['r1', 'r2']) {
      const ts = toggleGridRowExpanded(expandedRows, rowId);
      const wasm = runWasm<{ expanded: boolean; nextExpandedRows: Record<string, boolean> }>(
        'toggleGridRowExpanded',
        { expandedRows, rowId },
      );
      expect(wasm.expanded).toBe(ts.expanded);
      expect(wasm.nextExpandedRows).toEqual(ts.nextExpandedRows);
    }
  });

  it('matches expandAllGridRows / areAllGridRowsExpanded', () => {
    const rows = [makeRow('r1'), makeRow('r2'), makeRow('r3')];
    const tsExpanded = expandAllGridRows(rows);
    const wasmExpanded = runWasm<Record<string, boolean>>(
      'expandAllGridRows',
      serializeRows(rows),
    );
    expect(wasmExpanded).toEqual(tsExpanded);

    expect(
      runWasm<boolean>('areAllGridRowsExpanded', {
        rows: serializeRows(rows),
        expandedRows: tsExpanded,
      }),
    ).toBe(areAllGridRowsExpanded(rows, tsExpanded));

    expect(
      runWasm<boolean>('areAllGridRowsExpanded', {
        rows: serializeRows(rows),
        expandedRows: { r1: true, r2: true },
      }),
    ).toBe(areAllGridRowsExpanded(rows, { r1: true, r2: true }));
  });

  it('matches setGridTreeRowExpanded / toggleGridTreeRowExpanded', () => {
    const expandedTreeRows = { r1: true };
    for (const expanded of [true, false]) {
      const ts = setGridTreeRowExpanded(expandedTreeRows, 'r2', expanded);
      const wasm = runWasm<Record<string, boolean>>('setGridTreeRowExpanded', {
        expandedTreeRows,
        rowId: 'r2',
        expanded,
      });
      expect(wasm).toEqual(ts);
    }
    for (const rowId of ['r1', 'r2']) {
      const ts = toggleGridTreeRowExpanded(expandedTreeRows, rowId);
      const wasm = runWasm<{ expanded: boolean; nextExpandedTreeRows: Record<string, boolean> }>(
        'toggleGridTreeRowExpanded',
        // shim shares ExpandedRowsRowIdInput shape
        { expandedRows: expandedTreeRows, rowId },
      );
      expect(wasm.expanded).toBe(ts.expanded);
      expect(wasm.nextExpandedTreeRows).toEqual(ts.nextExpandedTreeRows);
    }
  });

  it('matches expandAllGridTreeRows (only rows with children)', () => {
    const rows = [
      makeRow('r1', { hasChildren: true }),
      makeRow('r2'),
      makeRow('r3', { hasChildren: true }),
    ];
    const ts = expandAllGridTreeRows(rows);
    const wasm = runWasm<Record<string, boolean>>('expandAllGridTreeRows', serializeRows(rows));
    expect(wasm).toEqual(ts);
  });

  it('matches getGridTreeRowChildren', () => {
    const rows = [
      makeRow('r1', { hasChildren: true }),
      makeRow('r2', { parentId: 'r1' }),
      makeRow('r3', { parentId: 'r1' }),
      makeRow('r4'),
    ];
    const ts = getGridTreeRowChildren(rows, 'r1');
    const wasm = runWasm<unknown[]>('getGridTreeRowChildren', {
      rows: serializeRows(rows),
      rowId: 'r1',
    });
    expect(wasm.map((r) => (r as { id: string }).id)).toEqual(ts.map((r) => r.id));
  });

  it('matches addGridRowInvisibleReason / clearGridRowInvisibleReason', () => {
    const initial: Record<string, string[]> = { r1: ['stale'] };
    const tsAfterAdd = addGridRowInvisibleReason(initial, 'r1', 'fresh');
    const wasmAfterAdd = runWasm<Record<string, string[]>>('addGridRowInvisibleReason', {
      hiddenRowReasons: initial,
      rowId: 'r1',
      reason: 'fresh',
    });
    // Order of strings within each row's reasons array may differ; compare as sets
    const sortedTs = Object.fromEntries(
      Object.entries(tsAfterAdd).map(([k, v]) => [k, [...v].sort()]),
    );
    const sortedWasm = Object.fromEntries(
      Object.entries(wasmAfterAdd).map(([k, v]) => [k, [...v].sort()]),
    );
    expect(sortedWasm).toEqual(sortedTs);

    const tsAfterClear = clearGridRowInvisibleReason(tsAfterAdd, 'r1', 'fresh');
    const wasmAfterClear = runWasm<Record<string, string[]>>('clearGridRowInvisibleReason', {
      hiddenRowReasons: tsAfterAdd,
      rowId: 'r1',
      reason: 'fresh',
    });
    const sortedTsClear = Object.fromEntries(
      Object.entries(tsAfterClear).map(([k, v]) => [k, [...v].sort()]),
    );
    const sortedWasmClear = Object.fromEntries(
      Object.entries(wasmAfterClear).map(([k, v]) => [k, [...v].sort()]),
    );
    expect(sortedWasmClear).toEqual(sortedTsClear);

    // Clearing the last reason removes the row entirely.
    const tsRemoved = clearGridRowInvisibleReason({ r1: ['only'] }, 'r1', 'only');
    const wasmRemoved = runWasm<Record<string, string[]>>('clearGridRowInvisibleReason', {
      hiddenRowReasons: { r1: ['only'] },
      rowId: 'r1',
      reason: 'only',
    });
    expect(Object.keys(tsRemoved)).toEqual([]);
    expect(Object.keys(wasmRemoved)).toEqual([]);
  });
});
