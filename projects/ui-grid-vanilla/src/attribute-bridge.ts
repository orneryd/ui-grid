/**
 * Declarative attribute bridge.
 *
 * The grid element accepts its full `GridOptions` shape through HTML
 * attributes so it can be driven declaratively from any framework (or
 * plain HTML). This module owns:
 *
 *   - `OBSERVED_GRID_ATTRIBUTES`: the list passed to `observedAttributes`
 *   - `parseGridAttributeOptions(el)`: reads attributes off an element and
 *     returns the `Partial<GridOptions>` they describe
 *   - the individual attribute parsers (boolean / tri-state / number / JSON)
 *
 * The element keeps its own `attributeOptions` cache and `buildEffectiveOptions`
 * merge so JS-set properties can override attribute values, but the parsing
 * itself lives here.
 */

import type { GridColumnDef, GridOptions, GridRecord } from '@ornery/ui-grid-core';

/** The list passed to `static observedAttributes`. Every kebab-case name
 * that corresponds to a GridOptions field lives here. */
export const OBSERVED_GRID_ATTRIBUTES: readonly string[] = [
  // Scalar attributes
  'grid-id',
  'title',
  'row-height',
  'header-row-height',
  'pagination-page-size',
  'pagination-current-page',
  'total-items',
  'virtualization-threshold',
  'tree-children-field',
  'tree-indent',
  'expandable-row-height',
  'expandable-row-header-width',
  'empty-message',
  'infinite-scroll-rows-from-end',
  // JSON attributes
  'column-defs',
  'data',
  'grouping',
  'pagination-page-sizes',
  // Boolean flags
  'enable-sorting',
  'enable-filtering',
  'enable-grouping',
  'enable-pinning',
  'enable-column-moving',
  'enable-column-resizing',
  'enable-cell-edit',
  'enable-cell-edit-on-focus',
  'enable-pagination',
  'enable-pagination-controls',
  'use-external-pagination',
  'enable-expandable',
  'enable-tree-view',
  'show-tree-expand-no-children',
  'tree-row-header-always-visible',
  'enable-auto-resize',
  'enable-virtualization',
  'enable-infinite-scroll',
  'infinite-scroll-up',
  'infinite-scroll-down',
  // Selection — ported from ui.grid.selection options.
  'enable-row-selection',
  'multi-select',
  'no-unselect',
  'modifier-keys-to-multi-select',
  'enable-row-header-selection',
  'enable-full-row-selection',
  'enable-focus-row-on-row-header-click',
  'enable-select-row-on-focus',
  'enable-select-all',
  'enable-selection-batch-event',
  'enable-footer-total-selected',
  'selection-row-header-width',
];

/**
 * Read every supported attribute off the element and produce the
 * corresponding `Partial<GridOptions>`. Missing attributes are simply
 * absent from the result — the element merges this with its imperative
 * `options` setter so JS-set properties win.
 */
export function parseGridAttributeOptions(el: Element): Partial<GridOptions> {
  const out: Partial<GridOptions> = {};

  // Scalar string attributes
  const gridId = el.getAttribute('grid-id');
  if (gridId !== null) out.id = gridId;

  const title = el.getAttribute('title');
  if (title !== null) out.title = title;

  const emptyMessage = el.getAttribute('empty-message');
  if (emptyMessage !== null) out.emptyMessage = emptyMessage;

  const treeChildrenField = el.getAttribute('tree-children-field');
  if (treeChildrenField !== null) out.treeChildrenField = treeChildrenField;

  // Scalar number attributes
  const rowHeight = parseNumber(el, 'row-height');
  if (rowHeight !== undefined) out.rowHeight = rowHeight;

  const headerRowHeight = parseNumber(el, 'header-row-height');
  if (headerRowHeight !== undefined) out.headerRowHeight = headerRowHeight;

  const paginationPageSize = parseNumber(el, 'pagination-page-size');
  if (paginationPageSize !== undefined) out.paginationPageSize = paginationPageSize;

  const paginationCurrentPage = parseNumber(el, 'pagination-current-page');
  if (paginationCurrentPage !== undefined) out.paginationCurrentPage = paginationCurrentPage;

  const totalItems = parseNumber(el, 'total-items');
  if (totalItems !== undefined) out.totalItems = totalItems;

  const virtualizationThreshold = parseNumber(el, 'virtualization-threshold');
  if (virtualizationThreshold !== undefined) out.virtualizationThreshold = virtualizationThreshold;

  const treeIndent = parseNumber(el, 'tree-indent');
  if (treeIndent !== undefined) out.treeIndent = treeIndent;

  const expandableRowHeight = parseNumber(el, 'expandable-row-height');
  if (expandableRowHeight !== undefined) out.expandableRowHeight = expandableRowHeight;

  const expandableRowHeaderWidth = parseNumber(el, 'expandable-row-header-width');
  if (expandableRowHeaderWidth !== undefined) out.expandableRowHeaderWidth = expandableRowHeaderWidth;

  const infiniteScrollRowsFromEnd = parseNumber(el, 'infinite-scroll-rows-from-end');
  if (infiniteScrollRowsFromEnd !== undefined) out.infiniteScrollRowsFromEnd = infiniteScrollRowsFromEnd;

  // Boolean attributes
  const enableSorting = parseBoolean(el, 'enable-sorting');
  if (enableSorting !== undefined) out.enableSorting = enableSorting;

  const enableFiltering = parseBoolean(el, 'enable-filtering');
  if (enableFiltering !== undefined) out.enableFiltering = enableFiltering;

  const enableGrouping = parseBoolean(el, 'enable-grouping');
  if (enableGrouping !== undefined) out.enableGrouping = enableGrouping;

  const enablePinning = parseBoolean(el, 'enable-pinning');
  if (enablePinning !== undefined) out.enablePinning = enablePinning;

  const enableColumnMoving = parseBoolean(el, 'enable-column-moving');
  if (enableColumnMoving !== undefined) out.enableColumnMoving = enableColumnMoving;

  const enableColumnResizing = parseBoolean(el, 'enable-column-resizing');
  if (enableColumnResizing !== undefined) out.enableColumnResizing = enableColumnResizing;

  const enableCellEdit = parseBoolean(el, 'enable-cell-edit');
  if (enableCellEdit !== undefined) out.enableCellEdit = enableCellEdit;

  const enableCellEditOnFocus = parseBoolean(el, 'enable-cell-edit-on-focus');
  if (enableCellEditOnFocus !== undefined) out.enableCellEditOnFocus = enableCellEditOnFocus;

  const enablePagination = parseBoolean(el, 'enable-pagination');
  if (enablePagination !== undefined) out.enablePagination = enablePagination;

  const enablePaginationControls = parseBoolean(el, 'enable-pagination-controls');
  if (enablePaginationControls !== undefined) out.enablePaginationControls = enablePaginationControls;

  const useExternalPagination = parseBoolean(el, 'use-external-pagination');
  if (useExternalPagination !== undefined) out.useExternalPagination = useExternalPagination;

  const enableExpandable = parseBoolean(el, 'enable-expandable');
  if (enableExpandable !== undefined) out.enableExpandable = enableExpandable;

  const enableTreeView = parseBoolean(el, 'enable-tree-view');
  if (enableTreeView !== undefined) out.enableTreeView = enableTreeView;

  const showTreeExpandNoChildren = parseBoolean(el, 'show-tree-expand-no-children');
  if (showTreeExpandNoChildren !== undefined) out.showTreeExpandNoChildren = showTreeExpandNoChildren;

  const treeRowHeaderAlwaysVisible = parseBoolean(el, 'tree-row-header-always-visible');
  if (treeRowHeaderAlwaysVisible !== undefined) out.treeRowHeaderAlwaysVisible = treeRowHeaderAlwaysVisible;

  const enableAutoResize = parseBoolean(el, 'enable-auto-resize');
  if (enableAutoResize !== undefined) out.enableAutoResize = enableAutoResize;

  const enableVirtualization = parseBoolean(el, 'enable-virtualization');
  if (enableVirtualization !== undefined) out.enableVirtualization = enableVirtualization;

  const enableInfiniteScroll = parseTriStateBoolean(el, 'enable-infinite-scroll');
  if (enableInfiniteScroll !== undefined) out.enableInfiniteScroll = enableInfiniteScroll;

  const infiniteScrollUp = parseBoolean(el, 'infinite-scroll-up');
  if (infiniteScrollUp !== undefined) out.infiniteScrollUp = infiniteScrollUp;

  const infiniteScrollDown = parseBoolean(el, 'infinite-scroll-down');
  if (infiniteScrollDown !== undefined) out.infiniteScrollDown = infiniteScrollDown;

  // Selection — most flags default to true in the old grid, so we use
  // the tri-state parser to let consumers opt out with attr="false".
  const enableRowSelection = parseTriStateBoolean(el, 'enable-row-selection');
  if (enableRowSelection !== undefined) out.enableRowSelection = enableRowSelection;

  const multiSelect = parseTriStateBoolean(el, 'multi-select');
  if (multiSelect !== undefined) out.multiSelect = multiSelect;

  const noUnselect = parseTriStateBoolean(el, 'no-unselect');
  if (noUnselect !== undefined) out.noUnselect = noUnselect;

  const modifierKeysToMultiSelect = parseTriStateBoolean(el, 'modifier-keys-to-multi-select');
  if (modifierKeysToMultiSelect !== undefined) out.modifierKeysToMultiSelect = modifierKeysToMultiSelect;

  const enableRowHeaderSelection = parseTriStateBoolean(el, 'enable-row-header-selection');
  if (enableRowHeaderSelection !== undefined) out.enableRowHeaderSelection = enableRowHeaderSelection;

  const enableFullRowSelection = parseTriStateBoolean(el, 'enable-full-row-selection');
  if (enableFullRowSelection !== undefined) out.enableFullRowSelection = enableFullRowSelection;

  const enableFocusRowOnRowHeaderClick = parseTriStateBoolean(
    el,
    'enable-focus-row-on-row-header-click',
  );
  if (enableFocusRowOnRowHeaderClick !== undefined) out.enableFocusRowOnRowHeaderClick = enableFocusRowOnRowHeaderClick;

  const enableSelectRowOnFocus = parseTriStateBoolean(el, 'enable-select-row-on-focus');
  if (enableSelectRowOnFocus !== undefined) out.enableSelectRowOnFocus = enableSelectRowOnFocus;

  const enableSelectAll = parseTriStateBoolean(el, 'enable-select-all');
  if (enableSelectAll !== undefined) out.enableSelectAll = enableSelectAll;

  const enableSelectionBatchEvent = parseTriStateBoolean(el, 'enable-selection-batch-event');
  if (enableSelectionBatchEvent !== undefined) out.enableSelectionBatchEvent = enableSelectionBatchEvent;

  const enableFooterTotalSelected = parseTriStateBoolean(el, 'enable-footer-total-selected');
  if (enableFooterTotalSelected !== undefined) out.enableFooterTotalSelected = enableFooterTotalSelected;

  const selectionRowHeaderWidth = parseNumber(el, 'selection-row-header-width');
  if (selectionRowHeaderWidth !== undefined) out.selectionRowHeaderWidth = selectionRowHeaderWidth;

  // JSON attributes
  const columnDefs = parseJson<GridColumnDef[]>(el, 'column-defs');
  if (columnDefs !== undefined) out.columnDefs = columnDefs;

  const data = parseJson<GridRecord[]>(el, 'data');
  if (data !== undefined) out.data = data;

  const grouping = parseJson(el, 'grouping');
  if (grouping !== undefined && grouping !== null) {
    // Grouping is typed as `GridGroupingOptions` in core; we stay loose
    // here because the parse-time check already validated shape via
    // JSON.parse, and downstream merges don't care about the cast.
    out.grouping = grouping as GridOptions['grouping'];
  }

  const paginationPageSizes = parseJson<number[] | null>(el, 'pagination-page-sizes');
  if (paginationPageSizes !== undefined) out.paginationPageSizes = paginationPageSizes;

  return out;
}

/** Present attribute → true. Absent → undefined (no override). */
export function parseBoolean(el: Element, name: string): boolean | undefined {
  return el.hasAttribute(name) ? true : undefined;
}

/**
 * Tri-state boolean. Present + empty/"true" → true; "false"/"0"/"off" →
 * false; absent → undefined. Use for flags that default to true in the
 * model so consumers can opt out with `attr="false"` without removing
 * the attribute.
 */
export function parseTriStateBoolean(el: Element, name: string): boolean | undefined {
  if (!el.hasAttribute(name)) return undefined;
  const raw = el.getAttribute(name);
  if (raw === null) return undefined;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'off') return false;
  return true;
}

export function parseNumber(el: Element, name: string): number | undefined {
  const raw = el.getAttribute(name);
  if (raw === null) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseJson<T = unknown>(el: Element, name: string): T | undefined {
  const raw = el.getAttribute(name);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`<ui-grid-element>: invalid JSON in "${name}" attribute`, e);
    return undefined;
  }
}
