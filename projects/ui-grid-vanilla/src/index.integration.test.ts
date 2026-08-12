import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as core from '@ornery/ui-grid-core';
import {
  SORT_DIRECTIONS,
  activeGridEngineBackend,
  buildGridRows,
  clearRustWasmGridEngine,
} from '@ornery/ui-grid-core';
import {
  defineStandaloneUiGridElement,
  mountVanillaUiGrid,
  registerVanillaUiGridRustModule,
  type GridOptions,
  type UiGridIconOverrides,
  type UiGridRustWebModule,
  type UiGridApi,
} from './index';
import { createVanillaGridController } from './grid-controller';

async function waitFor<T>(resolve: () => T | null | undefined, timeoutMs = 10000): Promise<T> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = resolve();
    if (value) {
      return value;
    }

    await new Promise((resolveNext) => window.setTimeout(resolveNext, 20));
  }

  throw new Error('Timed out waiting for expected element state');
}

describe('mountVanillaUiGrid integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('mounts the standalone element and handles header sort interaction', async () => {
    let gridApi: UiGridApi | undefined;
    const target = document.getElementById('app');
    if (!target) {
      throw new Error('Expected test root element');
    }

    const options: GridOptions = {
      id: 'vanilla-rust-keyboard-grid',
      enableGrouping: true,
      enableSorting: true,
      enableFiltering: true,
      virtualizationThreshold: 99,
      data: [
        {
          id: 'row-1',
          name: 'Gamma',
          status: 'Pilot',
          account: { owner: 'Mina Patel' },
        },
        {
          id: 'row-2',
          name: 'Beta',
          status: 'Active',
          account: { owner: 'Jordan Silva' },
        },
      ],
      columnDefs: [{ name: 'name', displayName: 'Customer' }, { name: 'status' }],
      onRegisterApi: (api) => {
        gridApi = api as UiGridApi;
      },
    };

    const grid = await mountVanillaUiGrid(
      target,
      options,
      undefined,
      'ui-grid-element-vanilla-test',
    );

    await waitFor(() => gridApi);
    if (!gridApi) {
      throw new Error('Expected grid API registration');
    }
    const shadowRoot = await waitFor(() => grid.shadowRoot);
    const sortButton = await waitFor(
      () =>
        shadowRoot.querySelector('.header-action[data-column="name"]') as HTMLButtonElement | null,
    );

    sortButton.click();
    expect(gridApi.core.getVisibleRows().map((row) => row.entity['name'])).toEqual([
      'Beta',
      'Gamma',
    ]);

    const sortButtonAfterFirstClick = await waitFor(
      () =>
        shadowRoot.querySelector('.header-action[data-column="name"]') as HTMLButtonElement | null,
    );
    sortButtonAfterFirstClick.click();
    expect(gridApi.core.getVisibleRows().map((row) => row.entity['name'])).toEqual([
      'Gamma',
      'Beta',
    ]);
  }, 15000);

  it('renders custom header content from column headerRenderer', async () => {
    const target = document.getElementById('app');
    if (!target) {
      throw new Error('Expected test root element');
    }

    const grid = await mountVanillaUiGrid(
      target,
      {
        id: 'vanilla-header-render-grid',
        data: [{ id: 'row-1', name: 'Gamma', status: 'Pilot' }],
        columnDefs: [
          {
            name: 'name',
            displayName: 'Customer',
            headerRenderer: ({ value, column }) => `${value}:${column.name}`,
          },
          { name: 'status' },
        ],
      },
      undefined,
      'ui-grid-element-vanilla-test',
    );

    const shadowRoot = await waitFor(() => grid.shadowRoot);
    const headers = Array.from(shadowRoot.querySelectorAll('.header-label')).map((node) =>
      node.textContent?.trim(),
    );

    expect(headers).toEqual(['Customer:name', 'Status']);
  });

  it('registers Rust/WASM bindings through the vanilla API', async () => {
    const module: UiGridRustWebModule = {
      default: vi.fn(async () => undefined),
    };

    await registerVanillaUiGridRustModule(module);
    expect(module.default).toHaveBeenCalledTimes(1);
    expect(activeGridEngineBackend()).toBe('typescript');
  });

  it('controller API exposes subscribe and action methods', () => {
    const controller = createVanillaGridController({
      id: 'controller-smoke',
      data: [
        { id: 'r1', name: 'Gamma' },
        { id: 'r2', name: 'Alpha' },
      ],
      columnDefs: [{ name: 'name' }],
      enableSorting: true,
      enableFiltering: true,
    });

    const changes: number[] = [];
    const unsubscribe = controller.subscribe((snapshot) => {
      changes.push(snapshot.pipeline.visibleRows.length);
    });

    controller.setFilter('name', 'Alpha');
    controller.sortColumn('name', SORT_DIRECTIONS.asc);
    unsubscribe();

    expect(changes.length).toBeGreaterThan(1);
    expect(controller.getSnapshot().pipeline.visibleRows.map((row) => row.entity['name'])).toEqual([
      'Alpha',
    ]);
  });

  it('lazy-loads the wasm engine once and refreshes through it when ready', async () => {
    const enableSpy = vi.spyOn(core, 'enableUiGridWasmEngine').mockImplementation(async () => {
      core.registerRustWasmGridEngine({
        buildPipeline(context) {
          return {
            visibleRows: buildGridRows(
              context.options,
              context.rowSize,
              context.hiddenRowReasons,
              context.expandedRows,
            ),
            displayItems: [],
            virtualizationEnabled: false,
            pipelineMs: 123,
            totalItems: context.options.data.length,
          };
        },
      });
    });

    const controller = createVanillaGridController({
      id: 'controller-wasm-bootstrap',
      data: [
        { id: 'r1', name: 'Gamma' },
        { id: 'r2', name: 'Alpha' },
      ],
      columnDefs: [{ name: 'name' }],
      enableSorting: true,
      enableFiltering: true,
    });

    expect(enableSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      const snapshot = controller.getSnapshot();
      return activeGridEngineBackend() === 'rust-wasm' && snapshot.pipeline.pipelineMs === 123
        ? snapshot
        : null;
    });

    controller.setFilter('name', 'Alpha');
    controller.sortColumn('name', SORT_DIRECTIONS.asc);

    expect(enableSpy).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().pipeline.pipelineMs).toBe(123);
    enableSpy.mockRestore();
  });

  it('applies overridable SVG icons for controls', async () => {
    const target = document.getElementById('app');
    if (!target) {
      throw new Error('Expected test root element');
    }

    const options: GridOptions = {
      id: 'vanilla-icon-grid',
      enableSorting: true,
      data: [{ id: 'row-1', name: 'Gamma' }],
      columnDefs: [{ name: 'name', displayName: 'Customer' }],
    };

    const grid = await mountVanillaUiGrid(
      target,
      options,
      undefined,
      'ui-grid-element-vanilla-test',
    );
    const overrides: UiGridIconOverrides = {
      sortNone: { path: 'M3 3h18v18H3z' },
    };

    (grid as unknown as { controlIcons: UiGridIconOverrides }).controlIcons = overrides;

    const shadowRoot = await waitFor(() => grid.shadowRoot);
    const iconPath = shadowRoot.querySelector('.header-action .control-icon path');

    expect(iconPath?.getAttribute('d')).toBe('M3 3h18v18H3z');
  });

  it('renders native template slots for cells and expandable rows', async () => {
    const target = document.getElementById('app');
    if (!target) {
      throw new Error('Expected test root element');
    }

    const options: GridOptions = {
      id: 'vanilla-slot-grid',
      enableSorting: true,
      enableExpandable: true,
      data: [
        {
          id: 'row-1',
          name: 'Gamma',
          status: 'Active',
          account: { owner: 'Mina Patel' },
        },
      ],
      columnDefs: [
        { name: 'name', displayName: 'Customer' },
        { name: 'status', displayName: 'Status' },
      ],
    };

    const grid = await mountVanillaUiGrid(
      target,
      options,
      undefined,
      'ui-grid-element-vanilla-test',
    );

    const statusTemplate = document.createElement('template');
    statusTemplate.slot = 'cell-status';
    statusTemplate.innerHTML =
      '<span class="status-pill status-pill-{{valueLower}}">{{value}}</span>';

    const expandableTemplate = document.createElement('template');
    expandableTemplate.slot = 'expandable-row';
    expandableTemplate.innerHTML = '<div class="detail-card">Owner {{row.account.owner}}</div>';

    grid.append(statusTemplate, expandableTemplate);

    const statusPill = await waitFor(
      () => grid.shadowRoot?.querySelector('.status-pill-active') as HTMLElement | null,
    );

    expect(statusPill.textContent).toContain('Active');

    const expandButton = await waitFor(
      () => grid.shadowRoot?.querySelector('.row-toggle-expand') as HTMLButtonElement | null,
    );

    expandButton.click();

    const detailCard = await waitFor(
      () => grid.shadowRoot?.querySelector('.detail-card') as HTMLElement | null,
    );

    expect(detailCard.textContent).toContain('Owner Mina Patel');
  });

  it('preserves declarative attribute data when augmenting options imperatively', async () => {
    // Use the already-registered 'ui-grid-element-vanilla-test' tag (from mountVanillaUiGrid
    // in prior tests) to avoid the jsdom constraint of not registering the same class twice.
    const grid = document.createElement('ui-grid-element-vanilla-test') as HTMLElement & {
      options: GridOptions;
    };
    document.getElementById('app')!.appendChild(grid);

    grid.setAttribute('grid-id', 'declarative-test');
    grid.setAttribute('column-defs', JSON.stringify([{ name: 'name', displayName: 'Customer' }]));
    grid.setAttribute('data', JSON.stringify([{ id: 'row-1', name: 'Gamma' }]));

    // Flush the attributeChangedCallback microtask so attributeOptions are populated.
    await new Promise<void>((r) => setTimeout(r, 0));

    // Before any imperative assignment, the getter must surface attribute-derived data.
    expect((grid.options.data as Array<{ id: string; name: string }>)[0].name).toBe('Gamma');
    expect(grid.options.columnDefs[0].name).toBe('name');

    // Simulate the bridge pattern: augment without losing attribute-derived data.
    grid.options = {
      ...grid.options,
      minRowsToShow: 20,
    };

    expect((grid.options.data as Array<{ id: string; name: string }>)[0].name).toBe('Gamma');
    expect(grid.options.minRowsToShow).toBe(20);
  });

});
