import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

describe('grid accessibility roles', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('exposes headers, filter cells, and data cells through row semantics', async () => {
    let api: UiGridApi | undefined;
    const grid = await mountVanillaUiGrid(
      document.getElementById('app')!,
      {
        id: 'accessibility-roles',
        enableFiltering: true,
        data: [
          { id: 'r1', name: 'Alpha', status: 'active' },
          { id: 'r2', name: 'Beta', status: 'inactive' },
        ],
        columnDefs: [{ name: 'name' }, { name: 'status' }],
        onRegisterApi: (registered) => {
          api = registered as UiGridApi;
        },
      },
      undefined,
      'ui-grid-element-accessibility-roles-test',
    );

    await waitFor(() => api);
    await waitFor(() => grid.shadowRoot?.querySelector('.body-cell'));

    const root = grid.shadowRoot!;
    expect(root.querySelector('.grid-frame')?.getAttribute('role')).toBe('grid');
    expect(root.querySelector('.header-grid')?.getAttribute('role')).toBe('row');
    expect(root.querySelectorAll('[role="columnheader"]')).toHaveLength(2);
    expect(root.querySelector('.filter-grid')?.getAttribute('role')).toBe('row');
    expect(root.querySelectorAll('.filter-grid [role="gridcell"]')).toHaveLength(2);

    const rows = [...root.querySelectorAll('.body-grid > [role="row"]')];
    expect(rows).toHaveLength(2);
    expect(rows[0]?.querySelectorAll('[role="gridcell"]')).toHaveLength(2);
    expect(rows[1]?.querySelectorAll('[role="gridcell"]')).toHaveLength(2);
  });
});
