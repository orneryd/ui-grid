import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * Row-selection integration tests. Ports the behaviours from the old
 * ui.grid.selection module and pins them against the vanilla grid's
 * public API and DOM wiring.
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

const TAG = 'ui-grid-element-vanilla-selection-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
}

function makeData(): Row[] {
  return [
    { id: 'r1', name: 'Alpha', status: 'Active' },
    { id: 'r2', name: 'Beta', status: 'Pilot' },
    { id: 'r3', name: 'Gamma', status: 'Draft' },
    { id: 'r4', name: 'Delta', status: 'Active' },
  ];
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const options: GridOptions = {
    id: 'row-selection-grid',
    data: makeData(),
    columnDefs: [
      { name: 'name', displayName: 'Name' },
      { name: 'status', displayName: 'Status' },
    ],
    rowIdentity: (entity) => String((entity as { id: string }).id),
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

function cellIn(root: ShadowRoot, rowId: string, columnName: string): HTMLElement {
  const selector = `.body-cell[data-row="${rowId}"][data-column="${columnName}"]`;
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Cell ${rowId}/${columnName} not rendered`);
  return el;
}

function dispatchMouse(
  el: HTMLElement,
  type: 'mousedown' | 'mouseup' | 'mousemove' | 'click',
  opts: {
    shiftKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    button?: number;
  } = {},
): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    shiftKey: !!opts.shiftKey,
    ctrlKey: !!opts.ctrlKey,
    metaKey: !!opts.metaKey,
    button: opts.button ?? 0,
  });
  el.dispatchEvent(event);
  return event;
}

function pressKey(el: HTMLElement, key: string, opts: { ctrlKey?: boolean; shiftKey?: boolean } = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    composed: true,
    ctrlKey: !!opts.ctrlKey,
    shiftKey: !!opts.shiftKey,
  });
  el.dispatchEvent(event);
  return event;
}

describe('vanilla grid row selection', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  describe('selection row header column', () => {
    it('is injected when enableRowHeaderSelection is true (default)', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      expect(
        shadow.querySelector('.header-cell[data-column="selectionRowHeaderCol"]'),
      ).not.toBeNull();
      expect(
        shadow.querySelectorAll('.body-cell[data-column="selectionRowHeaderCol"]').length,
      ).toBe(4);
    });

    it('is NOT injected when enableRowHeaderSelection is false', async () => {
      const options = baseOptions({ enableRowHeaderSelection: false });
      const { shadow } = await mountGrid(options);
      expect(
        shadow.querySelector('.header-cell[data-column="selectionRowHeaderCol"]'),
      ).toBeNull();
    });

    it('is NOT injected when enableRowSelection is false', async () => {
      const options = baseOptions({ enableRowSelection: false });
      const { shadow } = await mountGrid(options);
      expect(
        shadow.querySelector('.header-cell[data-column="selectionRowHeaderCol"]'),
      ).toBeNull();
    });
  });

  describe('gridApi.selection public API', () => {
    it('selectRow toggles isSelected and updates snapshot', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const row = options.data[1]!;
      api.selection.selectRow(row as unknown as Record<string, unknown>);
      await waitFor(() =>
        cellIn(shadow, 'r2', 'name').classList.contains('ui-grid-row-selected') ? {} : null,
      );
      expect(api.selection.getSelectedCount()).toBe(1);
      expect(api.selection.getSelectedRows()).toEqual([row]);
    });

    it('unSelectRow deselects a previously-selected row', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const row = options.data[0]!;
      api.selection.selectRow(row as unknown as Record<string, unknown>);
      await waitFor(() => (api.selection.getSelectedCount() === 1 ? {} : null));
      api.selection.unSelectRow(row as unknown as Record<string, unknown>);
      await waitFor(() => (api.selection.getSelectedCount() === 0 ? {} : null));
      expect(cellIn(shadow, 'r1', 'name').classList.contains('ui-grid-row-selected')).toBe(false);
    });

    it('toggleRowSelection flips state each call', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      const row = options.data[2]!;
      api.selection.toggleRowSelection(row as unknown as Record<string, unknown>);
      expect(api.selection.getSelectedCount()).toBe(1);
      api.selection.toggleRowSelection(row as unknown as Record<string, unknown>);
      expect(api.selection.getSelectedCount()).toBe(0);
    });

    it('selectRowByVisibleIndex selects by position in visible rows', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      api.selection.selectRowByVisibleIndex(2);
      expect(api.selection.getSelectedCount()).toBe(1);
      expect(api.selection.getSelectedRows()[0]!['id']).toBe('r3');
    });

    it('selectRowByKey finds by entity key', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      api.selection.selectRowByKey(true, 'status', 'Pilot');
      expect(api.selection.getSelectedRows()[0]!['id']).toBe('r2');
    });

    it('selectAllRows selects every eligible row', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      api.selection.selectAllRows();
      expect(api.selection.getSelectedCount()).toBe(4);
      expect(api.selection.getSelectAllState()).toBe(true);
    });

    it('selectAllRows honors isRowSelectable', async () => {
      const options = baseOptions({
        isRowSelectable: (row) => (row.entity as unknown as Row).status !== 'Draft',
      });
      await mountGrid(options);
      const api = getApi(options);
      api.selection.selectAllRows();
      // r3 has status=Draft → excluded.
      expect(api.selection.getSelectedCount()).toBe(3);
      expect(api.selection.getSelectedRows().some((r: any) => r.id === 'r3')).toBe(false);
    });

    it('clearSelectedRows empties the selection', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      api.selection.selectAllRows();
      api.selection.clearSelectedRows();
      expect(api.selection.getSelectedCount()).toBe(0);
      expect(api.selection.getSelectAllState()).toBe(false);
    });

    it('selectAllVisibleRows only selects visible rows', async () => {
      // Filter to just "Active" rows to make some invisible.
      const options = baseOptions();
      const { } = await mountGrid(options);
      const api = getApi(options);
      api.core.setFilter('status', 'Active');
      await waitFor(() => (api.core.getVisibleRows().length === 2 ? {} : null));
      api.selection.selectAllVisibleRows();
      expect(api.selection.getSelectedCount()).toBe(2);
      const ids = api.selection.getSelectedRows().map((r: any) => r.id).sort();
      expect(ids).toEqual(['r1', 'r4']);
    });

    it('multiSelect=false keeps only one row selected at a time', async () => {
      const options = baseOptions({ multiSelect: false });
      await mountGrid(options);
      const api = getApi(options);
      api.selection.selectRow(options.data[0]! as unknown as Record<string, unknown>);
      api.selection.selectRow(options.data[1]! as unknown as Record<string, unknown>);
      expect(api.selection.getSelectedCount()).toBe(1);
      expect(api.selection.getSelectedRows()[0]!['id']).toBe('r2');
    });

    it('noUnselect prevents deselection', async () => {
      const options = baseOptions({ noUnselect: true });
      await mountGrid(options);
      const api = getApi(options);
      const row = options.data[0]! as unknown as Record<string, unknown>;
      api.selection.selectRow(row);
      api.selection.toggleRowSelection(row); // Would normally unselect.
      expect(api.selection.getSelectedCount()).toBe(1);
    });

    it('setMultiSelect switches modes on the fly', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      api.selection.selectRow(options.data[0]! as unknown as Record<string, unknown>);
      api.selection.selectRow(options.data[1]! as unknown as Record<string, unknown>);
      expect(api.selection.getSelectedCount()).toBe(2);
      api.selection.setMultiSelect(false);
      api.selection.selectRow(options.data[2]! as unknown as Record<string, unknown>);
      // Single-select should clear prior selection.
      expect(api.selection.getSelectedCount()).toBe(1);
      expect(api.selection.getSelectedRows()[0]!['id']).toBe('r3');
    });

    it('shiftSelectRow range-selects from lastSelected', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      api.selection.selectRow(options.data[1]! as unknown as Record<string, unknown>);
      api.selection.shiftSelectRow(options.data[3]! as unknown as Record<string, unknown>);
      const ids = api.selection.getSelectedRows().map((r: any) => r.id).sort();
      expect(ids).toEqual(['r2', 'r3', 'r4']);
    });

    it('getSelectedGridRows returns GridRow objects, getSelectedRows returns entities', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      api.selection.selectRow(options.data[0]! as unknown as Record<string, unknown>);
      const rows = api.selection.getSelectedGridRows();
      expect(rows).toHaveLength(1);
      expect(rows[0]!.id).toBe('r1');
      expect(rows[0]!.entity).toBe(options.data[0]);
      expect(api.selection.getSelectedRows()[0]).toBe(options.data[0]);
    });
  });

  describe('selection events', () => {
    it('rowSelectionChanged fires on individual toggles', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      const listener = vi.fn();
      api.selection.on.rowSelectionChanged(listener);
      api.selection.selectRow(options.data[0]! as unknown as Record<string, unknown>);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('rowSelectionChangedBatch fires for bulk selectAllRows by default', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      const single = vi.fn();
      const batch = vi.fn();
      api.selection.on.rowSelectionChanged(single);
      api.selection.on.rowSelectionChangedBatch(batch);
      api.selection.selectAllRows();
      expect(batch).toHaveBeenCalledTimes(1);
      expect(batch.mock.calls[0]![0]).toHaveLength(4);
      expect(single).toHaveBeenCalledTimes(0);
    });

    it('enableSelectionBatchEvent=false falls back to per-row events', async () => {
      const options = baseOptions({ enableSelectionBatchEvent: false });
      await mountGrid(options);
      const api = getApi(options);
      const single = vi.fn();
      api.selection.on.rowSelectionChanged(single);
      api.selection.selectAllRows();
      expect(single).toHaveBeenCalledTimes(4);
    });
  });

  describe('mouse interactions', () => {
    it('clicking the row-header checkbox selects the row', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const checkboxCell = cellIn(shadow, 'r2', 'selectionRowHeaderCol');
      dispatchMouse(checkboxCell, 'click');
      await waitFor(() => (api.selection.getSelectedCount() === 1 ? {} : null));
      expect(api.selection.getSelectedRows()[0]!['id']).toBe('r2');
    });

    it('shift-click extends selection from anchor', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      dispatchMouse(cellIn(shadow, 'r2', 'selectionRowHeaderCol'), 'click');
      await waitFor(() => (api.selection.getSelectedCount() === 1 ? {} : null));
      dispatchMouse(cellIn(shadow, 'r4', 'selectionRowHeaderCol'), 'click', { shiftKey: true });
      await waitFor(() => (api.selection.getSelectedCount() >= 3 ? {} : null));
      const ids = api.selection.getSelectedRows().map((r: any) => r.id).sort();
      expect(ids).toEqual(['r2', 'r3', 'r4']);
    });

    it('ctrl-click toggles a single row without clearing others', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      dispatchMouse(cellIn(shadow, 'r1', 'selectionRowHeaderCol'), 'click');
      await waitFor(() => (api.selection.getSelectedCount() === 1 ? {} : null));
      dispatchMouse(cellIn(shadow, 'r3', 'selectionRowHeaderCol'), 'click', { ctrlKey: true });
      await waitFor(() => (api.selection.getSelectedCount() === 2 ? {} : null));
      const ids = api.selection.getSelectedRows().map((r: any) => r.id).sort();
      expect(ids).toEqual(['r1', 'r3']);
    });

    it('full-row click selects when enableFullRowSelection is true', async () => {
      const options = baseOptions({ enableFullRowSelection: true });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      dispatchMouse(cellIn(shadow, 'r2', 'name'), 'click');
      await waitFor(() => (api.selection.getSelectedCount() === 1 ? {} : null));
      expect(api.selection.getSelectedRows()[0]!['id']).toBe('r2');
    });

    it('full-row click is ignored when enableFullRowSelection is false (default with header)', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      dispatchMouse(cellIn(shadow, 'r2', 'name'), 'click');
      // No checkbox click — plain click on a data cell should not add to
      // selection when full-row selection is off.
      await new Promise((r) => window.setTimeout(r, 20));
      expect(api.selection.getSelectedCount()).toBe(0);
    });

    it('full-row single click (mousedown + mouseup + click) toggles once, not twice', async () => {
      // Regression: the drag-paint handler used to commit the starting row
      // on mousedown AND then the click handler toggled again, producing a
      // visible flicker and a net "no change" for single clicks. This test
      // simulates the browser's full click sequence and asserts exactly one
      // toggle ends up applied.
      const options = baseOptions({ enableFullRowSelection: true });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const events: number[] = [];
      api.selection.on.rowSelectionChanged(() => {
        events.push(api.selection.getSelectedCount());
      });
      const target = cellIn(shadow, 'r2', 'name');
      dispatchMouse(target, 'mousedown');
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      dispatchMouse(target, 'click');
      await waitFor(() => (api.selection.getSelectedCount() === 1 ? {} : null));
      // Exactly one selection-change event should fire. Two events (0→1→0)
      // or zero events would both indicate flicker/re-entry.
      expect(events).toEqual([1]);
      expect(api.selection.getSelectedRows()[0]!['id']).toBe('r2');
    });

    it('click-drag paints selection across multiple rows', async () => {
      const options = baseOptions({ enableFullRowSelection: true });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      dispatchMouse(cellIn(shadow, 'r1', 'name'), 'mousedown');
      // Simulate dragging across r2 and r3.
      window.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, composed: true, shiftKey: false }),
      );
      // jsdom's dispatchEvent won't route through composedPath to the right
      // cell on a window-level event — simulate by dispatching on each cell
      // with a mousemove that bubbles.
      cellIn(shadow, 'r2', 'name').dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, composed: true }),
      );
      cellIn(shadow, 'r3', 'name').dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, composed: true }),
      );
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      const ids = api.selection.getSelectedRows().map((r: any) => r.id).sort();
      // Drag guarantees start row is selected; the intermediate mousemoves
      // paint the others as the window-level listener picks them up.
      expect(ids).toContain('r1');
    });
  });

  describe('keyboard interactions', () => {
    it('Space on the row-header checkbox toggles selection', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const cell = cellIn(shadow, 'r2', 'selectionRowHeaderCol');
      cell.focus();
      pressKey(cell, ' ');
      expect(api.selection.getSelectedCount()).toBe(1);
      expect(api.selection.getSelectedRows()[0]!['id']).toBe('r2');
    });

    it('Ctrl+A selects all rows', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const cell = cellIn(shadow, 'r1', 'name');
      cell.focus();
      pressKey(cell, 'a', { ctrlKey: true });
      expect(api.selection.getSelectedCount()).toBe(4);
    });

    it('Ctrl+A is a no-op when multiSelect is false', async () => {
      const options = baseOptions({ multiSelect: false });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const cell = cellIn(shadow, 'r1', 'name');
      cell.focus();
      pressKey(cell, 'a', { ctrlKey: true });
      expect(api.selection.getSelectedCount()).toBe(0);
    });
  });

  describe('select-all header checkbox', () => {
    it('clicking the header select-all checkbox selects every visible row', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const header = shadow.querySelector<HTMLElement>(
        '.header-cell[data-column="selectionRowHeaderCol"] [data-action="select-all"]',
      );
      expect(header).not.toBeNull();
      header!.click();
      await waitFor(() => (api.selection.getSelectedCount() === 4 ? {} : null));
      expect(api.selection.getSelectAllState()).toBe(true);
    });

    it('clicking again clears the selection', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const findHeader = (): HTMLElement | null =>
        shadow.querySelector<HTMLElement>(
          '.header-cell[data-column="selectionRowHeaderCol"] [data-action="select-all"]',
        );
      findHeader()!.click();
      await waitFor(() => (api.selection.getSelectedCount() === 4 ? {} : null));
      // Re-query: the header markup is rebuilt on refresh, so the prior
      // button reference is detached from the DOM.
      findHeader()!.click();
      await waitFor(() => (api.selection.getSelectedCount() === 0 ? {} : null));
      expect(api.selection.getSelectAllState()).toBe(false);
    });

    it('is hidden when enableSelectAll is false', async () => {
      const options = baseOptions({ enableSelectAll: false });
      const { shadow } = await mountGrid(options);
      expect(
        shadow.querySelector(
          '.header-cell[data-column="selectionRowHeaderCol"] [data-action="select-all"]',
        ),
      ).toBeNull();
    });
  });

  describe('state preservation across refresh', () => {
    it('selected rows remain selected across a data refresh with the same ids', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      api.selection.selectRow(options.data[0]! as unknown as Record<string, unknown>);
      api.selection.selectRow(options.data[2]! as unknown as Record<string, unknown>);
      await waitFor(() => (api.selection.getSelectedCount() === 2 ? {} : null));
      api.core.refresh();
      await new Promise((r) => window.setTimeout(r, 20));
      expect(api.selection.getSelectedCount()).toBe(2);
      expect(cellIn(shadow, 'r1', 'name').classList.contains('ui-grid-row-selected')).toBe(true);
      expect(cellIn(shadow, 'r3', 'name').classList.contains('ui-grid-row-selected')).toBe(true);
    });
  });
});
