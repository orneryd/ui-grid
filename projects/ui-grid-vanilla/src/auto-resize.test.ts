import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Unit tests for auto-height adjustment and ResizeObserver (enableAutoResize).
 *
 * These tests exercise the logic directly on the UiGridStandaloneElement class.
 * Because jsdom partially supports custom elements (the class must extend
 * HTMLElement at import time), we define a minimal mock before importing.
 */

// Provide a mock ResizeObserver before the element module loads.
const mockResizeObserverDisconnect = vi.fn();
let resizeObserverCallback: ResizeObserverCallback | null = null;
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObserverCallback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = mockResizeObserverDisconnect;
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

// requestAnimationFrame / cancelAnimationFrame for debounce tests.
let rafId = 0;
const rafCallbacks = new Map<number, FrameRequestCallback>();
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  const id = ++rafId;
  rafCallbacks.set(id, cb);
  return id;
});
vi.stubGlobal('cancelAnimationFrame', (id: number) => {
  rafCallbacks.delete(id);
});
function flushRaf() {
  for (const [id, cb] of rafCallbacks) {
    rafCallbacks.delete(id);
    cb(performance.now());
  }
}

import { defineStandaloneUiGridElement, UiGridStandaloneElement } from './ui-grid-standalone.element';

describe('autoAdjustHeight', () => {
  let element: UiGridStandaloneElement;

  beforeEach(async () => {
    document.body.innerHTML = '';
    await defineStandaloneUiGridElement('ui-grid-element-resize-test');
    element = document.createElement('ui-grid-element-resize-test') as unknown as UiGridStandaloneElement;
    document.body.appendChild(element);
  });

  it('sets host height to accommodate minRowsToShow + header + filter + pagination', () => {
    element.options = {
      id: 'test-grid',
      data: [{ name: 'Alice' }],
      columnDefs: [{ name: 'name' }],
      enableFiltering: true,
      enablePagination: true,
      enablePaginationControls: true,
      minRowsToShow: 5,
    };

    // After setting options, the element should have rendered and autoAdjustHeight
    // should have set a minimum height. Since clientHeight in jsdom defaults to 0,
    // the element's style.height should be set.
    const height = parseInt(element.style.height, 10);
    expect(height).toBeGreaterThan(0);

    // The minimum should include header + (5 rows * rowHeight).
    // Default rowHeight is 44 (from snapshot.rowSize), header ~50.
    // Exact values depend on render, but it must be >= 5*44 + 50 = 270.
    expect(height).toBeGreaterThanOrEqual(270);
  });

  it('does not set height when enableMinHeightCheck is false', () => {
    element.options = {
      id: 'test-grid',
      data: [{ name: 'Alice' }],
      columnDefs: [{ name: 'name' }],
      enableMinHeightCheck: false,
      minRowsToShow: 5,
    };

    // autoAdjustHeight bails when enableMinHeightCheck is false.
    // The height should not have been imperatively set (remains '' or unset).
    expect(element.style.height).toBe('');
  });

  it('defaults minRowsToShow to 10 when not specified', () => {
    element.options = {
      id: 'test-grid',
      data: [{ name: 'Alice' }],
      columnDefs: [{ name: 'name' }],
    };

    const height = parseInt(element.style.height, 10);
    // Default: 10 rows * 44px + header(50) = 490 minimum
    expect(height).toBeGreaterThanOrEqual(490);
  });
});

describe('enableAutoResize (ResizeObserver)', () => {
  let element: UiGridStandaloneElement;

  beforeEach(async () => {
    document.body.innerHTML = '';
    resizeObserverCallback = null;
    mockResizeObserverDisconnect.mockClear();
    rafCallbacks.clear();

    await defineStandaloneUiGridElement('ui-grid-element-resize-test');
    element = document.createElement('ui-grid-element-resize-test') as unknown as UiGridStandaloneElement;
  });

  it('creates a ResizeObserver on connectedCallback', () => {
    document.body.appendChild(element);
    expect(element.autoResizeObserver).not.toBeNull();
    expect(resizeObserverCallback).not.toBeNull();
  });

  it('disconnects the ResizeObserver on disconnectedCallback', () => {
    document.body.appendChild(element);
    expect(element.autoResizeObserver).not.toBeNull();

    element.remove();
    expect(mockResizeObserverDisconnect).toHaveBeenCalledTimes(1);
    expect(element.autoResizeObserver).toBeNull();
  });

  it('debounces resize events via requestAnimationFrame', () => {
    document.body.appendChild(element);
    element.options = {
      id: 'test-grid',
      data: [{ name: 'Alice' }],
      columnDefs: [{ name: 'name' }],
      enableMinHeightCheck: false,
    };

    const renderSpy = vi.spyOn(element as any, 'render');
    renderSpy.mockClear();

    // Simulate multiple rapid resize events
    const entries = [{ contentRect: { width: 500, height: 400 } }] as unknown as ResizeObserverEntry[];
    resizeObserverCallback!(entries, element.autoResizeObserver as unknown as ResizeObserver);
    resizeObserverCallback!(entries, element.autoResizeObserver as unknown as ResizeObserver);
    resizeObserverCallback!(entries, element.autoResizeObserver as unknown as ResizeObserver);

    // render should not have been called yet (debounced)
    expect(renderSpy).not.toHaveBeenCalled();

    // Flush the rAF
    flushRaf();

    // Only one render call from the debounced resize (no autoAdjustHeight
    // re-render because enableMinHeightCheck is false)
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('still re-renders on resize even with enableAutoResize false (column widths need recalculation)', () => {
    document.body.appendChild(element);
    element.options = {
      id: 'test-grid',
      data: [{ name: 'Alice' }],
      columnDefs: [{ name: 'name' }],
      enableAutoResize: false,
      enableMinHeightCheck: false,
    };

    const renderSpy = vi.spyOn(element as any, 'render');
    renderSpy.mockClear();

    const entries = [{ contentRect: { width: 500, height: 400 } }] as unknown as ResizeObserverEntry[];
    resizeObserverCallback!(entries, element.autoResizeObserver as unknown as ResizeObserver);

    flushRaf();

    // Resize always triggers render for column width recalculation
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('cancels pending rAF on teardown', () => {
    document.body.appendChild(element);
    element.options = {
      id: 'test-grid',
      data: [{ name: 'Alice' }],
      columnDefs: [{ name: 'name' }],
    };

    const renderSpy = vi.spyOn(element as any, 'render');
    renderSpy.mockClear();

    // Trigger resize
    const entries = [{ contentRect: { width: 500, height: 400 } }] as unknown as ResizeObserverEntry[];
    resizeObserverCallback!(entries, element.autoResizeObserver as unknown as ResizeObserver);

    // Remove before rAF fires
    element.remove();

    // Flush — should not call render since the handle was cancelled
    flushRaf();
    expect(renderSpy).not.toHaveBeenCalled();
  });
});
