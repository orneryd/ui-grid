import { afterEach, describe, expect, it } from 'vitest';
import { mountVanillaUiGrid } from './index';

describe('default filter accessibility', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('names each input from its column and updates names on option changes', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const grid = await mountVanillaUiGrid(container, {
      id: 'filter-accessibility',
      enableFiltering: true,
      data: [{ username: 'alex', email: 'a@example.com', id: '1' }],
      columnDefs: [
        { name: 'username', displayName: 'Username' },
        { name: 'email', displayName: 'Email' },
        { name: 'id', displayName: 'Identifier', enableFiltering: false },
      ],
    });
    const input = (name: string) => grid.shadowRoot!
      .querySelector(`ui-grid-filter-cell[data-column="${name}"]`)!
      .shadowRoot!.querySelector('input')!;
    expect(input('username').getAttribute('aria-label')).toBe('Filter… Username');
    expect(input('email').getAttribute('aria-label')).toBe('Filter… Email');
    expect(input('id').disabled).toBe(true);
    expect(input('id').getAttribute('aria-label')).toContain('Identifier');
    grid.options = { ...grid.options, columnDefs: [
      { name: 'username', displayName: 'User name' },
      { name: 'email', displayName: 'Email' },
      { name: 'id', displayName: 'Identifier', enableFiltering: false },
    ] };
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(input('username').getAttribute('aria-label')).toBe('Filter… User name');
  });
});
