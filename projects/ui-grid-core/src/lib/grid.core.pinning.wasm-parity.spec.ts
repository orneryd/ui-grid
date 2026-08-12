/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  buildInitialPinnedState,
  computePinnedOffset,
  getColumnPinDirection,
  isColumnPinnable,
  isPinningEnabled,
  PinnedColumnState,
  pinColumnState,
  pinningButtonLabel,
} from './grid.core.pinning';
import { DEFAULT_GRID_LABELS, GridColumnDef, GridOptions } from './grid.models';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.pinning.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(
    process.execPath,
    ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return JSON.parse(output) as T;
}

function col(name: string, extra: Partial<GridColumnDef> = {}): GridColumnDef {
  return { name, ...extra };
}

describe('grid.core.pinning wasm parity', () => {
  it('matches isPinningEnabled / isColumnPinnable', { timeout: 30000 }, () => {
    const off: GridOptions = { id: 'g', data: [], columnDefs: [] };
    const on: GridOptions = { id: 'g', data: [], columnDefs: [], enablePinning: true };
    expect(runWasm('isPinningEnabled', off)).toBe(isPinningEnabled(off));
    expect(runWasm('isPinningEnabled', on)).toBe(isPinningEnabled(on));

    const pinnableCol = col('name');
    const blockedCol = col('name', { enablePinning: false });
    for (const opts of [off, on]) {
      for (const c of [pinnableCol, blockedCol]) {
        expect(runWasm('isColumnPinnable', { options: opts, column: c })).toBe(
          isColumnPinnable(opts, c),
        );
      }
    }
  });

  it('matches getColumnPinDirection / pinColumnState / pinningButtonLabel', { timeout: 30000 }, () => {
    const pinned: PinnedColumnState = { name: 'left', region: 'right' };
    for (const c of [col('name'), col('region'), col('other')]) {
      expect(
        runWasm('getColumnPinDirection', { pinnedColumns: pinned, column: c }),
      ).toBe(getColumnPinDirection(pinned, c));
      expect(
        runWasm('pinningButtonLabel', {
          pinnedColumns: pinned,
          column: c,
          labels: DEFAULT_GRID_LABELS,
        }),
      ).toBe(pinningButtonLabel(pinned, c, DEFAULT_GRID_LABELS));
    }

    for (const direction of ['left', 'right', 'none'] as const) {
      expect(
        runWasm('pinColumnState', {
          current: pinned,
          columnName: 'name',
          direction,
        }),
      ).toEqual(pinColumnState(pinned, 'name', direction));
    }
  });

  it('matches buildInitialPinnedState', { timeout: 30000 }, () => {
    const cases = [
      [],
      [col('a'), col('b'), col('c')],
      [col('a', { pinnedLeft: true }), col('b'), col('c', { pinnedRight: true })],
      [col('a', { pinnedLeft: true, pinnedRight: true })], // left wins
    ];
    for (const c of cases) {
      expect(runWasm('buildInitialPinnedState', c)).toEqual(buildInitialPinnedState(c));
    }
  });

  it('matches computePinnedOffset for left and right pinned columns', { timeout: 30000 }, () => {
    const visibleColumns = [
      col('a', { pinnedLeft: true, width: '120px' }),
      col('b', { pinnedLeft: true, width: '80px' }),
      col('c'),
      col('d', { pinnedRight: true, width: '100px' }),
      col('e', { pinnedRight: true, width: '60px' }),
    ];
    const pinned: PinnedColumnState = { a: 'left', b: 'left', d: 'right', e: 'right' };

    for (const c of visibleColumns) {
      expect(
        runWasm('computePinnedOffset', {
          visibleColumns,
          pinnedColumns: pinned,
          column: c,
        }),
      ).toEqual(computePinnedOffset(visibleColumns, pinned, c));
    }
  });
});
