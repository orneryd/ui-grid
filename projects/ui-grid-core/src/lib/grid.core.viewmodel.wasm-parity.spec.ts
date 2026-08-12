/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { SORT_DIRECTIONS } from './grid.constants';
import {
  canGridExpandRows,
  canGridMoveColumns,
  gridCellIndent,
  gridColumnWidth,
  gridEditorInputType,
  gridExpandToggleLabel,
  gridExpandToggleLabelForRow,
  gridFilterPlaceholder,
  gridGroupDisclosureLabel,
  gridGroupingButtonLabel,
  gridSortAriaSort,
  gridSortButtonLabel,
  gridTreeToggleLabel,
  gridTreeToggleLabelForRow,
  isGridColumnFilterable,
  isGridColumnGrouped,
  isGridColumnSortable,
  isGridFilteringEnabled,
  isGridGroupingEnabled,
  isGridInfiniteScrollEnabled,
  isGridPaginationEnabled,
  isGridPrimaryColumn,
  isGridSortingEnabled,
  isGridTreeEnabled,
  isGridTreeRowExpanded,
  shouldShowGridExpandToggle,
  shouldShowGridPaginationControls,
  shouldShowGridTreeToggle,
} from './grid.core.viewmodel';
import {
  DEFAULT_GRID_LABELS,
  GridColumnDef,
  GridOptions,
  GridRow,
} from './grid.models';

const wasmRunnerPath = fileURLToPath(
  new URL('./grid.core.viewmodel.wasm-runner.mjs', import.meta.url),
);

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(
    process.execPath,
    ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })],
    { cwd: process.cwd(), encoding: 'utf8' },
  );
  return JSON.parse(output) as T;
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  return {
    id: 'g',
    data: [],
    columnDefs: [],
    ...overrides,
  };
}

function col(name: string, extra: Partial<GridColumnDef> = {}): GridColumnDef {
  return { name, ...extra };
}

function makeRow(id: string, extra: Partial<GridRow> = {}): GridRow {
  const row = new GridRow(id, { id, ...(extra.entity ?? {}) }, 0, 44);
  if (extra.treeLevel !== undefined) row.treeLevel = extra.treeLevel;
  if (extra.hasChildren !== undefined) row.hasChildren = extra.hasChildren;
  if (extra.expanded !== undefined) row.expanded = extra.expanded;
  return row;
}

function serializeRow(row: GridRow): unknown {
  return {
    id: row.id,
    entity: row.entity,
    index: row.index,
    height: row.height,
    invisibleReasons: [...row.invisibleReasons],
    visible: row.visible,
    isSelected: row.isSelected,
    isFocused: row.isFocused,
    enableSelection: row.enableSelection,
    treeLevel: row.treeLevel,
    parentId: row.parentId,
    hasChildren: row.hasChildren,
    childCount: row.childCount,
    expanded: row.expanded,
    expandedRowHeight: row.expandedRowHeight,
  };
}

describe('grid.core.viewmodel wasm parity', () => {
  it('matches feature-flag predicates on options', { timeout: 30000 }, () => {
    const cases: GridOptions[] = [
      baseOptions(),
      baseOptions({ enableTreeView: true }),
      baseOptions({ enableGrouping: true }),
      baseOptions({ enableGrouping: true, enableTreeView: true }),
      baseOptions({ enableExpandable: true }),
      baseOptions({
        enableExpandable: true,
        // expandableRowTemplate is required for canGridExpandRows to be true.
        // Use a sentinel that survives serialisation.
        expandableRowTemplate: { createEmbeddedView: () => undefined } as unknown as GridOptions['expandableRowTemplate'],
      }),
      baseOptions({ enablePagination: true }),
      baseOptions({ paginationPageSize: 25 }),
      baseOptions({ enablePagination: true, enablePaginationControls: false }),
      baseOptions({ infiniteScrollUp: true }),
      baseOptions({ infiniteScrollDown: true }),
      baseOptions({ infiniteScrollRowsFromEnd: 10 }),
      baseOptions({ enableSorting: false }),
      baseOptions({ enableFiltering: false }),
      baseOptions({ enableColumnMoving: true }),
    ];

    for (const opts of cases) {
      // expandableRowTemplate doesn't survive JSON, so canGridExpandRows
      // diverges on the wasm side; only test the predicates that ARE pure
      // option flags.
      expect(runWasm('isGridTreeEnabled', opts)).toBe(isGridTreeEnabled(opts));
      expect(runWasm('isGridGroupingEnabled', opts)).toBe(isGridGroupingEnabled(opts));
      expect(runWasm('isGridPaginationEnabled', opts)).toBe(isGridPaginationEnabled(opts));
      expect(runWasm('shouldShowGridPaginationControls', opts)).toBe(
        shouldShowGridPaginationControls(opts),
      );
      expect(runWasm('isGridInfiniteScrollEnabled', opts)).toBe(
        isGridInfiniteScrollEnabled(opts),
      );
      expect(runWasm('isGridSortingEnabled', opts)).toBe(isGridSortingEnabled(opts));
      expect(runWasm('isGridFilteringEnabled', opts)).toBe(isGridFilteringEnabled(opts));
      expect(runWasm('canGridMoveColumns', opts)).toBe(canGridMoveColumns(opts));
    }
  });

  it('canGridExpandRows ignores expandableRowTemplate truthiness consistently', () => {
    // expandableRowTemplate doesn't cross JSON; both implementations must
    // resolve to a stable result for the JSON-roundtripped value.
    const opts = baseOptions({ enableExpandable: true });
    // Without the template, both must return false.
    expect(runWasm('canGridExpandRows', opts)).toBe(canGridExpandRows(opts));
  });

  it('matches per-column predicates', () => {
    const cases: Array<{ options: GridOptions; column: GridColumnDef }> = [
      { options: baseOptions(), column: col('name') },
      { options: baseOptions(), column: col('name', { sortable: false }) },
      { options: baseOptions(), column: col('name', { enableSorting: false }) },
      { options: baseOptions(), column: col('name', { filterable: false }) },
      { options: baseOptions(), column: col('name', { enableFiltering: false }) },
      { options: baseOptions({ enableSorting: false }), column: col('name') },
      { options: baseOptions({ enableFiltering: false }), column: col('name') },
    ];
    for (const c of cases) {
      expect(runWasm('isGridColumnSortable', c)).toBe(isGridColumnSortable(c.options, c.column));
      expect(runWasm('isGridColumnFilterable', c)).toBe(
        isGridColumnFilterable(c.options, c.column),
      );
    }
  });

  it('isGridPrimaryColumn skips selectionRowHeaderCol', () => {
    const visibleColumns = [col('selectionRowHeaderCol'), col('name'), col('status')];
    expect(
      runWasm('isGridPrimaryColumn', { visibleColumns, column: col('name') }),
    ).toBe(isGridPrimaryColumn(visibleColumns, col('name')));
    expect(
      runWasm('isGridPrimaryColumn', { visibleColumns, column: col('status') }),
    ).toBe(isGridPrimaryColumn(visibleColumns, col('status')));
    expect(
      runWasm('isGridPrimaryColumn', {
        visibleColumns,
        column: col('selectionRowHeaderCol'),
      }),
    ).toBe(isGridPrimaryColumn(visibleColumns, col('selectionRowHeaderCol')));
  });

  it('matches tree-toggle visibility', () => {
    const visibleColumns = [col('name'), col('status')];
    const optionsTree = baseOptions({ enableTreeView: true });
    const rowWithChildren = makeRow('r1', { hasChildren: true });
    const rowLeaf = makeRow('r2');

    const cases = [
      { options: optionsTree, visibleColumns, row: rowWithChildren, column: col('name') },
      { options: optionsTree, visibleColumns, row: rowLeaf, column: col('name') },
      {
        options: baseOptions({ enableTreeView: true, showTreeExpandNoChildren: false }),
        visibleColumns,
        row: rowLeaf,
        column: col('name'),
      },
    ];
    for (const c of cases) {
      const wasmInput = {
        options: c.options,
        visibleColumns: c.visibleColumns,
        row: serializeRow(c.row),
        column: c.column,
      };
      expect(runWasm('shouldShowGridTreeToggle', wasmInput)).toBe(
        shouldShowGridTreeToggle(c.options, c.visibleColumns, c.row, c.column),
      );
    }
  });

  it('matches expand-toggle visibility', () => {
    const visibleColumns = [col('name'), col('status')];
    const opts = baseOptions({ enableExpandable: true });
    expect(
      runWasm('shouldShowGridExpandToggle', {
        options: opts,
        visibleColumns,
        column: col('name'),
      }),
    ).toBe(shouldShowGridExpandToggle(opts, visibleColumns, col('name')));
  });

  it('matches all label/aria helpers', () => {
    const labels = DEFAULT_GRID_LABELS;
    const directions = [SORT_DIRECTIONS.asc, SORT_DIRECTIONS.desc, SORT_DIRECTIONS.none];
    for (const direction of directions) {
      expect(runWasm('gridSortButtonLabel', { direction, labels })).toBe(
        gridSortButtonLabel(direction, labels),
      );
      expect(runWasm('gridSortAriaSort', direction)).toBe(gridSortAriaSort(direction));
    }
    for (const value of [true, false]) {
      expect(runWasm('gridGroupingButtonLabel', { value, labels })).toBe(
        gridGroupingButtonLabel(value, labels),
      );
      expect(runWasm('gridFilterPlaceholder', { value, labels })).toBe(
        gridFilterPlaceholder(value, labels),
      );
      expect(runWasm('gridGroupDisclosureLabel', { value, labels })).toBe(
        gridGroupDisclosureLabel(value, labels),
      );
      expect(runWasm('gridTreeToggleLabel', { value, labels })).toBe(
        gridTreeToggleLabel(value, labels),
      );
      expect(runWasm('gridExpandToggleLabel', { value, labels })).toBe(
        gridExpandToggleLabel(value, labels),
      );
    }
  });

  it('matches editor input type and column width helpers', () => {
    // Untyped column → both implementations return 'text' (default).
    {
      const c = col('untyped');
      expect(runWasm('gridEditorInputType', c)).toBe(gridEditorInputType(c));
    }
    for (const type of ['number', 'date', 'string', 'boolean'] as const) {
      const c = col('x', { type });
      expect(runWasm('gridEditorInputType', c)).toBe(gridEditorInputType(c));
    }
    for (const width of [undefined, '120px', 'minmax(8rem, 1fr)']) {
      const c = col('x', width === undefined ? {} : { width });
      expect(runWasm('gridColumnWidth', c)).toBe(gridColumnWidth(c));
    }
  });

  it('matches gridCellIndent across tree/non-tree modes', () => {
    const visibleColumns = [col('name'), col('status')];
    const cases: Array<{ options: GridOptions; row: GridRow; column: GridColumnDef }> = [
      { options: baseOptions(), row: makeRow('r1', { treeLevel: 2 }), column: col('name') },
      {
        options: baseOptions({ enableTreeView: true }),
        row: makeRow('r1', { treeLevel: 0 }),
        column: col('name'),
      },
      {
        options: baseOptions({ enableTreeView: true }),
        row: makeRow('r1', { treeLevel: 3 }),
        column: col('name'),
      },
      {
        options: baseOptions({ enableTreeView: true, treeIndent: 20 }),
        row: makeRow('r1', { treeLevel: 2 }),
        column: col('name'),
      },
      {
        options: baseOptions({ enableTreeView: true }),
        row: makeRow('r1', { treeLevel: 2 }),
        column: col('status'),
      },
    ];
    for (const c of cases) {
      const wasmInput = {
        options: c.options,
        visibleColumns,
        row: serializeRow(c.row),
        column: c.column,
      };
      expect(runWasm('gridCellIndent', wasmInput)).toBe(
        gridCellIndent(c.options, visibleColumns, c.row, c.column),
      );
    }
  });

  it('matches isGridColumnGrouped', () => {
    const groups = ['status', 'region'];
    expect(
      runWasm('isGridColumnGrouped', { groupByColumns: groups, column: col('status') }),
    ).toBe(isGridColumnGrouped(groups, col('status')));
    expect(
      runWasm('isGridColumnGrouped', { groupByColumns: groups, column: col('name') }),
    ).toBe(isGridColumnGrouped(groups, col('name')));
  });

  it('matches isGridTreeRowExpanded and per-row label helpers', () => {
    const labels = DEFAULT_GRID_LABELS;
    const expandedTreeRows = { r1: true };
    const r1 = makeRow('r1', { expanded: true });
    const r2 = makeRow('r2');

    expect(
      runWasm('isGridTreeRowExpanded', {
        expandedTreeRows,
        row: serializeRow(r1),
      }),
    ).toBe(isGridTreeRowExpanded(expandedTreeRows, r1));
    expect(
      runWasm('isGridTreeRowExpanded', {
        expandedTreeRows,
        row: serializeRow(r2),
      }),
    ).toBe(isGridTreeRowExpanded(expandedTreeRows, r2));

    expect(
      runWasm('gridTreeToggleLabelForRow', {
        expandedTreeRows,
        row: serializeRow(r1),
        labels,
      }),
    ).toBe(gridTreeToggleLabelForRow(expandedTreeRows, r1, labels));
    expect(
      runWasm('gridExpandToggleLabelForRow', { row: serializeRow(r1), labels }),
    ).toBe(gridExpandToggleLabelForRow(r1, labels));
  });
});
