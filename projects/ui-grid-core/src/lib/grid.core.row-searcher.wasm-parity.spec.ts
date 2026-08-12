/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { FILTER_CONDITIONS } from './grid.constants';
import { getTerm, runColumnFilter, setupFilters } from './row-searcher';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.row-searcher.wasm-runner.mjs', import.meta.url));

function runWasm<T>(command: string, input?: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

describe('grid.core.row-searcher wasm parity', () => {
  it('matches term trimming semantics', () => {
    expect(runWasm('getGridFilterTerm', { term: '  Active  ' })).toBe(getTerm({ term: '  Active  ' }));
    expect(runWasm('getGridFilterTerm', { term: 42 })).toBe(getTerm({ term: 42 }));
    expect(runWasm('getGridFilterTerm', {})).toBeNull();
  });

  it('matches filter setup for ignored, wildcard, and literal cases', () => {
    expect(runWasm<any[]>('setupGridFilters', [{ term: undefined }])).toEqual([]);
    expect(runWasm<any[]>('setupGridFilters', [{ term: undefined, noTerm: true }])).toHaveLength(1);

    const [wildcard] = runWasm<any[]>('setupGridFilters', [{ term: 'Act*ve' }]);
    expect(wildcard.conditionTag).toBe('regex');
    expect(wildcard.matcherKind).toBeNull();

    const [fallback] = runWasm<any[]>('setupGridFilters', [{ term: 'a*a*a*a*a*a*a*a*a*a*' }]);
    expect(fallback.conditionTag).toBe('contains');
    expect(fallback.matcherKind).toBe('contains');

    const [contains] = runWasm<any[]>('setupGridFilters', [{ term: 'Act' }]);
    expect(contains.conditionTag).toBe('contains');
    expect(contains.matcherKind).toBe('contains');
  });

  it('matches text filtering behavior', () => {
    const cases = [
      { filter: { term: 'Act*ve' }, row: { status: 'Active' }, expected: true },
      { filter: { term: 'Act*ve' }, row: { status: 'Archive' }, expected: false },
      { filter: { term: 'a.b', condition: FILTER_CONDITIONS.contains }, row: { status: 'a.b' }, expected: true },
      { filter: { term: 'a.b', condition: FILTER_CONDITIONS.contains }, row: { status: 'axb' }, expected: false },
      { filter: { term: 'Act', condition: FILTER_CONDITIONS.startsWith }, row: { status: 'Active' }, expected: true },
      { filter: { term: 'ive', condition: FILTER_CONDITIONS.endsWith }, row: { status: 'Active' }, expected: true },
      { filter: { term: 'Active', condition: FILTER_CONDITIONS.exact }, row: { status: 'Pilot' }, expected: false },
      {
        filter: { term: 'Active', condition: FILTER_CONDITIONS.exact, rawTerm: true, flags: { caseSensitive: true } },
        row: { status: 'active' },
        expected: false,
      },
    ];

    for (const testCase of cases) {
      expect(
        runWasm('runGridColumnFilter', { row: testCase.row, column: { name: 'status' }, filter: testCase.filter }),
      ).toBe(runColumnFilter(testCase.row, { name: 'status' }, setupFilters([testCase.filter])[0]!));
      expect(
        runWasm('runGridColumnFilter', { row: testCase.row, column: { name: 'status' }, filter: testCase.filter }),
      ).toBe(testCase.expected);
    }
  });

  it('matches numeric and date comparison behavior', () => {
    const comparisonCases = [
      { filter: { term: '200', condition: FILTER_CONDITIONS.greaterThan }, row: { revenue: 250 }, column: { name: 'revenue' } },
      { filter: { term: '200', condition: FILTER_CONDITIONS.lessThanOrEqual }, row: { revenue: 200 }, column: { name: 'revenue' } },
      {
        filter: { term: '2026-02-01', condition: FILTER_CONDITIONS.greaterThanOrEqual, rawTerm: true, flags: { date: true } },
        row: { renewalDate: '2026-03-01' },
        column: { name: 'renewalDate' },
      },
      {
        filter: { term: '2026-02-01', condition: FILTER_CONDITIONS.greaterThanOrEqual, rawTerm: true, flags: { date: true } },
        row: { renewalDate: '2026-01-01' },
        column: { name: 'renewalDate' },
      },
    ];

    for (const testCase of comparisonCases) {
      expect(runWasm('runGridColumnFilter', testCase)).toBe(
        runColumnFilter(testCase.row, testCase.column, setupFilters([testCase.filter])[0]!),
      );
    }
  });
});
