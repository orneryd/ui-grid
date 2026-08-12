/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  collectGridRowEntities,
  createGridRowEditState,
  isGridRowEditTimerEnabled,
  markGridRowClean,
  markGridRowDirty,
  markGridRowError,
  markGridRowSaving,
  resolveGridRowEditWaitInterval,
} from './grid.core.row-edit';
import { GridRow } from './grid.models';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.row-edit.wasm-runner.mjs', import.meta.url));

function runWasm<T>(command: string, input?: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

function makeRow(id: string): GridRow {
  return new GridRow(id, { id }, Number(id.replace(/\D/g, '')) || 0, 44);
}

function normalizeState(state: ReturnType<typeof createGridRowEditState>) {
  return {
    dirtyRowIds: [...state.dirtyRowIds].sort(),
    errorRowIds: [...state.errorRowIds].sort(),
    savingRowIds: [...state.savingRowIds].sort(),
    savePromiseRowIds: [...state.savePromises.keys()].sort(),
  };
}

function serializeState(state: ReturnType<typeof createGridRowEditState>) {
  return {
    dirtyRowIds: [...state.dirtyRowIds],
    errorRowIds: [...state.errorRowIds],
    savingRowIds: [...state.savingRowIds],
    savePromiseRowIds: [...state.savePromises.keys()],
  };
}

function normalizeRow(row: GridRow) {
  return {
    id: row.id,
    entity: row.entity,
    isDirty: row.isDirty,
    isError: row.isError,
    isSaving: row.isSaving,
  };
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
    isDirty: row.isDirty,
    isError: row.isError,
    isSaving: row.isSaving,
  };
}

describe('grid.core.row-edit wasm parity', () => {
  it('matches dirty/clean/saving/error row transitions', () => {
    const tsState = createGridRowEditState();
    const tsRow = makeRow('r1');

    const dirtyChanged = markGridRowDirty(tsState, tsRow);
    markGridRowSaving(tsState, tsRow);
    markGridRowError(tsState, tsRow);
    markGridRowClean(tsState, tsRow);

    let wasmState = runWasm<any>('createGridRowEditState');
    let wasmRow = serializeRow(makeRow('r1'));
    let result = runWasm<any>('markGridRowDirty', { state: wasmState, row: wasmRow });
    expect(result.changed).toBe(dirtyChanged);
    wasmState = result.state;
    wasmRow = result.row;
    result = runWasm<any>('markGridRowSaving', { state: wasmState, row: wasmRow });
    wasmState = result.state;
    wasmRow = result.row;
    result = runWasm<any>('markGridRowError', { state: wasmState, row: wasmRow });
    wasmState = result.state;
    wasmRow = result.row;
    result = runWasm<any>('markGridRowClean', { state: wasmState, row: wasmRow });

    expect(result.state).toEqual(normalizeState(tsState));
    expect({
      id: result.row.id,
      entity: result.row.entity,
      isDirty: result.row.isDirty,
      isError: result.row.isError,
      isSaving: result.row.isSaving,
    }).toEqual(normalizeRow(tsRow));
  });

  it('matches timer enablement and wait interval helpers', () => {
    expect(runWasm('isGridRowEditTimerEnabled', -1)).toBe(isGridRowEditTimerEnabled(-1));
    expect(runWasm('isGridRowEditTimerEnabled', undefined)).toBe(isGridRowEditTimerEnabled(undefined));
    expect(runWasm('resolveGridRowEditWaitInterval', { waitInterval: undefined })).toBe(
      resolveGridRowEditWaitInterval(undefined),
    );
    expect(runWasm('resolveGridRowEditWaitInterval', { waitInterval: 4000 })).toBe(
      resolveGridRowEditWaitInterval(4000),
    );
  });

  it('matches entity collection order', () => {
    const r1 = makeRow('r1');
    const r2 = makeRow('r2');
    const r3 = makeRow('r3');
    const ids = new Set(['r3', 'r1']);

    expect(
      runWasm('collectGridRowEntities', {
        rows: [serializeRow(r1), serializeRow(r2), serializeRow(r3)],
        ids: ['r3', 'r1'],
      }),
    ).toEqual(collectGridRowEntities([r1, r2, r3], ids));
  });
});