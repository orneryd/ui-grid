import { describe, expect, it } from 'vitest';
import { GRID_CORE_CSS } from './grid-core-styles';

describe('GRID_CORE_CSS pin menu z-index', () => {
  it('raises only pinned headers whose pin menu is open', () => {
    expect(GRID_CORE_CSS).toMatch(/\.header-cell\.is-pinned\.is-pin-menu-open\s*\{/);
    expect(GRID_CORE_CSS).not.toMatch(/(^|\})\s*\.header-cell\.is-pin-menu-open\s*\{/);
  });

  it('keeps an open unpinned header below the pinned cell layer so its pin menu cannot paint over pinned cells', () => {
    expect(GRID_CORE_CSS).toMatch(
      /\.header-cell\.is-pin-menu-open:not\(\.is-pinned\)\s*\{\s*z-index:\s*max\(0,\s*var\(--ui-grid-pinned-cell-z-index\)\s*-\s*1\)/,
    );
  });
});
