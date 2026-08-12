import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * Integration tests for the importer. Ports the behaviour from
 * ui.grid.importer onto the vanilla grid: the element owns the file
 * picker + FileReader; the controller owns the pure parse / dispatch
 * pipeline. Consumers wire `importerDataAddCallback` to receive the
 * parsed rows.
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

const TAG = 'ui-grid-element-vanilla-importer-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const data: Row[] = [];
  const options: GridOptions = {
    id: 'importer-grid',
    data,
    columnDefs: [
      { name: 'id', field: 'id' },
      { name: 'name', displayName: 'Full Name' },
      { name: 'status' },
    ],
    enableImporter: true,
    rowIdentity: (entity) => String((entity as Row).id),
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
  return { grid, shadow };
}

describe('vanilla grid importer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('parses a CSV string + invokes importerDataAddCallback', async () => {
    const importerDataAddCallback = vi.fn();
    const options = baseOptions({ importerDataAddCallback });
    await mountGrid(options);
    const api = getApi(options);
    api.importer.importText('id,Full Name,status\n1,Alpha,Active\n2,Beta,Pilot', 'csv');
    expect(importerDataAddCallback).toHaveBeenCalledTimes(1);
    const [newObjects] = importerDataAddCallback.mock.calls[0]!;
    expect(newObjects).toEqual([
      { id: '1', name: 'Alpha', status: 'Active' },
      { id: '2', name: 'Beta', status: 'Pilot' },
    ]);
  });

  it('parses a JSON string when type is "json"', async () => {
    const importerDataAddCallback = vi.fn();
    const options = baseOptions({ importerDataAddCallback });
    await mountGrid(options);
    const api = getApi(options);
    api.importer.importText('[{"id":"1","name":"Alpha"}]', 'json');
    expect(importerDataAddCallback).toHaveBeenCalledTimes(1);
    const [objects] = importerDataAddCallback.mock.calls[0]!;
    expect(objects).toEqual([{ id: '1', name: 'Alpha' }]);
  });

  it('auto-detects JSON vs CSV when no type is passed', async () => {
    const importerDataAddCallback = vi.fn();
    const options = baseOptions({ importerDataAddCallback });
    await mountGrid(options);
    const api = getApi(options);
    api.importer.importText('[{"id":"j"}]');
    api.importer.importText('id\nc');
    expect(importerDataAddCallback).toHaveBeenCalledTimes(2);
    expect(importerDataAddCallback.mock.calls[0]![0]).toEqual([{ id: 'j' }]);
    expect(importerDataAddCallback.mock.calls[1]![0]).toEqual([{ id: 'c' }]);
  });

  it('raises the errorCallback when CSV headers produce no objects', async () => {
    const importerDataAddCallback = vi.fn();
    const importerErrorCallback = vi.fn();
    const options = baseOptions({ importerDataAddCallback, importerErrorCallback });
    await mountGrid(options);
    const api = getApi(options);
    // Header-only CSV — no data rows, so objects will be empty.
    api.importer.importText('id,name', 'csv');
    expect(importerDataAddCallback).not.toHaveBeenCalled();
    expect(importerErrorCallback).toHaveBeenCalledWith(
      'importer.noObjects',
      expect.any(String),
      'id,name',
    );
  });

  it('appends to options.data when no importerDataAddCallback is set', async () => {
    const options = baseOptions(); // no callback
    await mountGrid(options);
    const api = getApi(options);
    api.importer.importText('id,name\n1,Alpha', 'csv');
    expect(api.core.getVisibleRows().length).toBe(1);
    expect(api.core.getVisibleRows()[0]!.entity).toMatchObject({ id: '1', name: 'Alpha' });
  });
});
