/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { getSortFn } from './row-sorter';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.row-sorter.wasm-runner.mjs', import.meta.url));

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

describe('grid.core.row-sorter wasm parity', () => {
  it('matches inferred sort kinds for serializable value shapes', () => {
    expect(runWasm('guessGridSortKind', { column: { name: 'revenue' }, rows: [{ revenue: 300 }, { revenue: null }] })).toBe('number');
    expect(runWasm('guessGridSortKind', { column: { name: 'active' }, rows: [{ active: true }, { active: false }] })).toBe('boolean');
    expect(runWasm('guessGridSortKind', { column: { name: 'name' }, rows: [{ name: 'Alpha' }, { name: 'beta' }] })).toBe('alpha');
    expect(runWasm('guessGridSortKind', { column: { name: 'revenueLabel' }, rows: [{ revenueLabel: '$2,400' }, { revenueLabel: 'invalid' }] })).toBe('numberString');
    expect(
      runWasm('guessGridSortKind', {
        column: { name: 'renewalDate', type: 'date' },
        rows: [{ renewalDate: '2026-03-01T00:00:00.000Z' }, { renewalDate: '2026-01-01T00:00:00.000Z' }],
      }),
    ).toBe('date');
  });

  it('matches numeric, boolean, alpha, and numeric-string ordering', () => {
    expect(
      runWasm('sortGridScalarValues', {
        column: { name: 'revenue' },
        rows: [{ revenue: 300 }, { revenue: null }, { revenue: 100 }],
        values: [300, null, 100],
      }),
    ).toEqual([300, null, 100].sort(getSortFn({ name: 'revenue' }, [{ revenue: 300 }, { revenue: null }, { revenue: 100 }])));

    expect(
      runWasm('sortGridScalarValues', {
        column: { name: 'active' },
        rows: [{ active: true }, { active: false }, { active: true }],
        values: [true, false, true],
      }),
    ).toEqual([true, false, true].sort(getSortFn({ name: 'active' }, [{ active: true }, { active: false }, { active: true }])));

    expect(
      runWasm('sortGridScalarValues', {
        column: { name: 'name' },
        rows: [{ name: 'gamma' }, { name: 'Alpha' }, { name: 'beta' }],
        values: ['gamma', 'Alpha', 'beta'],
      }),
    ).toEqual(['gamma', 'Alpha', 'beta'].sort(getSortFn({ name: 'name' }, [{ name: 'gamma' }, { name: 'Alpha' }, { name: 'beta' }])));

    expect(
      runWasm('sortGridScalarValues', {
        column: { name: 'revenueLabel' },
        rows: [{ revenueLabel: '$2,400' }, { revenueLabel: 'invalid' }, { revenueLabel: '$150' }],
        values: ['$2,400', 'invalid', '$150'],
      }),
    ).toEqual(
      ['$2,400', 'invalid', '$150'].sort(
        getSortFn({ name: 'revenueLabel' }, [{ revenueLabel: '$2,400' }, { revenueLabel: 'invalid' }, { revenueLabel: '$150' }]),
      ),
    );
  });

  it('matches date ordering when the column type is explicit', () => {
    expect(
      runWasm('sortGridScalarValues', {
        column: { name: 'renewalDate', type: 'date' },
        rows: [
          { renewalDate: '2026-03-01T00:00:00.000Z' },
          { renewalDate: '2026-01-01T00:00:00.000Z' },
          { renewalDate: '2026-02-01T00:00:00.000Z' },
        ],
        values: [
          '2026-03-01T00:00:00.000Z',
          '2026-01-01T00:00:00.000Z',
          '2026-02-01T00:00:00.000Z',
        ],
      }),
    ).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-02-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z',
    ]);
  });

  it('matches comparison edge cases', () => {
    expect(
      runWasm('compareGridSortValues', {
        column: { name: 'meta' },
        rows: [{ meta: { rank: 1 } }, { meta: { rank: 2 } }],
        left: { rank: 1 },
        right: { rank: 1 },
      }),
    ).toBe(0);

    expect(
      runWasm('compareGridSortValues', {
        column: { name: 'revenueLabel' },
        rows: [{ revenueLabel: '$120.50' }, { revenueLabel: 'n/a' }],
        left: 'n/a',
        right: '$120.50',
      }),
    ).toBe(1);

    expect(
      runWasm('compareGridSortValues', {
        column: { name: 'active' },
        rows: [{ active: true }],
        left: null,
        right: true,
      }),
    ).toBe(1);
  });
});
