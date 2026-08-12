import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import {
  mountVanillaUiGrid,
  type GridOptions,
  type UiGridApi,
  type VanillaUiGridElement,
} from './index';

/**
 * Infinite-scroll integration tests. Ports the behaviours from the old
 * ui.grid.infiniteScroll module and verifies the vanilla element's
 * scroll-handler wiring raises the right events and the public API
 * methods (dataLoaded/resetScroll/saveScrollPercentage/dataRemoved* /
 * setScrollDirections) flow through the controller state helpers.
 */

async function waitFor<T>(resolve: () => T | null | undefined, timeoutMs = 5000): Promise<T> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = resolve();
    if (value) return value;
    await new Promise((r) => window.setTimeout(r, 10));
  }
  throw new Error('Timed out waiting for expected state');
}

const TAG = 'ui-grid-element-vanilla-infinite-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  let capturedApi: UiGridApi | undefined;
  const data: Row[] = Array.from({ length: 200 }, (_, i) => ({
    id: `r${i}`,
    name: `Row ${i}`,
  }));
  const options: GridOptions = {
    id: 'infinite-scroll-grid',
    data,
    columnDefs: [{ name: 'name', displayName: 'Name' }],
    enableRowSelection: false,
    rowIdentity: (entity) => String((entity as Row).id),
    rowHeight: 20,
    virtualizationThreshold: 1,
    onRegisterApi: (api) => {
      capturedApi = api as UiGridApi;
    },
    ...overrides,
  };
  Object.defineProperty(options, '__api', { enumerable: false, get: () => capturedApi });
  return options;
}

function getApi(options: GridOptions): UiGridApi {
  const api = (options as unknown as { __api: UiGridApi | undefined }).__api;
  if (!api) throw new Error('Grid API was never registered');
  return api;
}

async function mountGrid(options: GridOptions): Promise<{
  grid: VanillaUiGridElement;
  shadow: ShadowRoot;
}> {
  const target = document.getElementById('app')!;
  const grid = await mountVanillaUiGrid(target, options, undefined, TAG);
  const shadow = await waitFor(() => grid.shadowRoot);
  await waitFor(() => shadow.querySelector('.grid-table'));
  return { grid, shadow };
}

function scrollGrid(shadow: ShadowRoot, top: number): void {
  const viewport = shadow.querySelector<HTMLElement>('.grid-body-viewport');
  if (!viewport) throw new Error('grid-body-viewport not rendered');
  viewport.scrollTop = top;
  // Patch clientHeight in jsdom so the maybeTriggerInfiniteScroll math
  // sees a viewport — jsdom otherwise returns 0 for clientHeight.
  Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 200 });
  viewport.dispatchEvent(new Event('scroll', { bubbles: true }));
}

async function waitFrame(): Promise<void> {
  // The scroll handler schedules work in rAF. Two rAFs + a micro-yield is
  // enough to flush the chain in jsdom.
  await new Promise((r) => requestAnimationFrame(() => r(undefined)));
  await new Promise((r) => requestAnimationFrame(() => r(undefined)));
  await new Promise((r) => window.setTimeout(r, 0));
}

describe('vanilla grid infinite scroll', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.innerHTML = '';
  });

  describe('events', () => {
    it('raises needLoadMoreData when the user scrolls near the bottom', async () => {
      const options = baseOptions({ infiniteScrollDown: true });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const listener = vi.fn();
      api.infiniteScroll.on.needLoadMoreData(listener);
      // Scroll near the end — viewport=200/row=20 → 10 rows visible,
      // threshold=20 (default), total=200 rows → trigger at startIndex>=170.
      scrollGrid(shadow, 200 * 20);
      await waitFrame();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('raises needLoadMoreDataTop when the user scrolls near the top (scrollUp=true)', async () => {
      const options = baseOptions({ infiniteScrollUp: true });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      // Start mid-grid.
      scrollGrid(shadow, 50 * 20);
      await waitFrame();
      const listener = vi.fn();
      api.infiniteScroll.on.needLoadMoreDataTop(listener);
      // Now scroll back near the top — startIndex ≤ threshold (20) fires top.
      scrollGrid(shadow, 0);
      await waitFrame();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not raise anything when enableInfiniteScroll is false', async () => {
      const options = baseOptions({
        enableInfiniteScroll: false,
        infiniteScrollDown: true,
      });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const listener = vi.fn();
      api.infiniteScroll.on.needLoadMoreData(listener);
      scrollGrid(shadow, 200 * 20);
      await waitFrame();
      expect(listener).not.toHaveBeenCalled();
    });

    it('suppresses the event when direction flag is off (default scrollUp=false)', async () => {
      const options = baseOptions(); // scrollUp defaults to false
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const listener = vi.fn();
      api.infiniteScroll.on.needLoadMoreDataTop(listener);
      scrollGrid(shadow, 0);
      await waitFrame();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('public API methods', () => {
    it('dataLoaded clears the loading flag so subsequent scrolls can trigger again', async () => {
      const options = baseOptions({ infiniteScrollDown: true });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const listener = vi.fn();
      api.infiniteScroll.on.needLoadMoreData(listener);
      scrollGrid(shadow, 200 * 20);
      await waitFrame();
      expect(listener).toHaveBeenCalledTimes(1);
      // Loading flag is now true; a second near-bottom scroll must NOT
      // retrigger until dataLoaded resets it.
      scrollGrid(shadow, 200 * 20 - 40);
      scrollGrid(shadow, 200 * 20);
      await waitFrame();
      expect(listener).toHaveBeenCalledTimes(1);
      // Reset loading flag — now the next near-bottom scroll fires again.
      await api.infiniteScroll.dataLoaded(true, true);
      await waitFrame();
      scrollGrid(shadow, 200 * 20 - 40);
      await waitFrame();
      scrollGrid(shadow, 200 * 20);
      await waitFrame();
      expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('setScrollDirections toggles which events fire', async () => {
      const options = baseOptions({ infiniteScrollUp: true, infiniteScrollDown: true });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      const topListener = vi.fn();
      api.infiniteScroll.on.needLoadMoreDataTop(topListener);
      api.infiniteScroll.setScrollDirections(false, true);
      scrollGrid(shadow, 0);
      await waitFrame();
      expect(topListener).not.toHaveBeenCalled();
    });

    it('saveScrollPercentage + dataRemovedTop update state without crashing', async () => {
      const options = baseOptions();
      await mountGrid(options);
      const api = getApi(options);
      // Should be no-op in jsdom but exercises the code paths.
      api.infiniteScroll.saveScrollPercentage();
      api.infiniteScroll.dataRemovedTop(true, true);
      api.infiniteScroll.dataRemovedBottom(true, true);
      expect(api.infiniteScroll).toBeDefined();
    });

    it('resetScroll returns the viewport to the top', async () => {
      const options = baseOptions({ infiniteScrollUp: true });
      const { shadow } = await mountGrid(options);
      const api = getApi(options);
      scrollGrid(shadow, 50 * 20);
      const viewport = shadow.querySelector<HTMLElement>('.grid-body-viewport')!;
      expect(viewport.scrollTop).toBeGreaterThan(0);
      api.infiniteScroll.resetScroll(true, true);
      expect(viewport.scrollTop).toBe(0);
    });
  });
});
