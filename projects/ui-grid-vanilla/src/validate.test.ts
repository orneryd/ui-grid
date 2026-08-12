import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

async function waitFor<T>(resolve: () => T | null | undefined, timeoutMs = 5000): Promise<T> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = resolve();
    if (value) return value;
    await new Promise((r) => window.setTimeout(r, 10));
  }
  throw new Error('Timed out waiting for expected state');
}

const TAG = 'ui-grid-element-vanilla-validate-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const data: Row[] = [
    { id: 'r1', name: 'Alpha' },
    { id: 'r2', name: '' },
    { id: 'r3', name: 'Gamma' },
  ];
  const options: GridOptions = {
    id: 'validate-grid',
    data,
    columnDefs: [
      { name: 'id' },
      {
        name: 'name',
        displayName: 'Name',
        enableCellEdit: true,
        validators: { required: true, minLength: 3 },
      },
    ],
    enableCellEdit: true,
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
  await waitFor(() => shadow.querySelector('.body-cell[data-row="r1"]'));
  return { grid, shadow };
}

describe('vanilla grid validate', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('runValidators flips the cell invalid + raises validationFailed', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    const handler = vi.fn();
    api.validate.on.validationFailed(handler);

    const col = options.columnDefs.find((c) => c.name === 'name')!;
    await api.validate.runValidators(options.data[0] as Record<string, unknown>, col, '', 'Alpha');

    expect(api.validate.isInvalid(options.data[0] as Record<string, unknown>, col)).toBe(true);
    expect(handler).toHaveBeenCalled();
    const errors = api.validate.getErrorMessages(
      options.data[0] as Record<string, unknown>,
      col,
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('getFormattedErrors returns an HTML block with the error label prefix', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    const col = options.columnDefs.find((c) => c.name === 'name')!;
    await api.validate.runValidators(options.data[0] as Record<string, unknown>, col, '', 'Alpha');
    const html = api.validate.getFormattedErrors(options.data[0] as Record<string, unknown>, col);
    expect(html).toContain('<p><b>');
    expect(html).toContain('<br/>');
  });

  it('getInvalidRows sweeps the full data and returns every offending entity', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    const invalid = await api.validate.getInvalidRows();
    // Row r2 has name="" which fails both `required` and `minLength`.
    expect(invalid.length).toBe(1);
    expect(invalid[0]!).toBe(options.data[1]!);
  });

  it('renders the invalid class on cells whose value currently fails', async () => {
    const options = baseOptions();
    const { shadow } = await mountGrid(options);
    const api = getApi(options);
    const col = options.columnDefs.find((c) => c.name === 'name')!;
    // Programmatically flip row 1 invalid via runValidators; the rendered
    // cell should gain `.ui-grid-cell-invalid` on the next refresh.
    await api.validate.runValidators(options.data[0] as Record<string, unknown>, col, '', 'Alpha');
    api.core.refresh();
    await waitFor(() =>
      shadow.querySelector('.body-cell[data-row="r1"][data-column="name"].ui-grid-cell-invalid'),
    );
  });

  it('registers a custom validator via setValidator', async () => {
    const options = baseOptions({
      columnDefs: [
        { name: 'id' },
        {
          name: 'name',
          enableCellEdit: true,
          validators: { noSpaces: true },
        },
      ],
    });
    await mountGrid(options);
    const api = getApi(options);
    api.validate.setValidator(
      'noSpaces',
      () => (_oldValue, newValue) => !/\s/.test(String(newValue ?? '')),
      () => 'Spaces not allowed',
    );
    const col = options.columnDefs.find((c) => c.name === 'name')!;
    await api.validate.runValidators(
      options.data[0] as Record<string, unknown>,
      col,
      'has space',
      'Alpha',
    );
    expect(api.validate.isInvalid(options.data[0] as Record<string, unknown>, col)).toBe(true);
    expect(
      api.validate.getErrorMessages(options.data[0] as Record<string, unknown>, col),
    ).toEqual(['Spaces not allowed']);
  });
});
