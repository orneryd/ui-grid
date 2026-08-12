/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  buildGridCellContext,
  formatGridCellDisplayValue,
} from './grid.core.display';
import { GridColumnDef, GridRecord, GridRow } from './grid.models';
import { getCellValue, stringifyCellValue } from './grid.utils';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.display.wasm-runner.mjs', import.meta.url),
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

function makeRow(id: string, entity: GridRecord): GridRow {
  return new GridRow(id, entity, 0, 44);
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

describe('grid.core.display wasm parity', () => {
  it('matches getCellValue across direct, nested, and missing fields', () => {
    const row: GridRecord = { name: 'Alpha', account: { owner: 'Mina' } };
    const cases: Array<{ row: GridRecord; column: GridColumnDef }> = [
      { row, column: col('name') },
      { row, column: col('owner', { field: 'account.owner' }) },
      { row, column: col('missing') },
      { row, column: col('protoCheck', { field: '__proto__' }) },
    ];

    for (const c of cases) {
      const wasmValue = runWasm('getCellValue', { row: c.row, column: c.column });
      const tsValue = getCellValue(c.row, c.column);
      // wasm returns serde JSON value (null for missing); TS returns undefined
      // for missing. Normalise both to JSON-comparable shapes.
      expect(JSON.stringify(wasmValue ?? null)).toBe(JSON.stringify(tsValue ?? null));
    }
  });

  it('matches stringifyCellValue across primitive, array, object, null', () => {
    const cases: unknown[] = [
      'hello',
      42,
      0,
      true,
      false,
      null,
      [1, 2, 3],
      { a: 1 },
      '',
    ];
    for (const value of cases) {
      expect(runWasm('stringifyCellValue', { value })).toBe(stringifyCellValue(value));
    }
  });

  it('formatGridCellDisplayValue matches the no-callback path (pure string formatting)', () => {
    // Only the no-formatter / no-renderer path is comparable across wasm —
    // JS callbacks can't cross the boundary. The Rust shim implements the
    // same fallback (stringify the cell value).
    const row = makeRow('r1', { name: 'Alpha', revenue: 1234, account: { owner: 'Mina' } });
    const cases: GridColumnDef[] = [
      col('name'),
      col('revenue'),
      col('owner', { field: 'account.owner' }),
      col('missing'),
    ];

    for (const column of cases) {
      const wasmInput = { row: serializeRow(row), column };
      const wasm = runWasm<string>('formatGridCellDisplayValue', wasmInput);
      const ts = formatGridCellDisplayValue(buildGridCellContext(row, column));
      expect(wasm).toBe(ts);
    }
  });
});
