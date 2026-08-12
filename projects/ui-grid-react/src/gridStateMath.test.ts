import { describe, expect, it } from 'vitest';
import type { GridColumnDef } from '@ornery/ui-grid-core';
import {
  buildGridTemplateColumns,
  computeViewportHeightPx,
  computeViewportRows,
  formatPaginationSummary,
  orderVisibleColumns,
  resolveBenchmarkIterations,
} from './gridStateMath';

describe('gridStateMath', () => {
  const columns: GridColumnDef[] = [
    { name: 'status', width: '2fr' },
    { name: 'owner', visible: false },
    { name: 'revenue', width: '120px' },
    { name: 'customer' },
  ];

  it('orders only visible columns by the provided column order', () => {
    expect(
      orderVisibleColumns(columns, ['customer', 'revenue', 'status', 'owner']).map(
        (column) => column.name,
      ),
    ).toEqual(['customer', 'revenue', 'status']);
  });

  it('builds grid template columns deterministically', () => {
    expect(
      buildGridTemplateColumns(orderVisibleColumns(columns, ['status', 'revenue', 'customer'])),
    ).toBe('2fr 120px minmax(11rem, 1fr)');
  });

  it('resolves benchmark iterations with a minimum of one', () => {
    expect(resolveBenchmarkIterations(undefined, undefined)).toBe(25);
    expect(resolveBenchmarkIterations(undefined, 7)).toBe(7);
    expect(resolveBenchmarkIterations(0, 7)).toBe(1);
  });

  it('formats pagination summaries', () => {
    expect(formatPaginationSummary(0, 0, 0)).toBe('0-0 of 0');
    expect(formatPaginationSummary(42, 10, 19)).toBe('11-20 of 42');
  });

  it('computes viewport height and viewport rows', () => {
    expect(computeViewportHeightPx(undefined, undefined)).toBe('440px');
    expect(computeViewportHeightPx(620, 480)).toBe('620px');
    expect(computeViewportRows(undefined, undefined)).toBe(10);
    expect(computeViewportRows(220, 44)).toBe(5);
  });
});
