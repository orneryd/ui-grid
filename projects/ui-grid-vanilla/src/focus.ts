/**
 * Keyboard navigation + focused-cell management.
 *
 * `moveGridFocus` is the central router: arrow keys, Tab/Enter inside an
 * edit session, Home/End, Ctrl+Home/End all funnel through it. It knows
 * how to walk the visible-row list (skipping group headers + expandable
 * rows), moves the `cell-focused` decoration, nudges virtualization to
 * bring off-screen targets into view, and DOM-focuses the target cell.
 *
 * Each function takes the element as its first argument and reads its
 * internal state (snapshot / controller / focusedCell / shadowRoot)
 * directly.
 */

import {
  findNextGridCell,
  type GridColumnDef,
  type GridRow,
} from '@ornery/ui-grid-core';
import type { UiGridStandaloneElement } from './ui-grid-standalone.element';
import { cssEscape } from './utils/cell-class';
import { isRowItem } from './utils/display-items';

export type GridMoveDirection =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'rowStart'
  | 'rowEnd'
  | 'top'
  | 'bottom';

/**
 * Commit the in-flight edit, then move keyboard focus relative to the
 * committed cell. Splits commit + focus across two paint frames: commit
 * runs synchronously (editor unmounts, cell re-renders with the new
 * value), then focus moves to the adjacent cell in a microtask so the
 * blur handler's re-entry guard doesn't race the focus attempt.
 *
 * If the source cell was being edited, the destination cell also enters
 * edit mode provided its column is editable — Tab/Enter inside an edit
 * session stays continuous. Arrow nav outside an edit session does NOT
 * auto-enter edit.
 */
export function commitAndMove(
  el: UiGridStandaloneElement,
  fromRowId: string | null,
  fromColumnName: string | null,
  direction: 'left' | 'right' | 'up' | 'down',
): void {
  if (!el.controller || !fromRowId || !fromColumnName) return;
  el.controller.commitCellEdit();
  queueMicrotask(() => {
    moveGridFocus(el, direction, fromRowId, fromColumnName, { resumeEdit: true });
  });
}

/**
 * Move focus relative to `(rowId, columnName)`. Uses the snapshot's
 * display-items order so ArrowDown skips over group headers + expandable
 * rows to whatever row comes visually next. `top` / `bottom` jump to the
 * first/last visible row; `rowStart` / `rowEnd` jump to the first/last
 * column of the current row.
 */
export function moveGridFocus(
  el: UiGridStandaloneElement,
  direction: GridMoveDirection,
  rowId: string | null,
  columnName: string | null,
  opts: { resumeEdit?: boolean } = {},
): void {
  if (!el.snapshot || !el.controller || !rowId || !columnName) return;

  const rows: GridRow[] = [];
  for (const item of el.snapshot.pipeline.displayItems) {
    if (isRowItem(item)) rows.push(item.row);
  }
  const columns = el.snapshot.visibleColumns;
  if (rows.length === 0 || columns.length === 0) return;

  let nextRowId = rowId;
  let nextColumnName = columnName;
  let nextRow: GridRow | undefined;
  let nextColumn: GridColumnDef | undefined;

  if (direction === 'top' || direction === 'bottom') {
    const row = rows[direction === 'top' ? 0 : rows.length - 1];
    if (!row) return;
    nextRow = row;
    nextColumn = columns.find((c) => c.name === columnName);
    nextRowId = row.id;
  } else if (direction === 'rowStart' || direction === 'rowEnd') {
    const col = columns[direction === 'rowStart' ? 0 : columns.length - 1];
    if (!col) return;
    nextColumn = col;
    nextRow = rows.find((r) => r.id === rowId);
    nextColumnName = col.name;
  } else {
    const next = findNextGridCell({ rows, columns, rowId, columnName, direction });
    if (!next) return;
    nextRow = next.row;
    nextColumn = next.column;
    nextRowId = next.row.id;
    nextColumnName = next.column.name;
  }

  const previous = el.focusedCell;
  el.focusedCell = { rowId: nextRowId, columnName: nextColumnName };
  // Move the `cell-focused` decoration immediately so the selection
  // indicator tracks keyboard nav even though we don't re-render the whole
  // grid on every arrow press — only the two affected cells are touched.
  applyFocusedCellClass(el, previous, el.focusedCell);
  scrollFocusedRowIntoView(el, nextRowId);
  // Raise cellNav.navigate for consumers that wired a listener (ports the
  // old gridApi.cellNav.on.navigate event).
  el.controller.setCellNavFocus(nextRowId, nextColumnName);

  // When moving out of an edit session (Tab/Enter in editor), auto-open
  // the next cell's editor if that cell is editable. Non-edit nav (plain
  // arrow keys on a non-editing cell) never opens the editor.
  if (
    opts.resumeEdit &&
    nextRow &&
    nextColumn &&
    el.controller.isCellEditable(nextRow, nextColumn)
  ) {
    el.controller.beginCellEdit(nextRowId, nextColumnName);
    return;
  }

  focusCellElement(el, nextRowId, nextColumnName);
}

/**
 * Ensure the row for `rowId` is inside the virtualization window before
 * focus moves there. When virtualization is on, a distant row isn't yet
 * rendered into the DOM — scroll to bring it in, let the virtual-body
 * rebuild on the next frame, then `focusCellElement`'s retry picks it up.
 */
export function scrollFocusedRowIntoView(el: UiGridStandaloneElement, rowId: string): void {
  const snapshot = el.snapshot;
  if (!snapshot) return;
  const index = snapshot.pipeline.displayItems.findIndex(
    (item) => 'row' in item && item.row && (item.row as { id: string }).id === rowId,
  );
  if (index < 0) return;
  const bodyViewport = el.shadowRoot?.querySelector<HTMLElement>('.grid-body-viewport');
  if (!bodyViewport) return;
  const rowTop = index * snapshot.rowSize;
  const rowBottom = rowTop + snapshot.rowSize;
  const viewportTop = bodyViewport.scrollTop;
  const viewportHeight = bodyViewport.clientHeight;
  if (rowTop < viewportTop) {
    bodyViewport.scrollTop = rowTop;
  } else if (rowBottom > viewportTop + viewportHeight) {
    bodyViewport.scrollTop = rowBottom - viewportHeight;
  }
}

/**
 * Toggle the `cell-focused` class between the previous and next cells.
 * The grid shell doesn't re-render on every arrow press — we hand-mutate
 * the two affected cells instead to avoid touching the rest of the DOM.
 */
export function applyFocusedCellClass(
  el: UiGridStandaloneElement,
  previous: { rowId: string; columnName: string } | null,
  next: { rowId: string; columnName: string } | null,
): void {
  const root = el.shadowRoot;
  if (!root) return;
  if (previous && (previous.rowId !== next?.rowId || previous.columnName !== next?.columnName)) {
    const prevEl = root.querySelector<HTMLElement>(
      `.body-cell[data-row="${cssEscape(previous.rowId)}"][data-column="${cssEscape(previous.columnName)}"]`,
    );
    if (prevEl) {
      prevEl.classList.remove('cell-focused');
      prevEl.setAttribute('data-focused', 'false');
    }
  }
  if (next) {
    const nextEl = root.querySelector<HTMLElement>(
      `.body-cell[data-row="${cssEscape(next.rowId)}"][data-column="${cssEscape(next.columnName)}"]`,
    );
    if (nextEl) {
      nextEl.classList.add('cell-focused');
      nextEl.setAttribute('data-focused', 'true');
    }
  }
}

/**
 * DOM-focus the body cell matching the given row/column. Retries across
 * two animation frames so a scroll-triggered virtual-body rebuild has
 * time to bring the target row into the DOM before we give up.
 */
export function focusCellElement(
  el: UiGridStandaloneElement,
  rowId: string | null,
  columnName: string | null,
): void {
  if (!rowId || !columnName) return;
  const root = el.shadowRoot;
  if (!root) return;
  const selector = `.body-cell[data-row="${cssEscape(rowId)}"][data-column="${cssEscape(columnName)}"]`;
  const attempt = (retriesLeft: number): void => {
    const target = root.querySelector<HTMLElement>(selector);
    if (!target) {
      if (retriesLeft > 0) requestAnimationFrame(() => attempt(retriesLeft - 1));
      return;
    }
    try {
      target.focus({ preventScroll: false });
    } catch {
      target.focus();
    }
  };
  attempt(2);
}

/**
 * Dispatch a plain click on a body cell through the selection module.
 * Mirrors the old `ui.grid.selection.uiGridCell` directive: shift-click
 * ranges, ctrl/meta toggles one, plain click respects
 * `enableFullRowSelection` + `enableSelectRowOnFocus` +
 * `modifierKeysToMultiSelect`.
 */
export function handleRowSelectionClick(
  el: UiGridStandaloneElement,
  rowId: string,
  columnName: string,
  event: Event,
): void {
  const controller = el.controller;
  if (!controller) return;
  const resolved = controller.getResolvedSelectionOptions();
  if (!resolved.enableRowSelection) return;
  // The checkbox column has its own click path.
  if (columnName === 'selectionRowHeaderCol') return;
  if (!resolved.enableFullRowSelection) {
    // Full-row selection is off — only the checkbox column selects, but
    // focus-row-changed should still fire.
    const row = controller.findRowByIdPublic(rowId);
    if (row) {
      controller.setRowFocused(rowId, true, event);
    }
    return;
  }
  const row = controller.findRowByIdPublic(rowId);
  if (!row) return;
  const mouseEvent = event as MouseEvent;
  if (mouseEvent.shiftKey) {
    controller.shiftSelectRow(row.entity, event);
  } else if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
    controller.toggleRowSelectionByEntity(row.entity, event);
  } else if (resolved.enableSelectRowOnFocus) {
    if (resolved.multiSelect && !resolved.modifierKeysToMultiSelect) {
      controller.toggleRowSelectionByEntity(row.entity, event);
    } else {
      controller.setMultiSelect(false);
      controller.toggleRowSelectionByEntity(row.entity, event);
      controller.setMultiSelect(resolved.multiSelect);
    }
  }
  controller.setRowFocused(rowId, true, event);
}

/**
 * Click handler for the row-header checkbox column. Differs from the
 * full-row click only in that shift/ctrl semantics mirror the old
 * selection module (shift-select pulls from `lastSelectedRow` regardless
 * of modifier).
 */
export function handleRowHeaderCheckboxClick(
  el: UiGridStandaloneElement,
  rowId: string,
  event: Event,
): void {
  const controller = el.controller;
  if (!controller) return;
  const resolved = controller.getResolvedSelectionOptions();
  if (!resolved.enableRowSelection) return;
  const row = controller.findRowByIdPublic(rowId);
  if (!row) return;
  const mouseEvent = event as MouseEvent;
  if (mouseEvent.shiftKey) {
    controller.shiftSelectRow(row.entity, event);
  } else if (mouseEvent.ctrlKey || mouseEvent.metaKey) {
    controller.toggleRowSelectionByEntity(row.entity, event);
  } else {
    if (resolved.multiSelect && !resolved.modifierKeysToMultiSelect) {
      controller.toggleRowSelectionByEntity(row.entity, event);
    } else {
      controller.setMultiSelect(false);
      controller.toggleRowSelectionByEntity(row.entity, event);
      controller.setMultiSelect(resolved.multiSelect);
    }
  }
  if (resolved.enableFocusRowOnRowHeaderClick) {
    controller.setRowFocused(rowId, true, event);
  }
}

/**
 * Does a keydown event match a cellNav key-override descriptor?
 * Undefined fields on the override are treated as wildcards. Used by the
 * event bus to decide whether a key should be handled internally or
 * forwarded to the consumer via `viewPortKeyDown`.
 */
export function matchesKeyOverride(
  override: {
    keyCode?: number;
    key?: string;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  },
  event: KeyboardEvent,
): boolean {
  if (override.keyCode !== undefined && override.keyCode !== event.keyCode) return false;
  if (override.key !== undefined && override.key !== event.key) return false;
  if (override.shiftKey !== undefined && override.shiftKey !== event.shiftKey) return false;
  if (override.ctrlKey !== undefined && override.ctrlKey !== event.ctrlKey) return false;
  if (override.altKey !== undefined && override.altKey !== event.altKey) return false;
  if (override.metaKey !== undefined && override.metaKey !== event.metaKey) return false;
  return true;
}

/**
 * Measure the natural content width of a column by cloning visible cells
 * into a hidden max-content container. This avoids measuring the CSS Grid
 * track width (which just reflects the current column size) and instead
 * returns the width the content actually needs.
 */
export function measureAutoColumnWidth(el: UiGridStandaloneElement, columnName: string): number {
  const root = el.shadowRoot;
  if (root == null) return 176;
  const escaped = cssEscape(columnName);

  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:max-content;visibility:hidden;';
  root.appendChild(probe);

  let maxWidth = 0;

  // Header cell: clone and measure at natural width.
  for (const header of root.querySelectorAll<HTMLElement>(`.header-cell[data-column="${escaped}"]`)) {
    const clone = header.cloneNode(true) as HTMLElement;
    clone.style.cssText = 'display:grid;grid-template-columns:auto auto;gap:inherit;padding:inherit;width:max-content;';
    probe.appendChild(clone);
    maxWidth = Math.max(maxWidth, clone.scrollWidth);
    probe.removeChild(clone);
  }

  // Filter cell: both custom element and class-based fallback.
  for (const filter of root.querySelectorAll<HTMLElement>(`ui-grid-filter-cell[data-column="${escaped}"], .filter-cell[data-column="${escaped}"]`)) {
    const clone = filter.cloneNode(true) as HTMLElement;
    clone.style.cssText = 'display:block;width:max-content;';
    probe.appendChild(clone);
    maxWidth = Math.max(maxWidth, clone.scrollWidth);
    probe.removeChild(clone);
  }

  // Body cells: clone .cell-shell content and measure.
  for (const cell of root.querySelectorAll<HTMLElement>(`.body-cell[data-column="${escaped}"]`)) {
    const shell = cell.querySelector<HTMLElement>('.cell-shell');
    if (!shell) continue;
    const clone = shell.cloneNode(true) as HTMLElement;
    clone.style.cssText = 'display:flex;width:max-content;';
    probe.appendChild(clone);
    maxWidth = Math.max(maxWidth, clone.scrollWidth);
    probe.removeChild(clone);
  }

  root.removeChild(probe);
  return Math.max(88, maxWidth + 12);
}
