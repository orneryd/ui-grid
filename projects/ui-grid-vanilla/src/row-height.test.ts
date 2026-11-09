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

describe('virtual row height', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('holds virtualized rows to rowHeight', async () => {
    let api: UiGridApi | undefined;
    const grid = await mountVanillaUiGrid(
      document.getElementById('app')!,
      {
        id: 'row-height',
        rowHeight: 60,
        virtualizationThreshold: 5,
        data: Array.from({ length: 50 }, (_, i) => ({ id: `r${i}`, name: `Row ${i}` })),
        columnDefs: [{ name: 'name' }],
        onRegisterApi: (registered) => {
          api = registered as UiGridApi;
        },
      },
      undefined,
      'ui-grid-element-row-height-test',
    );
    await waitFor(() => api);
    const spacer = await waitFor(() =>
      grid.shadowRoot?.querySelector<HTMLElement>('.grid-virtual-spacer'),
    );

    expect(spacer.style.getPropertyValue('--ui-grid-row-height')).toBe('60px');
    expect(spacer.style.height).toBe('3000px');
    expect(GRID_CORE_CSS).toMatch(
      /\.grid-virtual-body > :not\(\.expandable-row\) \{[^}]*height: var\(--ui-grid-row-height\)/,
    );
  });
});
