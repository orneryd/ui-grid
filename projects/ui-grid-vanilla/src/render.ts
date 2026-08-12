/**
 * Pure markup builders used by the grid element's initial-render and patch
 * paths. Every function here returns an HTML string — none of them touch
 * the DOM or the element's scroll state. The element's top-level `render()`
 * / `renderFull()` / `renderPatch()` orchestrators wire these into the
 * actual mount pipeline.
 *
 * The element is passed in as the first argument; these functions read its
 * internal state (controller / snapshot / focusedCell / …) directly.
 * TypeScript's @internal JSDoc markers on those fields document the
 * coupling — nothing outside this package should depend on the fields.
 */

import {
  SORT_DIRECTIONS,
  buildGridHeaderContext,
  canGridMoveColumns,
  formatGridHeaderDisplayValue,
  getCellValue,
  type DisplayItem,
  type GridColumnDef,
  type GridOptions,
  type GridRecord,
  type GridRow,
} from '@ornery/ui-grid-core';
import type { GridControllerSnapshot } from './grid-controller';
import {
  cellSlotNameForRow,
  expandableRowSlotName,
  filterSlotName,
  groupRowSlotName,
  headerSlotName,
} from './framework-slots';
import {
  cellEditorMarkup,
  cellValueMarkup,
  defaultExpandableMarkup,
  emptyDataMarkup,
  expandToggleMarkup,
  expandableRowMarkup,
  resizerMarkup,
  slotRegistryMarkup,
  treeToggleMarkup,
} from './templates';
import type { UiGridStandaloneElement } from './ui-grid-standalone.element';
import { bodyCellClass, headerCellClass } from './utils/cell-class';
import { asGroupItem, isRowItem } from './utils/display-items';
import { escapeHtml } from './utils/dom';

/**
 * Render a single column's header cell. Emits the selection-row-header
 * variant, the framework-rendered `<slot>` variant, or the full
 * header-cell markup with sort / group / pin / resize chrome.
 */
export function renderHeaderCell(
  el: UiGridStandaloneElement,
  column: GridColumnDef,
  sortEnabled: boolean,
  groupingEnabled: boolean,
  pinningEnabled: boolean,
  options: GridOptions,
): string {
  const controller = el.controller!;
  // Row-header selection column — emit a select-all checkbox instead of
  // the normal column header controls.
  if (column.name === 'selectionRowHeaderCol') {
    const resolvedSel = controller.getResolvedSelectionOptions();
    const selectAll = el.snapshot?.selectAll === true;
    const showSelectAll = resolvedSel.enableSelectAll && resolvedSel.multiSelect;
    const inner = showSelectAll
      ? `<button type="button" class="ui-grid-selection-select-all" data-action="select-all" aria-label="Select all rows"${selectAll ? ' aria-checked="true"' : ' aria-checked="false"'}><span class="ui-grid-selection-checkbox${selectAll ? ' ui-grid-selection-checkbox-checked' : ''}"></span></button>`
      : '';
    return `<ui-grid-header-cell class="header-cell ui-grid-selection-row-header" data-column="selectionRowHeaderCol">${inner}</ui-grid-header-cell>`;
  }

  // Framework-rendered header: emit a bare cell with a slot placeholder.
  // Sort / group / pin chrome is surrendered to the wrapper — consumers
  // who just want to restyle the label should keep the default path.
  if (el.frameworkSlots.hasHeader(column.name)) {
    el.frameworkSlots.stageHeader(column);
    const slotName = headerSlotName(column);
    const isPinned = controller.isPinned(column);
    const pinOffset = isPinned ? controller.pinnedOffset(column) : null;
    const stickyStyle = pinOffset ? `${pinOffset.side}:${pinOffset.offset};` : '';
    return `<ui-grid-header-cell class="header-cell"${stickyStyle ? ` style="${escapeHtml(stickyStyle)}"` : ''} data-column="${escapeHtml(column.name)}" data-pinned="${isPinned}" data-sticky-style="${escapeHtml(stickyStyle)}"><slot name="${escapeHtml(slotName)}"></slot></ui-grid-header-cell>`;
  }

  const sortDirection = controller.getSortDirection(column);
  const sortLabel = controller.sortButtonLabel(column);
  const groupingLabel = controller.groupingButtonLabel(column);
  const canSort = sortEnabled && controller.isColumnSortable(column);
  const canGroup = groupingEnabled && column.enableGrouping !== false;
  const canPin = pinningEnabled && controller.isColumnPinnable(column);
  const isPinned = controller.isPinned(column);
  const pinOffset = isPinned ? controller.pinnedOffset(column) : null;
  const stickyStyle = pinOffset ? `${pinOffset.side}:${pinOffset.offset};` : '';

  const sortIconKey =
    sortDirection === SORT_DIRECTIONS.asc
      ? 'sortAsc'
      : sortDirection === SORT_DIRECTIONS.desc
        ? 'sortDesc'
        : 'sortNone';

  const pinLabel = isPinned
    ? (el.snapshot?.labels.unpin ?? 'Unpin')
    : (el.snapshot?.labels.pinColumn ?? 'Pin');
  const canResize = controller.canResizeColumns() && column.enableColumnResizing !== false;
  const headerValue = escapeHtml(formatGridHeaderDisplayValue(buildGridHeaderContext(column)));
  const resizerHtml = canResize
    ? resizerMarkup(escapeHtml(column.name), escapeHtml(headerValue))
    : '';

  const isPinnedLeftLast = controller.isPinnedLeftLast(column);
  const isPinnedRightFirst = controller.isPinnedRightFirst(column);
  const isPinMenuOpen = el.openPinMenuColumn === column.name;
  const isDragTarget = el.dropTargetColumnName === column.name;
  const isDragging = el.draggedColumnName === column.name;
  const isDraggable = canGridMoveColumns(options) && column.enableColumnMoving !== false;
  const className = headerCellClass(
    sortDirection !== SORT_DIRECTIONS.none,
    isPinned,
    isPinnedLeftLast,
    isPinnedRightFirst,
    isPinMenuOpen,
    isDragTarget,
    isDragging,
  );
  // className/style/draggable are pre-computed here so the <ui-grid-header-cell>
  // upgrade is a no-op at parse time. `data-*` stay for event delegation.
  return `<ui-grid-header-cell class="${className}"${isDraggable ? ' draggable="true"' : ''}${stickyStyle ? ` style="${escapeHtml(stickyStyle)}"` : ''} data-column="${escapeHtml(column.name)}" data-sort-active="${sortDirection !== SORT_DIRECTIONS.none}" data-pinned="${isPinned}" data-pinned-left-last="${isPinnedLeftLast}" data-pinned-right-first="${isPinnedRightFirst}" data-pin-menu-open="${isPinMenuOpen}" data-drag-target="${isDragTarget}" data-dragging="${isDragging}" data-draggable="${isDraggable}" data-sticky-style="${escapeHtml(stickyStyle)}"><span class="header-label">${headerValue}</span><span class="header-actions">${canSort ? `<button type="button" class="header-action" data-action="sort" data-column="${escapeHtml(column.name)}" aria-label="${escapeHtml(sortLabel)}">${el.icons.renderControlIcon(sortIconKey)}<span class="sr-only">${escapeHtml(sortLabel)}</span></button>` : ''}${canGroup ? `<button type="button" class="chip-action${controller.isColumnGrouped(column) ? ' chip-action-active' : ''}" data-action="group" data-column="${escapeHtml(column.name)}" aria-label="${escapeHtml(groupingLabel)}">${el.icons.renderControlIcon('group')}<span class="sr-only">${escapeHtml(groupingLabel)}</span></button>` : ''}${canPin ? `<div class="pin-control${isPinMenuOpen ? ' pin-control-open' : ''}"><button type="button" class="chip-action pin-trigger${isPinned ? ' chip-action-active' : ''}" data-action="pin-trigger" data-column="${escapeHtml(column.name)}" aria-label="${escapeHtml(pinLabel)}">${el.icons.renderControlIcon('pin')}<span class="sr-only">${escapeHtml(pinLabel)}</span></button><div class="pin-menu" role="menu" aria-label="${escapeHtml(pinLabel)}"><button type="button" class="pin-menu-action" data-action="pin-left" data-column="${escapeHtml(column.name)}" aria-label="${escapeHtml(el.snapshot?.labels.pinLeft ?? 'Pin left')}">${el.icons.renderIconWithClass('control-icon', 'pinLeft')}<span class="sr-only">${escapeHtml(el.snapshot?.labels.pinLeft ?? 'Pin left')}</span></button><button type="button" class="pin-menu-action" data-action="pin-right" data-column="${escapeHtml(column.name)}" aria-label="${escapeHtml(el.snapshot?.labels.pinRight ?? 'Pin right')}">${el.icons.renderIconWithClass('control-icon', 'pinRight')}<span class="sr-only">${escapeHtml(el.snapshot?.labels.pinRight ?? 'Pin right')}</span></button></div></div>` : ''}</span>${resizerHtml}</ui-grid-header-cell>`;
}

/** Render the filter-row cell for one column. Selection column gets a bare
 * spacer div; framework-rendered columns get a `<slot>`; everything else
 * renders a `<ui-grid-filter-cell>` component with data-attributes. */
export function renderFilterCell(el: UiGridStandaloneElement, column: GridColumnDef): string {
  if (column.name === 'selectionRowHeaderCol') {
    const pinOffset = el.controller!.isPinned(column) ? el.controller!.pinnedOffset(column) : null;
    const stickyStyle = pinOffset ? `${pinOffset.side}:${pinOffset.offset};` : '';
    return `<div class="filter-cell ui-grid-selection-row-header" data-column="selectionRowHeaderCol"${stickyStyle ? ` style="${escapeHtml(stickyStyle)}"` : ''}></div>`;
  }
  const value = el.snapshot?.activeFilters[column.name] ?? '';
  const controller = el.controller!;
  const canFilter = controller.isColumnFilterable(column);
  const pinOffset = controller.isPinned(column) ? controller.pinnedOffset(column) : null;
  const stickyStyle = pinOffset ? `${pinOffset.side}:${pinOffset.offset};` : '';

  if (el.frameworkSlots.hasFilter(column.name)) {
    el.frameworkSlots.stageFilter(column, value, controller.filterPlaceholder(column), !canFilter);
    const slotName = filterSlotName(column);
    return `<div class="filter-cell ui-grid-filter-container" data-column="${escapeHtml(column.name)}"${stickyStyle ? ` style="${escapeHtml(stickyStyle)}"` : ''}><slot name="${escapeHtml(slotName)}"></slot></div>`;
  }

  return `<ui-grid-filter-cell data-column="${escapeHtml(column.name)}" data-value="${escapeHtml(value)}" data-placeholder="${escapeHtml(controller.filterPlaceholder(column))}" data-disabled="${!canFilter}" data-pinned="${controller.isPinned(column)}" data-pinned-left-last="${controller.isPinnedLeftLast(column)}" data-pinned-right-first="${controller.isPinnedRightFirst(column)}" data-sticky-style="${escapeHtml(stickyStyle)}"></ui-grid-filter-cell>`;
}

/** Render one display-item: group row, expandable row, or the cells of a
 * regular data row. */
export function renderDisplayItem(
  el: UiGridStandaloneElement,
  item: DisplayItem,
  displayIndex: number,
): string {
  if (!el.snapshot || !el.controller) return '';

  if (item.kind === 'group') {
    const group = asGroupItem(item);
    if (el.frameworkSlots.hasGroupRow()) {
      el.frameworkSlots.stageGroupRow(group);
      const slotName = groupRowSlotName(group);
      return `<div class="group-row ui-grid-row ui-grid-group-row" data-group="${escapeHtml(group.id)}" style="grid-column:1 / -1"><slot name="${escapeHtml(slotName)}"></slot></div>`;
    }
    const iconKey = group.collapsed ? 'groupCollapsed' : 'groupExpanded';
    const icon = el.icons.resolve(iconKey);
    const disclosureLabel = el.controller.groupDisclosureLabel(group);
    return `<ui-grid-group-row data-action="toggle-group" data-group="${escapeHtml(group.id)}" data-collapsed="${group.collapsed ? 'true' : 'false'}" data-field="${escapeHtml(group.field)}" data-label="${escapeHtml(group.label)}" data-count="${group.count}" data-depth="${group.depth}" data-disclosure-label="${escapeHtml(disclosureLabel)}" data-icon-path="${icon.path}" data-icon-view-box="${icon.viewBox ?? '0 0 24 24'}" data-rows-suffix="${escapeHtml(el.snapshot.labels.groupRowsSuffix)}"></ui-grid-group-row>`;
  }

  if (item.kind === 'expandable') {
    const row = (item as DisplayItem & { row: GridRow }).row;
    return expandableRowMarkup(renderExpandableTemplate(el, row));
  }

  if (!isRowItem(item)) return '';

  return el.snapshot.visibleColumns
    .map((column) => renderBodyCell(el, item.row, column, displayIndex))
    .join('');
}

/** Render one body cell including its pin / focus / edit / validation
 * chrome. The inner `.cell-content` is produced by `renderCellTemplate`. */
export function renderBodyCell(
  el: UiGridStandaloneElement,
  row: GridRow,
  column: GridColumnDef,
  displayIndex: number,
): string {
  if (!el.snapshot || !el.controller) return '';

  const controller = el.controller;
  const rowId = row.id;
  const columnName = column.name;
  const editing = controller.isEditingCell(rowId, columnName);
  const pinOffset = controller.isPinned(column) ? controller.pinnedOffset(column) : null;
  const treeToggle = controller.showTreeToggle(row, column)
    ? (() => {
        const treeIconKey = controller.isTreeRowExpanded(row) ? 'treeExpanded' : 'treeCollapsed';
        const treeIcon = el.icons.resolve(treeIconKey);
        return treeToggleMarkup(
          escapeHtml(rowId),
          escapeHtml(controller.treeToggleLabel(row)),
          treeIcon.viewBox ?? '0 0 24 24',
          treeIcon.path,
        );
      })()
    : '';
  const expandToggle = controller.showExpandToggle(row, column)
    ? (() => {
        const expIconKey = row.expanded ? 'expandExpanded' : 'expandCollapsed';
        const expIcon = el.icons.resolve(expIconKey);
        return expandToggleMarkup(
          escapeHtml(rowId),
          escapeHtml(controller.expandToggleLabel(row)),
          expIcon.viewBox ?? '0 0 24 24',
          expIcon.path,
        );
      })()
    : '';

  const content = editing
    ? cellEditorMarkup(
        escapeHtml(rowId),
        escapeHtml(columnName),
        escapeHtml(controller.editorInputType(column)),
        escapeHtml(el.snapshot.editingValue),
      )
    : renderCellTemplate(el, row, column, displayIndex);

  const isFocused =
    el.focusedCell?.rowId === rowId && el.focusedCell.columnName === columnName;
  const stickyStyle = pinOffset ? `${pinOffset.side}:${pinOffset.offset};` : '';
  const isPinned = controller.isPinned(column);
  const isPinnedLeftLast = controller.isPinnedLeftLast(column);
  const isPinnedRightFirst = controller.isPinnedRightFirst(column);
  const align = column.align ?? '';
  const isRowSelected = el.snapshot?.selectedRowIds.has(rowId) ?? false;
  const isRowFocused = el.snapshot?.focusedRowId === rowId;
  const isCellInvalid = controller.gridApi.validate.isInvalid(row.entity, column);
  const className = bodyCellClass(
    displayIndex % 2 !== 0,
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
  );
  // When invalid, surface the joined validator messages as a title attr —
  // matches the old `getTitleFormattedErrors` contract.
  const titleAttr = isCellInvalid
    ? ` title="${escapeHtml(controller.gridApi.validate.getTitleFormattedErrors(row.entity, column))}"`
    : '';
  return `<ui-grid-body-cell class="${className}" tabindex="0"${stickyStyle ? ` style="${escapeHtml(stickyStyle)}"` : ''}${titleAttr} data-row="${escapeHtml(rowId)}" data-column="${escapeHtml(columnName)}" data-odd="${displayIndex % 2 !== 0}" data-align="${escapeHtml(align)}" data-pinned="${isPinned}" data-pinned-left-last="${isPinnedLeftLast}" data-pinned-right-first="${isPinnedRightFirst}" data-focused="${isFocused}" data-editing="${editing}" data-sticky-style="${escapeHtml(stickyStyle)}"><div class="cell-shell" style="padding-inline-start:${escapeHtml(controller.cellIndent(row, column))}">${treeToggle}${expandToggle}<div class="cell-content">${content}</div></div></ui-grid-body-cell>`;
}

/** Render the contents of `.cell-shell` (tree/expand toggles + the
 * interpolated cell content). Used by the patch path to replace inner
 * HTML without rebuilding the body-cell wrapper. */
export function renderCellShellContents(
  el: UiGridStandaloneElement,
  row: GridRow,
  column: GridColumnDef,
  displayIndex: number,
  editing: boolean,
  templateMarkupMap?: Map<string, string | null>,
): string {
  const controller = el.controller!;
  const rowId = row.id;
  const columnName = column.name;
  const treeToggle = controller.showTreeToggle(row, column)
    ? (() => {
        const treeIconKey = controller.isTreeRowExpanded(row) ? 'treeExpanded' : 'treeCollapsed';
        const treeIcon = el.icons.resolve(treeIconKey);
        return treeToggleMarkup(
          escapeHtml(rowId),
          escapeHtml(controller.treeToggleLabel(row)),
          treeIcon.viewBox ?? '0 0 24 24',
          treeIcon.path,
        );
      })()
    : '';
  const expandToggle = controller.showExpandToggle(row, column)
    ? (() => {
        const expIconKey = row.expanded ? 'expandExpanded' : 'expandCollapsed';
        const expIcon = el.icons.resolve(expIconKey);
        return expandToggleMarkup(
          escapeHtml(rowId),
          escapeHtml(controller.expandToggleLabel(row)),
          expIcon.viewBox ?? '0 0 24 24',
          expIcon.path,
        );
      })()
    : '';
  const content = editing
    ? cellEditorMarkup(
        escapeHtml(rowId),
        escapeHtml(columnName),
        escapeHtml(controller.editorInputType(column)),
        escapeHtml(el.snapshot?.editingValue ?? ''),
      )
    : templateMarkupMap
      ? renderCellTemplateFromMarkup(el, row, column, displayIndex, templateMarkupMap.get(columnName) ?? null)
      : renderCellTemplate(el, row, column, displayIndex);
  return `${treeToggle}${expandToggle}<div class="cell-content">${content}</div>`;
}

/** Pagination footer markup. Reads page-size options + labels + icons off
 * the snapshot; emits a `<ui-grid-pagination>` component with data-* attrs. */
export function renderPagination(
  el: UiGridStandaloneElement,
  snapshot: GridControllerSnapshot,
): string {
  const pageSizes = snapshot.options.paginationPageSizes ?? [10, 25, 50, 100];
  const prevIcon = el.icons.resolve('paginationPrev');
  const nextIcon = el.icons.resolve('paginationNext');
  return `<ui-grid-pagination data-range-label="${escapeHtml(`${snapshot.firstRowIndex + 1}-${snapshot.lastRowIndex + 1} of ${snapshot.pipeline.totalItems}`)}" data-current-page="${snapshot.currentPage}" data-total-pages="${snapshot.totalPages}" data-page-label="${escapeHtml(snapshot.labels.paginationPage)}" data-of-label="${escapeHtml(snapshot.labels.paginationOf)}" data-prev-label="${escapeHtml(snapshot.labels.paginationPrevious)}" data-next-label="${escapeHtml(snapshot.labels.paginationNext)}" data-rows-label="${escapeHtml(snapshot.labels.paginationRows)}" data-prev-icon-path="${prevIcon.path}" data-prev-icon-view-box="${prevIcon.viewBox ?? '0 0 24 24'}" data-next-icon-path="${nextIcon.path}" data-next-icon-view-box="${nextIcon.viewBox ?? '0 0 24 24'}" data-page-sizes="${escapeHtml(JSON.stringify(pageSizes))}" data-page-size="${snapshot.pageSize}" data-prev-disabled="${snapshot.currentPage <= 1}" data-next-disabled="${snapshot.currentPage >= snapshot.totalPages}"></ui-grid-pagination>`;
}

/** Hidden `<slot>` registry block so the element's shadow DOM exposes a
 * named slot for every visible column's default `<template slot="cell-…">`
 * markup. Matches the old grid's slot-exposure contract. */
export function renderSlotRegistry(columns: readonly GridColumnDef[]): string {
  const cellSlots = columns
    .map((column) => `<slot name="${escapeHtml(`cell-${column.name}`)}"></slot>`)
    .join('');
  return slotRegistryMarkup(cellSlots);
}

/** Render the inner `.cell-content` of one cell — the value interpolated
 * through a consumer template, or the default display value. */
export function renderCellTemplate(
  el: UiGridStandaloneElement,
  row: GridRow,
  column: GridColumnDef,
  displayIndex: number,
): string {
  const templateMarkup = getTemplateMarkup(el, `cell-${column.name}`);
  return renderCellTemplateFromMarkup(el, row, column, displayIndex, templateMarkup);
}

/** Render the inner `.cell-content` from a pre-fetched template markup
 * string. Used by the patch path which resolves templates once per column
 * and reuses the result across every cell. */
export function renderCellTemplateFromMarkup(
  el: UiGridStandaloneElement,
  row: GridRow,
  column: GridColumnDef,
  displayIndex: number,
  templateMarkup: string | null,
): string {
  // Special-case the selection row-header column — render a checkbox
  // whose checked state tracks the row's isSelected. Matches the old
  // selectionRowHeaderButtons template.
  if (column.name === 'selectionRowHeaderCol') {
    const checked = el.snapshot?.selectedRowIds.has(row.id) ?? false;
    const disabled = row.enableSelection === false;
    return `<span class="ui-grid-selection-row-header-buttons" role="checkbox" tabindex="-1"${checked ? ' aria-checked="true"' : ' aria-checked="false"'}${disabled ? ' aria-disabled="true"' : ''}><span class="ui-grid-selection-checkbox${checked ? ' ui-grid-selection-checkbox-checked' : ''}${disabled ? ' ui-grid-selection-checkbox-disabled' : ''}"></span></span>`;
  }

  // Framework-rendered path: emit a per-cell slot placeholder and register
  // the slot so the post-render diff includes it in `added` if new.
  if (el.frameworkSlots.hasCell(column.name)) {
    el.frameworkSlots.stageCell(column, row, rowIndexFor(el, row, displayIndex));
    const slotName = cellSlotNameForRow(column, row);
    return `<slot name="${escapeHtml(slotName)}"></slot>`;
  }

  if (!templateMarkup) {
    return cellValueMarkup(escapeHtml(el.controller?.displayValue(row, column) ?? ''));
  }

  const rawRow = row.entity as GridRecord;
  const rawValue = getCellValue(rawRow, column);
  const valueText = rawValue == null ? '' : String(rawValue);
  return el.interpolateTemplate(templateMarkup, {
    $implicit: rawValue,
    value: rawValue,
    valueText,
    valueLower: valueText.toLowerCase(),
    row: rawRow,
    column,
    rowIndex: rowIndexFor(el, row, displayIndex),
  });
}

/** Render the body of an expandable detail row — either a framework slot
 * placeholder or the interpolated `<template slot="expandable-row">`. */
export function renderExpandableTemplate(
  el: UiGridStandaloneElement,
  row: GridRow,
): string {
  if (el.frameworkSlots.hasExpandableRow()) {
    el.frameworkSlots.stageExpandableRow(row, rowIndexFor(el, row));
    const slotName = expandableRowSlotName(row);
    return `<slot name="${escapeHtml(slotName)}"></slot>`;
  }

  const templateMarkup = getTemplateMarkup(el, 'expandable-row');
  if (!templateMarkup) {
    return defaultExpandableMarkup(escapeHtml(String(row.entity['name'] ?? row.id)));
  }

  return el.interpolateTemplate(templateMarkup, {
    $implicit: row.entity,
    row: row.entity,
    expanded: row.expanded,
    rowIndex: rowIndexFor(el, row),
  });
}

/** Render the no-data empty-state panel. In framework-rendered mode,
 * stages the singleton `empty` slot and emits a slot placeholder. */
export function renderEmptyState(
  el: UiGridStandaloneElement,
  headingRaw: string,
  descriptionRaw: string,
): string {
  if (el.frameworkSlots.hasEmptyState()) {
    if (el.snapshot) {
      el.frameworkSlots.stageEmptyState(headingRaw, descriptionRaw, el.snapshot.labels);
    }
    return `<div class="empty-state ui-grid-no-row-overlay"><slot name="empty"></slot></div>`;
  }
  return emptyDataMarkup(escapeHtml(headingRaw), escapeHtml(descriptionRaw));
}

/** Read a consumer-provided `<template slot="…">` out of the element's
 * light DOM. Returns the template's innerHTML or null when absent. */
export function getTemplateMarkup(
  el: UiGridStandaloneElement,
  slotName: string,
): string | null {
  const template = el.querySelector<HTMLTemplateElement>(`template[slot="${slotName}"]`);
  return template?.innerHTML ?? null;
}

/** Resolve the visible-rows index for a given row, falling back to the
 * render-pass displayIndex when the row isn't in `visibleRows`. */
export function rowIndexFor(
  el: UiGridStandaloneElement,
  row: GridRow,
  fallback = 0,
): number {
  return (
    el.snapshot?.pipeline.visibleRows.findIndex((candidate) => candidate.id === row.id) ?? fallback
  );
}
