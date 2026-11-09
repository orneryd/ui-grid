import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { adoptStyles } from './adopt-styles';
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

describe('theming hooks', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function mount() {
    let api: UiGridApi | undefined;
    const grid = await mountVanillaUiGrid(
      document.getElementById('app')!,
      {
        id: 'theming-hooks',
        enableFiltering: true,
        enablePinning: true,
        data: [{ id: 'r1', name: 'Alpha' }],
        columnDefs: [{ name: 'name' }],
        onRegisterApi: (registered) => {
          api = registered as UiGridApi;
        },
      },
      undefined,
      'ui-grid-element-theming-test',
    );
    await waitFor(() => api);
    await waitFor(() => grid.shadowRoot?.querySelector('.body-cell'));
    return grid;
  }

  it('renders the documented part hooks', async () => {
    const root = (await mount()).shadowRoot!;
    const parts = new Set([...root.querySelectorAll('[part]')].map((node) => node.getAttribute('part')));
    for (const part of ['grid-frame', 'header', 'header-cell', 'header-label', 'header-actions', 'pin-menu', 'filter-cell', 'body-cell']) {
      expect(parts, part).toContain(part);
    }
  });

  it('keeps addStyles sheets after the grid sheets, and removes them', async () => {
    const grid = await mount();
    const root = grid.shadowRoot!;
    const remove = grid.addStyles('.body-cell{color:red}');
    const added = root.adoptedStyleSheets.at(-1)!;

    adoptStyles(root, '.late{color:blue}', {});
    expect(root.adoptedStyleSheets.at(-1)).toBe(added);

    remove();
    expect(root.adoptedStyleSheets).not.toContain(added);
  });
});
