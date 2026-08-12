import { getSortFn } from './row-sorter';

describe('getSortFn', () => {
  it('returns a custom sorting algorithm when one is provided', () => {
    const customSort = (left: unknown, right: unknown) => String(right).localeCompare(String(left));
    const sortFn = getSortFn(
      {
        name: 'name',
        sortingAlgorithm: customSort
      },
      [{ name: 'Bob' }, { name: 'Alice' }]
    );

    expect(sortFn).toBe(customSort);
    expect(['Bob', 'Alice'].sort(sortFn)).toEqual(['Bob', 'Alice']);
  });

  it('sorts numeric columns and pushes nullish values to the end', () => {
    const sortFn = getSortFn({ name: 'revenue' }, [{ revenue: 300 }, { revenue: null }, { revenue: 100 }]);

    expect([300, null, 100].sort(sortFn)).toEqual([100, 300, null]);
  });

  it('sorts boolean columns with false before true', () => {
    const sortFn = getSortFn({ name: 'active' }, [{ active: true }, { active: false }, { active: true }]);

    expect([true, false, true].sort(sortFn)).toEqual([false, true, true]);
  });

  it('sorts date columns chronologically', () => {
    const jan = new Date('2026-01-01T00:00:00.000Z');
    const mar = new Date('2026-03-01T00:00:00.000Z');
    const feb = new Date('2026-02-01T00:00:00.000Z');
    const sortFn = getSortFn({ name: 'renewalDate' }, [{ renewalDate: mar }, { renewalDate: jan }, { renewalDate: feb }]);

    expect([mar, jan, feb].sort(sortFn)).toEqual([jan, feb, mar]);
  });

  it('sorts currency-like strings numerically and keeps invalid values last', () => {
    const sortFn = getSortFn(
      { name: 'revenueLabel' },
      [{ revenueLabel: '$2,400' }, { revenueLabel: 'invalid' }, { revenueLabel: '$150' }]
    );

    expect(['$2,400', 'invalid', '$150'].sort(sortFn)).toEqual(['$150', '$2,400', 'invalid']);
  });

  it('sorts text case-insensitively when the values are strings', () => {
    const sortFn = getSortFn({ name: 'name' }, [{ name: 'gamma' }, { name: 'Alpha' }, { name: 'beta' }]);

    expect(['gamma', 'Alpha', 'beta'].sort(sortFn)).toEqual(['Alpha', 'beta', 'gamma']);
  });

  it('falls back to the basic sorter for unsupported value types and handles equality', () => {
    const shared = { rank: 1 };
    const other = { rank: 2 };
    const sortFn = getSortFn({ name: 'meta' }, [{ meta: shared }, { meta: other }]);

    expect(sortFn(shared, shared)).toBe(0);
    expect(sortFn(undefined, other)).toBe(1);
    expect(sortFn(shared, null)).toBe(-1);
  });

  it('handles numeric string edge cases including infinity and both-invalid comparisons', () => {
    const sortFn = getSortFn(
      { name: 'revenueLabel' },
      [{ revenueLabel: '$25' }, { revenueLabel: 'Infinity' }, { revenueLabel: 'invalid' }]
    );

    expect(['Infinity', '$25'].sort(sortFn)).toEqual(['$25', 'Infinity']);
    expect(sortFn('invalid', 'invalid')).toBe(0);
  });

  it('returns zero for equal booleans and equal dates', () => {
    const booleanSort = getSortFn({ name: 'active' }, [{ active: false }, { active: true }]);
    const dateSort = getSortFn({ name: 'renewalDate' }, [{ renewalDate: new Date('2026-01-01T00:00:00.000Z') }]);

    expect(booleanSort(false, false)).toBe(0);
    expect(dateSort(new Date('2026-01-01T00:00:00.000Z'), '2026-01-01T00:00:00.000Z')).toBe(0);
  });

  it('handles null and undefined consistently across inferred sorter types', () => {
    const numberSort = getSortFn({ name: 'revenue' }, [{ revenue: 1 }]);
    const alphaSort = getSortFn({ name: 'name' }, [{ name: 'Alpha' }]);
    const dateSort = getSortFn({ name: 'renewalDate' }, [{ renewalDate: new Date('2026-01-01T00:00:00.000Z') }]);
    const booleanSort = getSortFn({ name: 'active' }, [{ active: true }]);

    expect(numberSort(null, undefined)).toBe(0);
    expect(alphaSort(undefined, 'Alpha')).toBe(1);
    expect(dateSort('2026-01-01', null)).toBe(-1);
    expect(booleanSort(null, true)).toBe(1);
  });

  it('orders invalid numeric strings after valid numeric strings', () => {
    const sortFn = getSortFn(
      { name: 'revenueLabel' },
      [{ revenueLabel: '$120.50' }, { revenueLabel: 'n/a' }]
    );

    expect(sortFn('n/a', '$120.50')).toBe(1);
    expect(sortFn('$120.50', 'n/a')).toBe(-1);
    expect(sortFn('n/a', 'still n/a')).toBe(0);
  });
});