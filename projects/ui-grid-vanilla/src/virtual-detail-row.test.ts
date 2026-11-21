import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  UiGridStandaloneElement,
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * Regression tests for issue #7410: expanded detail rows are taller than
 * `rowHeight`, so they must contribute to the virtual window offset and to
 * the spacer's total height — for every expanded row at once, and back out
 * again when a row collapses.
 *
 * The numbers are pinned: 10 rows at rowHeight 30 with expandableRowHeight
 * 120 gives a 300px spacer collapsed, +120px per expanded row.
 */

async function waitFor<T>(resolve: () => T | null | undefined, timeoutMs = 5000): Promise<T> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = resolve();
    if (value) return value;
    await new Promise((next) => window.setTimeout(next, 20));
  }
  throw new Error('Timed out waiting for expected element state');
}

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
}

const ROW_HEIGHT = 30;
const DETAIL_ROW_HEIGHT = 120;
const ROW_COUNT = 10;

function rows(): Row[] {
  return Array.from({ length: ROW_COUNT }, (_, index) => ({
    id: `r${index}`,
    name: `Row ${index}`,
  }));
}

const TAG = 'ui-grid-element-virtual-detail-test';

interface MountedGrid {
  grid: VanillaUiGridElement;
  el: UiGridStandaloneElement;
  api: UiGridApi;
}

async function mountGrid(): Promise<MountedGrid> {
  let captured: UiGridApi | undefined;
  const options: GridOptions = {
    id: 'virtual-detail-grid',
    data: rows(),
    columnDefs: [{ name: 'name', displayName: 'Name' }],
    rowIdentity: (entity) => String((entity as Row).id),
    rowHeight: ROW_HEIGHT,
    minRowsToShow: 3,
    virtualizationThreshold: 5,
    enableExpandable: true,
    expandableRowHeight: DETAIL_ROW_HEIGHT,
    onRegisterApi: (api) => {
      captured = api as UiGridApi;
    },
  };

  const grid = await mountVanillaUiGrid(
    document.getElementById('app')!,
    options,
    undefined,
    TAG,
  );

  const api = await waitFor(() => captured);
  return { grid, el: grid as unknown as UiGridStandaloneElement, api };
}

function spacerOf(grid: VanillaUiGridElement): HTMLElement | null {
  return grid.shadowRoot?.querySelector<HTMLElement>('.grid-virtual-spacer') ?? null;
}

function virtualBodyOf(grid: VanillaUiGridElement): HTMLElement | null {
  return grid.shadowRoot?.querySelector<HTMLElement>('.grid-virtual-body') ?? null;
}

function renderedRowIds(grid: VanillaUiGridElement): string[] {
  const body = virtualBodyOf(grid);
  if (!body) return [];
  return Array.from(body.querySelectorAll<HTMLElement>('ui-grid-body-cell[data-row]')).map(
    (cell) => cell.getAttribute('data-row') ?? '',
  );
}

function expandedItemCount(el: UiGridStandaloneElement): number {
  return (
    el.snapshot?.pipeline.displayItems.filter((item) => item.kind === 'expandable').length ?? -1
  );
}

describe('virtual window with expanded detail rows', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('adds every expanded detail row to the spacer height and removes it on collapse', async () => {
    const { grid, el, api } = await mountGrid();

    const spacer = await waitFor(() => spacerOf(grid));
    expect(spacer.style.height).toBe('300px');
    expect(spacer.style.getPropertyValue('--ui-grid-row-height')).toBe('30px');
    expect(spacer.style.getPropertyValue('--ui-grid-expandable-row-height')).toBe('120px');

    api.expandable.toggleRowExpansion('r1');
    api.expandable.toggleRowExpansion('r4');

    await waitFor(() => (spacer.style.height === '540px' ? true : null));
    expect(spacer.style.height).toBe('540px');
    expect(expandedItemCount(el)).toBe(2);

    // Collapse one of the two: only its 120px comes back out.
    api.expandable.toggleRowExpansion('r1');
    await waitFor(() => (spacer.style.height === '420px' ? true : null));
    expect(spacer.style.height).toBe('420px');
    expect(expandedItemCount(el)).toBe(1);

    // Collapse the rest: back to the uniform 10 * 30 total.
    api.expandable.toggleRowExpansion('r4');
    await waitFor(() => (spacer.style.height === '300px' ? true : null));
    expect(spacer.style.height).toBe('300px');
    expect(expandedItemCount(el)).toBe(0);
  });

  it('offsets the virtual body past expanded detail rows instead of index * rowHeight', async () => {
    const { grid, el, api } = await mountGrid();
    const spacer = await waitFor(() => spacerOf(grid));

    api.expandable.toggleRowExpansion('r1');
    api.expandable.toggleRowExpansion('r4');
    await waitFor(() => (spacer.style.height === '540px' ? true : null));

    // Items: r0, r1, detail, r2, r3, r4, detail, r5 ... — item 7 (r5) starts at
    // 390px, so the overscanned window starts at item 3 (r2) → 180px.
    // The uniform-height formula would start at item 9 and offset 270px.
    el.scrollPosition = 400;
    el.renderVirtualBody();

    const virtualBody = await waitFor(() => virtualBodyOf(grid));
    expect(virtualBody.style.top).toBe('180px');

    const ids = renderedRowIds(grid);
    // Items 3..11 render: r2, r3, r4, detail(r4), r5, r6, r7, r8, r9.
    expect(ids).toEqual(['r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9']);
    expect(grid.shadowRoot?.querySelectorAll('.grid-virtual-body > .expandable-row').length).toBe(1);
  });

  it('clamps the window to the shortened spacer after collapsing at a deep scroll position', async () => {
    const { grid, el, api } = await mountGrid();
    const spacer = await waitFor(() => spacerOf(grid));

    api.expandable.toggleRowExpansion('r1');
    api.expandable.toggleRowExpansion('r4');
    await waitFor(() => (spacer.style.height === '540px' ? true : null));

    el.scrollPosition = 400;
    el.renderVirtualBody();
    expect((await waitFor(() => virtualBodyOf(grid))).style.top).toBe('180px');

    api.expandable.collapseAllRows();
    await waitFor(() => (spacer.style.height === '300px' ? true : null));

    // A full render re-reads scrollTop from the (flat, layout-less) test
    // viewport, so re-apply the deep scroll position and rebuild the body.
    el.scrollPosition = 400;
    el.renderVirtualBody();

    // 300px of content with a 30px viewport: scrollTop clamps to 270, so the
    // window starts at item 5 (150px) and still renders the final row.
    const virtualBody = await waitFor(() => virtualBodyOf(grid));
    expect(virtualBody.style.top).toBe('150px');

    const ids = renderedRowIds(grid);
    expect(ids[0]).toBe('r5');
    expect(ids[ids.length - 1]).toBe('r9');
  });
});
