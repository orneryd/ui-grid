/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import { SORT_DIRECTIONS } from './grid.constants';
import {
  buildGridRows,
  filterAndFlattenGridTreeRows,
  isTreeEnabled,
} from './grid.core.tree';
import { GridColumnDef, GridOptions, GridRecord, SortState } from './grid.models';

// In-process wasm import — needed for callback-bridge tests because
// JSON.stringify drops functions and the subprocess parity runner can't
// carry them across the process boundary. Use the web target (regular ES
// module + explicit init), which vitest can load.
import * as wasmModule from '../../../../dist/ui-grid-wasm-web/ui_grid_wasm.js';

const wasmBinaryPath = fileURLToPath(
  new URL('../../../../dist/ui-grid-wasm-web/ui_grid_wasm_bg.wasm', import.meta.url),
);

beforeAll(async () => {
  // Web-target wasm modules require explicit init with the .wasm bytes.
  await (wasmModule as unknown as { default: (input: ArrayBuffer) => Promise<unknown> }).default(
    readFileSync(wasmBinaryPath).buffer as ArrayBuffer,
  );
});

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.tree.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(
    process.execPath,
    ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return JSON.parse(output) as T;
}

const baseOptions: GridOptions = {
  id: 'g',
  data: [],
  columnDefs: [],
};

describe('grid.core.tree wasm parity', () => {
  it('matches isTreeEnabled', { timeout: 30000 }, () => {
    expect(runWasm('isTreeEnabled', baseOptions)).toBe(isTreeEnabled(baseOptions));
    expect(
      runWasm('isTreeEnabled', { ...baseOptions, enableTreeView: true }),
    ).toBe(isTreeEnabled({ ...baseOptions, enableTreeView: true }));
  });

  // ─────────────────────────────────────────────────────────────────────
  // In-process callback-bridge parity. The wasm shim plucks
  // `options.rowIdentity` off the live JsValue and invokes it through
  // `Function.call2` to pre-resolve identities into row_identity_overrides
  // (see crates/ui-grid-wasm/src/lib.rs). The subprocess parity runner
  // can't carry callbacks (JSON.stringify drops them), so these tests
  // call the wasm shim directly in-process so the JS callback survives.
  // ─────────────────────────────────────────────────────────────────────

  it('matches buildGridRows flat data via in-process rowIdentity callback', () => {
    const data: GridRecord[] = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
      { id: 'c', name: 'Gamma' },
    ];
    const options: GridOptions = {
      ...baseOptions,
      data,
      rowIdentity: (r: GridRecord) => String(r['id']),
    };

    const ts = buildGridRows(options, 44, {}, {});
    const wasm = (
      wasmModule as unknown as {
        build_grid_rows_js: (input: unknown) => Array<{ id: string }>;
      }
    ).build_grid_rows_js({
      // Pass live options object — wasm shim uses Reflect.get to extract
      // options.rowIdentity *before* serde deserializes, so the callback
      // survives the boundary.
      options,
      rowSize: 44,
      hiddenRowReasons: {},
      expandedRows: {},
    });

    expect(wasm.map((r) => r.id)).toEqual(ts.map((r) => r.id));
    expect(wasm.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('matches buildGridRows nested tree data via in-process rowIdentity callback', () => {
    const data: GridRecord[] = [
      {
        id: 'p1',
        name: 'P1',
        children: [
          { id: 'c1', name: 'C1' },
          { id: 'c2', name: 'C2' },
        ],
      },
      { id: 'p2', name: 'P2' },
    ];
    const options: GridOptions = {
      ...baseOptions,
      data,
      enableTreeView: true,
      rowIdentity: (r: GridRecord) => String(r['id']),
    };

    const ts = buildGridRows(options, 44, {}, {});
    const wasm = (
      wasmModule as unknown as {
        build_grid_rows_js: (input: unknown) => Array<{
          id: string;
          treeLevel: number;
          parentId: string | null;
          hasChildren: boolean;
        }>;
      }
    ).build_grid_rows_js({
      options,
      rowSize: 44,
      hiddenRowReasons: {},
      expandedRows: {},
    });

    expect(wasm.map((r) => r.id)).toEqual(ts.map((r) => r.id));
    expect(wasm.map((r) => r.id)).toEqual(['p1', 'c1', 'c2', 'p2']);
    expect(wasm.map((r) => r.treeLevel)).toEqual([0, 1, 1, 0]);
    expect(wasm.map((r) => r.hasChildren)).toEqual([true, false, false, false]);
  });

  it('matches filterAndFlattenGridTreeRows via subprocess (using prebuilt rows)', { timeout: 30000 }, () => {
    const data: GridRecord[] = [
      {
        id: 'p1',
        name: 'Alpha',
        children: [
          { id: 'c1', name: 'AlphaChild' },
          { id: 'c2', name: 'BetaChild' },
        ],
      },
      { id: 'p2', name: 'Other' },
    ];
    const options: GridOptions = {
      ...baseOptions,
      data,
      enableTreeView: true,
      enableFiltering: true,
      rowIdentity: (r: GridRecord) => String(r['id']),
    };
    const columns: GridColumnDef[] = [{ name: 'name' }];
    // Build rows in TS (the canonical implementation) so identities resolve
    // via the rowIdentity callback. The resulting `GridRow[]` is fully
    // serializable, which lets the subprocess shim consume it.
    const tsRows = buildGridRows(options, 44, {}, {});
    const expandedTreeRows = { p1: true };
    const sortState: SortState = { columnName: null, direction: SORT_DIRECTIONS.none };

    const tsFiltered = filterAndFlattenGridTreeRows(
      tsRows,
      columns,
      options,
      { name: 'Alpha' },
      expandedTreeRows,
      sortState,
    );
    const wasmFiltered = runWasm<Array<{ id: string }>>('filterAndFlattenGridTreeRows', {
      rows: tsRows.map((r) => ({
        id: r.id,
        entity: r.entity,
        index: r.index,
        height: r.height,
        invisibleReasons: [...r.invisibleReasons],
        visible: r.visible,
        isSelected: r.isSelected,
        isFocused: r.isFocused,
        enableSelection: r.enableSelection,
        treeLevel: r.treeLevel,
        parentId: r.parentId,
        hasChildren: r.hasChildren,
        childCount: r.childCount,
        expanded: r.expanded,
        expandedRowHeight: r.expandedRowHeight,
      })),
      columns,
      // Subprocess can't carry the callback — drop rowIdentity for the
      // serializable payload. The rows are already keyed by their resolved
      // ids from the in-process build, so the filter doesn't need it.
      options: { ...options, rowIdentity: undefined, data: [] },
      activeFilters: { name: 'Alpha' },
      expandedTreeRows,
      sortState,
    });

    expect(wasmFiltered.map((r) => r.id)).toEqual(tsFiltered.map((r) => r.id));
    // Sanity: filter "Alpha" includes the parent and the child whose name
    // starts with Alpha; collapsed children stay hidden.
    expect(tsFiltered.map((r) => r.id)).toEqual(['p1', 'c1']);
  });
});
