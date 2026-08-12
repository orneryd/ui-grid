/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  clearAllGridSelection,
  createGridSelectionState,
  findGridRowByKey,
  mapSelectedRowsToEntities,
  reconcileGridSelection,
  resolveGridSelectionOptions,
  selectAllGridRows,
  selectAllVisibleGridRows,
  shiftGridRowSelection,
  toggleGridRowSelection,
} from './grid.core.selection';
import { GridOptions, GridRow } from './grid.models';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.selection.wasm-runner.mjs', import.meta.url));

function runWasm<T>(command: string, input?: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

function makeRow(id: string, extra: Partial<GridRow> = {}): GridRow {
  const row = new GridRow(id, { id }, Number(id.replace(/\D/g, '')) || 0, 44);
  if (extra.visible === false) row.visible = false;
  if (extra.enableSelection === false) row.enableSelection = false;
  if (extra.isSelected === true) row.setSelected(true);
  if (extra.isFocused === true) row.setFocused(true);
  return row;
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  return {
    id: 'g',
    data: [],
    columnDefs: [],
    ...overrides,
  };
}

function normalizeState(state: ReturnType<typeof createGridSelectionState>) {
  return {
    selectedRowIds: [...state.selectedRowIds].sort(),
    lastSelectedRowId: state.lastSelectedRowId,
    focusedRowId: state.focusedRowId,
    selectAll: state.selectAll,
  };
}

function serializeState(state: ReturnType<typeof createGridSelectionState>) {
  return {
    selectedRowIds: [...state.selectedRowIds],
    lastSelectedRowId: state.lastSelectedRowId,
    focusedRowId: state.focusedRowId,
    selectAll: state.selectAll,
  };
}

function normalizeRows(rows: readonly GridRow[]) {
  return rows.map((row) => ({
    id: row.id,
    entity: row.entity,
    visible: row.visible,
    isSelected: row.isSelected,
    isFocused: row.isFocused,
    enableSelection: row.enableSelection,
  }));
}

function serializeRows(rows: readonly GridRow[]) {
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

function normalizeChangeRows(rows: Array<{ id: string; isSelected: boolean }>) {
  return rows.map((row) => ({ id: row.id, isSelected: row.isSelected }));
}

describe('grid.core.selection wasm parity', () => {
  it('matches resolveGridSelectionOptions defaults', () => {
    expect(runWasm('resolveGridSelectionOptions', baseOptions())).toEqual(
      resolveGridSelectionOptions(baseOptions()),
    );
  });

  it('matches toggleGridRowSelection state and row mutations', () => {
    const state = createGridSelectionState();
    const rows = [makeRow('r1'), makeRow('r2')];
    const ts = toggleGridRowSelection(state, rows, rows[0]!, {
      multiSelect: true,
      noUnselect: false,
    });

    const wasmResult = runWasm<any>('toggleGridRowSelection', {
      state: serializeState(createGridSelectionState()),
      allRows: serializeRows([makeRow('r1'), makeRow('r2')]),
      rowId: 'r1',
      multiSelect: true,
      noUnselect: false,
    });

    expect(wasmResult.state).toEqual(normalizeState(state));
    expect(normalizeRows(rows)).toEqual(wasmResult.allRows.map((row: any) => ({
      id: row.id,
      entity: row.entity,
      visible: row.visible,
      isSelected: row.isSelected,
      isFocused: row.isFocused,
      enableSelection: row.enableSelection,
    })));
    expect(normalizeChangeRows(ts.changed)).toEqual(normalizeChangeRows(wasmResult.change.changed));
    expect(wasmResult.change.selectAllAfter).toBe(ts.selectAllAfter);
  });

  it('matches shift/select-all/clear and reconcile behavior', () => {
    const tsState = createGridSelectionState();
    const tsRows = [makeRow('r1'), makeRow('r2'), makeRow('r3', { visible: false }), makeRow('r4')];
    toggleGridRowSelection(tsState, tsRows, tsRows[1]!, { multiSelect: true, noUnselect: false });
    shiftGridRowSelection(tsState, tsRows, tsRows[3]!, { multiSelect: true });
    selectAllVisibleGridRows(tsState, tsRows, { multiSelect: true, isRowSelectable: null });
    clearAllGridSelection(tsState, tsRows);
    tsState.selectedRowIds.add('r1');
    tsState.selectedRowIds.add('gone');
    tsState.focusedRowId = 'r1';
    reconcileGridSelection(tsState, tsRows, null);

    let wasmState = runWasm<any>('createGridSelectionState');
    let wasmRows = serializeRows([makeRow('r1'), makeRow('r2'), makeRow('r3', { visible: false }), makeRow('r4')]);
    let result = runWasm<any>('toggleGridRowSelection', {
      state: wasmState,
      allRows: wasmRows,
      rowId: 'r2',
      multiSelect: true,
      noUnselect: false,
    });
    wasmState = result.state;
    wasmRows = result.allRows;
    result = runWasm<any>('shiftGridRowSelection', {
      state: wasmState,
      visibleRowCache: wasmRows,
      rowId: 'r4',
      multiSelect: true,
    });
    wasmState = result.state;
    wasmRows = result.allRows;
    result = runWasm<any>('selectAllVisibleGridRows', {
      state: wasmState,
      allRows: wasmRows,
      multiSelect: true,
    });
    wasmState = result.state;
    wasmRows = result.allRows;
    result = runWasm<any>('clearAllGridSelection', {
      state: wasmState,
      allRows: wasmRows,
    });
    wasmState = result.state;
    wasmRows = result.allRows;
    wasmState.selectedRowIds.push('r1', 'gone');
    wasmState.focusedRowId = 'r1';
    const reconcile = runWasm<any>('reconcileGridSelection', {
      state: wasmState,
      allRows: wasmRows,
    });

    expect(reconcile.state).toEqual(normalizeState(tsState));
    expect(reconcile.allRows.map((row: any) => ({
      id: row.id,
      entity: row.entity,
      visible: row.visible,
      isSelected: row.isSelected,
      isFocused: row.isFocused,
      enableSelection: row.enableSelection,
    }))).toEqual(normalizeRows(tsRows));
  });

  it('matches row lookup and entity mapping helpers', () => {
    const rows = [makeRow('r1'), makeRow('r2')];
    (rows[0]!.entity as Record<string, unknown>)['status'] = 'Active';
    rows[0]!.setSelected(true);

    expect(
      runWasm<any>('findGridRowByKey', {
        rows: serializeRows(rows),
        isInEntity: true,
        key: 'status',
        comparator: 'Active',
      }),
    ).toMatchObject({ id: findGridRowByKey(rows, true, 'status', 'Active')?.id });
    expect(runWasm('mapSelectedRowsToEntities', serializeRows([rows[0]!]))).toEqual(
      mapSelectedRowsToEntities([rows[0]!]),
    );
  });

  it('matches selectAllGridRows eligibility without callback projection', () => {
    const state = createGridSelectionState();
    const rows = [makeRow('r1'), makeRow('r2', { enableSelection: false }), makeRow('r3')];
    const ts = selectAllGridRows(state, rows, { multiSelect: true, isRowSelectable: null });
    const wasmResult = runWasm<any>('selectAllGridRows', {
      state: serializeState(createGridSelectionState()),
      allRows: serializeRows([makeRow('r1'), makeRow('r2', { enableSelection: false }), makeRow('r3')]),
      multiSelect: true,
    });

    expect(wasmResult.state).toEqual(normalizeState(state));
    expect(normalizeChangeRows(wasmResult.change.changed)).toEqual(normalizeChangeRows(ts.changed));
  });
});