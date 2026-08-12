import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

const TAG = 'ui-grid-element-vanilla-exporter-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  revenue: number;
  status: string;
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const data: Row[] = [
    { id: 'r1', name: 'Alpha', revenue: 100, status: 'Active' },
    { id: 'r2', name: 'Beta, Inc.', revenue: 200, status: 'Pilot' },
    { id: 'r3', name: 'Gamma', revenue: 300, status: 'Draft' },
  ];
  const options: GridOptions = {
    id: 'exporter-grid',
    data,
    columnDefs: [
      { name: 'name', displayName: 'Name' },
      { name: 'revenue', displayName: 'Revenue' },
      { name: 'status', displayName: 'Status' },
    ],
    rowIdentity: (entity) => String((entity as Row).id),
    enableRowSelection: true,
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

describe('vanilla grid exporter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('exposes exporter.buildCsv on the public api', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    const csv = api.exporter.buildCsv('visible', 'visible');
    expect(csv.split('\n')).toEqual([
      'Name,Revenue,Status',
      'Alpha,100,Active',
      '"Beta, Inc.",200,Pilot',
      'Gamma,300,Draft',
    ]);
  });

  it('respects the row-type argument (selected rows only)', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    api.selection.selectRow(options.data[0]! as unknown as Record<string, unknown>);
    api.selection.selectRow(options.data[2]! as unknown as Record<string, unknown>);
    const csv = api.exporter.buildCsv('selected');
    expect(csv.split('\n').slice(1)).toEqual(['Alpha,100,Active', 'Gamma,300,Draft']);
  });

  it('skips suppressed columns from setOptions override', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    api.exporter.setOptions({ suppressColumns: ['revenue'] });
    const csv = api.exporter.buildCsv();
    expect(csv.split('\n')[0]).toBe('Name,Status');
  });

  it('honors exporterCsvColumnSeparator from grid options', async () => {
    const options = baseOptions({ exporterCsvColumnSeparator: ';' });
    await mountGrid(options);
    const api = getApi(options);
    const csv = api.exporter.buildCsv();
    expect(csv.split('\n')[0]).toBe('Name;Revenue;Status');
  });

  it('includes hidden columns when colType is "all"', async () => {
    const options = baseOptions({
      columnDefs: [
        { name: 'name', displayName: 'Name' },
        { name: 'revenue', displayName: 'Revenue', visible: false },
        { name: 'status', displayName: 'Status' },
      ],
    });
    await mountGrid(options);
    const api = getApi(options);
    expect(api.exporter.buildCsv('visible', 'visible').split('\n')[0]).toBe('Name,Status');
    expect(api.exporter.buildCsv('visible', 'all').split('\n')[0]).toBe('Name,Revenue,Status');
  });

  it('returns an ExcelBuilder-ready sheet data grid via exporter.buildExcelSheetData', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    const sheet = api.exporter.buildExcelSheetData('visible', 'visible');
    // Header row + 3 data rows.
    expect(sheet.length).toBe(4);
    expect(sheet[0]!.map((c) => c.value)).toEqual(['Name', 'Revenue', 'Status']);
    expect(sheet[1]!.map((c) => c.value)).toEqual(['Alpha', 100, 'Active']);
  });

  it('returns a pdfMake-ready doc definition via exporter.buildPdfDocDefinition', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    const doc = api.exporter.buildPdfDocDefinition('visible', 'visible');
    expect(doc.pageOrientation).toBe('landscape');
    expect(doc.content[0]!.table.headerRows).toBe(1);
    // Header row + 3 data rows.
    expect(doc.content[0]!.table.body.length).toBe(4);
  });

  it('exposes menu items via exporter.getMenuItems with locale-driven titles', async () => {
    const options = baseOptions({
      labels: { exporterAllAsCsv: 'Export everything as csv' },
    });
    await mountGrid(options);
    const api = getApi(options);
    const items = api.exporter.getMenuItems();
    const allAsCsv = items.find((i) => i.title === 'Export everything as csv');
    expect(allAsCsv).toBeDefined();
    expect(allAsCsv!.shown()).toBe(true);
  });

  it('hides the "selected" menu item when no rows are selected', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    const items = api.exporter.getMenuItems();
    const selectedItems = items.filter((i) => /selected/i.test(i.title));
    // Selected rows menu entry stays hidden because no rows are selected.
    expect(selectedItems.every((i) => i.shown() === false)).toBe(true);

    api.selection.selectRow(options.data[0]! as unknown as Record<string, unknown>);
    const itemsAfter = api.exporter.getMenuItems();
    const selectedAfter = itemsAfter.filter((i) => /selected/i.test(i.title));
    expect(selectedAfter.every((i) => i.shown() === true)).toBe(true);
  });
});
