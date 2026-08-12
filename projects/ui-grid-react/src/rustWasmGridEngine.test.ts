import { beforeEach, describe, expect, it } from 'vitest';
import { activeGridEngineBackend, clearRustWasmGridEngine, defaultGridEngine } from '@ornery/ui-grid-core';
import { registerReactUiGridWasmEngineFromModule } from './rustWasmGridEngine';
import { SORT_DIRECTIONS } from '@ornery/ui-grid-core';
import type { BuildGridPipelineContext } from '@ornery/ui-grid-core';

function createContext(): BuildGridPipelineContext {
  return {
    options: {
      id: 'react-engine-spec',
      data: [
        { id: 'row-1', owner: 'Alice' },
        { id: 'row-2', owner: 'Bob' },
      ],
      columnDefs: [{ name: 'owner' }],
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
  };
}

describe('rustWasmGridEngine', () => {
  beforeEach(() => {
    clearRustWasmGridEngine();
  });

  it('does not install a wasm pipeline engine through the React helper', () => {
    registerReactUiGridWasmEngineFromModule({
      default: async () => undefined,
    });

    expect(defaultGridEngine.buildPipeline(createContext()).visibleRows.map((row) => row.id)).toEqual([
      'react-engine-spec-0',
      'react-engine-spec-1',
    ]);
    expect(activeGridEngineBackend()).toBe('typescript');
  });
});
