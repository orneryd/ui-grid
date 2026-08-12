import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SORT_DIRECTIONS, clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  createVanillaGridController,
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * saveState integration tests. Ports the per-field save/restore behaviour
 * from the old ui.grid.saveState module.
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

const TAG = 'ui-grid-element-vanilla-savestate-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const data: Row[] = [
    { id: 'r1', name: 'Alpha', status: 'Active' },
    { id: 'r2', name: 'Beta', status: 'Pilot' },
    { id: 'r3', name: 'Gamma', status: 'Draft' },
  ];
  const options: GridOptions = {
    id: 'savestate-grid',
    data,
    columnDefs: [
      { name: 'name', displayName: 'Name' },
      { name: 'status', displayName: 'Status' },
    ],
    enableRowSelection: true,
    enableFullRowSelection: true,
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

describe('vanilla grid saveState', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('getState returns sort, filter, grouping, pinning by default', () => {
    const controller = createVanillaGridController({
      id: 'save-controller',
      data: [{ id: 'r1', name: 'Alpha' }] as Row[],
      columnDefs: [{ name: 'name' }],
    });
    controller.setFilter('name', 'Al');
    controller.sortColumn('name', SORT_DIRECTIONS.asc);
    const state = controller.getState();
    expect(state.sortState).toEqual({ columnName: 'name', direction: SORT_DIRECTIONS.asc });
    expect(state.activeFilters).toEqual({ name: 'Al' });
    expect(state.groupByColumns).toEqual([]);
    expect(state.pinnedColumns).toEqual({});
    expect(state.columnOrder).toEqual(['name']);
  });

  it('per-field saveSort=false excludes sort from the snapshot', () => {
    const controller = createVanillaGridController({
      id: 'save-controller',
      data: [{ id: 'r1', name: 'Alpha' }] as Row[],
      columnDefs: [{ name: 'name' }],
      saveSort: false,
    });
    controller.sortColumn('name', SORT_DIRECTIONS.asc);
    const state = controller.getState();
    expect(state.sortState).toBeUndefined();
    // Filter is still serialized — each flag is independent.
    expect(state.activeFilters).toEqual({});
  });

  it('setState restores sort and filter independently', () => {
    const controller = createVanillaGridController({
      id: 'save-controller',
      data: [
        { id: 'r1', name: 'Alpha' },
        { id: 'r2', name: 'Beta' },
      ] as Row[],
      columnDefs: [{ name: 'name' }],
      enableSorting: true,
      enableFiltering: true,
      rowIdentity: (entity) => String((entity as Row).id),
    });
    controller.setState({
      sortState: { columnName: 'name', direction: SORT_DIRECTIONS.desc },
      activeFilters: { name: 'Beta' },
    });
    expect(controller.getSnapshot().pipeline.visibleRows.map((r) => r.id)).toEqual(['r2']);
  });

  it('saveSelection captures selectedRowIds and restores cleanly', async () => {
    const options = baseOptions();
    await mountGrid(options);
    const api = getApi(options);
    api.selection.selectRow(options.data[0]! as unknown as Record<string, unknown>);
    api.selection.selectRow(options.data[2]! as unknown as Record<string, unknown>);
    const state = api.saveState.save();
    expect((state as unknown as { selectedRowIds: string[] }).selectedRowIds.sort()).toEqual(['r1', 'r3']);
    api.selection.clearSelectedRows();
    expect(api.selection.getSelectedCount()).toBe(0);
    api.saveState.restore(state);
    expect(api.selection.getSelectedCount()).toBe(2);
  });

  it('saveFocus captures focusedCell and restores it', async () => {
    const options = baseOptions();
    const { shadow } = await mountGrid(options);
    const api = getApi(options);
    const cell = shadow.querySelector<HTMLElement>('.body-cell[data-row="r2"][data-column="status"]')!;
    cell.click();
    const state = api.saveState.save();
    expect((state as unknown as { focusedCell: { rowId: string } | null }).focusedCell?.rowId).toBe('r2');
    // Clear focus, then restore.
    cell.blur();
    api.saveState.restore({});
    expect(api.cellNav.getFocusedCell()?.row.id).toBe('r2');
  });

  it('saveGroupingExpandedStates=true captures collapsed groups', async () => {
    const controller = createVanillaGridController({
      id: 'save-controller',
      data: [{ id: 'r1', name: 'Alpha', status: 'Active' }] as Row[],
      columnDefs: [{ name: 'name' }, { name: 'status' }],
      enableGrouping: true,
      grouping: { groupBy: ['status'] },
      saveGroupingExpandedStates: true,
    });
    controller.setCollapsedGroup('status::Active', true);
    const state = controller.getState();
    expect(state.collapsedGroups).toEqual({ 'status::Active': true });
  });

  it('saveScroll flag captures and restores viewport scroll position', async () => {
    const options = baseOptions({
      saveScroll: true,
      data: Array.from({ length: 100 }, (_, i) => ({
        id: `r${i}`,
        name: `Row ${i}`,
        status: 'Active',
      })),
      rowHeight: 20,
      virtualizationThreshold: 1,
    });
    const { shadow } = await mountGrid(options);
    const api = getApi(options);
    // After the body/viewport split, vertical scroll lives on
    // .grid-body-viewport (the inner overflow wrapper). The .grid-table
    // only owns horizontal overflow now.
    const bodyViewport = shadow.querySelector<HTMLElement>('.grid-body-viewport')!;
    bodyViewport.scrollTop = 400;
    bodyViewport.dispatchEvent(new Event('scroll', { bubbles: true }));
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    const state = api.saveState.save();
    expect((state as unknown as { scrollTop: number }).scrollTop).toBe(400);
    // Scroll back to 0, then restore.
    bodyViewport.scrollTop = 0;
    api.saveState.restore(state);
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    expect(bodyViewport.scrollTop).toBe(400);
  });

  it('saveScroll=true implicitly disables saveFocus', async () => {
    const controller = createVanillaGridController({
      id: 'save-controller',
      data: [{ id: 'r1', name: 'Alpha' }] as Row[],
      columnDefs: [{ name: 'name' }],
      saveScroll: true,
    });
    controller.setCellNavFocus('r1', 'name');
    const state = controller.getState();
    expect(state.focusedCell).toBeUndefined();
  });

  it('setState is a no-op for fields that are undefined', () => {
    const controller = createVanillaGridController({
      id: 'save-controller',
      data: [{ id: 'r1', name: 'Alpha' }] as Row[],
      columnDefs: [{ name: 'name' }],
    });
    controller.setFilter('name', 'Al');
    const before = controller.getState();
    // setState({}) should preserve everything.
    controller.setState({});
    const after = controller.getState();
    expect(after.activeFilters).toEqual(before.activeFilters);
  });
});
