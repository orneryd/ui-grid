// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { UiGrid } from './UiGrid';

describe('server rendering', () => {
  it('renders the host without evaluating browser-only custom elements', () => {
    expect(typeof HTMLElement).toBe('undefined');
    const html = renderToString(createElement(UiGrid, {
      options: { id: 'ssr', data: [], columnDefs: [{ name: 'name' }] },
    }));
    expect(html).toContain('<div');
  });
});
