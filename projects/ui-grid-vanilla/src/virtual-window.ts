import type { DisplayItem } from '@ornery/ui-grid-core';

/**
 * Virtual-window math for the body region.
 *
 * `displayItems` is a mixed-height sequence: data / group rows render at
 * `rowSize`, while an expanded detail item (`kind: 'expandable'`) renders at
 * `detailRowHeight` (`expandableRowHeight`). Every virtual offset, window
 * start and spacer height therefore comes from a cumulative layout instead
 * of `index * rowSize`, otherwise each expanded detail row shifts everything
 * below it and the spacer is too short to scroll to the last row.
 */

export const DEFAULT_EXPANDABLE_ROW_HEIGHT = 150;
export const DEFAULT_WINDOW_OVERSCAN = 4;

/** Resolve the detail-row height used by the layout math. */
export function resolveDetailRowHeight(configured: number | undefined): number {
  const resolved = configured ?? DEFAULT_EXPANDABLE_ROW_HEIGHT;
  return Number.isFinite(resolved) && resolved > 0 ? resolved : 0;
}

export interface DisplayLayout {
  readonly itemCount: number;
  readonly rowSize: number;
  readonly detailRowHeight: number;
  /** Ascending indices of `kind === 'expandable'` items. */
  readonly expandedIndices: readonly number[];
  readonly totalHeight: number;
}

export interface DisplayWindowRequest {
  scrollTop: number;
  viewportHeight: number;
  overscan?: number;
}

export interface DisplayWindow {
  /** First rendered display-item index (overscanned). */
  startIndex: number;
  /** Exclusive end of the rendered display-item range (overscanned). */
  endIndex: number;
  /** Content-space top of `startIndex`; the virtual body's `top`. */
  offsetY: number;
  totalHeight: number;
  visibleRange: { start: number; end: number };
}

function toNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** Height contributed by `expandedCount` detail items and `rowCount` rows. */
function sumHeights(
  rowCount: number,
  expandedCount: number,
  rowSize: number,
  detailRowHeight: number,
): number {
  return rowCount * rowSize + expandedCount * detailRowHeight;
}

export function buildDisplayLayout(
  items: readonly DisplayItem[],
  rowSize: number,
  detailRowHeight: number,
): DisplayLayout {
  const resolvedRowSize = toNonNegative(rowSize);
  const resolvedDetailHeight = toNonNegative(detailRowHeight);
  const expandedIndices: number[] = [];
  for (let index = 0; index < items.length; index += 1) {
    if (items[index].kind === 'expandable') {
      expandedIndices.push(index);
    }
  }

  return {
    itemCount: items.length,
    rowSize: resolvedRowSize,
    detailRowHeight: resolvedDetailHeight,
    expandedIndices,
    totalHeight: sumHeights(
      items.length - expandedIndices.length,
      expandedIndices.length,
      resolvedRowSize,
      resolvedDetailHeight,
    ),
  };
}

const layoutCache = new WeakMap<readonly DisplayItem[], DisplayLayout>();

/**
 * Memoized {@link buildDisplayLayout}. The pipeline hands out a fresh
 * `displayItems` array whenever rows, sorting, filtering, grouping or
 * expansion state change, so identity is a safe cache key and scroll frames
 * stay O(log n) instead of rescanning every item.
 */
export function getDisplayLayout(
  items: readonly DisplayItem[],
  rowSize: number,
  detailRowHeight: number,
): DisplayLayout {
  const resolvedRowSize = toNonNegative(rowSize);
  const resolvedDetailHeight = toNonNegative(detailRowHeight);
  const cached = layoutCache.get(items);
  if (
    cached &&
    cached.rowSize === resolvedRowSize &&
    cached.detailRowHeight === resolvedDetailHeight
  ) {
    return cached;
  }

  const layout = buildDisplayLayout(items, resolvedRowSize, resolvedDetailHeight);
  layoutCache.set(items, layout);
  return layout;
}

/** Number of expanded detail items before `index` (binary search). */
function countExpandedBefore(expandedIndices: readonly number[], index: number): number {
  let low = 0;
  let high = expandedIndices.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (expandedIndices[mid] < index) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

/** Content-space top of display item `index`. `index === itemCount` is the end. */
export function displayItemTop(layout: DisplayLayout, index: number): number {
  const clamped = Math.min(Math.max(index, 0), layout.itemCount);
  const expandedBefore = countExpandedBefore(layout.expandedIndices, clamped);
  return sumHeights(
    clamped - expandedBefore,
    expandedBefore,
    layout.rowSize,
    layout.detailRowHeight,
  );
}

/** Rendered height of display item `index`. */
export function displayItemHeight(layout: DisplayLayout, index: number): number {
  if (index < 0 || index >= layout.itemCount) {
    return 0;
  }

  const before = countExpandedBefore(layout.expandedIndices, index);
  const throughItem = countExpandedBefore(layout.expandedIndices, index + 1);
  return throughItem > before ? layout.detailRowHeight : layout.rowSize;
}

/** Last display item whose top is at or above `top` (monotonic binary search). */
function findItemAt(layout: DisplayLayout, top: number): number {
  let low = 0;
  let high = layout.itemCount - 1;
  let found = 0;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (displayItemTop(layout, mid) <= top) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

export function calculateDisplayWindow(
  layout: DisplayLayout,
  request: DisplayWindowRequest,
): DisplayWindow {
  const overscanInput = request.overscan ?? DEFAULT_WINDOW_OVERSCAN;
  const overscan = Number.isFinite(overscanInput)
    ? Math.max(0, Math.floor(overscanInput))
    : DEFAULT_WINDOW_OVERSCAN;
  const viewportHeight = toNonNegative(request.viewportHeight);

  if (layout.itemCount === 0 || layout.rowSize <= 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      offsetY: 0,
      totalHeight: layout.totalHeight,
      visibleRange: { start: 0, end: 0 },
    };
  }

  // Collapsing detail rows shrinks the spacer; the browser clamps the real
  // scrollTop to the new maximum, so clamp here too or the window would
  // render past the end and leave a blank band.
  const maxScroll = Math.max(0, layout.totalHeight - viewportHeight);
  const scrollTop = Math.min(
    Number.isFinite(request.scrollTop) ? Math.max(0, request.scrollTop) : 0,
    maxScroll,
  );

  const startIndex = Math.max(0, findItemAt(layout, scrollTop) - overscan);
  const offsetY = displayItemTop(layout, startIndex);
  const windowEnd = scrollTop + viewportHeight;

  let endIndex = startIndex;
  let covered = offsetY;
  while (endIndex < layout.itemCount && covered < windowEnd) {
    covered += displayItemHeight(layout, endIndex);
    endIndex += 1;
  }

  endIndex = Math.min(layout.itemCount, Math.max(startIndex + 1, endIndex + overscan));

  return {
    startIndex,
    endIndex,
    offsetY,
    totalHeight: layout.totalHeight,
    visibleRange: { start: startIndex, end: endIndex },
  };
}
