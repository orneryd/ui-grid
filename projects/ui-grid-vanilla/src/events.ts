/**
 * DOM event wiring for the grid element.
 *
 * One entry point — `bindEvents(el)` — attaches every shadow-root event
 * listener the grid needs: click, focusin/out, input, mousedown (selection
 * drag + column resize), dblclick, keydown, blur, dragstart/over/leave/
 * drop/end, wheel, scroll. Each handler is a standalone function declared
 * inside `bindEvents` so it closes over the element and keeps the coupling
 * local.
 *
 * Supporting helpers (`observeTemplateSlots`, `syncHeaderHorizontalScroll`,
 * `maybeTriggerInfiniteScroll`) also live here because they are only used
 * by the event path.
 */

import { canGridMoveColumns } from '@ornery/ui-grid-core';
import {
  applyFocusedCellClass,
  commitAndMove,
  focusCellElement,
  handleRowHeaderCheckboxClick,
  handleRowSelectionClick,
  matchesKeyOverride,
  measureAutoColumnWidth,
  moveGridFocus,
} from './focus';
import type { UiGridStandaloneElement } from './ui-grid-standalone.element';

type BoundShadowRoot = ShadowRoot & { __uiGridBound?: boolean };

/**
 * Find the `.body-cell[data-row][data-column]` ancestor of an event by walking
 * the composed event path. Plain `closest()` from the click target stops at
 * shadow boundaries — for clicks on framework-projected light-DOM cell
 * content (Angular ng-template, React render props), the body cell sits in
 * the shadow tree on the other side of the slot. composedPath includes both
 * sides, so we just scan it.
 */
function bodyCellFromEvent(event: Event): HTMLElement | null {
  const path = event.composedPath();
  for (const node of path) {
    if (node instanceof HTMLElement && node.classList.contains('body-cell')) {
      if (node.dataset['row'] && node.dataset['column']) return node;
    }
  }
  return null;
}

/**
 * Watch the element's light DOM for `<template slot="…">` changes so
 * consumer template edits trigger a re-render. Ports the old grid's
 * observer that let template updates flow through without an explicit
 * options re-assign.
 */
export function observeTemplateSlots(el: UiGridStandaloneElement): void {
  if (el.templateObserver) return;

  el.templateObserver = new MutationObserver((mutations) => {
    // We only care about consumer-provided `<template slot="…">` nodes —
    // their innerHTML feeds the string-interpolation render path. Skip
    // mutations that only touched non-template slotted nodes (e.g. the
    // `<span slot="cell-…">` wrappers Angular / React wrappers append to
    // project framework-rendered content). Otherwise those framework
    // wrappers would re-trigger ensureController on every slot delta and
    // loop forever.
    const involvesTemplate = mutationsTouchTemplateSlot(mutations);
    if (!involvesTemplate) return;

    // Consumer light-DOM templates (`<template slot="cell-…">`) feed the
    // string-interpolation render path. When they're added/removed/edited
    // the per-row visual fingerprint cache becomes stale (the fingerprint
    // doesn't track template content), so blow it away to force the next
    // patch pass to re-render every cell shell.
    el.lastRowStateFingerprints.clear();
    if (el.activeOptions) {
      el.ensureController(el.buildEffectiveOptions(el.activeOptions));
    } else {
      el.render();
    }
  });

  el.templateObserver.observe(el, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['slot'],
  });
}

function mutationsTouchTemplateSlot(mutations: MutationRecord[]): boolean {
  for (const m of mutations) {
    if (m.type === 'attributes' && m.target instanceof HTMLTemplateElement) {
      return true;
    }
    if (m.type === 'childList') {
      for (const node of m.addedNodes) {
        if (node instanceof HTMLTemplateElement && node.hasAttribute('slot')) return true;
      }
      for (const node of m.removedNodes) {
        if (node instanceof HTMLTemplateElement && node.hasAttribute('slot')) return true;
      }
    }
  }
  return false;
}

/**
 * Mirror horizontal scroll from the body viewport onto the header +
 * filter strips. The strips are real scroll containers (necessary for
 * `position: sticky` on pinned cells), so they need scrollLeft set
 * imperatively to stay aligned with the body.
 */
export function syncHeaderHorizontalScroll(
  el: UiGridStandaloneElement,
  scrollLeft: number,
): void {
  const root = el.shadowRoot;
  if (!root) return;
  const headerStrip = root.querySelector<HTMLElement>('.grid-header-strip');
  const filterStrip = root.querySelector<HTMLElement>('.grid-filter-strip');
  if (headerStrip && headerStrip.scrollLeft !== scrollLeft) {
    headerStrip.scrollLeft = scrollLeft;
  }
  if (filterStrip && filterStrip.scrollLeft !== scrollLeft) {
    filterStrip.scrollLeft = scrollLeft;
  }
}

/**
 * Ask the controller to evaluate whether the current scroll position
 * should request more data at the top or bottom — ports the old grid's
 * `handleScroll → loadData` check. The controller raises
 * `needLoadMoreData` / `needLoadMoreDataTop` when thresholds are crossed.
 */
export function maybeTriggerInfiniteScroll(el: UiGridStandaloneElement): void {
  const snapshot = el.snapshot;
  if (!snapshot || !el.controller) return;
  if (snapshot.options.enableInfiniteScroll === false) return;
  const bodyViewport = el.shadowRoot?.querySelector<HTMLElement>('.grid-body-viewport');
  if (!bodyViewport) return;
  const rowSize = snapshot.rowSize || 1;
  const startIndex = Math.floor(el.scrollPosition / rowSize);
  const viewportRows = Math.max(1, Math.floor(bodyViewport.clientHeight / rowSize));
  const visibleRows = snapshot.pipeline.visibleRows.length;
  el.controller.evaluateInfiniteScroll(startIndex, visibleRows, viewportRows);
}

/**
 * Attach every shadow-root listener the grid needs. Idempotent: a
 * `__uiGridBound` marker on the shadow root prevents re-binding on
 * reconnect.
 */
export function bindEvents(el: UiGridStandaloneElement): void {
  const root = el.ensureShadowRoot() as BoundShadowRoot;
  if (root.__uiGridBound) return;

  // ─────────────────────────────────────────────────────────────────
  // click: body-cell focus seed, row-header checkbox, [data-action] dispatch
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener('click', (event) => {
    // Use composedPath to reach into sub-component shadow DOMs (pagination buttons, etc.).
    const realTarget = (event.composedPath()[0] ?? event.target) as HTMLElement | null;
    if (!realTarget || !el.controller || !el.snapshot) return;

    // Clicking inside a body cell seeds keyboard navigation. Some browsers
    // don't reliably focus a div with tabindex="0" on click, so we force it
    // here. This is required for arrow-key nav to work — otherwise focus
    // stays on the grid-table scroll container and arrows just scroll.
    const clickedCell = bodyCellFromEvent(event);
    if (clickedCell && !realTarget.closest('[data-role="editor"]')) {
      const rowId = clickedCell.dataset['row'];
      const columnName = clickedCell.dataset['column'];
      if (rowId && columnName) {
        const previous = el.focusedCell;
        const next = { rowId, columnName };
        el.focusedCell = next;
        applyFocusedCellClass(el, previous, next);
        el.controller.setCellNavFocus(rowId, columnName);
        const activeInShadow = (el.shadowRoot?.activeElement ?? null) as HTMLElement | null;
        if (activeInShadow !== clickedCell && !activeInShadow?.closest?.('.body-cell')) {
          try {
            clickedCell.focus({ preventScroll: true });
          } catch {
            clickedCell.focus();
          }
        }
        handleRowSelectionClick(el, rowId, columnName, event);
      }
    }

    // Row-header checkbox column click — mirrors the old
    // selectionRowHeaderButtons directive: even when enableFullRowSelection
    // is off, clicking the header checkbox selects the row.
    if (clickedCell?.dataset['column'] === 'selectionRowHeaderCol') {
      const rowId = clickedCell.dataset['row'];
      if (rowId) {
        event.stopPropagation();
        handleRowHeaderCheckboxClick(el, rowId, event);
      }
    }

    // Walk the composed path to find [data-action] across shadow boundaries.
    let actionNode: HTMLElement | null = null;
    for (const node of event.composedPath()) {
      if (node instanceof HTMLElement && node.dataset['action']) {
        actionNode = node;
        break;
      }
    }
    if (!actionNode) return;

    const action = actionNode.dataset['action'];
    if (!action) return;

    if (el.openPinMenuColumn && !realTarget.closest('.pin-control')) {
      el.openPinMenuColumn = null;
      el.render();
      return;
    }

    if (action === 'sort') {
      const columnName = actionNode.dataset['column'];
      if (columnName) el.controller.toggleSort(columnName);
      return;
    }

    if (action === 'select-all') {
      const resolvedSel = el.controller.getResolvedSelectionOptions();
      if (el.snapshot?.selectAll) {
        el.controller.clearSelectedRows(event);
        if (resolvedSel.noUnselect) {
          el.controller.selectRowByVisibleIndex(0, event);
        }
      } else if (resolvedSel.multiSelect) {
        el.controller.selectAllVisibleRows(event);
      }
      return;
    }

    if (action === 'group') {
      const columnName = actionNode.dataset['column'];
      if (columnName) el.controller.toggleGrouping(columnName);
      return;
    }

    if (action === 'toggle-group') {
      const groupId = actionNode.dataset['group'];
      if (groupId) {
        const collapsed = actionNode.dataset['collapsed'] !== 'true';
        el.controller.setCollapsedGroup(groupId, collapsed);
      }
      return;
    }

    if (action === 'pin-trigger') {
      const columnName = actionNode.dataset['column'];
      const column = columnName
        ? el.snapshot.visibleColumns.find((candidate) => candidate.name === columnName)
        : undefined;

      if (columnName && column) {
        if (el.controller.isPinned(column)) {
          el.openPinMenuColumn = null;
          el.controller.pinColumn(columnName, 'none');
          return;
        }

        el.openPinMenuColumn = el.openPinMenuColumn === columnName ? null : columnName;
        el.render();
      }
      return;
    }

    if (action === 'pin-left' || action === 'pin-right') {
      const columnName = actionNode.dataset['column'];
      if (columnName) {
        el.openPinMenuColumn = null;
        el.controller.pinColumn(columnName, action === 'pin-left' ? 'left' : 'right');
      }
      return;
    }

    if (action === 'toggle-tree') {
      const rowId = actionNode.dataset['row'];
      if (rowId) el.controller.toggleTreeRow(rowId);
      return;
    }

    if (action === 'toggle-expand') {
      const rowId = actionNode.dataset['row'];
      if (rowId) el.controller.toggleRowExpansion(rowId);
      return;
    }

    if (action === 'page-prev') {
      el.controller.seekPage(el.snapshot.currentPage - 1);
      return;
    }

    if (action === 'page-next') {
      el.controller.seekPage(el.snapshot.currentPage + 1);
      return;
    }

    if (action === 'benchmark') {
      void el.controller.gridApi.core.benchmark().then((result) => {
        el.benchmarkAverage = result.averageMs.toFixed(2);
        el.render();
      });
      return;
    }

    if (action === 'export-csv') {
      el.downloadCsv();
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // focusin / focusout: keep `focusedCell` in sync with DOM focus
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener('focusin', (event) => {
    const cell = bodyCellFromEvent(event);
    const rowId = cell?.dataset['row'];
    const columnName = cell?.dataset['column'];
    if (rowId && columnName) {
      const previous = el.focusedCell;
      const next = { rowId, columnName };
      if (!previous || previous.rowId !== rowId || previous.columnName !== columnName) {
        el.focusedCell = next;
        applyFocusedCellClass(el, previous, next);
      }
    }
  });

  root.addEventListener('focusout', (event) => {
    const relatedTarget = (event as FocusEvent).relatedTarget as HTMLElement | null;
    if (!relatedTarget?.closest('.body-cell[data-row][data-column]')) {
      el.focusedCell = null;
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // input: filter inputs + cell editors
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener('input', (event) => {
    const target = (event.composedPath()[0] ?? event.target) as HTMLElement | null;
    if (!target || !el.controller) return;

    if (target instanceof HTMLInputElement && target.dataset['role'] === 'filter') {
      const columnName = target.dataset['column'];
      if (columnName) el.controller.setFilter(columnName, target.value);
    }

    if (target instanceof HTMLInputElement && target.dataset['role'] === 'editor') {
      el.controller.updateEditingValue(target.value);
    }
  });

  // Listen for the composed custom event from the pagination component's shadow DOM.
  root.addEventListener('grid-page-size', ((event: CustomEvent<{ pageSize: number }>) => {
    if (el.controller) el.controller.setPageSize(event.detail.pageSize);
  }) as EventListener);

  // ─────────────────────────────────────────────────────────────────
  // mousedown #1: drag-paint row selection
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener('mousedown', (event) => {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button !== 0) return;
    const realTarget = (event.composedPath()[0] ?? event.target) as HTMLElement | null;
    if (!realTarget || !el.controller || !el.snapshot) return;
    // Don't interfere with column resize / actions / editor / anything in
    // the header or filter row.
    if (realTarget.closest('.column-resizer')) return;
    if (realTarget.closest('[data-role="editor"]')) return;
    if (realTarget.closest('.header-cell')) return;
    if (realTarget.closest('.filter-cell')) return;
    const resolved = el.controller.getResolvedSelectionOptions();
    if (!resolved.enableRowSelection || !resolved.multiSelect) return;
    const startCell = bodyCellFromEvent(event);
    if (!startCell) return;
    const startRowId = startCell.dataset['row'];
    if (!startRowId) return;
    const isCheckboxCol = startCell.dataset['column'] === 'selectionRowHeaderCol';
    if (!isCheckboxCol && !resolved.enableFullRowSelection) return;
    // Clicks with modifier keys go through the single-click handler
    // instead of drag-paint, so shift/ctrl don't accidentally commit a
    // one-row drag on mouseup.
    if (mouseEvent.shiftKey || mouseEvent.ctrlKey || mouseEvent.metaKey) return;

    // Drag-paint tracking. We don't touch the start row on mousedown — the
    // click handler owns single-click semantics. The starting row only
    // gets painted once we observe a mousemove onto a DIFFERENT row.
    const startSelected = el.snapshot.selectedRowIds.has(startRowId);
    const targetSelected = !startSelected;
    const touched = new Set<string>();
    let dragStarted = false;

    const paintRow = (rowId: string): void => {
      if (touched.has(rowId)) return;
      touched.add(rowId);
      const currentlySelected = el.snapshot?.selectedRowIds.has(rowId) ?? false;
      if (currentlySelected === targetSelected) return;
      const row = el.controller!.findRowByIdPublic(rowId);
      if (!row) return;
      if (targetSelected) el.controller!.selectRow(row.entity, event);
      else el.controller!.unSelectRow(row.entity, event);
    };

    const handleMove = (moveEvent: MouseEvent): void => {
      const cell = bodyCellFromEvent(moveEvent);
      if (!cell) return;
      const rowId = cell.dataset['row'];
      if (!rowId) return;
      if (!dragStarted) {
        // First move onto a different row promotes this gesture to a drag —
        // paint the starting row and suppress the trailing click.
        if (rowId === startRowId) return;
        dragStarted = true;
        paintRow(startRowId);
      }
      paintRow(rowId);
    };

    const suppressNextClick = (e: Event): void => {
      e.stopPropagation();
      e.preventDefault();
      root.removeEventListener('click', suppressNextClick, true);
    };

    const handleUp = (): void => {
      window.removeEventListener('mousemove', handleMove, true);
      window.removeEventListener('mouseup', handleUp, true);
      if (dragStarted) {
        root.addEventListener('click', suppressNextClick, true);
      }
    };

    window.addEventListener('mousemove', handleMove, true);
    window.addEventListener('mouseup', handleUp, true);
  });

  // ─────────────────────────────────────────────────────────────────
  // mousedown #2: column resize
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener('mousedown', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target || !el.controller) return;

    const resizer = target.closest<HTMLElement>('.column-resizer[data-column]');
    if (!resizer || !el.controller.canResizeColumns()) return;

    const columnName = resizer.dataset['column'];
    if (!columnName) return;

    const headerCell = resizer.closest<HTMLElement>('.header-cell');
    if (!headerCell) return;

    event.preventDefault();
    event.stopPropagation();

    const startX = (event as MouseEvent).clientX;
    const startWidth = headerCell.getBoundingClientRect().width;
    let lastWidth = startWidth;

    const handleMove = (moveEvent: MouseEvent): void => {
      lastWidth = Math.max(88, startWidth + (moveEvent.clientX - startX));

      // Write directly to DOM — skip the full refresh while dragging.
      const nextTemplate = el.controller!.buildTemplateColumnsWithOverride(columnName, lastWidth);
      const writeRoot = el.shadowRoot ?? el;
      (writeRoot as ShadowRoot | HTMLElement)
        .querySelectorAll<HTMLElement>('.header-grid, .filter-grid, .body-grid')
        .forEach((targetEl) => {
          targetEl.style.gridTemplateColumns = nextTemplate;
        });
    };

    const handleUp = (): void => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      // Commit final width once — triggers one full refresh.
      el.controller!.setColumnWidthOverride(columnName, lastWidth);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  });

  // ─────────────────────────────────────────────────────────────────
  // dblclick: auto-size column, begin cell edit
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener('dblclick', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target || !el.controller) return;

    const resizer = target.closest<HTMLElement>('.column-resizer[data-column]');
    if (resizer && el.controller.canResizeColumns()) {
      const columnName = resizer.dataset['column'];
      if (columnName) {
        event.preventDefault();
        event.stopPropagation();
        el.controller.setColumnWidthOverride(columnName, measureAutoColumnWidth(el, columnName));
        return;
      }
    }

    const cell = bodyCellFromEvent(event);
    if (!cell) return;

    const rowId = cell.dataset['row'];
    const columnName = cell.dataset['column'];
    if (rowId && columnName) {
      el.controller.beginCellEdit(rowId, columnName, event);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // keydown: cellNav + editor shortcuts
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener('keydown', (event) => {
    const keyboardEvent = event as KeyboardEvent;
    const target = event.target as HTMLElement | null;
    if (!target || !el.controller) return;

    const onBodyCell = bodyCellFromEvent(event);

    // cellNav.keyDownOverrides: declared overrides skip cellnav's default
    // handling and raise viewPortKeyDown so consumers can disable built-in
    // key handling per-key.
    const overrides = el.controller.getOptions().keyDownOverrides ?? [];
    if (overrides.length && onBodyCell) {
      for (const override of overrides) {
        if (matchesKeyOverride(override, keyboardEvent)) {
          el.controller.raiseCellNavKeyEvent('keydown', keyboardEvent);
          return;
        }
      }
    }

    // Ctrl/Cmd+A on a body cell — select all. Gated by enableRowSelection + multiSelect.
    if (
      (keyboardEvent.ctrlKey || keyboardEvent.metaKey) &&
      (keyboardEvent.key === 'a' || keyboardEvent.key === 'A') &&
      onBodyCell
    ) {
      const resolved = el.controller.getResolvedSelectionOptions();
      if (resolved.enableRowSelection && resolved.multiSelect) {
        event.preventDefault();
        el.controller.selectAllRows(event);
        return;
      }
    }

    // Space toggles the row when on the checkbox column or in full-row-selection mode.
    if (keyboardEvent.key === ' ' || keyboardEvent.key === 'Spacebar') {
      const cell = onBodyCell;
      const rowId = cell?.dataset['row'];
      const columnName = cell?.dataset['column'];
      if (cell && rowId && columnName) {
        const resolved = el.controller.getResolvedSelectionOptions();
        if (resolved.enableRowSelection) {
          const onCheckboxCol = columnName === 'selectionRowHeaderCol';
          if (onCheckboxCol || resolved.enableFullRowSelection) {
            event.preventDefault();
            const row = el.controller.findRowByIdPublic(rowId);
            if (row) {
              if (resolved.multiSelect && !resolved.modifierKeysToMultiSelect) {
                el.controller.toggleRowSelectionByEntity(row.entity, event);
              } else {
                el.controller.setMultiSelect(false);
                el.controller.toggleRowSelectionByEntity(row.entity, event);
                el.controller.setMultiSelect(resolved.multiSelect);
              }
            }
            return;
          }
        }
      }
    }

    if (target instanceof HTMLInputElement && target.dataset['role'] === 'editor') {
      if (keyboardEvent.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const fromRow = target.dataset['row'] ?? null;
        const fromCol = target.dataset['column'] ?? null;
        const direction = keyboardEvent.shiftKey ? 'up' : 'down';
        commitAndMove(el, fromRow, fromCol, direction);
        return;
      }

      if (keyboardEvent.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        const fromRow = target.dataset['row'] ?? null;
        const fromCol = target.dataset['column'] ?? null;
        el.controller.cancelCellEdit();
        focusCellElement(el, fromRow, fromCol);
        return;
      }

      if (keyboardEvent.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        const fromRow = target.dataset['row'] ?? null;
        const fromCol = target.dataset['column'] ?? null;
        const direction = keyboardEvent.shiftKey ? 'left' : 'right';
        commitAndMove(el, fromRow, fromCol, direction);
        return;
      }

      return;
    }

    // Derive the logical cell either from the event target (clicked cell) or
    // from the element's tracked focusedCell state (covers the case where
    // the browser routed the event to the scroll container instead of the
    // cell).
    let rowId: string | undefined;
    let columnName: string | undefined;
    if (onBodyCell) {
      rowId = onBodyCell.dataset['row'];
      columnName = onBodyCell.dataset['column'];
    } else if (el.focusedCell) {
      rowId = el.focusedCell.rowId;
      columnName = el.focusedCell.columnName;
    }
    if (!rowId || !columnName) return;

    switch (keyboardEvent.key) {
      case 'ArrowLeft':
        event.preventDefault();
        moveGridFocus(el, 'left', rowId, columnName);
        return;
      case 'ArrowRight':
        event.preventDefault();
        moveGridFocus(el, 'right', rowId, columnName);
        return;
      case 'ArrowUp':
        event.preventDefault();
        moveGridFocus(el, 'up', rowId, columnName);
        return;
      case 'ArrowDown':
        event.preventDefault();
        moveGridFocus(el, 'down', rowId, columnName);
        return;
      case 'Tab':
        event.preventDefault();
        moveGridFocus(el, keyboardEvent.shiftKey ? 'left' : 'right', rowId, columnName);
        return;
      case 'Home':
        event.preventDefault();
        moveGridFocus(el, keyboardEvent.ctrlKey ? 'top' : 'rowStart', rowId, columnName);
        return;
      case 'End':
        event.preventDefault();
        moveGridFocus(el, keyboardEvent.ctrlKey ? 'bottom' : 'rowEnd', rowId, columnName);
        return;
      case 'Enter':
      case 'F2':
        event.preventDefault();
        el.controller.beginCellEdit(rowId, columnName, event);
        return;
      default:
        break;
    }

    if (
      keyboardEvent.key.length === 1 &&
      !keyboardEvent.ctrlKey &&
      !keyboardEvent.metaKey &&
      !keyboardEvent.altKey
    ) {
      event.preventDefault();
      // Pass the typed character as the initial value — beginCellEdit seeds
      // the editor with this instead of the cell's current value, so the
      // first keystroke isn't lost to the "input is focused, skip value
      // overwrite" guard in ui-grid-cell-editor.
      el.controller.beginCellEdit(rowId, columnName, event, keyboardEvent.key);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // blur: commit edit on capture
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener(
    'blur',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || !el.controller) return;
      if (target instanceof HTMLInputElement && target.dataset['role'] === 'editor') {
        el.controller.commitCellEdit();
      }
    },
    true,
  );

  // ─────────────────────────────────────────────────────────────────
  // drag & drop: column reorder
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener('dragstart', (event) => {
    const dragEvent = event as DragEvent;
    const target = event.target as HTMLElement | null;
    const headerCell = target?.closest<HTMLElement>('.header-cell[data-column]');

    if (!headerCell || !el.snapshot || !canGridMoveColumns(el.snapshot.options)) {
      event.preventDefault();
      return;
    }

    const columnName = headerCell.dataset['column'];
    if (!columnName || !dragEvent.dataTransfer) {
      event.preventDefault();
      return;
    }

    const colDef = el.snapshot.visibleColumns.find((c) => c.name === columnName);
    if (colDef?.enableColumnMoving === false) {
      event.preventDefault();
      return;
    }

    el.draggedColumnName = columnName;
    el.dropTargetColumnName = null;
    dragEvent.dataTransfer.effectAllowed = 'move';
    dragEvent.dataTransfer.setData('text/plain', columnName);
    headerCell.classList.add('is-dragging');
  });

  root.addEventListener('dragover', (event) => {
    const dragEvent = event as DragEvent;
    const target = event.target as HTMLElement | null;
    const headerCell = target?.closest<HTMLElement>('.header-cell[data-column]');

    if (!headerCell || !el.draggedColumnName || !dragEvent.dataTransfer) return;

    const columnName = headerCell.dataset['column'];
    if (!columnName || columnName === el.draggedColumnName) return;

    const colDef = el.snapshot?.visibleColumns.find((c) => c.name === columnName);
    if (colDef?.enableColumnMoving === false) return;

    event.preventDefault();
    dragEvent.dataTransfer.dropEffect = 'move';

    if (el.dropTargetColumnName !== columnName) {
      root.querySelectorAll('.header-cell.is-drag-target').forEach((element) => {
        element.classList.remove('is-drag-target');
      });
      el.dropTargetColumnName = columnName;
      headerCell.classList.add('is-drag-target');
    }
  });

  root.addEventListener('dragleave', (event) => {
    // `dragleave` bubbles from every descendant as the cursor moves over
    // child nodes (the header-label span, the sort/pin buttons, etc.), so
    // we must only clear the drop indicator when the pointer has actually
    // left the header cell — i.e. when `relatedTarget` is outside it.
    const dragEvent = event as DragEvent;
    const target = event.target as HTMLElement | null;
    const headerCell = target?.closest<HTMLElement>('.header-cell[data-column]');
    if (!headerCell) return;
    const related = dragEvent.relatedTarget as Node | null;
    if (related && headerCell.contains(related)) return; // still inside the same header cell
    if (headerCell.dataset['column'] === el.dropTargetColumnName) {
      headerCell.classList.remove('is-drag-target');
      el.dropTargetColumnName = null;
    }
  });

  root.addEventListener('drop', (event) => {
    event.preventDefault();
    const dragEvent = event as DragEvent;
    const target = event.target as HTMLElement | null;
    const headerCell = target?.closest<HTMLElement>('.header-cell[data-column]');
    const targetColumn = headerCell?.dataset['column'];
    const sourceColumn =
      el.draggedColumnName ?? dragEvent.dataTransfer?.getData('text/plain') ?? null;

    el.draggedColumnName = null;
    el.dropTargetColumnName = null;

    root
      .querySelectorAll('.header-cell.is-dragging, .header-cell.is-drag-target')
      .forEach((element) => {
        element.classList.remove('is-dragging', 'is-drag-target');
      });

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn || !el.controller) return;

    el.controller.moveVisibleColumn(sourceColumn, targetColumn);
  });

  root.addEventListener('dragend', () => {
    el.draggedColumnName = null;
    el.dropTargetColumnName = null;
    root
      .querySelectorAll('.header-cell.is-dragging, .header-cell.is-drag-target')
      .forEach((element) => {
        element.classList.remove('is-dragging', 'is-drag-target');
      });
  });

  // ─────────────────────────────────────────────────────────────────
  // wheel on strips → forward to body viewport
  // ─────────────────────────────────────────────────────────────────
  // Forward wheel gestures originating inside the header / filter strips
  // to the body viewport. The strips are technically scroll containers
  // (necessary for `position: sticky` on pinned cells to anchor), but we
  // don't want the user scrolling them independently — that would desync
  // them from the body.
  const onStripWheel = (event: WheelEvent): void => {
    const target = event.target as HTMLElement | null;
    const strip = target?.closest('.grid-header-strip, .grid-filter-strip');
    if (!strip) return;
    const bodyViewport = el.shadowRoot?.querySelector<HTMLElement>('.grid-body-viewport');
    if (!bodyViewport) return;
    event.preventDefault();
    bodyViewport.scrollLeft += event.deltaX;
    bodyViewport.scrollTop += event.deltaY;
  };
  root.addEventListener('wheel', onStripWheel as EventListener, { passive: false });

  // ─────────────────────────────────────────────────────────────────
  // scroll: virtualization window shift + infinite-scroll threshold
  // ─────────────────────────────────────────────────────────────────
  root.addEventListener(
    'scroll',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || el.suppressScrollEvent) return;

      if (!target.classList.contains('grid-body-viewport')) return;

      el.lastScrollActivityAt = Date.now();
      el.scrollPosition = target.scrollTop;
      el.horizontalScrollPosition = target.scrollLeft;

      syncHeaderHorizontalScroll(el, target.scrollLeft);

      const snapshot = el.snapshot;
      if (!snapshot) return;

      if (snapshot.pipeline.virtualizationEnabled) {
        const overscan = 4;
        const nextStartIndex = Math.max(
          0,
          Math.floor(el.scrollPosition / snapshot.rowSize) - overscan,
        );
        const startChanged = nextStartIndex !== el.lastVirtualStartIndex;

        if (el.scrollFrame !== null) cancelAnimationFrame(el.scrollFrame);
        el.scrollFrame = requestAnimationFrame(() => {
          el.scrollFrame = null;
          if (startChanged) el.renderVirtualBody();
          maybeTriggerInfiniteScroll(el);
        });
        return;
      }

      // Non-virtualized path: still evaluate infinite-scroll thresholds so
      // large static datasets can page in via needLoadMoreData.
      if (el.scrollFrame !== null) cancelAnimationFrame(el.scrollFrame);
      el.scrollFrame = requestAnimationFrame(() => {
        el.scrollFrame = null;
        maybeTriggerInfiniteScroll(el);
      });
    },
    true,
  );

  root.__uiGridBound = true;
}
