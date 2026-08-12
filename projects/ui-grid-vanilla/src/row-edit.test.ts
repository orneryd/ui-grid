import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * Row-edit integration tests. Ports the behaviour from ui.grid.rowEdit
 * onto the vanilla grid. The controller subscribes to `edit.afterCellEdit`,
 * flips the row dirty, and raises `rowEdit.saveRow` once the debounce
 * elapses (or `flushDirtyRows()` is called). Consumers resolve / reject
 * the save promise they hand back via `setSavePromise`.
 */

async function waitFor<T>(resolve: () => T | null | undefined, timeoutMs = 5000): Promise<T> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = resolve();
    if (value) return value;
    await new Promise((r) => window.setTimeout(r, 10));
  }
  throw new Error('Timed out waiting for expected state');
}

const TAG = 'ui-grid-element-vanilla-row-edit-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
}

function makeData(): Row[] {
  return [
    { id: 'r1', name: 'Alpha', status: 'Active' },
    { id: 'r2', name: 'Beta', status: 'Pilot' },
  ];
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const options: GridOptions = {
    id: 'row-edit-grid',
    data: makeData(),
    columnDefs: [
      { name: 'name', displayName: 'Name', enableCellEdit: true },
      { name: 'status', displayName: 'Status', enableCellEdit: true },
    ],
    enableCellEdit: true,
    rowIdentity: (entity) => String((entity as Row).id),
    rowEditWaitInterval: 50, // short interval so tests don't linger.
    onRegisterApi: (api) => {
      capturedApi = api as UiGridApi;
    },
    ...overrides,
  };
  Object.defineProperty(options, '__api', { enumerable: false, get: () => capturedApi });
  return options;
}

function getApi(options: GridOptions): UiGridApi {
  const api = (options as unknown as { __api: UiGridApi | undefined }).__api;
  if (!api) throw new Error('Grid API was never registered');
  return api;
}

async function mountGrid(options: GridOptions): Promise<{
  grid: VanillaUiGridElement;
  shadow: ShadowRoot;
}> {
  const target = document.getElementById('app')!;
  const grid = await mountVanillaUiGrid(target, options, undefined, TAG);
  const shadow = await waitFor(() => grid.shadowRoot);
  await waitFor(() => shadow.querySelector('.body-cell[data-row="r1"]'));
  return { grid, shadow };
}

describe('vanilla grid row-edit', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('marks a row dirty after an edit commits', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    // Programmatic edit — begin, set a value, commit.
    const row = options.data[0]! as unknown as Record<string, unknown>;
    api.edit.raise.afterCellEdit(row, options.columnDefs[0]!, 'Alpha!', 'Alpha');
    expect(api.rowEdit.getDirtyRows().length).toBe(1);
    expect(api.rowEdit.getDirtyRows()[0]!.entity).toBe(row);
  });

  it('raises saveRow after the wait interval elapses', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    const handler = vi.fn<(row: Record<string, unknown>) => void>();
    api.rowEdit.on.saveRow(handler);
    const row = options.data[0]! as unknown as Record<string, unknown>;
    api.edit.raise.afterCellEdit(row, options.columnDefs[0]!, 'Alpha!', 'Alpha');
    await new Promise((r) => window.setTimeout(r, 80));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(row);
  });

  it('does not auto-save when rowEditWaitInterval is -1 (manual flush)', async () => {
    const options = baseOptions({ rowEditWaitInterval: -1 });
    await mountGrid(options);
    const api = getApi(options);
    const handler = vi.fn();
    api.rowEdit.on.saveRow(handler);
    const row = options.data[0]! as unknown as Record<string, unknown>;
    api.edit.raise.afterCellEdit(row, options.columnDefs[0]!, 'Alpha!', 'Alpha');
    await new Promise((r) => window.setTimeout(r, 80));
    expect(handler).not.toHaveBeenCalled();

    // flushDirtyRows triggers the save explicitly.
    await api.rowEdit.flushDirtyRows();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('clears dirty state after a successful save promise resolves', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    let resolveSave: (() => void) | null = null;
    api.rowEdit.on.saveRow((rowEntity) => {
      api.rowEdit.setSavePromise(
        rowEntity,
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
      );
    });
    const row = options.data[0]! as unknown as Record<string, unknown>;
    api.edit.raise.afterCellEdit(row, options.columnDefs[0]!, 'Alpha!', 'Alpha');
    await new Promise((r) => window.setTimeout(r, 80));
    expect(api.rowEdit.getDirtyRows().length).toBe(1);
    // Resolve the consumer's save promise.
    resolveSave!();
    await Promise.resolve();
    await Promise.resolve();
    expect(api.rowEdit.getDirtyRows().length).toBe(0);
    expect(api.rowEdit.getErrorRows().length).toBe(0);
  });

  it('moves the row into error state when the save promise rejects', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    api.rowEdit.on.saveRow((rowEntity) => {
      api.rowEdit.setSavePromise(rowEntity, Promise.reject(new Error('nope')));
    });
    const row = options.data[0]! as unknown as Record<string, unknown>;
    api.edit.raise.afterCellEdit(row, options.columnDefs[0]!, 'Alpha!', 'Alpha');
    await new Promise((r) => window.setTimeout(r, 80));
    await Promise.resolve();
    await Promise.resolve();
    expect(api.rowEdit.getErrorRows().length).toBe(1);
    expect(api.rowEdit.getDirtyRows().length).toBe(1); // stays dirty so retry works
  });

  it('setRowsDirty flips rows dirty without a prior edit', async () => {
    const options = baseOptions({ rowEditWaitInterval: -1 });
    await mountGrid(options);
    const api = getApi(options);
    api.rowEdit.setRowsDirty([options.data[0]! as unknown as Record<string, unknown>]);
    expect(api.rowEdit.getDirtyRows().length).toBe(1);
  });

  it('setRowsClean clears dirty + error flags', async () => {
    const options = baseOptions({ rowEditWaitInterval: -1 });
    await mountGrid(options);
    const api = getApi(options);
    const row = options.data[0]! as unknown as Record<string, unknown>;
    api.rowEdit.setRowsDirty([row]);
    api.rowEdit.setRowsClean([row]);
    expect(api.rowEdit.getDirtyRows().length).toBe(0);
  });

  it('does not begin editing on a column with enableCellEdit: false even when the grid is globally enabled', async () => {
    const options = baseOptions({
      columnDefs: [
        { name: 'name', displayName: 'Name' }, // inherits global enableCellEdit: true
        { name: 'status', displayName: 'Status', enableCellEdit: false },
      ],
    });
    const { grid } = await mountGrid(options);
    const controller = (grid as unknown as { controller: {
      beginCellEdit: (rowId: string, columnName: string) => void;
      editingCell: { rowId: string; columnName: string } | null;
      isCellEditable: (row: unknown, column: unknown) => boolean;
      findRowByIdPublic: (rowId: string) => unknown;
      getOptions: () => GridOptions;
    } }).controller;

    // Sanity: name column inherits global true, status column opts out.
    const nameCol = options.columnDefs.find((c) => c.name === 'name')!;
    const statusCol = options.columnDefs.find((c) => c.name === 'status')!;
    const row = controller.findRowByIdPublic('r1');
    expect(controller.isCellEditable(row, nameCol)).toBe(true);
    expect(controller.isCellEditable(row, statusCol)).toBe(false);

    // Attempting to begin an edit on the opt-out column is a no-op.
    controller.beginCellEdit('r1', 'status');
    expect(controller.editingCell).toBeNull();

    // The editable column does open an edit session.
    controller.beginCellEdit('r1', 'name');
    expect(controller.editingCell).toEqual({ rowId: 'r1', columnName: 'name' });
  });
});
