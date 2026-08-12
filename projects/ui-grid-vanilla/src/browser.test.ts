import { describe, expect, it } from 'vitest';

import './browser';

describe('browser entry', () => {
  it('auto-registers the standalone grid element', () => {
    expect(customElements.get('ui-grid-element')).toBeDefined();
  });
});
