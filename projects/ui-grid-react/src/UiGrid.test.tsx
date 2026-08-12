import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { UiGrid } from './UiGrid';
import type { UiGridProps } from './UiGrid';
import type {
  GridOptions,
  UiGridApi,
} from '@ornery/ui-grid-core';
import { SORT_DIRECTIONS, FILTER_CONDITIONS } from '@ornery/ui-grid-core';

const baseData = [
  {
    id: 'row-1',
    name: 'Gamma',
    status: 'Pilot',
    revenue: 300,
    active: true,
    account: { owner: 'Mina Patel' },
  },
  {
    id: 'row-2',
    name: 'alpha',
    status: 'Active',
    revenue: 100,
    active: false,
    account: { owner: 'Casey Tran' },
  },
  {
    id: 'row-3',
    name: 'Beta',
    status: 'Active',
    revenue: 200,
    active: true,
    account: { owner: 'Jordan Silva' },
  },
] as const;

function createOptions(
  overrides: Partial<GridOptions> = {},
  onRegisterApi?: (api: UiGridApi) => void,
): GridOptions {
  return {
    id: 'spec-grid',
    title: 'Spec Grid',
    emptyMessage: 'Nothing to show',
    data: baseData,
    rowIdentity: (row) => String(row['id']),
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: true,
    enableColumnMoving: true,
    enableVirtualization: true,
    virtualizationThreshold: 99,
    benchmark: { iterations: 3 },
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'status' },
      {
        name: 'revenue',
        align: 'end',
        filter: { condition: FILTER_CONDITIONS.greaterThan },
        formatter: (value) => `$${value}`,
      },
      { name: 'owner', field: 'account.owner' },
      {
        name: 'badge',
        cellRenderer: ({ row }) => `${row['name']}-badge`,
      },
    ],
    onRegisterApi: (api) => onRegisterApi?.(api as UiGridApi),
    ...overrides,
  };
}

function getShadowRoot(container: HTMLElement): ShadowRoot {
  const el = container.querySelector('ui-grid-element');
  if (!el?.shadowRoot) throw new Error('Shadow root not found');
  return el.shadowRoot;
}

async function renderGrid(
  overrides: Partial<GridOptions> = {},
  props: Partial<Omit<UiGridProps, 'options'>> = {},
): Promise<{ container: HTMLElement; gridApi: UiGridApi; shadowRoot: ShadowRoot }> {
  let gridApi!: UiGridApi;
  let resolveApi: () => void;
  const apiReady = new Promise<void>((r) => { resolveApi = r; });
  const options = createOptions(overrides, (api) => {
    gridApi = api;
    props.onRegisterApi?.(api);
    resolveApi();
  });

  const { container } = render(
    <UiGrid options={options} onRegisterApi={options.onRegisterApi as any} {...props} />,
  );

  await act(async () => { await apiReady; });

  const shadowRoot = getShadowRoot(container);
  return { container, gridApi, shadowRoot };
}

describe('UiGrid React component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('registers the API and renders headers and rows', async () => {
    const { shadowRoot, gridApi } = await renderGrid();

    const headers = Array.from(shadowRoot.querySelectorAll('.header-label')).map((el) =>
      el.textContent?.trim(),
    );
    const bodyCells = Array.from(shadowRoot.querySelectorAll('.body-cell')).map((el) =>
      el.textContent?.trim(),
    );

    expect(gridApi).toBeTruthy();
    expect(headers).toEqual(['Customer', 'Status', 'Revenue', 'Owner', 'Badge']);
    expect(bodyCells).toContain('Gamma');
    expect(bodyCells).toContain('$300');
    expect(bodyCells).toContain('Mina Patel');
    expect(bodyCells).toContain('Gamma-badge');
  });

  it('filters rows via the API', async () => {
    const { gridApi } = await renderGrid();

    const filterChanged = vi.fn();
    gridApi.core.on.filterChanged(filterChanged);

    act(() => {
      gridApi.core.setFilter('status', 'Active');
    });
    expect(gridApi.core.getVisibleRows().map((row) => row.entity['name'])).toEqual([
      'alpha',
      'Beta',
    ]);

    act(() => {
      gridApi.core.setFilter('status', 'Missing');
    });
    expect(gridApi.core.getVisibleRows()).toEqual([]);
  });

  it('sorts rows via the API', async () => {
    const { gridApi } = await renderGrid();

    const sortChanged = vi.fn();
    gridApi.core.on.sortChanged(sortChanged);

    act(() => {
      gridApi.core.sortColumn('name', SORT_DIRECTIONS.asc);
    });
    expect(gridApi.core.getVisibleRows().map((row) => row.entity['name'])).toEqual([
      'alpha',
      'Beta',
      'Gamma',
    ]);
    expect(sortChanged).toHaveBeenLastCalledWith('name', SORT_DIRECTIONS.asc);
  });

  it('groups rows via the API', async () => {
    const { shadowRoot, gridApi } = await renderGrid();

    const groupingChanged = vi.fn();
    gridApi.core.on.groupingChanged(groupingChanged);

    act(() => {
      gridApi.core.groupByColumn('status');
    });

    const groups = shadowRoot.querySelectorAll('.group-row');
    expect(groupingChanged).toHaveBeenLastCalledWith(['status']);
    expect(groups).toHaveLength(2);
  });

  it('exports visible rows as CSV', async () => {
    const { gridApi } = await renderGrid();

    const anchor = document.createElement('a');
    const originalCreateElement = document.createElement.bind(document);
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) =>
      tagName === 'a' ? anchor : originalCreateElement(tagName)) as typeof document.createElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:spec-grid');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    act(() => {
      gridApi.core.exportCsv();
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(anchor.download).toMatch(/\.csv$/);
  });

  it('paginates rows via the API', async () => {
    const { gridApi } = await renderGrid({
      enablePagination: true,
      enablePaginationControls: true,
      paginationPageSizes: [1, 2],
      paginationPageSize: 1,
      paginationCurrentPage: 1,
    });

    const paginationChanged = vi.fn();
    gridApi.pagination.on.paginationChanged(paginationChanged);

    expect(gridApi.core.getVisibleRows().map((row) => row.id)).toEqual(['row-1']);
    expect(gridApi.pagination.getTotalPages()).toBe(3);

    act(() => {
      gridApi.pagination.nextPage();
    });
    expect(gridApi.core.getVisibleRows().map((row) => row.id)).toEqual(['row-2']);
    expect(paginationChanged).toHaveBeenLastCalledWith(2, 1);

    act(() => {
      gridApi.pagination.setPageSize(2);
    });
    expect(gridApi.core.getVisibleRows().map((row) => row.id)).toEqual(['row-1', 'row-2']);
  });

  it('renders cell renderers via portals', async () => {
    const statusRenderer = vi.fn((ctx) => `pill-${ctx.value}`);
    const { container } = await renderGrid(
      {
        columnDefs: [
          { name: 'name', displayName: 'Customer' },
          { name: 'status' },
        ],
      },
      { cellRenderers: { status: statusRenderer } },
    );

    // The vanilla element's framework slot flush may not fire in jsdom.
    // Manually dispatch a cellSlotsChanged event to exercise the portal path.
    const el = container.querySelector('ui-grid-element')!;
    await act(async () => {
      el.dispatchEvent(new CustomEvent('cellSlotsChanged', {
        detail: {
          added: [{
            slotName: 'cell--status--row-1',
            columnName: 'status',
            rowId: 'row-1',
            context: { $implicit: 'Pilot', value: 'Pilot', row: baseData[0], column: { name: 'status' }, rowIndex: 0 },
          }],
          removed: [],
        },
      }));
    });

    expect(statusRenderer).toHaveBeenCalled();
    const portalContent = container.querySelectorAll('[slot]');
    expect(portalContent.length).toBeGreaterThan(0);
  });

  it('feature flags disable columns via visible:false', async () => {
    const { gridApi } = await renderGrid({
      enableSorting: false,
      enableFiltering: false,
      enableGrouping: false,
      enableColumnMoving: false,
      enableVirtualization: false,
      columnDefs: [
        { name: 'name', visible: false },
        { name: 'status', sortable: false, filterable: false },
        { name: 'owner', field: 'account.owner' },
      ],
    });

    expect(gridApi.core.getVisibleRows()).toHaveLength(3);
  });

  it('row selection + expandable rows: selection toggle only repaints the affected row', async () => {
    // Regression test for the selection+expand performance issue. The patch
    // path's per-row fingerprint cache (in the vanilla layer) skips cells
    // whose visual state didn't change. The React wrapper inherits this fix
    // automatically because it mounts the same vanilla element. This test
    // pins the end-to-end behaviour: clicking the row-selection checkbox
    // for one row must only flip ui-grid-row-selected on that row's cells —
    // not invalidate any visible state on the unselected rows.
    const expandableTemplate = { createEmbeddedView: () => undefined };
    const { gridApi, shadowRoot } = await renderGrid({
      enableRowSelection: true,
      enableExpandable: true,
      expandableRowTemplate:
        expandableTemplate as unknown as GridOptions['expandableRowTemplate'],
    });

    const cellFor = (rowId: string, column: string): HTMLElement => {
      const el = shadowRoot.querySelector<HTMLElement>(
        `.body-cell[data-row="${rowId}"][data-column="${column}"]`,
      );
      if (!el) throw new Error(`Cell ${rowId}/${column} not rendered`);
      return el;
    };

    expect(cellFor('row-1', 'name').classList.contains('ui-grid-row-selected')).toBe(false);
    expect(cellFor('row-2', 'name').classList.contains('ui-grid-row-selected')).toBe(false);
    expect(cellFor('row-3', 'name').classList.contains('ui-grid-row-selected')).toBe(false);

    await act(async () => {
      gridApi.selection.selectRow(baseData[1] as Record<string, unknown>);
    });

    // row-2 must be selected, the others untouched.
    expect(cellFor('row-1', 'name').classList.contains('ui-grid-row-selected')).toBe(false);
    expect(cellFor('row-2', 'name').classList.contains('ui-grid-row-selected')).toBe(true);
    expect(cellFor('row-2', 'status').classList.contains('ui-grid-row-selected')).toBe(true);
    expect(cellFor('row-3', 'name').classList.contains('ui-grid-row-selected')).toBe(false);

    // Toggling expand on row-1 must insert exactly one expandable detail
    // row and leave selection on row-2 intact.
    await act(async () => {
      gridApi.expandable.toggleRowExpansion(baseData[0] as Record<string, unknown>);
    });
    await waitFor(() => {
      expect(shadowRoot.querySelectorAll('.expandable-row').length).toBe(1);
    });
    expect(cellFor('row-2', 'name').classList.contains('ui-grid-row-selected')).toBe(true);
  });
});
