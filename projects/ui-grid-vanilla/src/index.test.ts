import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ornery/ui-grid-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ornery/ui-grid-core')>();
  return {
    ...actual,
  };
});

import { defineUiGridElement, mountVanillaUiGrid } from './index';

describe('mountVanillaUiGrid', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    vi.clearAllMocks();
  });

  it('defines and mounts the standalone element with the provided options', async () => {
    const target = document.getElementById('app');
    if (!target) {
      throw new Error('Expected test root element');
    }

    const options = {
      id: 'vanilla-demo-grid',
      data: [{ name: 'Alice' }],
      columnDefs: [{ name: 'name' }],
    };

    const module = {
      default: vi.fn(async () => undefined),
    };

    const grid = await mountVanillaUiGrid(target, options, module);

    expect(module.default).toHaveBeenCalledTimes(1);
    expect(customElements.get('ui-grid-element')).toBeDefined();
    expect(grid.tagName.toLowerCase()).toBe('ui-grid-element');
    expect(grid.options).toStrictEqual(options);
    expect(target.firstElementChild).toBe(grid);
  });

  it('exposes defineUiGridElement compatibility alias', async () => {
    await defineUiGridElement('ui-grid-element');
    await defineUiGridElement('ui-grid-element');
    expect(customElements.get('ui-grid-element')).toBeDefined();
  });
});
