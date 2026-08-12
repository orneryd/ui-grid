import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * Regression tests for two bugs reported around the cell selection / row
 * selection / expandable-rows interaction:
 *
 * 1. Click-on-projected-content focus retention — when a consumer projects
 *    a `<span slot="cell-…">` into a body cell (Angular ng-template, React
 *    portal, or vanilla `<template slot="cell-…">`), clicks on that
 *    light-DOM content used to fail to update `cell-focused` because the
 *    handler used `closest('.body-cell')` which doesn't cross shadow
 *    boundaries. The fix walks `composedPath()` instead.
 *
 * 2. Patch-path row-state cache — a per-row visual fingerprint short-
 *    circuits the patch loop when nothing relevant changed (selection /
 *    focus / expand / dirty / saving / error / validate / treeLevel /
 *    indent). This makes selection toggles in grids with both row
 *    selection and expandable rows enabled cheap. The tests below pin the
 *    correctness of the cache: selecting one row only touches that row's
 *    cells; toggling expand only touches that row; validate state changes
 *    flip the invalid class.
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

const TAG = 'ui-grid-element-vanilla-cell-state-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
}

function rows(): Row[] {
  return [
    { id: 'r1', name: 'Alpha', status: 'Active' },
    { id: 'r2', name: 'Beta', status: 'Pilot' },
    { id: 'r3', name: 'Gamma', status: 'Draft' },
  ];
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const options: GridOptions = {
    id: 'cell-state-grid',
    data: rows(),
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
  await waitFor(() => shadow.querySelector('.body-cell[data-row="r1"][data-column="name"]'));
  return { grid, shadow };
}

function cellIn(root: ShadowRoot, rowId: string, columnName: string): HTMLElement {
  const selector = `.body-cell[data-row="${rowId}"][data-column="${columnName}"]`;
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Cell ${rowId}/${columnName} not rendered`);
  return el;
}

function dispatchClick(el: HTMLElement): MouseEvent {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    composed: true,
    button: 0,
  });
  el.dispatchEvent(event);
  return event;
}

describe('cell selection state retention', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });
  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  it('moves the cell-focused class from the previous cell to the newly clicked cell', async () => {
    const { shadow } = await mountGrid(baseOptions({ enableRowSelection: false }));

    const a = cellIn(shadow, 'r1', 'name');
    const b = cellIn(shadow, 'r2', 'status');

    dispatchClick(a);
    expect(a.classList.contains('cell-focused')).toBe(true);
    expect(a.getAttribute('data-focused')).toBe('true');

    dispatchClick(b);
    expect(b.classList.contains('cell-focused')).toBe(true);
    expect(b.getAttribute('data-focused')).toBe('true');
    // Critical: the previously focused cell must lose the class, otherwise
    // both cells appear "selected" simultaneously.
    expect(a.classList.contains('cell-focused')).toBe(false);
    expect(a.getAttribute('data-focused')).toBe('false');
  });

  it('clicks on a deeply nested element inside a body cell focus the host body cell (composedPath traversal)', async () => {
    // Sanity-check: the click handler walks composedPath() instead of
    // closest('.body-cell'), so any descendant click — including child
    // elements far below the body-cell — still resolves to the host.
    // This is the same code path that handles framework-projected
    // light-DOM content (Angular ng-template, React render props), where
    // the deepest target sits OUTSIDE the body-cell's DOM ancestor chain.
    const { shadow } = await mountGrid(baseOptions({ enableRowSelection: false }));

    const cell = cellIn(shadow, 'r1', 'name');
    const cellValue = cell.querySelector<HTMLElement>('.cell-value');
    if (!cellValue) throw new Error('Expected default .cell-value span inside the cell');

    expect(cell.classList.contains('cell-focused')).toBe(false);
    dispatchClick(cellValue);
    expect(cell.classList.contains('cell-focused')).toBe(true);
    expect(cell.getAttribute('data-focused')).toBe('true');

    // Clicking inside another cell's deepest descendant clears the prior
    // cell's focus and applies it to the new one.
    const other = cellIn(shadow, 'r2', 'status');
    const otherValue = other.querySelector<HTMLElement>('.cell-value')!;
    dispatchClick(otherValue);
    expect(cell.classList.contains('cell-focused')).toBe(false);
    expect(cell.getAttribute('data-focused')).toBe('false');
    expect(other.classList.contains('cell-focused')).toBe(true);
  });

  it('renders a per-cell <slot> placeholder when a column is registered as framework-rendered', async () => {
    // Pins the bridge that the Angular wrapper depends on: declaring a
    // column as framework-rendered swaps its body cell from the default
    // string-interpolated content to a `<slot name="cell-…-rowId">`
    // placeholder. The wrapper then attaches a light-DOM node with a
    // matching `slot` attribute to project its rendered template.
    const { grid, shadow } = await mountGrid(baseOptions({ enableRowSelection: false }));

    grid.setFrameworkRenderedSlots({ cells: ['name'] });
    const slotInCell = await waitFor(() => {
      const cell = shadow.querySelector<HTMLElement>(
        '.body-cell[data-row="r1"][data-column="name"]',
      );
      return cell?.querySelector<HTMLSlotElement>('slot') ?? null;
    });

    // Slot name must include the row identity so the wrapper can match
    // each projected content node to its cell.
    const slotName = slotInCell.getAttribute('name');
    expect(slotName).toBe('cell-name-r1');
    // Each row gets its own unique slot name.
    const r2Slot = shadow.querySelector<HTMLSlotElement>(
      '.body-cell[data-row="r2"][data-column="name"] slot',
    );
    expect(r2Slot?.getAttribute('name')).toBe('cell-name-r2');
  });

  it('uses composedPath() to locate the body cell so framework-projected clicks resolve correctly in real browsers', async () => {
    // The Angular / React wrappers project light-DOM content (Angular
    // ng-template, React render props) into per-cell slots. In a real
    // browser the resulting click event has the shadow-DOM body-cell in
    // its composedPath. Test environments (jsdom + happy-dom alike)
    // don't simulate slot-driven event flow, so we directly validate the
    // helper logic by dispatching a click whose composedPath synthetically
    // includes the body cell — which is what a real browser produces.
    const { shadow } = await mountGrid(baseOptions({ enableRowSelection: false }));

    const targetCell = cellIn(shadow, 'r2', 'status');

    // Build a click event whose `composedPath` is overridden to include a
    // synthetic light-DOM node FOLLOWED by the real shadow-DOM body cell —
    // mirroring the path real browsers produce for a click on slotted
    // content. Without the composedPath fix the click handler would only
    // see the light-DOM portion (everything before the body-cell) and miss
    // the cell entirely.
    const projected = document.createElement('span');
    projected.className = 'projected-cell';
    const path: EventTarget[] = [
      projected,
      targetCell,
      shadow,
    ];
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      composed: true,
      button: 0,
    });
    Object.defineProperty(event, 'composedPath', {
      value: () => path,
      configurable: true,
    });
    Object.defineProperty(event, 'target', { value: projected, configurable: true });

    expect(targetCell.classList.contains('cell-focused')).toBe(false);
    shadow.dispatchEvent(event);
    expect(targetCell.classList.contains('cell-focused')).toBe(true);
    expect(targetCell.getAttribute('data-focused')).toBe('true');

    // A subsequent normal click on a different cell clears the focus.
    const other = cellIn(shadow, 'r3', 'name');
    dispatchClick(other);
    expect(targetCell.classList.contains('cell-focused')).toBe(false);
    expect(other.classList.contains('cell-focused')).toBe(true);
  });
});

describe('row selection + expand patch correctness', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });
  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  function selectionExpandOptions(): GridOptions {
    // Provide a no-op expandable template object so canGridExpandRows
    // returns true. The template body itself isn't exercised here.
    const template = { createEmbeddedView: () => undefined };
    return baseOptions({
      enableRowSelection: true,
      enableExpandable: true,
      expandableRowTemplate:
        template as unknown as GridOptions['expandableRowTemplate'],
    });
  }

  it('toggling selection on one row only flips the ui-grid-row-selected class on cells of that row', async () => {
    const options = selectionExpandOptions();
    const { shadow } = await mountGrid(options);

    const before = {
      r1Name: cellIn(shadow, 'r1', 'name').classList.contains('ui-grid-row-selected'),
      r2Name: cellIn(shadow, 'r2', 'name').classList.contains('ui-grid-row-selected'),
      r3Name: cellIn(shadow, 'r3', 'name').classList.contains('ui-grid-row-selected'),
    };
    expect(before).toEqual({ r1Name: false, r2Name: false, r3Name: false });

    getApi(options).selection.selectRow(options.data[1] as Record<string, unknown>);
    await waitFor(() =>
      cellIn(shadow, 'r2', 'name').classList.contains('ui-grid-row-selected') ? {} : null,
    );

    // Only r2's cells flipped — r1 / r3 remain unselected. Both cell
    // columns of r2 must be flagged so the row stripe shows across all
    // columns.
    expect(cellIn(shadow, 'r1', 'name').classList.contains('ui-grid-row-selected')).toBe(false);
    expect(cellIn(shadow, 'r1', 'status').classList.contains('ui-grid-row-selected')).toBe(false);
    expect(cellIn(shadow, 'r2', 'name').classList.contains('ui-grid-row-selected')).toBe(true);
    expect(cellIn(shadow, 'r2', 'status').classList.contains('ui-grid-row-selected')).toBe(true);
    expect(cellIn(shadow, 'r3', 'name').classList.contains('ui-grid-row-selected')).toBe(false);
    expect(cellIn(shadow, 'r3', 'status').classList.contains('ui-grid-row-selected')).toBe(false);

    // Unselect — class must drop.
    getApi(options).selection.unSelectRow(options.data[1] as Record<string, unknown>);
    await waitFor(() =>
      !cellIn(shadow, 'r2', 'name').classList.contains('ui-grid-row-selected') ? {} : null,
    );
    expect(cellIn(shadow, 'r2', 'name').classList.contains('ui-grid-row-selected')).toBe(false);
    expect(cellIn(shadow, 'r2', 'status').classList.contains('ui-grid-row-selected')).toBe(false);
  });

  it('toggling expansion on a row inserts/removes the expandable detail and updates that row only', async () => {
    const options = selectionExpandOptions();
    const { shadow } = await mountGrid(options);

    expect(shadow.querySelector('.expandable-row')).toBeNull();

    getApi(options).expandable.toggleRowExpansion(options.data[1] as Record<string, unknown>);
    await waitFor(() => shadow.querySelector('.expandable-row'));

    // Exactly one expandable-row appears after toggling a single row.
    expect(shadow.querySelectorAll('.expandable-row').length).toBe(1);

    // Other rows' selection / focus state must not have flipped.
    expect(cellIn(shadow, 'r1', 'name').classList.contains('ui-grid-row-selected')).toBe(false);
    expect(cellIn(shadow, 'r3', 'name').classList.contains('ui-grid-row-selected')).toBe(false);

    // Collapse — the detail row goes away.
    getApi(options).expandable.toggleRowExpansion(options.data[1] as Record<string, unknown>);
    await waitFor(() => (shadow.querySelector('.expandable-row') === null ? {} : null));
    expect(shadow.querySelector('.expandable-row')).toBeNull();
  });

  it('selection toggle preserves cell-focused on a different row', async () => {
    // The patch path's per-row fingerprint must NOT clobber the cell-focused
    // class on a row that wasn't touched by the selection toggle. This was
    // the actual bug — without proper "focused cell touches this row"
    // tracking, the focused cell could either lose its class on the next
    // refresh or keep it on a row it has moved off of.
    const options = selectionExpandOptions();
    const { shadow } = await mountGrid(options);

    const r1Cell = cellIn(shadow, 'r1', 'name');
    dispatchClick(r1Cell);
    expect(r1Cell.classList.contains('cell-focused')).toBe(true);

    // Selecting a different row triggers a full refresh; r1's cell-focused
    // class must survive because focusedCell didn't move.
    getApi(options).selection.selectRow(options.data[1] as Record<string, unknown>);
    await waitFor(() =>
      cellIn(shadow, 'r2', 'name').classList.contains('ui-grid-row-selected') ? {} : null,
    );
    expect(r1Cell.classList.contains('cell-focused')).toBe(true);
    expect(r1Cell.getAttribute('data-focused')).toBe('true');
  });

  it('expand toggle attaches to the first data column (not the selection checkbox column) and renders to the left of cell content', async () => {
    // Regression test for the visual bug where the expand toggle
    // rendered inside the selectionRowHeaderCol cell (column index 0).
    // isGridPrimaryColumn() now skips the synthetic selection column so
    // the toggle attaches to the actual first data column. The toggle
    // sits BEFORE `.cell-content` so the disclosure chevron hugs the
    // leading edge of the cell, matching the tree-toggle convention.
    const options = selectionExpandOptions();
    const { shadow } = await mountGrid(options);

    const selectionCellR1 = shadow.querySelector<HTMLElement>(
      '.body-cell[data-row="r1"][data-column="selectionRowHeaderCol"]',
    );
    expect(selectionCellR1).not.toBeNull();
    expect(selectionCellR1!.querySelector('.row-toggle-expand')).toBeNull();

    const nameCellR1 = cellIn(shadow, 'r1', 'name');
    const expandToggle = nameCellR1.querySelector<HTMLElement>('.row-toggle-expand');
    expect(expandToggle).not.toBeNull();

    // Inside the cell-shell the toggle must come BEFORE .cell-content
    // so it sits on the leading edge of the cell. DOCUMENT_POSITION_FOLLOWING
    // (0x04) means cellContent is AFTER expandToggle.
    const cellContent = nameCellR1.querySelector<HTMLElement>('.cell-content')!;
    const expectedFollowing = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(expandToggle!.compareDocumentPosition(cellContent) & expectedFollowing).toBe(
      expectedFollowing,
    );

    const selectionCheckbox = selectionCellR1!.querySelector<HTMLElement>(
      '.ui-grid-selection-row-header-buttons',
    );
    expect(selectionCheckbox).not.toBeNull();
  });

  it('validate state flip flows through the patch fast-path so the invalid class appears', async () => {
    // Validate writes `$$invalid<col>` directly on the row entity. The
    // entity reference doesn't change, so the row fingerprint cache must
    // sample those keys to detect the validity flip.
    const options = selectionExpandOptions();
    options.enableCellEdit = true;
    options.columnDefs = options.columnDefs.map((c) =>
      c.name === 'name'
        ? { ...c, enableCellEdit: true, validators: { required: true } }
        : c,
    );

    const { shadow } = await mountGrid(options);
    const api = getApi(options);

    // Drive r1 invalid. Refresh emits a new snapshot; the patch path's
    // fingerprint cache must detect the new invalid bit and flip the class.
    const col = options.columnDefs.find((c) => c.name === 'name')!;
    const target = options.data[0] as Record<string, unknown>;
    await api.validate.runValidators(target, col, '', 'Alpha');
    api.core.refresh();

    await waitFor(() =>
      shadow.querySelector('.body-cell[data-row="r1"][data-column="name"].ui-grid-cell-invalid'),
    );
    expect(
      cellIn(shadow, 'r1', 'name').classList.contains('ui-grid-cell-invalid'),
    ).toBe(true);
    // Other rows / columns must NOT be flagged.
    expect(
      cellIn(shadow, 'r1', 'status').classList.contains('ui-grid-cell-invalid'),
    ).toBe(false);
    expect(
      cellIn(shadow, 'r2', 'name').classList.contains('ui-grid-cell-invalid'),
    ).toBe(false);
  });
});
