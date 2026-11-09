import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { GRID_CORE_CSS } from '@ornery/ui-grid-core';
import { mountVanillaUiGrid, type UiGridApi } from './index';

async function waitFor<T>(resolve: () => T | null | undefined, timeoutMs = 5000): Promise<T> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = resolve();
    if (value) return value;
    await new Promise((next) => window.setTimeout(next, 20));
  }
  throw new Error('Timed out waiting for expected element state');
}

describe('body scrollbar compensation', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('narrows the header and filter strips by the body scrollbar width', async () => {
    let api: UiGridApi | undefined;
    const grid = await mountVanillaUiGrid(
      document.getElementById('app')!,
      {
        id: 'scrollbar-compensation',
        enableFiltering: true,
        data: [{ id: 'r1', name: 'Alpha' }],
        columnDefs: [{ name: 'name' }],
        onRegisterApi: (registered) => {
          api = registered as UiGridApi;
        },
      },
      undefined,
      'ui-grid-element-scrollbar-test',
    );
    await waitFor(() => api);
    const root = grid.shadowRoot!;
    const viewport = await waitFor(() => root.querySelector<HTMLElement>('.grid-body-viewport'));
    Object.defineProperty(viewport, 'offsetWidth', { configurable: true, value: 1000 });
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: 985 });

    api!.core.refresh();

    const frame = root.querySelector<HTMLElement>('.grid-frame')!;
    await waitFor(() => frame.style.getPropertyValue('--ui-grid-scrollbar-width') === '15px');
    expect(GRID_CORE_CSS).toContain('width: calc(100% - var(--ui-grid-scrollbar-width, 0px))');
  });
});
