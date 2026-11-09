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

describe('group row', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the column header, the grouped value and a singular suffix', async () => {
    let api: UiGridApi | undefined;
    const grid = await mountVanillaUiGrid(
      document.getElementById('app')!,
      {
        id: 'group-row',
        enableGrouping: true,
        grouping: { groupBy: ['current_status'] },
        data: [
          { id: 'a', done: true },
          { id: 'b', done: false },
          { id: 'c', done: false },
        ],
        columnDefs: [
          {
            name: 'current_status',
            displayName: 'Status',
            valueGetter: (row) => (row['done'] ? 'Finished <b>' : 'Open'),
          },
        ],
        onRegisterApi: (registered) => {
          api = registered as UiGridApi;
        },
      },
      undefined,
      'ui-grid-element-group-row-test',
    );
    await waitFor(() => api);
    const rows = await waitFor(() => {
      const found = [...(grid.shadowRoot?.querySelectorAll('ui-grid-group-row') ?? [])];
      return found.length === 2 && found.every((row) => row.shadowRoot?.textContent) ? found : null;
    });

    const text = rows.map((row) => [
      row.shadowRoot!.querySelector('strong')!.textContent,
      row.shadowRoot!.querySelector('strong + span')!.textContent,
    ]);
    expect(text).toEqual([
      ['Status: Finished <b>', '1 row'],
      ['Status: Open', '2 rows'],
    ]);
    expect(rows[0].shadowRoot!.querySelector('b')).toBeNull();
  });
});
