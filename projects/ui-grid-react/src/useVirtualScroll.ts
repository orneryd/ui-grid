import { useCallback, useRef, useState } from 'react';
import { calculateVirtualWindow } from './virtualScrollMath';

export interface UseVirtualScrollOptions {
  itemCount: number;
  itemSize: number;
  viewportHeight: number;
  overscan?: number;
}

export interface UseVirtualScrollResult {
  visibleRange: { start: number; end: number };
  totalHeight: number;
  offsetY: number;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  setScrollTop: (scrollTop: number) => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  scrollTop: number;
}

export function useVirtualScroll(options: UseVirtualScrollOptions): UseVirtualScrollResult {
  const { itemCount, itemSize, viewportHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const virtualWindow = calculateVirtualWindow({
    itemCount,
    itemSize,
    viewportHeight,
    overscan,
    scrollTop,
  });

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleRange: virtualWindow.visibleRange,
    totalHeight: virtualWindow.totalHeight,
    offsetY: virtualWindow.offsetY,
    onScroll,
    setScrollTop,
    viewportRef,
    scrollTop,
  };
}
