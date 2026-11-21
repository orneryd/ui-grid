import { afterEach, describe, expect, it } from 'vitest';
import { mountVanillaUiGrid } from './index';

describe('per-grid building components', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('uses custom tags only in the configured grid and patches their attributes', async () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    const options = {
      id: 'custom-components',
      data: [{ id: '1', name: 'Alpha' }, { id: '2', name: 'Beta' }],
      columnDefs: [{ name: 'name' }],
      enableFiltering: true,
      enablePagination: true,
      paginationPageSize: 1,
      components: { filterCell: 'example-filter', pagination: 'example-pager' },
    };
    const custom = await mountVanillaUiGrid(first, options);
    const standard = await mountVanillaUiGrid(second, { ...options, id: 'standard', components: undefined });
    const root = custom.shadowRoot!;
    const filter = root.querySelector('example-filter')!;
    const pager = root.querySelector('example-pager')!;
    expect(filter).not.toBeNull();
    expect(pager.getAttribute('data-range-label')).toContain('1');
    expect(standard.shadowRoot!.querySelector('ui-grid-filter-cell')).not.toBeNull();
    expect(standard.shadowRoot!.querySelector('ui-grid-pagination')).not.toBeNull();
    custom.options = { ...options, paginationPageSize: 2, labels: { filterPlaceholder: 'Find' } };
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(root.querySelector('example-filter')).toBe(filter);
    expect(filter.getAttribute('data-placeholder')).toBe('Find');
    expect(root.querySelector('example-pager')).toBe(pager);
    expect(pager.getAttribute('data-page-size')).toBe('2');
    custom.options = { ...options, components: undefined };
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(root.querySelector('ui-grid-filter-cell')).not.toBeNull();
    expect(root.querySelector('example-filter')).toBeNull();
  });
  it('renders and patches a custom group row', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const grid = await mountVanillaUiGrid(container, {
      id: 'custom-group',
      data: [{ id: '1', status: 'Open' }, { id: '2', status: 'Open' }],
      columnDefs: [{ name: 'status' }],
      enableGrouping: true,
      grouping: { groupBy: ['status'] },
      components: { groupRow: 'example-group' },
    });
    const group = grid.shadowRoot!.querySelector('example-group')!;
    expect(group.getAttribute('data-count')).toBe('2');
    grid.options = { ...grid.options, columnDefs: [{ name: 'status', displayName: 'State' }] };
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(grid.shadowRoot!.querySelector('example-group')).toBe(group);
    expect(group.getAttribute('data-column-label')).toBe('State');
  });

  it('rejects unsafe component tag markup', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const grid = await mountVanillaUiGrid(container, {
      id: 'invalid-component', data: [{ name: 'A' }], columnDefs: [{ name: 'name' }],
      enableFiltering: true, components: { filterCell: 'x-filter><img src=x>' },
    });
    expect(grid.shadowRoot!.querySelector('ui-grid-filter-cell')).not.toBeNull();
    expect(grid.shadowRoot!.querySelector('img')).toBeNull();
  });

  it('routes input from a custom filter through the grid', async () => {
    class ExampleFilter extends HTMLElement {
      connectedCallback() {
        this.className = 'filter-cell';
        const input = document.createElement('input');
        input.dataset['role'] = 'filter';
        input.dataset['column'] = this.getAttribute('data-column')!;
        this.append(input);
      }
    }
    if (!customElements.get('example-input-filter')) customElements.define('example-input-filter', ExampleFilter);
    const container = document.createElement('div');
    document.body.append(container);
    const grid = await mountVanillaUiGrid(container, {
      id: 'interactive-filter', data: [{ name: 'Alpha' }, { name: 'Beta' }],
      columnDefs: [{ name: 'name' }], enableFiltering: true,
      components: { filterCell: 'example-input-filter' },
    });
    const input = grid.shadowRoot!.querySelector('example-input-filter input') as HTMLInputElement;
    input.value = 'Alpha';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(grid.shadowRoot!.querySelectorAll('.body-cell')).toHaveLength(1);
    expect(grid.shadowRoot!.querySelector('.body-cell')?.textContent).toContain('Alpha');
  });

});
