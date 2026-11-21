import { describe, expect, it } from 'vitest';

import type { DisplayItem } from '@ornery/ui-grid-core';

import {
  DEFAULT_EXPANDABLE_ROW_HEIGHT,
  buildDisplayLayout,
  calculateDisplayWindow,
  displayItemHeight,
  displayItemTop,
  getDisplayLayout,
  resolveDetailRowHeight,
} from './virtual-window';

function rowItem(id: string): DisplayItem {
  return {
    kind: 'row',
    id,
    row: { id } as unknown as Extract<DisplayItem, { kind: 'row' }>['row'],
    visibleIndex: 0,
  };
}

function detailItem(id: string): DisplayItem {
  return {
    kind: 'expandable',
    id: `${id}:expandable`,
    row: { id } as unknown as Extract<DisplayItem, { kind: 'expandable' }>['row'],
  };
}

/** Row + optional detail item per row id, mirroring the pipeline's output. */
function itemsFor(ids: string[], expandedIds: readonly string[] = []): DisplayItem[] {
  const items: DisplayItem[] = [];
  for (const id of ids) {
    items.push(rowItem(id));
    if (expandedIds.includes(id)) {
      items.push(detailItem(id));
    }
  }
  return items;
}

function layoutFor(
  ids: string[],
  expandedIds: readonly string[] = [],
  rowSize = 30,
  detailRowHeight = 120,
) {
  return buildDisplayLayout(itemsFor(ids, expandedIds), rowSize, detailRowHeight);
}

const IDS = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9'];

describe('resolveDetailRowHeight', () => {
  it('falls back to the documented default', () => {
    expect(resolveDetailRowHeight(undefined)).toBe(DEFAULT_EXPANDABLE_ROW_HEIGHT);
    expect(DEFAULT_EXPANDABLE_ROW_HEIGHT).toBe(150);
  });

  it('honours a configured height', () => {
    expect(resolveDetailRowHeight(96)).toBe(96);
  });

  it('treats invalid heights as no contribution', () => {
    expect(resolveDetailRowHeight(0)).toBe(0);
    expect(resolveDetailRowHeight(-40)).toBe(0);
    expect(resolveDetailRowHeight(Number.NaN)).toBe(0);
  });
});

describe('buildDisplayLayout', () => {
  it('totals a uniform row set', () => {
    const layout = layoutFor(IDS);
    expect(layout.itemCount).toBe(10);
    expect(layout.expandedIndices).toEqual([]);
    expect(layout.totalHeight).toBe(300);
  });

  it('adds detail-row height for each expanded row', () => {
    // 10 rows + 2 detail items: 10 * 30 + 2 * 120 = 540.
    const layout = layoutFor(IDS, ['r1', 'r4']);
    expect(layout.itemCount).toBe(12);
    expect(layout.expandedIndices).toEqual([2, 6]);
    expect(layout.totalHeight).toBe(540);
  });

  it('shrinks back to the collapsed total', () => {
    expect(layoutFor(IDS, ['r1', 'r4']).totalHeight).toBe(540);
    expect(layoutFor(IDS).totalHeight).toBe(300);
  });

  it('keeps a zero-height detail item in the layout without adding height', () => {
    const layout = layoutFor(IDS, ['r2'], 30, 0);
    expect(layout.itemCount).toBe(11);
    expect(layout.expandedIndices).toEqual([3]);
    expect(layout.totalHeight).toBe(300);
  });
});

describe('getDisplayLayout', () => {
  it('memoizes per display-item array identity', () => {
    const items = itemsFor(IDS, ['r3']);
    expect(getDisplayLayout(items, 30, 120)).toBe(getDisplayLayout(items, 30, 120));
    expect(getDisplayLayout(items, 30, 90)).not.toBe(getDisplayLayout(items, 30, 120));
  });

  it('rebuilds when the expansion set changes', () => {
    expect(getDisplayLayout(itemsFor(IDS, ['r3']), 30, 120).totalHeight).toBe(420);
    expect(getDisplayLayout(itemsFor(IDS), 30, 120).totalHeight).toBe(300);
  });
});

describe('displayItemTop / displayItemHeight', () => {
  it('returns uniform offsets without detail rows', () => {
    const layout = layoutFor(IDS);
    expect(displayItemTop(layout, 0)).toBe(0);
    expect(displayItemTop(layout, 4)).toBe(120);
    expect(displayItemTop(layout, 10)).toBe(300);
    expect(displayItemHeight(layout, 4)).toBe(30);
  });

  it('shifts rows below every expanded detail row', () => {
    // Expanded r1 (item 2) and r4 (item 6) are 120 tall instead of 30.
    const layout = layoutFor(IDS, ['r1', 'r4']);
    expect(displayItemTop(layout, 0)).toBe(0);
    expect(displayItemTop(layout, 1)).toBe(30);
    expect(displayItemTop(layout, 2)).toBe(60);
    expect(displayItemHeight(layout, 2)).toBe(120);
    expect(displayItemTop(layout, 3)).toBe(180);
    expect(displayItemTop(layout, 4)).toBe(210);
    expect(displayItemTop(layout, 5)).toBe(240);
    expect(displayItemHeight(layout, 5)).toBe(30);
    expect(displayItemTop(layout, 6)).toBe(270);
    expect(displayItemHeight(layout, 6)).toBe(120);
    expect(displayItemTop(layout, 7)).toBe(390);
    expect(displayItemTop(layout, 12)).toBe(540);
  });

  it('clamps out-of-range indices', () => {
    const layout = layoutFor(IDS);
    expect(displayItemTop(layout, -3)).toBe(0);
    expect(displayItemTop(layout, 99)).toBe(300);
    expect(displayItemHeight(layout, -1)).toBe(0);
    expect(displayItemHeight(layout, 10)).toBe(0);
  });
});

describe('calculateDisplayWindow', () => {
  it('matches the uniform rowSize window', () => {
    const layout = layoutFor(IDS);
    expect(calculateDisplayWindow(layout, { scrollTop: 0, viewportHeight: 90 })).toEqual({
      startIndex: 0,
      endIndex: 7,
      offsetY: 0,
      totalHeight: 300,
      visibleRange: { start: 0, end: 7 },
    });

    const scrolled = calculateDisplayWindow(layout, { scrollTop: 150, viewportHeight: 90 });
    expect(scrolled.startIndex).toBe(1);
    expect(scrolled.offsetY).toBe(30);
    expect(scrolled.endIndex).toBe(10);
  });

  it('renders a whole expanded detail row when the window starts on it', () => {
    // r2 expanded: rows 0-2 at 0/30/60, detail item 3 spans 90..210.
    const layout = layoutFor(IDS, ['r2']);
    expect(calculateDisplayWindow(layout, { scrollTop: 90, viewportHeight: 60, overscan: 0 }))
      .toEqual({
        startIndex: 3,
        endIndex: 4,
        offsetY: 90,
        totalHeight: 420,
        visibleRange: { start: 3, end: 4 },
      });
  });

  it('offsets the window past a tall detail row instead of index * rowSize', () => {
    // Item 4 (r3) starts at 90 + 120 = 210, not 4 * 30 = 120.
    const layout = layoutFor(IDS, ['r2']);
    expect(displayItemTop(layout, 4)).toBe(210);
    expect(calculateDisplayWindow(layout, { scrollTop: 210, viewportHeight: 60, overscan: 0 }))
      .toEqual({
        startIndex: 4,
        endIndex: 6,
        offsetY: 210,
        totalHeight: 420,
        visibleRange: { start: 4, end: 6 },
      });
  });

  it('handles multiple expanded rows in one window', () => {
    // r0 (item 1) and r2 (item 4) expanded: item 5 (r3) starts at 330.
    const layout = layoutFor(IDS, ['r0', 'r2']);
    expect(layout.expandedIndices).toEqual([1, 4]);
    expect(displayItemTop(layout, 5)).toBe(330);
    expect(calculateDisplayWindow(layout, { scrollTop: 330, viewportHeight: 60, overscan: 0 }))
      .toEqual({
        startIndex: 5,
        endIndex: 7,
        offsetY: 330,
        totalHeight: 540,
        visibleRange: { start: 5, end: 7 },
      });
  });

  it('includes detail rows above the overscanned window start', () => {
    const layout = layoutFor(IDS, ['r1', 'r4']);
    expect(calculateDisplayWindow(layout, { scrollTop: 400, viewportHeight: 60 })).toEqual({
      startIndex: 3,
      endIndex: 12,
      offsetY: 180,
      totalHeight: 540,
      visibleRange: { start: 3, end: 12 },
    });
  });

  it('covers a detail row taller than the viewport', () => {
    const layout = layoutFor(['r0', 'r1'], ['r0'], 30, 400);
    expect(calculateDisplayWindow(layout, { scrollTop: 40, viewportHeight: 100 })).toEqual({
      startIndex: 0,
      endIndex: 3,
      offsetY: 0,
      totalHeight: 460,
      visibleRange: { start: 0, end: 3 },
    });
  });

  it('clamps scrollTop when collapsing shrinks the total height', () => {
    const expanded = layoutFor(IDS, ['r1', 'r2', 'r3']);
    expect(expanded.totalHeight).toBe(660);
    expect(calculateDisplayWindow(expanded, { scrollTop: 660, viewportHeight: 90 })).toEqual({
      startIndex: 6,
      endIndex: 13,
      offsetY: 360,
      totalHeight: 660,
      visibleRange: { start: 6, end: 13 },
    });

    // Same scrollTop after every detail row collapses: the spacer is 300 tall,
    // so the window must land on the last items rather than past the end.
    const collapsed = layoutFor(IDS);
    expect(calculateDisplayWindow(collapsed, { scrollTop: 660, viewportHeight: 90 })).toEqual({
      startIndex: 3,
      endIndex: 10,
      offsetY: 90,
      totalHeight: 300,
      visibleRange: { start: 3, end: 10 },
    });
  });

  it('handles an empty item set and a zero row size', () => {
    expect(calculateDisplayWindow(layoutFor([]), { scrollTop: 0, viewportHeight: 90 })).toEqual({
      startIndex: 0,
      endIndex: 0,
      offsetY: 0,
      totalHeight: 0,
      visibleRange: { start: 0, end: 0 },
    });

    expect(
      calculateDisplayWindow(layoutFor(IDS, ['r1'], 0, 120), {
        scrollTop: 60,
        viewportHeight: 90,
      }),
    ).toEqual({
      startIndex: 0,
      endIndex: 0,
      offsetY: 0,
      totalHeight: 120,
      visibleRange: { start: 0, end: 0 },
    });
  });

  it('always renders at least one item for a positive row size', () => {
    expect(
      calculateDisplayWindow(layoutFor(['r0']), { scrollTop: 0, viewportHeight: 0, overscan: 0 }),
    ).toEqual({
      startIndex: 0,
      endIndex: 1,
      offsetY: 0,
      totalHeight: 30,
      visibleRange: { start: 0, end: 1 },
    });
  });

  it('honours explicit overscan and ignores negative overscan', () => {
    const layout = layoutFor(IDS);
    expect(
      calculateDisplayWindow(layout, { scrollTop: 150, viewportHeight: 60, overscan: 0 })
        .startIndex,
    ).toBe(5);
    expect(
      calculateDisplayWindow(layout, { scrollTop: 150, viewportHeight: 60, overscan: -4 })
        .startIndex,
    ).toBe(5);
  });
});
