import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  activeGridEngineBackend,
  clearRustWasmGridEngine,
  defaultGridEngine,
  registerRustWasmGridEngine,
} from './ui-grid.engine';
import { configureWasmSerializationAudit } from './grid.core';
import { registerUiGridWasmEngineFromModule } from './ui-grid.engine.wasm';
import { SORT_DIRECTIONS } from './grid.constants';
import type { BuildGridPipelineContext, PipelineResult } from './grid.core';

function createContext(): BuildGridPipelineContext {
  return {
    options: {
      id: 'engine-spec',
      data: [
        { id: 'row-1', owner: 'Alice' },
        { id: 'row-2', owner: 'Bob' },
      ],
      columnDefs: [
        { name: 'owner' },
      ],
    },
    columns: [{ name: 'owner' }],
    activeFilters: {},
    sortState: { columnName: null, direction: SORT_DIRECTIONS.none },
    groupByColumns: [],
    collapsedGroups: {},
    hiddenRowReasons: {},
    expandedRows: {},
    expandedTreeRows: {},
    currentPage: 1,
    pageSize: 0,
    rowSize: 44,
    now: () => 0,
  };
}

describe('ui-grid.engine', () => {
  afterEach(() => {
    clearRustWasmGridEngine();
    configureWasmSerializationAudit({
      enabled: false,
      sizeThresholdBytes: 8_192,
      warnOnce: true,
    });
    vi.restoreAllMocks();
  });

  it('falls back to the TypeScript engine when no Rust/WASM bindings are registered', () => {
    clearRustWasmGridEngine();

    const result = defaultGridEngine.buildPipeline(createContext());

    expect(activeGridEngineBackend()).toBe('typescript');
    expect(result.visibleRows.map((row) => row.id)).toEqual(['engine-spec-0', 'engine-spec-1']);
  });

  it('uses the registered Rust/WASM bindings by default when available', () => {
    const sentinel: PipelineResult = {
      visibleRows: [],
      displayItems: [],
      virtualizationEnabled: true,
      pipelineMs: 0,
      totalItems: 999,
    };

    registerRustWasmGridEngine({
      buildPipeline: () => sentinel,
    });

    expect(defaultGridEngine.buildPipeline(createContext())).toBe(sentinel);
    expect(activeGridEngineBackend()).toBe('rust-wasm');

    clearRustWasmGridEngine();
  });

  it('does not register a wasm pipeline binding from the helper bootstrap module', () => {
    registerUiGridWasmEngineFromModule({
      default: async () => undefined,
    });

    const result = defaultGridEngine.buildPipeline(createContext());

    expect(activeGridEngineBackend()).toBe('typescript');
    expect(result.visibleRows.map((row) => row.id)).toEqual(['engine-spec-0', 'engine-spec-1']);
  });
});