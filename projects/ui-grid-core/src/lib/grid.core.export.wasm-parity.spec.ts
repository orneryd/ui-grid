/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  buildGridCsv,
  buildGridExcelSheetData,
  buildGridPdfDocDefinition,
  calculateGridPdfColumnWidths,
  filterExporterColumns,
  formatGridExcelField,
  formatGridPdfField,
  resolveGridExporterExcelOptions,
  resolveGridExporterOptions,
  resolveGridExporterPdfOptions,
} from './grid.core.export';
import { GridRow } from './grid.models';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.export.wasm-runner.mjs', import.meta.url));

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

function serializeRows(rows: readonly GridRow[]) {
  return rows.map((row) => ({
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
    exporterEnableExporting: row.exporterEnableExporting,
    isDirty: row.isDirty,
    isError: row.isError,
    isSaving: row.isSaving,
  }));
}

function definedEntries<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

function makeRow(id: string, entity: Record<string, unknown>, index: number): GridRow {
  return new GridRow(id, entity, index, 44);
}

const columns = [
  { name: 'name', displayName: 'Name' },
  { name: 'status', displayName: 'Status', visible: false },
  { name: 'revenue', displayName: 'Revenue' },
];

const rows = [
  makeRow('r1', { name: 'Alpha', status: 'Active', revenue: 100 }, 0),
  makeRow('r2', { name: 'Beta, Inc.', status: 'Pilot', revenue: 200 }, 1),
];

describe('grid.core.export wasm parity', () => {
  it('matches exporter option resolvers for serializable fields', () => {
    const options = {
      id: 'g',
      data: [],
      columnDefs: [],
      exporterCsvColumnSeparator: '\t',
      exporterCsvFilename: 'out.csv',
      exporterHeaderFilterUseName: true,
      exporterSuppressColumns: ['skip'],
      exporterOlderExcelCompatibility: true,
      exporterPdfOrientation: 'portrait',
      exporterExcelFilename: 'sheet.xlsx',
    };

    expect(definedEntries(runWasm<any>('resolveGridExporterOptions', options))).toEqual(
      definedEntries(resolveGridExporterOptions(options) as Record<string, unknown>),
    );
    expect(definedEntries(runWasm<any>('resolveGridExporterPdfOptions', options))).toEqual(
      definedEntries(resolveGridExporterPdfOptions(options) as Record<string, unknown>),
    );
    expect(definedEntries(runWasm<any>('resolveGridExporterExcelOptions', options))).toEqual(
      definedEntries(resolveGridExporterExcelOptions(options) as Record<string, unknown>),
    );
  });

  it('matches column filtering and default csv output on the serializable path', () => {
    expect(
      runWasm<any[]>('filterExporterColumns', {
        columns: [
          { name: 'selectionRowHeaderCol' },
          { name: 'treeBaseRowHeaderCol' },
          { name: 'name' },
        ],
        options: {},
        colType: 'visible',
      }).map((column) => column.name),
    ).toEqual(filterExporterColumns([
      { name: 'selectionRowHeaderCol' },
      { name: 'treeBaseRowHeaderCol' },
      { name: 'name' },
    ], {}, 'visible').map((column) => column.name));

    expect(
      runWasm('buildGridCsv', {
        columns,
        rows: serializeRows(rows),
        options: {},
        colType: 'visible',
      }),
    ).toBe(buildGridCsv(columns, rows));

    expect(
      runWasm('buildGridCsv', {
        columns,
        rows: serializeRows(rows),
        options: { csvColumnSeparator: ';', olderExcelCompatibility: true },
        colType: 'visible',
      }),
    ).toBe(buildGridCsv(columns, rows, { csvColumnSeparator: ';', olderExcelCompatibility: true }));
  });

  it('matches pdf field formatting, width calculation, and doc-definition building', () => {
    expect(runWasm('formatGridPdfField', { value: 'hello "world"', alignment: null })).toEqual(
      formatGridPdfField('hello "world"'),
    );
    expect(runWasm('formatGridPdfField', { value: 'Alpha', alignment: 'right' })).toEqual(
      formatGridPdfField('Alpha', 'right'),
    );
    expect(
      runWasm('calculateGridPdfColumnWidths', {
        columns: [{ name: 'a', width: '100' }, { name: 'b', width: '200' }],
        maxGridWidth: 300,
      }),
    ).toEqual(calculateGridPdfColumnWidths([{ name: 'a', width: '100' }, { name: 'b', width: '200' }], 300));

    const pdfColumns = [{ name: 'name', displayName: 'Name' }, { name: 'status', displayName: 'Status' }];
    const pdfRows = [
      makeRow('r1', { name: 'Alpha', status: 'Active' }, 0),
      makeRow('r2', { name: 'Beta', status: 'Pilot' }, 1),
    ];
    expect(
      runWasm('buildGridPdfDocDefinition', {
        columns: pdfColumns,
        rows: serializeRows(pdfRows),
        pdfOptions: {},
        exporterOptions: {},
        colType: 'visible',
      }),
    ).toEqual(buildGridPdfDocDefinition(pdfColumns, pdfRows));
  });

  it('matches excel field formatting and sheet data generation', () => {
    expect(runWasm('formatGridExcelField', true)).toEqual(formatGridExcelField(true));
    expect(runWasm('formatGridExcelField', { a: 1 })).toEqual(formatGridExcelField({ a: 1 }));

    const excelColumns = [{ name: 'name', displayName: 'Name' }, { name: 'revenue', displayName: 'Revenue' }];
    const excelRows = [
      makeRow('r1', { name: 'Alpha', revenue: 100 }, 0),
      makeRow('r2', { name: 'Beta', revenue: 200 }, 1),
    ];
    expect(
      runWasm('buildGridExcelSheetData', {
        columns: excelColumns,
        rows: serializeRows(excelRows),
        exporterOptions: {},
        colType: 'visible',
        styles: { header: { id: 'H1' } },
      }),
    ).toEqual(buildGridExcelSheetData(excelColumns, excelRows, {}, 'visible', { header: { id: 'H1' } }));
  });
});
