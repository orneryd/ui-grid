import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  SORT_DIRECTIONS,
  clearRustWasmGridEngine,
  type GridSavedState,
} from '@ornery/ui-grid-core';

import {
  createVanillaGridController,
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * saveState contract + round-trip coverage.
 *
 * The public `GridSavedState` declaration must describe the payload
 * `gridApi.saveState.save()` actually emits, and `restore()` must accept both
 * that runtime payload and the older declarative aliases without losing
 * anything.
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

const TAG = 'ui-grid-element-savestate-contract-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
}

/** Keys the live controller writes into a payload — must match `GridSavedState`. */
const SAVE_PAYLOAD_KEYS = [
  'sortState',
  'activeFilters',
  'groupByColumns',
  'collapsedGroups',
  'pinnedColumns',
  'columnOrder',
  'columnWidthOverrides',
  'currentPage',
  'pageSize',
  'selectedRowIds',
  'focusedCell',
  'expandedRows',
  'expandedTreeRows',
  'scrollTop',
  'scrollLeft',
] as const satisfies readonly (keyof GridSavedState)[];

/** Declarative aliases `restore()` still honours — `save()` must not emit them. */
const LEGACY_ALIAS_KEYS = [
  'sort',
  'filters',
  'grouping',
  'pagination',
  'expandable',
  'treeView',
  'pinning',
] as const satisfies readonly (keyof GridSavedState)[];

function createRows(statuses: readonly string[]): Row[] {
  return statuses.map((status, index) => ({
    id: `r${index + 1}`,
    name: `Row ${index + 1}`,
    status,
  }));
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const options: GridOptions = {
    id: 'savestate-contract-grid',
    data: createRows(['Active', 'Pilot', 'Draft']),
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

function expandableTemplate(): NonNullable<GridOptions['expandableRowTemplate']> {
  // canGridExpandRows only needs a template object to exist.
  return { createEmbeddedView: () => undefined } as unknown as NonNullable<
    GridOptions['expandableRowTemplate']
  >;
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

describe('vanilla grid saveState contract', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('save() emits exactly the declared runtime payload members', async () => {
    const options = baseOptions({
      enablePinning: true,
      enablePagination: true,
      paginationPageSize: 2,
      paginationPageSizes: [2, 4, 6],
    });
    await mountGrid(options);
    const api = getApi(options);
    api.pagination.setPageSize(2);

    const state = api.saveState.save();
    expect(Object.keys(state).sort()).toEqual([
      'activeFilters',
      'columnOrder',
      'columnWidthOverrides',
      'currentPage',
      'expandedRows',
      'expandedTreeRows',
      'focusedCell',
      'groupByColumns',
      'pageSize',
      'pinnedColumns',
      'selectedRowIds',
      'sortState',
    ]);

    for (const alias of LEGACY_ALIAS_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(state, alias)).toBe(false);
    }

    expect(state.sortState).toEqual({ columnName: null, direction: SORT_DIRECTIONS.none });
    expect(state.activeFilters).toEqual({});
    expect(state.groupByColumns).toEqual([]);
    expect(state.pinnedColumns).toEqual({});
    expect(state.selectedRowIds).toEqual([]);
    expect(state.focusedCell).toBeNull();
    expect(state.currentPage).toBe(1);
    expect(state.pageSize).toBe(2);
  });

  it('save() adds collapsedGroups and scroll offsets only when those flags are on', async () => {
    const options = baseOptions({
      saveScroll: true,
      saveGroupingExpandedStates: true,
      enableGrouping: true,
      grouping: { groupBy: ['status'] },
    });
    await mountGrid(options);

    const state = getApi(options).saveState.save();
    expect(Object.keys(state).sort()).toEqual([
      'activeFilters',
      'collapsedGroups',
      'columnOrder',
      'columnWidthOverrides',
      'currentPage',
      'expandedRows',
      'expandedTreeRows',
      'groupByColumns',
      'pageSize',
      'pinnedColumns',
      'scrollLeft',
      'scrollTop',
      'selectedRowIds',
      'sortState',
    ]);

    // saveScroll implicitly suppresses focus capture.
    expect(Object.prototype.hasOwnProperty.call(state, 'focusedCell')).toBe(false);
  });

  it('round-trips active filters through save/restore', async () => {
    const options = baseOptions({ enableFiltering: true });
    await mountGrid(options);
    const api = getApi(options);

    api.core.setFilter('status', 'Active');
    await waitFor(() => (api.core.getVisibleRows().length === 1 ? {} : null));

    const state = api.saveState.save();
    expect(state.activeFilters).toEqual({ status: 'Active' });

    api.core.clearAllFilters();
    await waitFor(() => (api.core.getVisibleRows().length === 3 ? {} : null));

    api.saveState.restore(state);
    await waitFor(() => (api.core.getVisibleRows().length === 1 ? {} : null));
    expect(api.core.getVisibleRows().map((row) => row.id)).toEqual(['r1']);
  });

  it('round-trips row expansion through save/restore', async () => {
    const options = baseOptions({
      enableExpandable: true,
      expandableRowTemplate: expandableTemplate(),
    });
    const { shadow } = await mountGrid(options);
    const api = getApi(options);

    api.expandable.toggleRowExpansion(options.data[1] as Record<string, unknown>);
    await waitFor(() => shadow.querySelector('.expandable-row'));
    expect(shadow.querySelectorAll('.expandable-row').length).toBe(1);

    const state = api.saveState.save();
    expect(state.expandedRows).toEqual({ r2: true });

    api.expandable.collapseAllRows();
    await waitFor(() => (shadow.querySelector('.expandable-row') ? null : {}));

    api.saveState.restore(state);
    await waitFor(() => shadow.querySelector('.expandable-row'));
    expect(shadow.querySelectorAll('.expandable-row').length).toBe(1);
  });

  it('round-trips pinned columns through save/restore', () => {
    const controller = createVanillaGridController({
      id: 'savestate-pinning',
      data: createRows(['Active', 'Pilot', 'Draft']),
      columnDefs: [{ name: 'name' }, { name: 'status' }],
      enablePinning: true,
    });

    controller.pinColumn('status', 'left');
    const state = controller.getState();
    expect(state.pinnedColumns).toEqual({ status: 'left' });

    controller.pinColumn('status', 'none');
    expect(controller.getSnapshot().pinnedColumns).toEqual({});

    controller.setState(state);
    expect(controller.getSnapshot().pinnedColumns).toEqual({ status: 'left' });
  });

  it('round-trips pagination through save/restore', () => {
    const controller = createVanillaGridController({
      id: 'savestate-pagination',
      data: createRows(['Active', 'Active', 'Pilot', 'Active', 'Active', 'Draft']),
      columnDefs: [{ name: 'name' }, { name: 'status' }],
      enablePagination: true,
      paginationPageSize: 2,
      paginationPageSizes: [2, 4, 6],
      rowIdentity: (entity) => String((entity as Row).id),
    });

    controller.setPageSize(2);
    controller.seekPage(2);
    const state = controller.getState();
    expect(state.currentPage).toBe(2);
    expect(state.pageSize).toBe(2);

    controller.setPageSize(4);
    controller.seekPage(1);
    expect(controller.getSnapshot().currentPage).toBe(1);
    expect(controller.getSnapshot().pageSize).toBe(4);

    controller.setState(state);
    expect(controller.getSnapshot().currentPage).toBe(2);
    expect(controller.getSnapshot().pageSize).toBe(2);
  });

  it('restore() still applies legacy declarative payloads', async () => {
    const options = baseOptions({
      data: createRows(['Active', 'Active', 'Pilot', 'Active', 'Active', 'Draft']),
      enableFiltering: true,
      enableSorting: true,
      enablePagination: true,
      paginationPageSize: 2,
      paginationPageSizes: [2, 4, 6],
    });
    await mountGrid(options);
    const api = getApi(options);

    // 4 of the 6 rows match the filter, so the filtered set has 2 pages.
    expect(api.pagination.getTotalPages()).toBe(3);

    const legacyPayload: GridSavedState = {
      filters: { status: 'Active' },
      grouping: [],
      pagination: { paginationCurrentPage: 2, paginationPageSize: 2 },
      sort: { columnName: 'name', direction: SORT_DIRECTIONS.desc },
      pinning: {},
      expandable: {},
      treeView: {},
    };

    api.saveState.restore(legacyPayload);

    await waitFor(() =>
      api.pagination.getTotalPages() === 2 && api.pagination.getPage() === 2 ? {} : null,
    );
    // Descending by name: Row 5, Row 4 | Row 2, Row 1 — page 2 is the last pair.
    expect(api.core.getVisibleRows().map((row) => row.id)).toEqual(['r2', 'r1']);
  });

  it('round-trips a JSON-serialised payload', async () => {
    const options = baseOptions({
      data: createRows(['Active', 'Active', 'Pilot', 'Active', 'Active', 'Draft']),
      enableFiltering: true,
    });
    const { shadow } = await mountGrid(options);
    const api = getApi(options);

    api.core.setFilter('status', 'Active');
    await waitFor(() => (api.core.getVisibleRows().length === 4 ? {} : null));

    const serialised = JSON.stringify(api.saveState.save());
    api.core.clearAllFilters();
    await waitFor(() => (api.core.getVisibleRows().length === 6 ? {} : null));

    api.saveState.restore(JSON.parse(serialised) as GridSavedState);
    await waitFor(() => (api.core.getVisibleRows().length === 4 ? {} : null));
    expect([...api.core.getVisibleRows().map((row) => row.id)].sort()).toEqual([
      'r1',
      'r2',
      'r4',
      'r5',
    ]);
    expect(shadow.querySelector('.body-cell[data-row="r1"]')).not.toBeNull();
  });
});
