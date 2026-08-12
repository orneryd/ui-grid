import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * Keyboard navigation tests for the vanilla grid element.
 *
 * These tests pin the behaviour that was historically missing after the
 * refactor: arrow/Tab navigation between body cells, commit/cancel flow from
 * the cell editor, and focus tracking across those transitions. Regressions
 * here would mean the user can no longer navigate with the keyboard.
 */

async function waitFor<T>(resolve: () => T | null | undefined, timeoutMs = 5000): Promise<T> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = resolve();
    if (value) return value;
    await new Promise((r) => window.setTimeout(r, 10));
  }
  throw new Error('Timed out waiting for expected element state');
}

const TAG = 'ui-grid-element-vanilla-keyboard-test';

function sampleOptions(): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const options: GridOptions = {
    id: 'vanilla-keyboard-grid',
    // Selection defaults to on in the old grid; nav tests assert against
    // the two declared columns, so we explicitly opt out here.
    enableRowSelection: false,
    enableCellEdit: true,
    data: [
      { id: 'r1', name: 'Alpha', status: 'Active' },
      { id: 'r2', name: 'Beta', status: 'Pilot' },
      { id: 'r3', name: 'Gamma', status: 'Draft' },
    ],
    columnDefs: [
      { name: 'name', displayName: 'Name' },
      { name: 'status', displayName: 'Status' },
    ],
    rowIdentity: (entity) => String((entity as { id: string }).id),
    onRegisterApi: (api) => {
      capturedApi = api as UiGridApi;
    },
  };
  Object.defineProperty(options, '__api', { enumerable: false, get: () => capturedApi });
  return options;
}

function getApi(options: GridOptions): UiGridApi | undefined {
  return (options as unknown as { __api: UiGridApi | undefined }).__api;
}

function cellIn(root: ShadowRoot, rowId: string, columnName: string): HTMLElement {
  const selector = `.body-cell[data-row="${rowId}"][data-column="${columnName}"]`;
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Expected cell ${rowId}/${columnName}; DOM missing it`);
  return el;
}

function pressKey(
  el: HTMLElement,
  key: string,
  opts: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {},
): void {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    composed: true,
    ...opts,
  });
  el.dispatchEvent(event);
}

/** Options where every column is editable. Used to exercise the "edit
 * follows navigation" behaviour: Tab/Enter while editing should land in
 * edit mode on the next editable cell; arrow nav outside edit mode must
 * NOT auto-open the editor. */
function editableOptions(): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const options: GridOptions = {
    id: 'vanilla-keyboard-editable-grid',
    enableCellEdit: true,
    enableRowSelection: false,
    data: [
      { id: 'r1', name: 'Alpha', status: 'Active' },
      { id: 'r2', name: 'Beta', status: 'Pilot' },
    ],
    columnDefs: [
      { name: 'name', displayName: 'Name' },
      { name: 'status', displayName: 'Status' },
    ],
    rowIdentity: (entity) => String((entity as { id: string }).id),
    onRegisterApi: (api) => {
      capturedApi = api as UiGridApi;
    },
  };
  Object.defineProperty(options, '__api', { enumerable: false, get: () => capturedApi });
  return options;
}

async function mountEditableGrid(): Promise<{
  grid: VanillaUiGridElement;
  shadow: ShadowRoot;
  options: GridOptions;
}> {
  const target = document.getElementById('app')!;
  const options = editableOptions();
  const grid = await mountVanillaUiGrid(target, options, undefined, TAG);
  const shadow = await waitFor(() => grid.shadowRoot);
  await waitFor(() => shadow.querySelector('.body-cell[data-row="r1"][data-column="name"]'));
  return { grid, shadow, options };
}

/** Options with grouping enabled and a `status` groupBy. The data has two
 * status buckets so a group header sits between row-2 (Pilot) and row-3
 * (Draft) in visual order — Arrow navigation must skip the header. */
function groupedOptions(): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const options: GridOptions = {
    id: 'vanilla-keyboard-grouped-grid',
    enableGrouping: true,
    enableRowSelection: false,
    grouping: { groupBy: ['status'] },
    data: [
      { id: 'r1', name: 'Alpha', status: 'Active' },
      { id: 'r2', name: 'Beta', status: 'Active' },
      { id: 'r3', name: 'Gamma', status: 'Pilot' },
      { id: 'r4', name: 'Delta', status: 'Pilot' },
    ],
    columnDefs: [
      { name: 'name', displayName: 'Name' },
      { name: 'status', displayName: 'Status' },
    ],
    rowIdentity: (entity) => String((entity as { id: string }).id),
    onRegisterApi: (api) => {
      capturedApi = api as UiGridApi;
    },
  };
  Object.defineProperty(options, '__api', { enumerable: false, get: () => capturedApi });
  return options;
}

async function mountGroupedGrid(): Promise<{
  grid: VanillaUiGridElement;
  shadow: ShadowRoot;
  options: GridOptions;
}> {
  const target = document.getElementById('app')!;
  const options = groupedOptions();
  const grid = await mountVanillaUiGrid(target, options, undefined, TAG);
  const shadow = await waitFor(() => grid.shadowRoot);
  await waitFor(() => shadow.querySelector('.body-cell[data-row="r2"][data-column="name"]'));
  return { grid, shadow, options };
}

async function mountGrid(): Promise<{
  grid: VanillaUiGridElement;
  shadow: ShadowRoot;
  options: GridOptions;
}> {
  const target = document.getElementById('app')!;
  const options = sampleOptions();
  const grid = await mountVanillaUiGrid(target, options, undefined, TAG);
  const shadow = await waitFor(() => grid.shadowRoot);
  await waitFor(() => shadow.querySelector('.body-cell[data-row="r1"][data-column="name"]'));
  return { grid, shadow, options };
}

describe('vanilla grid keyboard navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('clicking a body cell focuses it', async () => {
    const { shadow } = await mountGrid();
    const target = cellIn(shadow, 'r2', 'name');
    target.click();
    expect(shadow.activeElement).toBe(target);
  });

  it('ArrowDown after click calls preventDefault (scroll would be suppressed)', async () => {
    // Pins the fix for the 100K-row demo bug: after click, pressing ArrowDown
    // MUST preventDefault the keydown. Otherwise the scroll container
    // (.grid-table) handles the arrow and scrolls the viewport instead of
    // moving the selection. If this assertion fails, the demo will scroll.
    const { shadow } = await mountGrid();
    const cell = cellIn(shadow, 'r1', 'name');
    cell.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
    );
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    (shadow.activeElement as HTMLElement).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r2', 'name'));
  });

  it('clicking a descendant of the body cell still focuses the cell', async () => {
    // Real browsers deliver click events on the deepest DOM node under the
    // pointer (often .cell-value inside .cell-content inside .cell-shell
    // inside the body-cell). jsdom's cell.click() skips that — we simulate
    // the descendant-target path explicitly so regressions are caught.
    const { shadow } = await mountGrid();
    const cell = cellIn(shadow, 'r2', 'name');
    const descendant = cell.querySelector<HTMLElement>('.cell-content')
      ?? cell.querySelector<HTMLElement>('.cell-shell')
      ?? cell;
    descendant.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
    );
    expect(shadow.activeElement).toBe(cell);
  });

  it('after clicking (no explicit focus()), ArrowRight moves focus to the next column', async () => {
    // Regression: the 100K-row demo showed arrows scrolling instead of
    // advancing focus. The bug is only reproducible if we rely on the click
    // handler to focus the cell — NOT by calling .focus() directly like the
    // other tests. Click (via descendant, like a real browser would deliver)
    // then press arrow. Source/destination must both be queried against
    // shadow.activeElement, not focused manually.
    const { shadow } = await mountGrid();
    const start = cellIn(shadow, 'r1', 'name');
    const descendant = start.querySelector<HTMLElement>('.cell-content') ?? start;
    descendant.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
    );
    expect(shadow.activeElement).toBe(start);
    pressKey(shadow.activeElement as HTMLElement, 'ArrowRight');
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r1', 'status'));
  });

  it('ArrowRight moves the selection indicator (cell-focused class) to the next cell', async () => {
    const { shadow } = await mountGrid();
    const start = cellIn(shadow, 'r1', 'name');
    start.click();
    expect(start.classList.contains('cell-focused')).toBe(true);
    expect(start.getAttribute('data-focused')).toBe('true');
    pressKey(shadow.activeElement as HTMLElement, 'ArrowRight');
    const next = cellIn(shadow, 'r1', 'status');
    expect(next.classList.contains('cell-focused')).toBe(true);
    expect(next.getAttribute('data-focused')).toBe('true');
    expect(start.classList.contains('cell-focused')).toBe(false);
    expect(start.getAttribute('data-focused')).toBe('false');
  });

  it('ArrowDown moves the selection indicator to the row below', async () => {
    const { shadow } = await mountGrid();
    const start = cellIn(shadow, 'r1', 'name');
    start.click();
    pressKey(shadow.activeElement as HTMLElement, 'ArrowDown');
    const next = cellIn(shadow, 'r2', 'name');
    expect(next.classList.contains('cell-focused')).toBe(true);
    expect(start.classList.contains('cell-focused')).toBe(false);
    expect(shadow.activeElement).toBe(next);
  });

  it('clicking a cell updates the selection indicator', async () => {
    const { shadow } = await mountGrid();
    const first = cellIn(shadow, 'r1', 'name');
    first.click();
    expect(first.classList.contains('cell-focused')).toBe(true);
    const second = cellIn(shadow, 'r3', 'status');
    second.click();
    expect(second.classList.contains('cell-focused')).toBe(true);
    expect(first.classList.contains('cell-focused')).toBe(false);
  });

  it('ArrowRight moves focus to the next column', async () => {
    const { shadow } = await mountGrid();
    const start = cellIn(shadow, 'r1', 'name');
    start.focus();
    pressKey(start, 'ArrowRight');
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r1', 'status'));
  });

  it('ArrowLeft wraps at the start of a row to the end of the previous row', async () => {
    const { shadow } = await mountGrid();
    const start = cellIn(shadow, 'r2', 'name');
    start.focus();
    pressKey(start, 'ArrowLeft');
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r1', 'status'));
  });

  it('ArrowDown and ArrowUp move between rows in the same column', async () => {
    const { shadow } = await mountGrid();
    const start = cellIn(shadow, 'r1', 'status');
    start.focus();
    pressKey(start, 'ArrowDown');
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r2', 'status'));
    pressKey(shadow.activeElement as HTMLElement, 'ArrowUp');
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r1', 'status'));
  });

  it('Tab and Shift+Tab behave like ArrowRight / ArrowLeft', async () => {
    const { shadow } = await mountGrid();
    const start = cellIn(shadow, 'r1', 'name');
    start.focus();
    pressKey(start, 'Tab');
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r1', 'status'));
    pressKey(shadow.activeElement as HTMLElement, 'Tab', { shiftKey: true });
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r1', 'name'));
  });

  it('Home / End jump within a row, Ctrl+Home / Ctrl+End jump to grid edges', async () => {
    const { shadow } = await mountGrid();
    const start = cellIn(shadow, 'r2', 'status');
    start.focus();
    pressKey(start, 'Home');
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r2', 'name'));
    pressKey(shadow.activeElement as HTMLElement, 'End');
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r2', 'status'));
    pressKey(shadow.activeElement as HTMLElement, 'Home', { ctrlKey: true });
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r1', 'status'));
    pressKey(shadow.activeElement as HTMLElement, 'End', { ctrlKey: true });
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r3', 'status'));
  });

  it('Arrow at a grid edge is a no-op (no throw, focus unchanged)', async () => {
    const { shadow } = await mountGrid();
    const topLeft = cellIn(shadow, 'r1', 'name');
    topLeft.focus();
    pressKey(topLeft, 'ArrowUp');
    expect(shadow.activeElement).toBe(topLeft);
    pressKey(topLeft, 'ArrowLeft');
    expect(shadow.activeElement).toBe(topLeft);
  });

  it('Enter on a cell enters edit mode for that cell', async () => {
    const { shadow } = await mountGrid();
    const cell = cellIn(shadow, 'r2', 'name');
    cell.focus();
    pressKey(cell, 'Enter');
    await waitFor(() => shadow.querySelector(`ui-grid-cell-editor[data-row="r2"][data-column="name"]`));
    const editorInput = shadow.querySelector<HTMLInputElement>(
      `ui-grid-cell-editor[data-row="r2"][data-column="name"] input`,
    );
    expect(editorInput).not.toBeNull();
  });

  it('F2 enters edit mode identical to Enter', async () => {
    const { shadow } = await mountGrid();
    const cell = cellIn(shadow, 'r3', 'status');
    cell.focus();
    pressKey(cell, 'F2');
    await waitFor(() =>
      shadow.querySelector('ui-grid-cell-editor[data-row="r3"][data-column="status"]'),
    );
    expect(
      shadow.querySelector('ui-grid-cell-editor[data-row="r3"][data-column="status"]'),
    ).not.toBeNull();
  });

  it('printable key on a cell enters edit mode and seeds the typed character', async () => {
    const { shadow } = await mountGrid();
    const cell = cellIn(shadow, 'r1', 'name');
    cell.focus();
    pressKey(cell, 'x');
    const editorInput = await waitFor(() =>
      shadow.querySelector<HTMLInputElement>(
        'ui-grid-cell-editor[data-row="r1"][data-column="name"] input',
      ),
    );
    // attributeChangedCallback seeds the value; dispatch a microtask to let it flush.
    await new Promise((r) => window.setTimeout(r, 0));
    expect(editorInput.value).toBe('x');
  });

  it('Escape inside the editor cancels edit and returns focus to the cell', async () => {
    const { shadow } = await mountGrid();
    const cell = cellIn(shadow, 'r2', 'name');
    cell.focus();
    pressKey(cell, 'Enter');
    const editorInput = await waitFor(() =>
      shadow.querySelector<HTMLInputElement>(
        'ui-grid-cell-editor[data-row="r2"][data-column="name"] input',
      ),
    );
    editorInput.focus();
    pressKey(editorInput, 'Escape');
    await waitFor(() => {
      const stillEditing = shadow.querySelector(
        'ui-grid-cell-editor[data-row="r2"][data-column="name"]',
      );
      return stillEditing === null ? {} : null;
    });
    expect(
      shadow.querySelector('ui-grid-cell-editor[data-row="r2"][data-column="name"]'),
    ).toBeNull();
    expect(shadow.activeElement).toBe(cellIn(shadow, 'r2', 'name'));
  });

  it('Enter inside the editor commits and moves focus down', async () => {
    const { shadow } = await mountGrid();
    const cell = cellIn(shadow, 'r1', 'name');
    cell.focus();
    pressKey(cell, 'Enter');
    const editorInput = await waitFor(() =>
      shadow.querySelector<HTMLInputElement>(
        'ui-grid-cell-editor[data-row="r1"][data-column="name"] input',
      ),
    );
    editorInput.focus();
    editorInput.value = 'Alpha Prime';
    editorInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    pressKey(editorInput, 'Enter');
    // resumeEdit re-opens the editor on the next editable cell — focus
    // lands on the editor input, not the cell shell.
    const nextEditor = await waitFor(() =>
      shadow.querySelector<HTMLInputElement>(
        'ui-grid-cell-editor[data-row="r2"][data-column="name"] input',
      ),
    );
    expect(shadow.activeElement).toBe(nextEditor);
    expect(cellIn(shadow, 'r1', 'name').textContent).toContain('Alpha Prime');
  });

  it('Tab inside the editor does not re-enter commit via blur (no DOM crash)', async () => {
    // Regression: `commitCellEdit` rebuilds the cell markup, which removes
    // the focused <input>, firing blur on it. The blur handler also calls
    // commitCellEdit — without the `editingCell === null` guard, the nested
    // commit tries to mutate DOM the outer render hasn't unwound yet and
    // throws "The node to be removed is no longer a child of this node".
    const { shadow } = await mountGrid();
    const cell = cellIn(shadow, 'r1', 'name');
    cell.focus();
    pressKey(cell, 'Enter');
    const editorInput = await waitFor(() =>
      shadow.querySelector<HTMLInputElement>(
        'ui-grid-cell-editor[data-row="r1"][data-column="name"] input',
      ),
    );
    editorInput.focus();
    editorInput.value = 'edited';
    editorInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    // Pressing Tab dispatches keydown; the commit path removes the editor,
    // which fires blur synchronously. Both handlers call commitCellEdit.
    expect(() => pressKey(editorInput, 'Tab')).not.toThrow();
    await waitFor(() =>
      shadow.querySelector('ui-grid-cell-editor[data-row="r1"][data-column="status"] input'),
    );
    expect(cellIn(shadow, 'r1', 'name').textContent).toContain('edited');
  });

  it('Tab inside the editor commits and moves focus right', async () => {
    const { shadow } = await mountGrid();
    const cell = cellIn(shadow, 'r1', 'name');
    cell.focus();
    pressKey(cell, 'Enter');
    const editorInput = await waitFor(() =>
      shadow.querySelector<HTMLInputElement>(
        'ui-grid-cell-editor[data-row="r1"][data-column="name"] input',
      ),
    );
    editorInput.focus();
    editorInput.value = 'Alpha2';
    editorInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    pressKey(editorInput, 'Tab');
    // resumeEdit lands on the next editable cell's editor input.
    const nextEditor = await waitFor(() =>
      shadow.querySelector<HTMLInputElement>(
        'ui-grid-cell-editor[data-row="r1"][data-column="status"] input',
      ),
    );
    expect(shadow.activeElement).toBe(nextEditor);
    expect(cellIn(shadow, 'r1', 'name').textContent).toContain('Alpha2');
  });

  describe('with grouping', () => {
    it('ArrowDown skips group headers to the next data row in display order', async () => {
      // Display order: Active group header, r1, r2, Pilot group header, r3, r4.
      // ArrowDown from r2 must land on r3 (skipping the Pilot header), NOT
      // on whatever pipeline.visibleRows happens to have at index+1.
      const { shadow } = await mountGroupedGrid();
      const start = cellIn(shadow, 'r2', 'name');
      start.click();
      pressKey(shadow.activeElement as HTMLElement, 'ArrowDown');
      expect(shadow.activeElement).toBe(cellIn(shadow, 'r3', 'name'));
      expect(cellIn(shadow, 'r3', 'name').classList.contains('cell-focused')).toBe(true);
    });

    it('ArrowUp across a group boundary lands on the last row of the prior group', async () => {
      const { shadow } = await mountGroupedGrid();
      const start = cellIn(shadow, 'r3', 'status');
      start.click();
      pressKey(shadow.activeElement as HTMLElement, 'ArrowUp');
      expect(shadow.activeElement).toBe(cellIn(shadow, 'r2', 'status'));
    });

    it('ArrowRight at end-of-row wraps to first column of the next data row (not a group)', async () => {
      const { shadow } = await mountGroupedGrid();
      const start = cellIn(shadow, 'r2', 'status');
      start.click();
      pressKey(shadow.activeElement as HTMLElement, 'ArrowRight');
      expect(shadow.activeElement).toBe(cellIn(shadow, 'r3', 'name'));
    });
  });

  describe('edit mode follows navigation only when already editing', () => {
    it('Tab inside the editor opens the editor on the next editable cell', async () => {
      const { shadow } = await mountEditableGrid();
      const cell = cellIn(shadow, 'r1', 'name');
      cell.click();
      pressKey(cell, 'Enter');
      const editorInput = await waitFor(() =>
        shadow.querySelector<HTMLInputElement>(
          'ui-grid-cell-editor[data-row="r1"][data-column="name"] input',
        ),
      );
      editorInput.focus();
      pressKey(editorInput, 'Tab');
      // After Tab, the status column editor should mount automatically
      // because we were editing and the destination is editable.
      await waitFor(() =>
        shadow.querySelector('ui-grid-cell-editor[data-row="r1"][data-column="status"] input'),
      );
      expect(
        shadow.querySelector('ui-grid-cell-editor[data-row="r1"][data-column="status"] input'),
      ).not.toBeNull();
    });

    it('Enter inside the editor opens the editor on the cell below', async () => {
      const { shadow } = await mountEditableGrid();
      const cell = cellIn(shadow, 'r1', 'name');
      cell.click();
      pressKey(cell, 'Enter');
      const editorInput = await waitFor(() =>
        shadow.querySelector<HTMLInputElement>(
          'ui-grid-cell-editor[data-row="r1"][data-column="name"] input',
        ),
      );
      editorInput.focus();
      pressKey(editorInput, 'Enter');
      await waitFor(() =>
        shadow.querySelector('ui-grid-cell-editor[data-row="r2"][data-column="name"] input'),
      );
      expect(
        shadow.querySelector('ui-grid-cell-editor[data-row="r2"][data-column="name"] input'),
      ).not.toBeNull();
    });

    it('ArrowRight on a non-editing cell does NOT open the editor on the next cell', async () => {
      const { shadow } = await mountEditableGrid();
      const cell = cellIn(shadow, 'r1', 'name');
      cell.click();
      pressKey(shadow.activeElement as HTMLElement, 'ArrowRight');
      expect(
        shadow.querySelector('ui-grid-cell-editor[data-row="r1"][data-column="status"]'),
      ).toBeNull();
      expect(shadow.activeElement).toBe(cellIn(shadow, 'r1', 'status'));
    });

    it('ArrowDown on a non-editing cell does NOT open the editor', async () => {
      const { shadow } = await mountEditableGrid();
      const cell = cellIn(shadow, 'r1', 'name');
      cell.click();
      pressKey(shadow.activeElement as HTMLElement, 'ArrowDown');
      expect(
        shadow.querySelector('ui-grid-cell-editor[data-row="r2"][data-column="name"]'),
      ).toBeNull();
      expect(shadow.activeElement).toBe(cellIn(shadow, 'r2', 'name'));
    });
  });
});
