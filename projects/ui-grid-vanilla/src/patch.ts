/**
 * Patch path: apply the next snapshot onto the existing shadow-DOM tree
 * without rebuilding it. The initial mount produces the full structure
 * via `renderFull`; subsequent renders pass through `renderPatch` here,
 * which walks the existing nodes and only mutates what changed. This is
 * what keeps focus inside mounted `<ui-grid-cell-editor>` components and
 * what makes per-keystroke snapshot rebroadcasts cheap.
 *
 * Every function takes the element as its first argument and reads its
 * internal state directly. See the @internal field markers on the class
 * for the coupling contract.
 */

import type {
  DisplayItem,
  GridColumnDef,
  GridOptions,
  GridRow,
  GroupItem,
} from '@ornery/ui-grid-core';
import type { GridControllerSnapshot } from './grid-controller';
import {
  renderCellShellContents,
  renderCellTemplateFromMarkup,
  renderDisplayItem,
  renderEmptyState,
  renderExpandableTemplate,
  renderHeaderCell,
  renderPagination,
} from './render';
import {
  bodyStaticMarkup,
  bodyVirtualMarkup,
  emptyDataMarkup,
} from './templates';
import type { UiGridStandaloneElement } from './ui-grid-standalone.element';
import { bodyCellClass } from './utils/cell-class';
import { asGroupItem, isRowItem } from './utils/display-items';
import {
  createFromMarkup,
  escapeHtml,
  setAttr,
  setClass,
  setStyle,
  swapBodyChild,
} from './utils/dom';

/**
 * Fast-path data refresh: walk every rendered body cell and re-interpolate
 * its content. Used when the data changed but the row / column identity
 * didn't, so we can avoid a full render + scroll-position restore.
 */
export function patchCells(
  el: UiGridStandaloneElement,
  changedRowIds?: ReadonlySet<string>,
): void {
  const snapshot = el.snapshot;
  if (!snapshot) return;
  const root = el.shadowRoot;
  if (!root) return;

  // Build O(1) lookup maps from the current pipeline snapshot.
  const rowMap = new Map<string, GridRow>();
  const rowIndexMap = new Map<string, number>();
  for (const row of snapshot.pipeline.visibleRows) {
    rowMap.set(row.id, row);
    rowIndexMap.set(row.id, rowIndexMap.size);
  }
  const colMap = new Map<string, GridColumnDef>();
  const templateMarkupMap = new Map<string, string | null>();
  for (const col of snapshot.visibleColumns) {
    colMap.set(col.name, col);
    templateMarkupMap.set(col.name, getTemplateMarkup(el, `cell-${col.name}`));
  }

  // Patch every rendered body cell in-place.
  const cells = root.querySelectorAll<HTMLElement>('[data-row][data-column]');
  for (const cell of cells) {
    const rowId = cell.dataset['row'];
    const colName = cell.dataset['column'];
    if (!rowId || !colName) continue;
    if (changedRowIds && !changedRowIds.has(rowId)) continue;

    const row = rowMap.get(rowId);
    const column = colMap.get(colName);
    if (!row || !column) continue;
    if (cell.classList.contains('cell-editing')) continue;

    const cellContent = cell.querySelector<HTMLElement>('.cell-content');
    if (!cellContent) continue;

    const newContent = renderCellTemplateFromMarkup(
      el,
      row,
      column,
      rowIndexMap.get(rowId) ?? 0,
      templateMarkupMap.get(colName) ?? null,
    );
    if (cellContent.innerHTML !== newContent) {
      cellContent.innerHTML = newContent;
    }
  }

  // Data-only patch: no slot structure change, but any cells that were
  // re-rendered have staged a fresh context. Merge them back into the
  // bridge's last-snapshot without firing an add/remove event — wrappers
  // that need per-tick context updates should subscribe to
  // `rowsVisibleChanged` instead.
  el.frameworkSlots.mergePendingIntoLast();
}

/**
 * Structural patch: apply a full `RenderPlan` to the existing shadow-DOM
 * tree. Replaces `renderFull`'s innerHTML-dump path whenever the structure
 * key hasn't changed between snapshots.
 */
export function renderPatch(
  el: UiGridStandaloneElement,
  plan: {
    snapshot: GridControllerSnapshot;
    options: GridOptions;
    labels: GridControllerSnapshot['labels'];
    templateColumns: string;
    sortEnabled: boolean;
    filterEnabled: boolean;
    groupingEnabled: boolean;
    pinningEnabled: boolean;
    paginationEnabled: boolean;
    showPagination: boolean;
    virtualizationEnabled: boolean;
    itemsToRender: readonly DisplayItem[];
    startIndex: number;
    virtualOffset: number;
    totalVirtualHeight: number;
  },
  root: ShadowRoot,
): void {
  const {
    snapshot,
    options,
    labels,
    templateColumns,
    sortEnabled,
    filterEnabled,
    groupingEnabled,
    pinningEnabled,
    paginationEnabled,
    showPagination,
    virtualizationEnabled,
    itemsToRender,
    startIndex,
    virtualOffset,
    totalVirtualHeight,
  } = plan;

  // Grid frame aria-label.
  const gridFrame = root.querySelector<HTMLElement>('.grid-frame');
  const nextTitle = escapeHtml(options.title ?? 'Data grid');
  if (gridFrame && gridFrame.getAttribute('aria-label') !== nextTitle) {
    gridFrame.setAttribute('aria-label', nextTitle);
  }

  // Grid table wrapper styles (sticky-top CSS var + explicit height).
  const gridTable = root.querySelector<HTMLElement>('.grid-table');
  const stickyTop = el.measuredHeaderStickyHeight || options.headerRowHeight || 50;
  const tableHeight = el.clientHeight || ((options.minRowsToShow ?? 10) * snapshot.rowSize + (el.measuredHeaderStickyHeight || options.headerRowHeight || 50) + el.measuredFilterStickyHeight + el.measuredPaginationHeight());
  const nextTableStyle = `--ui-grid-header-sticky-top:${stickyTop}px;height:${tableHeight}px;`;
  if (gridTable && gridTable.getAttribute('style') !== nextTableStyle) {
    gridTable.setAttribute('style', nextTableStyle);
  }

  // Header grid: track sizes + cells.
  const headerGrid = root.querySelector<HTMLElement>('.header-grid');
  if (headerGrid) {
    const nextHeaderStyle = `grid-template-columns:${templateColumns}`;
    if (headerGrid.getAttribute('style') !== nextHeaderStyle) {
      headerGrid.setAttribute('style', nextHeaderStyle);
    }
    const headerHtml = snapshot.visibleColumns
      .map((column) =>
        renderHeaderCell(el, column, sortEnabled, groupingEnabled, pinningEnabled, options),
      )
      .join('');
    if (headerGrid.innerHTML !== headerHtml) {
      headerGrid.innerHTML = headerHtml;
    }
  }

  // Filter row: update attributes on existing <ui-grid-filter-cell> elements
  // (keyed by data-column). This is the path that preserves input focus.
  if (filterEnabled) {
    const filterGrid = root.querySelector<HTMLElement>('.filter-grid');
    if (filterGrid) {
      const nextFilterStyle = `grid-template-columns:${templateColumns}`;
      if (filterGrid.getAttribute('style') !== nextFilterStyle) {
        filterGrid.setAttribute('style', nextFilterStyle);
      }
      patchFilterCells(el, filterGrid, snapshot);
    }
  }

  // Body region: innerHTML-swap just the grid rows. The scroll container
  // (.grid-body-viewport) is never replaced, so scroll position survives naturally.
  patchBodyRegion(
    el,
    root,
    snapshot,
    options,
    labels,
    templateColumns,
    virtualizationEnabled,
    itemsToRender,
    startIndex,
    virtualOffset,
    totalVirtualHeight,
  );

  // Pagination: show/hide + patch attributes. Lives inside .grid-table
  // (after .grid-body-viewport) so the flex column layout constrains the
  // body viewport height and keeps pagination visible.
  reconcilePagination(el, root, snapshot, paginationEnabled && showPagination);

  // Flush framework-rendered slot deltas — see renderFull().
  el.frameworkSlots.flush();
}

/**
 * Ensures the grid-body-viewport contains the right body node for the
 * desired kind (empty-state / virtual / static), reusing the existing
 * node where possible. Returns the body container the caller should
 * patch into, or null for the empty state.
 */
export function reconcileBodyRoot(
  el: UiGridStandaloneElement,
  root: ShadowRoot,
  kind: 'empty' | 'virtual' | 'static',
  options: GridOptions,
  labels: GridControllerSnapshot['labels'],
  templateColumns: string,
  virtualOffset: number,
  totalVirtualHeight: number,
): HTMLElement | null {
  const bodyViewport = root.querySelector<HTMLElement>('.grid-body-viewport');
  if (!bodyViewport) return null;

  const currentEmpty = bodyViewport.querySelector<HTMLElement>(':scope > .empty-state');
  const currentVirtual = bodyViewport.querySelector<HTMLElement>(':scope > .grid-virtual-spacer');
  const currentStatic = bodyViewport.querySelector<HTMLElement>(':scope > .body-grid');
  const currentNode = currentEmpty ?? currentVirtual ?? currentStatic;

  if (kind === 'empty') {
    const headingRaw = options.emptyMessage ?? labels.emptyHeading;
    const descriptionRaw = labels.emptyDescription;
    const markup = renderEmptyState(el, headingRaw, descriptionRaw);
    // In framework-rendered mode the markup is a <slot> placeholder, so
    // compare outerHTML to decide whether we can in-place patch or need
    // to swap the whole node. The slot-driven path just re-swaps because
    // the content is framework-owned anyway.
    if (el.frameworkSlots.hasEmptyState()) {
      if (currentEmpty && currentEmpty.querySelector('slot')) {
        return null;
      }
      const fresh = createFromMarkup(markup);
      if (fresh) swapBodyChild(bodyViewport, currentNode, fresh);
      return null;
    }
    const heading = escapeHtml(headingRaw);
    const description = escapeHtml(descriptionRaw);
    if (currentEmpty) {
      const strong = currentEmpty.querySelector('strong');
      const p = currentEmpty.querySelector('p');
      if (strong && strong.innerHTML !== heading) strong.innerHTML = heading;
      if (p && p.innerHTML !== description) p.innerHTML = description;
      return null;
    }
    const fresh = createFromMarkup(emptyDataMarkup(heading, description));
    if (fresh) swapBodyChild(bodyViewport, currentNode, fresh);
    return null;
  }

  if (kind === 'virtual') {
    if (currentVirtual) {
      return currentVirtual.querySelector<HTMLElement>('.grid-virtual-body');
    }
    const fresh = createFromMarkup(
      bodyVirtualMarkup(templateColumns, totalVirtualHeight, virtualOffset, ''),
    );
    if (fresh) swapBodyChild(bodyViewport, currentNode, fresh);
    return fresh?.querySelector<HTMLElement>('.grid-virtual-body') ?? null;
  }

  // static
  if (currentStatic) return currentStatic;
  const fresh = createFromMarkup(bodyStaticMarkup(templateColumns, ''));
  if (fresh) swapBodyChild(bodyViewport, currentNode, fresh);
  return fresh;
}

/**
 * Pagination reconciliation: mount, patch, or remove the `<ui-grid-pagination>`
 * based on whether the snapshot should show it. Lives inside `.grid-table`
 * (after `.grid-body-viewport`) matching the Angular layout.
 */
export function reconcilePagination(
  el: UiGridStandaloneElement,
  root: ShadowRoot,
  snapshot: GridControllerSnapshot,
  shouldShow: boolean,
): void {
  const gridTable = root.querySelector<HTMLElement>('.grid-table');
  if (!gridTable) return;
  const existing = gridTable.querySelector<HTMLElement>(':scope > ui-grid-pagination');

  if (!shouldShow) {
    if (existing) existing.remove();
    return;
  }

  if (existing) {
    patchPagination(el, existing, snapshot);
    return;
  }

  // Mount a fresh pagination element at the end of .grid-table.
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderPagination(el, snapshot);
  const fresh = wrapper.firstElementChild as HTMLElement | null;
  if (fresh) {
    gridTable.appendChild(fresh);
  }
}

/**
 * Patch the filter-cell data-attrs on the existing `<ui-grid-filter-cell>`
 * instances — this preserves native input focus + caret across snapshot
 * rebuilds. `renderPatch` takes this path instead of swapping innerHTML.
 */
export function patchFilterCells(
  el: UiGridStandaloneElement,
  filterGrid: HTMLElement,
  snapshot: GridControllerSnapshot,
): void {
  const controller = el.controller!;
  const existing = new Map<string, HTMLElement>();
  for (const e of filterGrid.querySelectorAll<HTMLElement>('ui-grid-filter-cell[data-column]')) {
    const column = e.dataset['column'];
    if (column) existing.set(column, e);
  }

  for (const column of snapshot.visibleColumns) {
    const target = existing.get(column.name);
    if (!target) continue;
    const value = snapshot.activeFilters[column.name] ?? '';
    const canFilter = controller.isColumnFilterable(column);
    const pinOffset = controller.isPinned(column) ? controller.pinnedOffset(column) : null;
    const stickyStyle = pinOffset ? `${pinOffset.side}:${pinOffset.offset};` : '';
    setAttr(target, 'data-value', value);
    setAttr(target, 'data-placeholder', controller.filterPlaceholder(column));
    setAttr(target, 'data-disabled', String(!canFilter));
    setAttr(target, 'data-pinned', String(controller.isPinned(column)));
    setAttr(target, 'data-pinned-left-last', String(controller.isPinnedLeftLast(column)));
    setAttr(target, 'data-pinned-right-first', String(controller.isPinnedRightFirst(column)));
    setAttr(target, 'data-sticky-style', stickyStyle);
  }
}

/**
 * Reconcile the body region: pick the right container kind (empty /
 * virtual / static), apply its styles, and either in-place-patch or
 * innerHTML-swap the rows depending on whether the fingerprint changed.
 */
export function patchBodyRegion(
  el: UiGridStandaloneElement,
  root: ShadowRoot,
  snapshot: GridControllerSnapshot,
  options: GridOptions,
  labels: GridControllerSnapshot['labels'],
  templateColumns: string,
  virtualizationEnabled: boolean,
  itemsToRender: readonly DisplayItem[],
  startIndex: number,
  virtualOffset: number,
  totalVirtualHeight: number,
): void {
  const hasRows = snapshot.pipeline.displayItems.length > 0;
  const desiredKind: 'empty' | 'virtual' | 'static' = !hasRows
    ? 'empty'
    : virtualizationEnabled
      ? 'virtual'
      : 'static';

  const bodyContainer = reconcileBodyRoot(
    el,
    root,
    desiredKind,
    options,
    labels,
    templateColumns,
    virtualOffset,
    totalVirtualHeight,
  );

  if (!hasRows) {
    el.lastItemsFingerprint = '';
    return;
  }

  const itemsFingerprint = fingerprintItems(itemsToRender);

  if (virtualizationEnabled) {
    const spacer = root.querySelector<HTMLElement>('.grid-virtual-spacer');
    if (spacer && totalVirtualHeight !== el.lastTotalVirtualHeight) {
      spacer.setAttribute('style', `height:${totalVirtualHeight}px`);
      el.lastTotalVirtualHeight = totalVirtualHeight;
    }
    if (bodyContainer) {
      const nextBodyStyle = `grid-template-columns:${templateColumns};top:${virtualOffset}px`;
      if (bodyContainer.getAttribute('style') !== nextBodyStyle) {
        bodyContainer.setAttribute('style', nextBodyStyle);
        el.lastVirtualOffset = virtualOffset;
      }
    }
  } else if (bodyContainer) {
    const nextStyle = `grid-template-columns:${templateColumns}`;
    if (bodyContainer.getAttribute('style') !== nextStyle) {
      bodyContainer.setAttribute('style', nextStyle);
    }
  }

  if (!bodyContainer) {
    el.lastItemsFingerprint = itemsFingerprint;
    return;
  }

  // Fast path: item layout identical to last render — patch each existing
  // cell / group row in place. This preserves focus inside any mounted
  // <ui-grid-cell-editor>, and avoids parsing a fresh HTML string for every
  // keystroke / unrelated snapshot (extreme perf path).
  if (el.lastItemsFingerprint === itemsFingerprint) {
    patchExistingRows(el, bodyContainer, snapshot, itemsToRender, startIndex);
    return;
  }

  // Slow path: row set changed (paging, sort, group toggle, tree expand,
  // virtualization window scrolled). Swap innerHTML so all fragments rebuild.
  const bodyContent = itemsToRender
    .map((item, index) => renderDisplayItem(el, item, startIndex + index))
    .join('');
  if (bodyContainer.innerHTML !== bodyContent) {
    bodyContainer.innerHTML = bodyContent;
  }
  el.lastItemsFingerprint = itemsFingerprint;
  // Body just rebuilt — old per-row fingerprints reference cells that no
  // longer exist in the DOM. Re-seed from the freshly-rendered rows so the
  // next patch pass sees them as already-up-to-date.
  el.lastRowStateFingerprints.clear();
  for (let i = 0; i < itemsToRender.length; i++) {
    const item = itemsToRender[i]!;
    if (!isRowItem(item)) continue;
    el.lastRowStateFingerprints.set(item.row.id, {
      fingerprint: buildRowFingerprint(item.row, startIndex + i, snapshot.visibleColumns),
      entity: item.row.entity,
    });
  }
  el.lastEditingCellKey = el.controller?.getEditingCellKey() ?? null;
  el.lastFocusedCellKey = el.focusedCell
    ? `${el.focusedCell.rowId} ${el.focusedCell.columnName}`
    : null;
}

/**
 * Lean per-item fingerprint: `kind:id` joined by `|`. If any row/group is
 * added/removed/reordered between renders, the fingerprint shifts and the
 * body-region patch falls back to the innerHTML path.
 */
export function fingerprintItems(items: readonly DisplayItem[]): string {
  const parts: string[] = [];
  for (const item of items) {
    if (item.kind === 'group') {
      parts.push(`g:${(item as GroupItem).id}`);
    } else if (item.kind === 'expandable') {
      parts.push(`e:${(item as DisplayItem & { row: GridRow }).row.id}`);
    } else if (isRowItem(item)) {
      parts.push(`r:${item.row.id}`);
    } else {
      parts.push('?');
    }
  }
  return parts.join('|');
}

/**
 * Walk the rendered body container, match existing DOM nodes to display
 * items by identity, and patch each in place. Called only on the fast
 * path where the fingerprint matches.
 */
export function patchExistingRows(
  el: UiGridStandaloneElement,
  bodyContainer: HTMLElement,
  snapshot: GridControllerSnapshot,
  itemsToRender: readonly DisplayItem[],
  startIndex: number,
): void {
  const controller = el.controller!;
  const columns = snapshot.visibleColumns;

  // Build O(1) lookup maps from a single pass over bodyContainer.children.
  // This replaces the previous O(rows×cols) querySelector approach.
  const groupEls = new Map<string, HTMLElement>();
  const cellEls = new Map<string, Map<string, HTMLElement>>();
  const expandableEls: HTMLElement[] = [];
  for (let c = 0; c < bodyContainer.children.length; c++) {
    const node = bodyContainer.children[c] as HTMLElement;
    const tag = node.tagName;
    if (tag === 'UI-GRID-GROUP-ROW') {
      const id = node.dataset['group'];
      if (id) groupEls.set(id, node);
    } else if (tag === 'UI-GRID-BODY-CELL') {
      const rowId = node.dataset['row'];
      const colName = node.dataset['column'];
      if (rowId && colName) {
        let rowMap = cellEls.get(rowId);
        if (!rowMap) {
          rowMap = new Map<string, HTMLElement>();
          cellEls.set(rowId, rowMap);
        }
        rowMap.set(colName, node);
      }
    } else if (tag === 'DIV' && node.classList.contains('expandable-row')) {
      expandableEls.push(node);
    }
  }

  const templateMarkupMap = new Map<string, string | null>();
  for (const col of columns) {
    templateMarkupMap.set(col.name, getTemplateMarkup(el, `cell-${col.name}`));
  }

  // Track which row IDs we visited so we can prune stale fingerprint entries
  // (rows that scrolled out of the rendered window keep their last fingerprint
  // around so when they scroll back in we still detect changes — but rows
  // that are gone for good shouldn't grow the map indefinitely).
  const visitedRowIds = new Set<string>();
  const editingCellKey = controller.getEditingCellKey();
  const focusedCellKey = el.focusedCell
    ? `${el.focusedCell.rowId} ${el.focusedCell.columnName}`
    : null;
  const editingMoved = editingCellKey !== el.lastEditingCellKey;
  const focusedMoved = focusedCellKey !== el.lastFocusedCellKey;

  let expandableIndex = 0;
  for (let i = 0; i < itemsToRender.length; i++) {
    const item = itemsToRender[i]!;
    const displayIndex = startIndex + i;

    if (item.kind === 'group') {
      const group = asGroupItem(item);
      const target = groupEls.get(group.id);
      if (target) {
        patchGroupRow(el, target, group);
      }
      continue;
    }

    if (item.kind === 'expandable') {
      // Patch expandable rows so data changes are reflected even when the
      // fingerprint (which only tracks row identity) stays the same.
      const target = expandableEls[expandableIndex++];
      if (target) {
        const row = (item as DisplayItem & { row: GridRow }).row;
        const nextHtml = renderExpandableTemplate(el, row);
        if (target.innerHTML !== nextHtml) {
          target.innerHTML = nextHtml;
        }
      }
      continue;
    }

    if (!isRowItem(item)) continue;

    const row = item.row;
    visitedRowIds.add(row.id);
    const rowCells = cellEls.get(row.id);
    if (!rowCells) continue;

    // Per-row visual fingerprint — captures every input that drives
    // patchBodyCell's class / attrs / shell content. When this matches the
    // previous render's fingerprint AND the focused/editing cell hasn't
    // crossed in or out of this row, we can skip the per-cell patch entirely.
    // This is the hot path for selection / focus / expand toggles, where
    // most rows are visually unchanged but still walk the entire columns
    // loop in the previous implementation.
    const rowFingerprint = buildRowFingerprint(row, displayIndex, columns);
    const lastEntry = el.lastRowStateFingerprints.get(row.id);
    const editingTouchesRow =
      (editingCellKey !== null && editingCellKey.startsWith(`${row.id} `)) ||
      (el.lastEditingCellKey !== null && el.lastEditingCellKey.startsWith(`${row.id} `));
    const focusedTouchesRow =
      (focusedCellKey !== null && focusedCellKey.startsWith(`${row.id} `)) ||
      (el.lastFocusedCellKey !== null && el.lastFocusedCellKey.startsWith(`${row.id} `));

    // Skip when row identity (entity reference), visual fingerprint, and
    // the focused/editing cell positions are all unchanged. The entity
    // reference guard catches data-array swaps that produce a fresh row
    // instance with potentially new field values.
    const canSkip =
      lastEntry !== undefined &&
      lastEntry.fingerprint === rowFingerprint &&
      lastEntry.entity === row.entity &&
      !(editingMoved && editingTouchesRow) &&
      !(focusedMoved && focusedTouchesRow);

    if (canSkip) {
      // Even though we're skipping the per-cell DOM patch, the row's
      // framework-rendered slots must persist past the upcoming `flush()`.
      // `flush()` diffs `pendingCellSlots` against `lastCellSlots`; without
      // carrying the row's slots forward, every unchanged row in a structural
      // patch pass would emit a spurious `cellSlotsChanged removed` event,
      // tearing down framework wrappers' projected views (Angular embedded
      // views, React portals) that already match the DOM.
      el.frameworkSlots.carryRowCells(row.id);
      continue;
    }

    el.lastRowStateFingerprints.set(row.id, { fingerprint: rowFingerprint, entity: row.entity });

    for (const column of columns) {
      const target = rowCells.get(column.name);
      if (!target) continue;
      patchBodyCell(el, target, row, column, displayIndex, templateMarkupMap);
    }
  }

  // Prune fingerprint entries for rows that are no longer in the rendered
  // window. The map otherwise grows without bound across scroll passes.
  if (el.lastRowStateFingerprints.size > visitedRowIds.size) {
    for (const id of el.lastRowStateFingerprints.keys()) {
      if (!visitedRowIds.has(id)) el.lastRowStateFingerprints.delete(id);
    }
  }

  el.lastEditingCellKey = editingCellKey;
  el.lastFocusedCellKey = focusedCellKey;
}

/**
 * Per-row fingerprint of every input patchBodyCell reads off the row.
 * Stable across renders when nothing visual has changed; flips when
 * selection, focus, expand, dirty/saving/error, tree-expand, indent, or
 * the entity reference moves. Used as the skip key in patchExistingRows.
 *
 * Also samples per-column validation state — `validate.runValidators`
 * mutates fields directly on the row entity (`$$invalid<col>`), so we
 * read those keys here to detect validity flips even though the entity
 * reference is unchanged.
 */
function buildRowFingerprint(
  row: GridRow,
  displayIndex: number,
  visibleColumns: readonly GridColumnDef[],
): string {
  // Bit-packing flags into a single number keeps the fingerprint short.
  let flags = 0;
  if (row.isSelected) flags |= 1;
  if (row.isFocused) flags |= 2;
  if (row.expanded) flags |= 4;
  if (row.isDirty) flags |= 8;
  if (row.isSaving) flags |= 16;
  if (row.isError) flags |= 32;
  if (row.visible) flags |= 64;
  // Per-column validity bitmap. The validate module flags cells via
  // `$$invalid<col>` keys on the entity; without sampling them here a
  // selection-only refresh would skip cells whose validity just flipped.
  let invalidBits = '';
  const entity = row.entity as Record<string, unknown>;
  for (const col of visibleColumns) {
    invalidBits += entity[`$$invalid${col.name}`] ? '1' : '0';
  }
  return `${displayIndex}|${flags}|${row.treeLevel}|${row.height}|${row.expandedRowHeight}|${invalidBits}`;
}

/** Patch a group-row element's data-attrs. */
export function patchGroupRow(
  el: UiGridStandaloneElement,
  target: HTMLElement,
  group: GroupItem,
): void {
  const snapshot = el.snapshot!;
  const controller = el.controller!;
  const iconKey = group.collapsed ? 'groupCollapsed' : 'groupExpanded';
  const icon = el.icons.resolve(iconKey);
  setAttr(target, 'data-collapsed', group.collapsed ? 'true' : 'false');
  setAttr(target, 'data-field', group.field);
  setAttr(target, 'data-label', group.label);
  setAttr(target, 'data-count', String(group.count));
  setAttr(target, 'data-depth', String(group.depth));
  setAttr(target, 'data-disclosure-label', controller.groupDisclosureLabel(group));
  setAttr(target, 'data-icon-path', icon.path);
  setAttr(target, 'data-icon-view-box', icon.viewBox ?? '0 0 24 24');
  setAttr(target, 'data-rows-suffix', snapshot.labels.groupRowsSuffix);
}

/** Patch a body-cell element in place: class, sticky style, data-attrs,
 * and the cell-shell's interpolated content. */
export function patchBodyCell(
  el: UiGridStandaloneElement,
  cell: HTMLElement,
  row: GridRow,
  column: GridColumnDef,
  displayIndex: number,
  templateMarkupMap: Map<string, string | null>,
): void {
  const controller = el.controller!;
  const rowId = row.id;
  const columnName = column.name;
  const editing = controller.isEditingCell(rowId, columnName);
  const isPinned = controller.isPinned(column);
  const pinOffset = isPinned ? controller.pinnedOffset(column) : null;
  const stickyStyle = pinOffset ? `${pinOffset.side}:${pinOffset.offset};` : '';
  const isFocused =
    el.focusedCell?.rowId === rowId && el.focusedCell.columnName === columnName;
  const isPinnedLeftLast = controller.isPinnedLeftLast(column);
  const isPinnedRightFirst = controller.isPinnedRightFirst(column);
  const isOdd = displayIndex % 2 !== 0;
  const align = column.align ?? '';

  const isRowSelected = el.snapshot?.selectedRowIds.has(rowId) ?? false;
  const isRowFocused = el.snapshot?.focusedRowId === rowId;
  // Visual state is written directly (className / style) since the
  // <ui-grid-body-cell> custom element no longer translates data-* into
  // visual state. data-* attrs still drive event delegation and CSS hooks.
  const isCellInvalid = el.controller?.gridApi.validate.isInvalid(row.entity, column) ?? false;
  setClass(
    cell,
    bodyCellClass(
      isOdd,
      align,
      isPinned,
      isPinnedLeftLast,
      isPinnedRightFirst,
      isFocused,
      editing,
      isRowSelected,
      isRowFocused,
      row.isDirty,
      row.isSaving,
      row.isError,
      isCellInvalid,
    ),
  );
  setStyle(cell, stickyStyle);
  setAttr(cell, 'data-odd', String(isOdd));
  setAttr(cell, 'data-align', align);
  setAttr(cell, 'data-pinned', String(isPinned));
  setAttr(cell, 'data-pinned-left-last', String(isPinnedLeftLast));
  setAttr(cell, 'data-pinned-right-first', String(isPinnedRightFirst));
  setAttr(cell, 'data-focused', String(isFocused));
  setAttr(cell, 'data-editing', String(editing));
  setAttr(cell, 'data-sticky-style', stickyStyle);

  const cellShell = cell.querySelector<HTMLElement>(':scope > .cell-shell');
  if (!cellShell) return;

  const indentStyle = `padding-inline-start:${controller.cellIndent(row, column)}`;
  if (cellShell.getAttribute('style') !== indentStyle) {
    cellShell.setAttribute('style', indentStyle);
  }

  if (editing) {
    // Preserve the mounted <ui-grid-cell-editor> if present — just patch its
    // data-value. This is the path that preserves input focus + caret
    // across every keystroke's snapshot rebroadcast.
    const editor = cellShell.querySelector<HTMLElement>('ui-grid-cell-editor');
    const cellContent = cellShell.querySelector<HTMLElement>(':scope > .cell-content');
    if (editor && cellContent) {
      setAttr(editor, 'data-row', rowId);
      setAttr(editor, 'data-column', columnName);
      setAttr(editor, 'data-type', controller.editorInputType(column));
      setAttr(editor, 'data-value', el.snapshot?.editingValue ?? '');
      return;
    }
    // Transitioned from non-editing → editing: mount editor once by
    // rebuilding the cell-shell contents (toggles + cell-content + editor).
    const editingShellHtml = renderCellShellContents(el, row, column, displayIndex, true);
    if (cellShell.innerHTML !== editingShellHtml) {
      cellShell.innerHTML = editingShellHtml;
    }
    return;
  }

  // Not editing: rebuild the cell-shell's inner contents. This covers toggle
  // buttons (tree/expandable) which can appear/disappear as expandable slots
  // or tree rows come and go. The guard below skips the DOM write when the
  // rendered string matches the current DOM — steady-state typing / paging /
  // data refresh inside the same row layout is a no-op.
  const nextInner = renderCellShellContents(el, row, column, displayIndex, false, templateMarkupMap);
  if (cellShell.innerHTML !== nextInner) {
    cellShell.innerHTML = nextInner;
  }
}

/** Patch the pagination component's data-attrs without re-mounting it. */
export function patchPagination(
  el: UiGridStandaloneElement,
  paginationEl: HTMLElement,
  snapshot: GridControllerSnapshot,
): void {
  const pageSizes = snapshot.options.paginationPageSizes ?? [10, 25, 50, 100];
  const prevIcon = el.icons.resolve('paginationPrev');
  const nextIcon = el.icons.resolve('paginationNext');
  setAttr(
    paginationEl,
    'data-range-label',
    `${snapshot.firstRowIndex + 1}-${snapshot.lastRowIndex + 1} of ${snapshot.pipeline.totalItems}`,
  );
  setAttr(paginationEl, 'data-current-page', String(snapshot.currentPage));
  setAttr(paginationEl, 'data-total-pages', String(snapshot.totalPages));
  setAttr(paginationEl, 'data-page-label', snapshot.labels.paginationPage);
  setAttr(paginationEl, 'data-of-label', snapshot.labels.paginationOf);
  setAttr(paginationEl, 'data-prev-label', snapshot.labels.paginationPrevious);
  setAttr(paginationEl, 'data-next-label', snapshot.labels.paginationNext);
  setAttr(paginationEl, 'data-rows-label', snapshot.labels.paginationRows);
  setAttr(paginationEl, 'data-prev-icon-path', prevIcon.path);
  setAttr(paginationEl, 'data-prev-icon-view-box', prevIcon.viewBox ?? '0 0 24 24');
  setAttr(paginationEl, 'data-next-icon-path', nextIcon.path);
  setAttr(paginationEl, 'data-next-icon-view-box', nextIcon.viewBox ?? '0 0 24 24');
  setAttr(paginationEl, 'data-page-sizes', JSON.stringify(pageSizes));
  setAttr(paginationEl, 'data-page-size', String(snapshot.pageSize));
  setAttr(paginationEl, 'data-prev-disabled', String(snapshot.currentPage <= 1));
  setAttr(paginationEl, 'data-next-disabled', String(snapshot.currentPage >= snapshot.totalPages));
}

/** Read a consumer-provided `<template slot="…">` off the element. Duplicated
 * with `render.getTemplateMarkup` because the patch path needs it without
 * pulling in the whole render module's circular dependency. */
function getTemplateMarkup(el: UiGridStandaloneElement, slotName: string): string | null {
  const template = el.querySelector<HTMLTemplateElement>(`template[slot="${slotName}"]`);
  return template?.innerHTML ?? null;
}
