/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { buildGridDisplayItems } from './grid.core.grouping';
import { GridColumnDef, GridOptions, GridRow } from './grid.models';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.grouping.wasm-runner.mjs', import.meta.url),
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

function makeRow(id: string, entity: Record<string, unknown>): GridRow {
  return new GridRow(id, { id, ...entity }, 0, 44);
}

function serializeRows(rows: GridRow[]) {
  return rows.map((r, i) => ({
    id: r.id,
    entity: r.entity,
    index: i,
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
  }));
}

describe('grid.core.grouping wasm parity', () => {
  it('matches buildGridDisplayItems for ungrouped rows (kind: row only)', { timeout: 30000 }, () => {
    const rows = [
      makeRow('r1', { name: 'Alpha', status: 'Active' }),
      makeRow('r2', { name: 'Beta', status: 'Pilot' }),
    ];
    const columns: GridColumnDef[] = [{ name: 'name' }, { name: 'status' }];
    const options = baseOptions;

    const ts = buildGridDisplayItems(rows, columns, options, [], {});
    const wasm = runWasm<unknown[]>('buildGridDisplayItems', {
      rows: serializeRows(rows),
      columns,
      options,
      groupBy: [],
      collapsedGroups: {},
    });

    expect(wasm.length).toBe(ts.length);
    for (let i = 0; i < wasm.length; i++) {
      const wasmItem = wasm[i] as { kind: string; id: string };
      const tsItem = ts[i] as { kind: string; id: string };
      expect(wasmItem.kind).toBe(tsItem.kind);
      expect(wasmItem.id).toBe(tsItem.id);
    }
  });

  it('matches buildGridDisplayItems for grouped rows', { timeout: 30000 }, () => {
    const rows = [
      makeRow('r1', { name: 'Alpha', status: 'Active' }),
      makeRow('r2', { name: 'Beta', status: 'Active' }),
      makeRow('r3', { name: 'Gamma', status: 'Pilot' }),
    ];
    const columns: GridColumnDef[] = [{ name: 'name' }, { name: 'status' }];
    const options = { ...baseOptions, enableGrouping: true };

    const ts = buildGridDisplayItems(rows, columns, options, ['status'], {});
    const wasm = runWasm<unknown[]>('buildGridDisplayItems', {
      rows: serializeRows(rows),
      columns,
      options,
      groupBy: ['status'],
      collapsedGroups: {},
    });

    expect(wasm.length).toBe(ts.length);
    // First item should be a group item; row items follow.
    const wasmKinds = wasm.map((w) => (w as { kind: string }).kind);
    const tsKinds = ts.map((t) => (t as { kind: string }).kind);
    expect(wasmKinds).toEqual(tsKinds);
  });

  it('matches buildGridDisplayItems with collapsed groups (rows hidden inside collapsed groups)', { timeout: 30000 }, () => {
    const rows = [
      makeRow('r1', { name: 'Alpha', status: 'Active' }),
      makeRow('r2', { name: 'Beta', status: 'Pilot' }),
    ];
    const columns: GridColumnDef[] = [{ name: 'name' }, { name: 'status' }];
    const options = { ...baseOptions, enableGrouping: true };

    // Collapse the Active group.
    const collapsedGroups = { 'status:Active': true };
    const ts = buildGridDisplayItems(rows, columns, options, ['status'], collapsedGroups);
    const wasm = runWasm<unknown[]>('buildGridDisplayItems', {
      rows: serializeRows(rows),
      columns,
      options,
      groupBy: ['status'],
      collapsedGroups,
    });

    const wasmIds = wasm.map((w) => (w as { id: string }).id);
    const tsIds = ts.map((t) => (t as { id: string }).id);
    expect(wasmIds).toEqual(tsIds);
  });
});
