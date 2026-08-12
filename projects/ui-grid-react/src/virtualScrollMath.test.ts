import { describe, expect, it } from 'vitest';
import { calculateVirtualWindow } from './virtualScrollMath';

describe('virtualScrollMath', () => {
  it('calculates the default overscanned window deterministically', () => {
    expect(calculateVirtualWindow({
      itemCount: 100,
      itemSize: 44,
      viewportHeight: 220,
      scrollTop: 0,
    })).toEqual({
      visibleRange: { start: 0, end: 8 },
      totalHeight: 4400,
      offsetY: 0,
    });
  });

  it('calculates a scrolled window deterministically', () => {
    expect(calculateVirtualWindow({
      itemCount: 100,
      itemSize: 44,
      viewportHeight: 220,
      overscan: 3,
      scrollTop: 440,
    })).toEqual({
      visibleRange: { start: 7, end: 18 },
      totalHeight: 4400,
      offsetY: 308,
    });
  });

  it('handles zero item size safely', () => {
    expect(calculateVirtualWindow({
      itemCount: 10,
      itemSize: 0,
      viewportHeight: 220,
      scrollTop: 88,
    })).toEqual({
      visibleRange: { start: 0, end: 0 },
      totalHeight: 0,
      offsetY: 0,
    });
  });
});