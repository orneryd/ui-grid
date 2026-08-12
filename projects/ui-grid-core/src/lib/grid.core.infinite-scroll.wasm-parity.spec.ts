/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  completeInfiniteScrollDataLoad,
  maybeRequestInfiniteScrollData,
  resetInfiniteScrollState,
  saveInfiniteScrollPercentage,
  setInfiniteScrollDirectionsState,
} from './grid.core.infinite-scroll';
import { GridInfiniteScrollState } from './grid.core.types';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.infinite-scroll.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(
    process.execPath,
    ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return JSON.parse(output) as T;
}

const idle: GridInfiniteScrollState = {
  scrollUp: false,
  scrollDown: false,
  dataLoading: false,
  previousVisibleRows: 0,
};

describe('grid.core.infinite-scroll wasm parity', () => {
  it('matches resetInfiniteScrollState', { timeout: 30000 }, () => {
    for (const scrollUp of [true, false]) {
      for (const scrollDown of [true, false]) {
        expect(
          runWasm('resetInfiniteScrollState', { state: idle, scrollUp, scrollDown }),
        ).toEqual(resetInfiniteScrollState(scrollUp, scrollDown));
      }
    }
  });

  it('matches setInfiniteScrollDirectionsState', { timeout: 30000 }, () => {
    const states: GridInfiniteScrollState[] = [
      idle,
      { ...idle, scrollUp: true, scrollDown: true },
      { ...idle, dataLoading: true, previousVisibleRows: 50 },
    ];
    for (const state of states) {
      for (const scrollUp of [true, false]) {
        for (const scrollDown of [true, false]) {
          expect(
            runWasm('setInfiniteScrollDirectionsState', { state, scrollUp, scrollDown }),
          ).toEqual(setInfiniteScrollDirectionsState(state, scrollUp, scrollDown));
        }
      }
    }
  });

  it('matches saveInfiniteScrollPercentage', { timeout: 30000 }, () => {
    for (const visibleRows of [0, 10, 50, 5000]) {
      expect(
        runWasm('saveInfiniteScrollPercentage', { state: idle, visibleRows }),
      ).toEqual(saveInfiniteScrollPercentage(idle, visibleRows));
    }
  });

  it('matches completeInfiniteScrollDataLoad', { timeout: 30000 }, () => {
    const loading: GridInfiniteScrollState = { ...idle, dataLoading: true, previousVisibleRows: 25 };
    for (const scrollUp of [true, false]) {
      for (const scrollDown of [true, false]) {
        expect(
          runWasm('completeInfiniteScrollDataLoad', { state: loading, scrollUp, scrollDown }),
        ).toEqual(completeInfiniteScrollDataLoad(loading, scrollUp, scrollDown));
      }
    }
  });

  it('matches maybeRequestInfiniteScrollData across direction/threshold combinations', { timeout: 30000 }, () => {
    const cases = [
      // No direction enabled → no request.
      { state: idle, startIndex: 0, visibleRows: 100, viewportRows: 20, threshold: 5 },
      // dataLoading guard returns null even with direction enabled.
      {
        state: { ...idle, scrollUp: true, dataLoading: true },
        startIndex: 0,
        visibleRows: 100,
        viewportRows: 20,
        threshold: 5,
      },
      // scrollUp + at top → request 'top'.
      {
        state: { ...idle, scrollUp: true },
        startIndex: 2,
        visibleRows: 100,
        viewportRows: 20,
        threshold: 5,
      },
      // scrollUp but not at top → null.
      {
        state: { ...idle, scrollUp: true },
        startIndex: 50,
        visibleRows: 100,
        viewportRows: 20,
        threshold: 5,
      },
      // scrollDown + near bottom → request 'bottom'.
      {
        state: { ...idle, scrollDown: true },
        startIndex: 80,
        visibleRows: 100,
        viewportRows: 20,
        threshold: 5,
      },
      // scrollDown but not near bottom → null.
      {
        state: { ...idle, scrollDown: true },
        startIndex: 10,
        visibleRows: 100,
        viewportRows: 20,
        threshold: 5,
      },
    ];

    for (const c of cases) {
      const ts = maybeRequestInfiniteScrollData(c);
      const wasm = runWasm<{ request: 'top' | 'bottom' | null; nextState: GridInfiniteScrollState }>(
        'maybeRequestInfiniteScrollData',
        c,
      );
      expect(wasm.request).toBe(ts.request);
      expect(wasm.nextState).toEqual(ts.nextState);
    }
  });
});
