export interface VirtualWindowRequest {
  itemCount: number;
  itemSize: number;
  viewportHeight: number;
  overscan?: number;
  scrollTop: number;
}

export interface VirtualWindowResult {
  visibleRange: { start: number; end: number };
  totalHeight: number;
  offsetY: number;
}

export function calculateVirtualWindow(request: VirtualWindowRequest): VirtualWindowResult {
  const overscan = request.overscan ?? 3;

  if (request.itemCount <= 0 || request.itemSize <= 0) {
    return {
      visibleRange: { start: 0, end: 0 },
      totalHeight: Math.max(0, request.itemCount) * Math.max(0, request.itemSize),
      offsetY: 0,
    };
  }

  const rawStart = Math.floor(request.scrollTop / request.itemSize) - overscan;
  const start = Math.max(0, rawStart);
  const rawEnd = rawStart + Math.ceil(request.viewportHeight / request.itemSize) + 2 * overscan;
  const end = Math.min(request.itemCount, rawEnd);

  return {
    visibleRange: { start, end },
    totalHeight: request.itemCount * request.itemSize,
    offsetY: start * request.itemSize,
  };
}