import { afterEach, describe, expect, it } from 'vitest';

import { clearRustWasmGridEngine } from '@ornery/ui-grid-core';

import { mountVanillaUiGrid, type GridOptions, type VanillaUiGridElement } from './index';
import { formatPaginationRangeLabel } from './pagination-range-label';

const TAG = 'ui-grid-element-vanilla-pagination-label-test';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
}

async function waitFor<T>(resolve: () => T | null | undefined, timeoutMs = 5000): Promise<T> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = resolve();
    if (value) return value;
    await new Promise((r) => window.setTimeout(r, 10));
  }
  throw new Error('Timed out waiting for expected state');
}

function externalPagedOptions(data: Row[], totalItems: number): GridOptions {
  return {
    id: 'pagination-label-grid',
    data,
    totalItems,
    columnDefs: [{ name: 'name', displayName: 'Name' }],
    enablePagination: true,
    useExternalPagination: true,
    paginationPageSizes: [10],
    rowIdentity: (entity) => String((entity as Row).id),
  };
}

function paginationLabel(grid: VanillaUiGridElement): string | null {
  const pagination = grid.shadowRoot?.querySelector('ui-grid-pagination');
  return pagination?.getAttribute('data-range-label') ?? null;
}

describe('pager range label', () => {
  afterEach(() => {
    clearRustWasmGridEngine();
    document.body.replaceChildren();
  });

  it('reads "0 of 0" after the grid updates from rows to zero rows', async () => {
    const target = document.createElement('div');
    document.body.appendChild(target);
    const grid = await mountVanillaUiGrid(
      target,
      externalPagedOptions(
        [
          { id: 'r1', name: 'Alpha' },
          { id: 'r2', name: 'Beta' },
        ],
        2,
      ),
      undefined,
      TAG,
    );
    await waitFor(() => grid.shadowRoot?.querySelector('ui-grid-pagination'));
    expect(paginationLabel(grid)).toBe('1-2 of 2');

    grid.options = externalPagedOptions([], 0);

    const label = await waitFor(() => {
      const current = paginationLabel(grid);
      return current && current !== '1-2 of 2' ? current : null;
    });
    expect(label).toBe('0 of 0');
  });
});

describe('formatPaginationRangeLabel', () => {
  it('formats a populated page as a 1-based range', () => {
    expect(formatPaginationRangeLabel({ firstRowIndex: 10, lastRowIndex: 19, totalItems: 42 })).toBe('11-20 of 42');
  });

  it('formats an empty result as "0 of 0"', () => {
    expect(formatPaginationRangeLabel({ firstRowIndex: 0, lastRowIndex: 0, totalItems: 0 })).toBe('0 of 0');
  });
});
