/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  beginGridEditSession,
  buildGridFocusCellResult,
  clearGridEditSession,
  findNextGridCell,
  isGridCellPosition,
  isPrintableGridKey,
  parseGridEditedValue,
  shouldGridEditOnFocus,
  stringifyGridEditorValue,
} from './grid.core.edit';
import { GridColumnDef, GridOptions, GridRow } from './grid.models';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.edit.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input?: unknown): T {
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

function makeRow(id: string): GridRow {
  return new GridRow(id, { id }, 0, 44);
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

describe('grid.core.edit wasm parity', () => {
  it('matches isGridCellPosition', { timeout: 30000 }, () => {
    const cases: Array<{ position: { rowId: string; columnName: string } | null; rowId: string; columnName: string }> = [
      { position: null, rowId: 'r1', columnName: 'name' },
      { position: { rowId: 'r1', columnName: 'name' }, rowId: 'r1', columnName: 'name' },
      { position: { rowId: 'r1', columnName: 'name' }, rowId: 'r2', columnName: 'name' },
      { position: { rowId: 'r1', columnName: 'name' }, rowId: 'r1', columnName: 'status' },
    ];
    for (const c of cases) {
      expect(runWasm('isGridCellPosition', c)).toBe(
        isGridCellPosition(c.position, c.rowId, c.columnName),
      );
    }
  });

  it('matches beginGridEditSession', { timeout: 30000 }, () => {
    expect(
      runWasm('beginGridEditSession', { rowId: 'r1', columnName: 'name', editingValue: 'A' }),
    ).toEqual(beginGridEditSession('r1', 'name', 'A'));
  });

  it('matches shouldGridEditOnFocus', { timeout: 30000 }, () => {
    const options: GridOptions = { id: 'g', data: [], columnDefs: [] };
    const cases: Array<{ options: GridOptions; column: GridColumnDef }> = [
      { options, column: col('name') },
      { options, column: col('name', { enableCellEditOnFocus: true }) },
      { options, column: col('name', { enableCellEditOnFocus: false }) },
      { options: { ...options, enableCellEditOnFocus: true }, column: col('name') },
      {
        options: { ...options, enableCellEditOnFocus: true },
        column: col('name', { enableCellEditOnFocus: false }),
      },
    ];
    for (const c of cases) {
      expect(runWasm('shouldGridEditOnFocus', c)).toBe(shouldGridEditOnFocus(c.options, c.column));
    }
  });

  it('matches buildGridFocusCellResult', { timeout: 30000 }, () => {
    const cases = [
      {
        currentFocusedCell: null,
        currentEditingCell: null,
        rowId: 'r1',
        columnName: 'name',
        shouldEditOnFocus: true,
        isCellEditable: true,
      },
      {
        currentFocusedCell: { rowId: 'r1', columnName: 'name' },
        currentEditingCell: null,
        rowId: 'r1',
        columnName: 'name',
        shouldEditOnFocus: true,
        isCellEditable: true,
      },
      {
        currentFocusedCell: null,
        currentEditingCell: null,
        rowId: 'r1',
        columnName: 'name',
        shouldEditOnFocus: false,
        isCellEditable: true,
      },
    ];
    for (const c of cases) {
      expect(runWasm('buildGridFocusCellResult', c)).toEqual(
        buildGridFocusCellResult(c),
      );
    }
  });

  it('matches clearGridEditSession', { timeout: 30000 }, () => {
    expect(runWasm('clearGridEditSession')).toEqual(clearGridEditSession());
  });

  it('matches findNextGridCell across directions and bounds', { timeout: 30000 }, () => {
    const rows = [makeRow('r1'), makeRow('r2'), makeRow('r3')];
    const columns = [col('a'), col('b'), col('c')];
    const directions = ['left', 'right', 'up', 'down'] as const;

    for (const direction of directions) {
      for (const startRow of ['r1', 'r3']) {
        for (const startColumn of ['a', 'c']) {
          const ts = findNextGridCell({
            rows,
            columns,
            rowId: startRow,
            columnName: startColumn,
            direction,
          });
          const wasm = runWasm<{ row: { id: string }; column: { name: string } } | null>(
            'findNextGridCell',
            {
              rows: rows.map(serializeRow),
              columns,
              rowId: startRow,
              columnName: startColumn,
              direction,
            },
          );
          if (ts === null) {
            expect(wasm).toBeNull();
          } else {
            expect(wasm).not.toBeNull();
            expect(wasm!.row.id).toBe(ts.row.id);
            expect(wasm!.column.name).toBe(ts.column.name);
          }
        }
      }
    }
  });

  it('matches stringifyGridEditorValue', { timeout: 30000 }, () => {
    const cases: unknown[] = [null, undefined, '', 'hello', 42, 0, true, false];
    for (const value of cases) {
      // wasm shim takes a plain JsValue (no wrapper).
      expect(runWasm('stringifyGridEditorValue', value)).toBe(
        stringifyGridEditorValue(value),
      );
    }
  });

  it('matches parseGridEditedValue across types', { timeout: 30000 }, () => {
    const cases: Array<{ column: GridColumnDef; value: string; oldValue: unknown }> = [
      { column: col('x'), value: 'hello', oldValue: 'prev' },
      { column: col('x', { type: 'number' }), value: '42', oldValue: 0 },
      { column: col('x', { type: 'number' }), value: 'NaN-like', oldValue: 7 },
      { column: col('x', { type: 'boolean' }), value: 'true', oldValue: false },
      { column: col('x', { type: 'boolean' }), value: 'false', oldValue: true },
      { column: col('x', { type: 'date' }), value: '2026-05-16', oldValue: '' },
    ];
    for (const c of cases) {
      const tsValue = parseGridEditedValue(c.column, c.value, c.oldValue);
      const wasmValue = runWasm<unknown>('parseGridEditedValue', c);
      expect(JSON.stringify(wasmValue ?? null)).toBe(JSON.stringify(tsValue ?? null));
    }
  });

  it('matches isPrintableGridKey', { timeout: 30000 }, () => {
    const cases = [
      { key: 'a', ctrlKey: false, metaKey: false, altKey: false },
      { key: 'A', ctrlKey: false, metaKey: false, altKey: false },
      { key: 'Enter', ctrlKey: false, metaKey: false, altKey: false },
      { key: 'a', ctrlKey: true, metaKey: false, altKey: false },
      { key: 'a', ctrlKey: false, metaKey: true, altKey: false },
      { key: 'a', ctrlKey: false, metaKey: false, altKey: true },
      { key: '1', ctrlKey: false, metaKey: false, altKey: false },
    ];
    for (const c of cases) {
      expect(runWasm('isPrintableGridKey', c)).toBe(
        isPrintableGridKey(c.key, c.ctrlKey, c.metaKey, c.altKey),
      );
    }
  });
});
