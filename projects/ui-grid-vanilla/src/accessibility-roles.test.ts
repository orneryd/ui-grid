import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * ARIA grid semantics for the vanilla renderer (issue #7411).
 *
 * `role="grid"` is only meaningful when assistive technology can resolve a
 * cell's position: the grid carries `aria-rowcount` / `aria-colcount`, every
 * row carries a 1-based `aria-rowindex` and every cell a 1-based
 * `aria-colindex`. The indexes are absolute — a virtualized body only mounts
 * a window of rows, and that window must still announce its real position.
 *
 * The tests also pin two patch-path regressions found while reviewing the
 * role work: the fast in-place row patch replaced an expandable row's whole
 * `innerHTML` (dropping its `gridcell`) and collected cells by descending
 * into cell content (adopting a nested grid's cells).
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

async function waitFrame(): Promise<void> {
  await new Promise((next) => requestAnimationFrame(() => next(undefined)));
  await new Promise((next) => requestAnimationFrame(() => next(undefined)));
  await new Promise((next) => window.setTimeout(next, 0));
}

const TAG = 'ui-grid-element-accessibility-roles-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const options: GridOptions = {
    id: 'accessibility-roles',
    data: [
      { id: 'r1', name: 'Alpha', status: 'active' },
      { id: 'r2', name: 'Beta', status: 'inactive' },
    ] satisfies Row[],
    columnDefs: [{ name: 'name' }, { name: 'status' }],
    rowIdentity: (entity) => String((entity as { id: string }).id),
    onRegisterApi: (registered) => {
      capturedApi = registered as UiGridApi;
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
  const grid = await mountVanillaUiGrid(document.getElementById('app')!, options, undefined, TAG);
  const shadow = await waitFor(() => grid.shadowRoot);
  await waitFor(() => shadow.querySelector('.body-cell[data-column="name"]'));
  return { grid, shadow };
}

function cellIn(root: ShadowRoot, rowId: string, columnName: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(
    `.body-cell[data-row="${rowId}"][data-column="${columnName}"]`,
  );
  if (!el) throw new Error(`Cell ${rowId}/${columnName} is not rendered`);
  return el;
}

function dispatchClick(el: HTMLElement): void {
  el.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, button: 0 }),
  );
}

function pressKey(el: HTMLElement, key: string): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, composed: true }),
  );
}

function rowIndexOf(el: Element | null): string | null {
  return el?.getAttribute('aria-rowindex') ?? null;
}

function colIndexes(root: ParentNode, selector: string): (string | null)[] {
  return [...root.querySelectorAll(selector)].map((el) => el.getAttribute('aria-colindex'));
}

describe('grid accessibility roles', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('exposes headers, filter cells, and data cells through row semantics', async () => {
    const options = baseOptions({ enableFiltering: true });
    const { shadow: root } = await mountGrid(options);

    expect(root.querySelector('.grid-frame')?.getAttribute('role')).toBe('grid');
    expect(root.querySelector('.header-grid')?.getAttribute('role')).toBe('row');
    expect(root.querySelectorAll('[role="columnheader"]')).toHaveLength(2);
    expect(root.querySelector('.filter-grid')?.getAttribute('role')).toBe('row');
    expect(root.querySelectorAll('.filter-grid [role="gridcell"]')).toHaveLength(2);

    const rows = [...root.querySelectorAll('.body-grid > [role="row"]')];
    expect(rows).toHaveLength(2);
    expect(rows[0]?.querySelectorAll('[role="gridcell"]')).toHaveLength(2);
    expect(rows[1]?.querySelectorAll('[role="gridcell"]')).toHaveLength(2);
  });

  it('indexes the header rows, data rows and cells of a rendered grid', async () => {
    const options = baseOptions({ enableFiltering: true });
    const { shadow: root } = await mountGrid(options);

    const frame = root.querySelector('.grid-frame');
    // Two header rows (column header + filter row) plus two data rows.
    expect(frame?.getAttribute('aria-rowcount')).toBe('4');
    expect(frame?.getAttribute('aria-colcount')).toBe('2');

    expect(rowIndexOf(root.querySelector('.header-grid'))).toBe('1');
    expect(rowIndexOf(root.querySelector('.filter-grid'))).toBe('2');
    expect(colIndexes(root, '.header-grid [role="columnheader"]')).toEqual(['1', '2']);
    expect(colIndexes(root, '.filter-grid [role="gridcell"]')).toEqual(['1', '2']);

    expect(rowIndexOf(root.querySelector('.ui-grid-data-row[data-row="r1"]'))).toBe('3');
    expect(rowIndexOf(root.querySelector('.ui-grid-data-row[data-row="r2"]'))).toBe('4');
    expect(colIndexes(root, '.ui-grid-data-row[data-row="r1"] [role="gridcell"]')).toEqual([
      '1',
      '2',
    ]);
    expect(colIndexes(root, '.ui-grid-data-row[data-row="r2"] [role="gridcell"]')).toEqual([
      '1',
      '2',
    ]);
  });

  it('drops the header offset when the filter row is not rendered', async () => {
    const options = baseOptions({ enableFiltering: false });
    const { shadow: root } = await mountGrid(options);

    expect(root.querySelector('.filter-grid')).toBeNull();
    expect(root.querySelector('.grid-frame')?.getAttribute('aria-rowcount')).toBe('3');
    expect(rowIndexOf(root.querySelector('.ui-grid-data-row[data-row="r1"]'))).toBe('2');
    expect(rowIndexOf(root.querySelector('.ui-grid-data-row[data-row="r2"]'))).toBe('3');
  });

  it('indexes rows absolutely so a virtualized window stays addressable', async () => {
    const options = baseOptions({
      enableFiltering: false,
      rowHeight: 60,
      virtualizationThreshold: 5,
      data: Array.from({ length: 50 }, (_, index) => ({
        id: `r${index}`,
        name: `Row ${index}`,
        status: 'active',
      })) satisfies Row[],
    });
    const { shadow: root } = await mountGrid(options);

    const frame = root.querySelector('.grid-frame');
    // One header row plus every display item, not just the mounted window.
    expect(frame?.getAttribute('aria-rowcount')).toBe('51');
    expect(frame?.getAttribute('aria-colcount')).toBe('2');

    const rendered = [...root.querySelectorAll<HTMLElement>('.ui-grid-data-row')];
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(50);
    expect(rendered[0]?.dataset['row']).toBe('r0');
    expect(rowIndexOf(rendered[0] ?? null)).toBe('2');

    // Scroll far enough that the mounted window starts at display index 16
    // (floor(1200 / 60) - 4 overscan). The rows must keep reporting their
    // absolute position instead of restarting at 1.
    const viewport = root.querySelector<HTMLElement>('.grid-body-viewport');
    expect(viewport).not.toBeNull();
    viewport!.scrollTop = 20 * 60;
    viewport!.dispatchEvent(new Event('scroll', { bubbles: true }));
    await waitFrame();

    const firstWindowRow = await waitFor(() =>
      root.querySelector<HTMLElement>('.ui-grid-data-row[data-row="r16"]'),
    );
    expect(rowIndexOf(firstWindowRow)).toBe('18');
    for (const row of root.querySelectorAll<HTMLElement>('.ui-grid-data-row')) {
      const position = Number(row.dataset['row']?.replace('r', '') ?? -1);
      expect(rowIndexOf(row)).toBe(String(position + 2));
    }
  });

  it('keeps keyboard navigation on the indexed gridcells', async () => {
    const options = baseOptions({ enableFiltering: false, enableRowSelection: false });
    const { shadow: root } = await mountGrid(options);

    const start = cellIn(root, 'r1', 'name');
    dispatchClick(start);
    await waitFor(() => (start.classList.contains('cell-focused') ? {} : null));

    pressKey((root.activeElement as HTMLElement | null) ?? start, 'ArrowRight');
    const nextColumnCell = await waitFor(() =>
      cellIn(root, 'r1', 'status').classList.contains('cell-focused')
        ? cellIn(root, 'r1', 'status')
        : null,
    );
    expect(nextColumnCell.getAttribute('role')).toBe('gridcell');
    expect(nextColumnCell.getAttribute('aria-colindex')).toBe('2');

    pressKey((root.activeElement as HTMLElement | null) ?? nextColumnCell, 'ArrowDown');
    const nextRowCell = await waitFor(() =>
      cellIn(root, 'r2', 'status').classList.contains('cell-focused')
        ? cellIn(root, 'r2', 'status')
        : null,
    );
    expect(nextRowCell.getAttribute('aria-colindex')).toBe('2');
    expect(rowIndexOf(nextRowCell.closest('[role="row"]'))).toBe('3');
  });

  it('numbers group rows and data rows in one sequence and renumbers on collapse', async () => {
    const options = baseOptions({
      enableFiltering: false,
      enableGrouping: true,
      grouping: { groupBy: ['status'] },
      data: [
        { id: 'r1', name: 'Alpha', status: 'active' },
        { id: 'r2', name: 'Beta', status: 'active' },
        { id: 'r3', name: 'Gamma', status: 'inactive' },
      ] satisfies Row[],
    });
    const { shadow: root } = await mountGrid(options);

    const groupContainers = [...root.querySelectorAll<HTMLElement>('.ui-grid-group-row-container')];
    expect(groupContainers).toHaveLength(2);
    expect(groupContainers[0]?.getAttribute('role')).toBe('row');
    const groupCell = groupContainers[0]?.querySelector('[role="gridcell"]');
    expect(groupCell?.getAttribute('aria-colindex')).toBe('1');
    expect(groupCell?.getAttribute('aria-colspan')).toBe('2');

    const bodyRowIndexes = (): (string | null)[] =>
      [...root.querySelectorAll<HTMLElement>('.body-grid > [role="row"]')].map((row) =>
        row.getAttribute('aria-rowindex'),
      );
    // Two groups + three data rows, numbered straight after the header row.
    expect(bodyRowIndexes()).toEqual(['2', '3', '4', '5', '6']);

    // Collapsing the first group drops its two rows from the display list;
    // the remaining rows must be renumbered, not left stale.
    dispatchClick(groupCell as HTMLElement);
    await waitFor(() => (bodyRowIndexes().length === 3 ? {} : null));
    expect(bodyRowIndexes()).toEqual(['2', '3', '4']);
  });

  it('keeps the gridcell of an expandable row across a fast-path patch', async () => {
    const options = baseOptions({
      enableFiltering: false,
      enableExpandable: true,
      expandableRowTemplate: {
        createEmbeddedView: () => undefined,
      } as unknown as GridOptions['expandableRowTemplate'],
    });
    const { shadow: root } = await mountGrid(options);

    getApi(options).expandable.toggleRowExpansion(options.data[0]! as Record<string, unknown>);
    const expandable = await waitFor(() => root.querySelector<HTMLElement>('.expandable-row'));
    expect(expandable.getAttribute('role')).toBe('row');
    // displayItems: r1 (index 0), its detail row (index 1), r2 (index 2).
    expect(rowIndexOf(expandable)).toBe('3');
    expect(expandable.querySelector(':scope > [role="gridcell"]')).not.toBeNull();

    // Focusing a cell re-renders with the same item set, which takes the
    // in-place row patch. That patch must not replace the row's own markup.
    dispatchClick(cellIn(root, 'r2', 'name'));
    await waitFor(() =>
      cellIn(root, 'r2', 'name').classList.contains('cell-focused') ? {} : null,
    );
    await waitFrame();

    const patched = await waitFor(() => root.querySelector<HTMLElement>('.expandable-row'));
    expect(patched).toBe(expandable);
    expect(rowIndexOf(patched)).toBe('3');
    const gridcell = patched.querySelector(':scope > [role="gridcell"]');
    expect(gridcell).not.toBeNull();
    expect(gridcell?.textContent).toContain('Alpha');
  });

  it('only patches its own cells when a cell template nests another grid', async () => {
    const options = baseOptions({ enableFiltering: false, enableRowSelection: true });
    const { grid, shadow: root } = await mountGrid(options);

    // Stand-in for a grid rendered inside a cell template: markup carrying
    // this grid's cell attributes but belonging to the nested grid.
    const template = document.createElement('template');
    template.slot = 'cell-name';
    template.innerHTML =
      '<span class="value">{{value}}</span>' +
      '<ui-grid-body-cell data-row="r1" data-column="name"><span class="nested">nested</span></ui-grid-body-cell>';
    grid.append(template);
    await waitFor(() => cellIn(root, 'r1', 'name').querySelector('.value'));

    // Flip a row-state flag so the patch path walks r1's cells again.
    (options.data[0] as Record<string, unknown>)['name'] = 'Alpha updated';
    getApi(options).selection.selectRow(options.data[0]! as Record<string, unknown>);
    await waitFor(() =>
      cellIn(root, 'r1', 'name').classList.contains('ui-grid-row-selected') ? {} : null,
    );

    const outerCell = cellIn(root, 'r1', 'name');
    expect(outerCell.querySelector('.value')?.textContent).toBe('Alpha updated');
    expect(outerCell.querySelector('.nested')?.textContent).toBe('nested');
  });

  it('marks the pin menu items as menuitems', async () => {
    const options = baseOptions({ enableFiltering: false, enablePinning: true });
    const { shadow: root } = await mountGrid(options);

    const menu = root.querySelector('.pin-menu');
    expect(menu?.getAttribute('role')).toBe('menu');
    expect(menu?.hasAttribute('inert')).toBe(true);
    expect([...(menu?.children ?? [])].map((child) => child.getAttribute('role'))).toEqual([
      'menuitem',
      'menuitem',
    ]);
    expect(
      [...(menu?.querySelectorAll('[role="menuitem"]') ?? [])].map((item) =>
        item.getAttribute('data-action'),
      ),
    ).toEqual(['pin-left', 'pin-right']);

    const trigger = root.querySelector<HTMLElement>(
      '.header-cell[data-column="name"] .pin-trigger',
    );
    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');

    dispatchClick(trigger!);
    const expandedTrigger = await waitFor(() =>
      root.querySelector<HTMLElement>(
        '.header-cell[data-column="name"][data-pin-menu-open="true"] .pin-trigger',
      ),
    );
    expect(expandedTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(expandedTrigger.getAttribute('tabindex')).toBe('-1');
    expect(root.querySelector('.pin-menu')?.hasAttribute('inert')).toBe(false);
    expect((root.activeElement as HTMLElement | null)?.dataset['action']).toBe('pin-left');

    pressKey(root.activeElement as HTMLElement, 'ArrowDown');
    expect((root.activeElement as HTMLElement | null)?.dataset['action']).toBe('pin-right');
    pressKey(root.activeElement as HTMLElement, 'Home');
    expect((root.activeElement as HTMLElement | null)?.dataset['action']).toBe('pin-left');
    pressKey(root.activeElement as HTMLElement, 'Escape');

    const closedTrigger = root.querySelector<HTMLElement>(
      '.header-cell[data-column="name"] .pin-trigger',
    );
    expect(root.querySelector('.pin-menu')?.hasAttribute('inert')).toBe(true);
    expect(closedTrigger?.getAttribute('tabindex')).toBeNull();
    expect(root.activeElement).toBe(closedTrigger);

    pressKey(closedTrigger!, 'ArrowDown');
    expect(root.querySelector('.pin-menu')?.hasAttribute('inert')).toBe(false);
    expect((root.activeElement as HTMLElement | null)?.dataset['action']).toBe('pin-left');

    const nextColumnTrigger = root.querySelector<HTMLElement>(
      '.header-cell[data-column="status"] .pin-trigger',
    );
    nextColumnTrigger?.focus();
    await waitFor(() =>
      root.querySelector('.pin-menu')?.hasAttribute('inert') ? {} : null,
    );
    expect(root.activeElement).toBe(nextColumnTrigger);
  });
});
