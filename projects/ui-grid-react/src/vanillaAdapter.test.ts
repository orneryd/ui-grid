import { describe, expect, it, vi } from 'vitest';

import { mountUiGridCustomElement } from './vanillaAdapter';

describe('mountUiGridCustomElement', () => {
  it('mounts a custom element and applies grid options', async () => {
    const host = document.createElement('div');
    const ensureDefined = vi.fn(async (tagName: string) => {
      if (!customElements.get(tagName)) {
        customElements.define(tagName, class extends HTMLElement {});
      }
    });

    const options = {
      id: 'react-adapter-grid',
      data: [{ name: 'Alice' }],
      columnDefs: [{ name: 'name' }],
    };

    const mounted = await mountUiGridCustomElement(host, {
      options,
      tagName: 'ui-grid-react-adapter-test',
      ensureDefined,
    });

    expect(ensureDefined).toHaveBeenCalledWith('ui-grid-react-adapter-test');
    expect(host.firstElementChild).toBe(mounted.element);
    expect(mounted.element.options).toBe(options);

    mounted.unmount();
    expect(host.childElementCount).toBe(0);
  });
});
