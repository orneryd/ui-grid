import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * cellNav public API parity tests. Validates the `gridApi.cellNav` surface
 * ported from the old ui.grid.cellNav module — events (navigate,
 * viewPortKeyDown, viewPortKeyPress) and methods (scrollToFocus,
 * getFocusedCell, getCurrentSelection, rowColSelectIndex).
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

const TAG = 'ui-grid-element-vanilla-cellnav-test';

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
    id: 'cellnav-grid',
    data,
    columnDefs: [
      { name: 'name', displayName: 'Name' },
      { name: 'status', displayName: 'Status' },
    ],
    enableRowSelection: false,
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
  await waitFor(() => shadow.querySelector('.body-cell[data-row="r1"][data-column="name"]'));
  return { grid, shadow };
}

function cellIn(root: ShadowRoot, rowId: string, columnName: string): HTMLElement {
  const selector = `.body-cell[data-row="${rowId}"][data-column="${columnName}"]`;
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Cell ${rowId}/${columnName} not rendered`);
  return el;
}

function pressKey(el: HTMLElement, key: string, opts: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    composed: true,
    ctrlKey: !!opts.ctrlKey,
    shiftKey: !!opts.shiftKey,
    altKey: !!opts.altKey,
  });
  el.dispatchEvent(event);
  return event;
}

describe('vanilla grid cellNav public API', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  describe('getFocusedCell / navigate event', () => {
    it('returns null before any cell has been focused', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      expect(api.cellNav.getFocusedCell()).toBeNull();
    });

    it('click records the focused cell and fires navigate', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const listener = vi.fn();
      api.cellNav.on.navigate(listener);
      cellIn(shadow, 'r2', 'status').click();
      const focused = api.cellNav.getFocusedCell();
      expect(focused).not.toBeNull();
      expect(focused!.row.id).toBe('r2');
      expect(focused!.col.name).toBe('status');
      expect(listener).toHaveBeenCalledTimes(1);
      // navigate(newRowCol, oldRowCol) — second arg null since this was the
      // first focus.
      const [newRowCol, oldRowCol] = listener.mock.calls[0]!;
      expect(newRowCol.row.id).toBe('r2');
      expect(newRowCol.col.name).toBe('status');
      expect(oldRowCol).toBeNull();
    });

    it('arrow navigation updates getFocusedCell and fires navigate', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      cellIn(shadow, 'r1', 'name').click();
      const listener = vi.fn();
      api.cellNav.on.navigate(listener);
      pressKey(shadow.activeElement as HTMLElement, 'ArrowDown');
      expect(api.cellNav.getFocusedCell()!.row.id).toBe('r2');
      expect(listener).toHaveBeenCalledTimes(1);
      const [newRowCol, oldRowCol] = listener.mock.calls[0]!;
      expect(newRowCol.row.id).toBe('r2');
      expect(oldRowCol.row.id).toBe('r1');
    });
  });

  describe('scrollToFocus', () => {
    it('resolves and records focus on the target cell', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      await api.cellNav.scrollToFocus(
        options.data[2]! as unknown as Record<string, unknown>,
        options.columnDefs[1]!,
      );
      expect(api.cellNav.getFocusedCell()!.row.id).toBe('r3');
      expect(api.cellNav.getFocusedCell()!.col.name).toBe('status');
      // DOM focus follows.
      await waitFor(() =>
        shadow.activeElement === cellIn(shadow, 'r3', 'status') ? {} : null,
      );
    });

    it('scrollToFocus(null, null) clears focus', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      cellIn(shadow, 'r1', 'name').click();
      expect(api.cellNav.getFocusedCell()).not.toBeNull();
      await api.cellNav.scrollToFocus(null, null);
      expect(api.cellNav.getFocusedCell()).toBeNull();
    });
  });

  describe('getCurrentSelection / rowColSelectIndex', () => {
    it('tracks the single current focus cell by default', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      cellIn(shadow, 'r1', 'name').click();
      expect(api.cellNav.getCurrentSelection()).toHaveLength(1);
      cellIn(shadow, 'r2', 'status').click();
      // Default nav replaces focus — only one cell in the selection.
      const selection = api.cellNav.getCurrentSelection();
      expect(selection).toHaveLength(1);
      expect(selection[0]!.row.id).toBe('r2');
    });

    it('rowColSelectIndex returns -1 for cells not in the selection', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      cellIn(shadow, 'r1', 'name').click();
      const focused = api.cellNav.getFocusedCell()!;
      expect(api.cellNav.rowColSelectIndex(focused)).toBe(0);
      // A different cell is not in the selection.
      const other = {
        row: focused.row,
        col: options.columnDefs[1]!,
      };
      expect(api.cellNav.rowColSelectIndex(other)).toBe(-1);
    });
  });

  describe('viewPortKeyDown + keyDownOverrides', () => {
    it('is NOT raised when no override matches', async () => {
      const options = baseOptions();
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const listener = vi.fn();
      api.cellNav.on.viewPortKeyDown(listener);
      cellIn(shadow, 'r1', 'name').click();
      pressKey(shadow.activeElement as HTMLElement, 'ArrowDown');
      expect(listener).not.toHaveBeenCalled();
    });

    it('is raised when a keyDownOverride matches, skipping cellnav defaults', async () => {
      const options = baseOptions({
        keyDownOverrides: [{ key: 'ArrowDown' }],
      });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const listener = vi.fn();
      api.cellNav.on.viewPortKeyDown(listener);
      cellIn(shadow, 'r1', 'name').click();
      const before = api.cellNav.getFocusedCell()!;
      pressKey(shadow.activeElement as HTMLElement, 'ArrowDown');
      // Override swallows the key — focus should NOT move to r2.
      expect(api.cellNav.getFocusedCell()!.row.id).toBe(before.row.id);
      expect(listener).toHaveBeenCalledTimes(1);
      const [event, rowCol] = listener.mock.calls[0]!;
      expect(event).toBeInstanceOf(KeyboardEvent);
      expect(rowCol.row.id).toBe('r1');
    });

    it('matches keyDownOverride with modifier fields', async () => {
      const options = baseOptions({
        keyDownOverrides: [{ key: 'ArrowDown', shiftKey: true }],
      });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const listener = vi.fn();
      api.cellNav.on.viewPortKeyDown(listener);
      cellIn(shadow, 'r1', 'name').click();
      // Plain ArrowDown: doesn't match the override, navigates normally.
      pressKey(shadow.activeElement as HTMLElement, 'ArrowDown');
      expect(listener).not.toHaveBeenCalled();
      // Shift+ArrowDown: matches the override, raises event, no nav.
      const beforeId = api.cellNav.getFocusedCell()!.row.id;
      pressKey(shadow.activeElement as HTMLElement, 'ArrowDown', { shiftKey: true });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(api.cellNav.getFocusedCell()!.row.id).toBe(beforeId);
    });
  });
});
