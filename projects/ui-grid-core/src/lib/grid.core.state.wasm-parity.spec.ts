/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { SORT_DIRECTIONS } from './grid.constants';
import {
  buildGridSavedState,
  isSafeStateKey,
  normalizeBooleanMap,
  normalizeGridSavedState,
  sanitizeDownloadFilename,
} from './grid.core.state';
import { GridSavedState } from './grid.models';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.state.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(
    process.execPath,
    ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return JSON.parse(output) as T;
}

/**
 * The Rust `GridSavedState` always emits every field (Vec / BTreeMap default-empty).
 * The TS `GridSavedState` declares them all as optional and `buildGridSavedState`
 * itself populates every field unconditionally — *except* `pinning`, which is
 * undefined when no pinned columns are passed. Normalize both shapes for
 * comparison: drop empty arrays / objects on both sides so the absence of
 * `pinning` (TS) compares equal to `pinning: {}` (Rust).
 */
function normalizeShapeForCompare(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.length === 0 ? undefined : value.map(normalizeShapeForCompare);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const normalized = normalizeShapeForCompare(v);
      if (normalized === undefined) continue;
      if (
        normalized !== null &&
        typeof normalized === 'object' &&
        !Array.isArray(normalized) &&
        Object.keys(normalized).length === 0
      ) {
        continue;
      }
      out[k] = normalized;
    }
    return out;
  }
  return value;
}

describe('grid.core.state wasm parity', () => {
  it('matches buildGridSavedState across full and minimal contexts', { timeout: 30000 }, () => {
    const cases: Parameters<typeof buildGridSavedState>[0][] = [
      {
        columnOrder: ['name', 'status'],
        activeFilters: { status: 'Active' },
        sortState: { columnName: 'name', direction: SORT_DIRECTIONS.asc },
        groupByColumns: ['status'],
        currentPage: 2,
        pageSize: 25,
        totalItems: 100,
        expandedRows: { r1: true },
        expandedTreeRows: {},
        pinnedColumns: { name: 'left' as const },
      },
      {
        columnOrder: [],
        activeFilters: {},
        sortState: { columnName: null, direction: SORT_DIRECTIONS.none },
        groupByColumns: [],
        currentPage: 1,
        pageSize: 0,
        totalItems: 0,
        expandedRows: {},
        expandedTreeRows: {},
      },
    ];

    for (const c of cases) {
      const ts = buildGridSavedState(c);
      const wasm = runWasm<GridSavedState>('buildGridSavedState', c);
      expect(normalizeShapeForCompare(wasm)).toEqual(normalizeShapeForCompare(ts));
    }
  });

  it('matches normalizeGridSavedState round-trips', { timeout: 30000 }, () => {
    const cases: GridSavedState[] = [
      {},
      {
        columnOrder: ['name', '__proto__', 'status'],
        filters: { name: 'A', __proto__: 'evil', status: 'Active' },
      },
      {
        sort: { columnName: 'rev', direction: SORT_DIRECTIONS.desc },
        pagination: { paginationCurrentPage: 3, paginationPageSize: 50 },
      },
      {
        sort: { columnName: '__proto__', direction: 'invalid' as 'asc' | 'desc' | 'none' },
      },
      {
        expandable: { r1: true, r2: false, __proto__: true } as Record<string, boolean>,
        treeView: { r1: true } as Record<string, boolean>,
        pinning: { name: 'left', __proto__: 'left', status: 'invalid' } as unknown as Record<string, 'left' | 'right'>,
      },
      {
        pagination: { paginationCurrentPage: -1, paginationPageSize: -5 },
      },
    ];

    for (const c of cases) {
      const ts = normalizeGridSavedState(c);
      const wasm = runWasm<GridSavedState>('normalizeGridSavedState', c);
      expect(normalizeShapeForCompare(wasm)).toEqual(normalizeShapeForCompare(ts));
    }
  });

  it('matches sanitizeDownloadFilename', { timeout: 30000 }, () => {
    const cases = [
      'plain-file',
      'spaces are bad',
      '../../etc/passwd',
      'has@symbols#and$stuff%.txt',
      '____',
      '',
      'file_name.with.dots-and_dashes',
      '🤩 emoji 🤩',
    ];
    for (const c of cases) {
      expect(runWasm('sanitizeDownloadFilename', c)).toBe(sanitizeDownloadFilename(c));
    }
  });

  it('matches normalizeBooleanMap', { timeout: 30000 }, () => {
    const cases = [
      {},
      { r1: true, r2: false },
      { r1: true, __proto__: true, constructor: false },
      { r1: 'not-bool' as unknown, r2: 1 as unknown, r3: true } as Record<string, unknown>,
    ];
    for (const c of cases) {
      const wasm = runWasm<Record<string, boolean>>('normalizeBooleanMap', { value: c });
      const ts = normalizeBooleanMap(c as Record<string, unknown>);
      expect(wasm).toEqual(ts);
    }
  });

  it('matches isSafeStateKey', { timeout: 30000 }, () => {
    const cases = ['name', 'status', '__proto__', 'constructor', 'prototype', '', 'x.y.z'];
    for (const c of cases) {
      expect(runWasm('isSafeStateKey', c)).toBe(isSafeStateKey(c));
    }
  });
});
