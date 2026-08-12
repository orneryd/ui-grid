import { describe, expect, it } from 'vitest';
import {
  GRID_EXPORTER_CONSTANTS,
  buildGridCsv,
  buildGridExcelSheetData,
  buildGridPdfDocDefinition,
  calculateGridPdfColumnWidths,
  filterExporterColumns,
  formatGridExcelField,
  formatGridPdfField,
  resolveExporterFilename,
  resolveGridExporterOptions,
} from './grid.core.export';
import { GridColumnDef, GridOptions, GridRow } from './grid.models';

function makeRow(id: string, entity: Record<string, unknown>, index: number): GridRow {
  return new GridRow(id, entity, index, 44);
}

const columns: GridColumnDef[] = [
  { name: 'name', displayName: 'Name' },
  { name: 'status', displayName: 'Status', visible: false },
  { name: 'revenue', displayName: 'Revenue' },
];

const rows: GridRow[] = [
  makeRow('r1', { name: 'Alpha', status: 'Active', revenue: 100 }, 0),
  makeRow('r2', { name: 'Beta, Inc.', status: 'Pilot', revenue: 200 }, 1),
];

describe('buildGridCsv', () => {
  it('exports visible columns by default with display-name headers', () => {
    const csv = buildGridCsv(columns, rows);
    // status is visible:false → filtered out when colType='visible'
    expect(csv.split('\n')).toEqual(['Name,Revenue', 'Alpha,100', '"Beta, Inc.",200']);
  });

  it('includes hidden columns when colType is "all"', () => {
    const csv = buildGridCsv(columns, rows, {}, 'all');
    expect(csv.split('\n')[0]).toBe('Name,Status,Revenue');
  });

  it('uses column.name headers when headerFilterUseName is true', () => {
    const csv = buildGridCsv(columns, rows, { headerFilterUseName: true });
    expect(csv.split('\n')[0]).toBe('name,revenue');
  });

  it('routes headers through headerFilter when provided', () => {
    const csv = buildGridCsv(columns, rows, {
      headerFilter: (header) => header.toUpperCase(),
    });
    expect(csv.split('\n')[0]).toBe('NAME,REVENUE');
  });

  it('honors csvColumnSeparator', () => {
    const csv = buildGridCsv(columns, rows, { csvColumnSeparator: ';' });
    // 'Beta, Inc.' is no longer quoted because the separator is ';', but
    // the semicolon-less cells round-trip without quotes.
    expect(csv.split('\n')).toEqual(['Name;Revenue', 'Alpha;100', 'Beta, Inc.;200']);
  });

  it('suppresses columns listed in suppressColumns', () => {
    const csv = buildGridCsv(columns, rows, { suppressColumns: ['revenue'] }, 'all');
    expect(csv.split('\n')[0]).toBe('Name,Status');
  });

  it('applies fieldCallback to override raw cell values', () => {
    const csv = buildGridCsv(columns, rows, {
      fieldCallback: (_row, column, value) =>
        column.name === 'revenue' ? `$${value}` : value,
    });
    expect(csv.split('\n')[1]).toBe('Alpha,$100');
  });

  it('applies fieldFormatCallback to wrap the final string', () => {
    const csv = buildGridCsv(columns, rows, {
      fieldFormatCallback: (_row, column) =>
        column.name === 'name' ? '[name]' : undefined,
    });
    expect(csv.split('\n')[1]).toBe('[name],100');
  });

  it('prepends BOM when olderExcelCompatibility is true', () => {
    const csv = buildGridCsv(columns, rows, { olderExcelCompatibility: true });
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('substitutes HEADER_VALUES in a custom header template', () => {
    const csv = buildGridCsv(columns, rows, {
      headerTemplate: 'prefix\nHEADER_VALUES\nsuffix',
    });
    const lines = csv.split('\n');
    expect(lines[0]).toBe('prefix');
    expect(lines[1]).toBe('Name,Revenue');
    expect(lines[2]).toBe('suffix');
    // Body rows follow the rendered header template.
    expect(lines[3]).toBe('Alpha,100');
  });
});

describe('resolveGridExporterOptions', () => {
  it('maps exporter* options to the stripped-name shape', () => {
    const options: GridOptions = {
      id: 'g',
      data: [],
      columnDefs: [],
      exporterCsvColumnSeparator: '\t',
      exporterCsvFilename: 'out.csv',
      exporterHeaderFilterUseName: true,
      exporterSuppressColumns: ['skip'],
      exporterOlderExcelCompatibility: true,
    };
    expect(resolveGridExporterOptions(options)).toMatchObject({
      csvColumnSeparator: '\t',
      csvFilename: 'out.csv',
      headerFilterUseName: true,
      suppressColumns: ['skip'],
      olderExcelCompatibility: true,
    });
  });
});

describe('filterExporterColumns', () => {
  it('auto-suppresses selectionRowHeaderCol and treeBaseRowHeaderCol', () => {
    const cols: GridColumnDef[] = [
      { name: 'selectionRowHeaderCol' },
      { name: 'treeBaseRowHeaderCol' },
      { name: 'name' },
    ];
    expect(filterExporterColumns(cols, {}, 'visible').map((c) => c.name)).toEqual(['name']);
  });

  it('honors exporterSuppressExport on columnDef', () => {
    const cols: GridColumnDef[] = [
      { name: 'a' },
      { name: 'b', exporterSuppressExport: true },
      { name: 'c' },
    ];
    expect(filterExporterColumns(cols, {}, 'visible').map((c) => c.name)).toEqual(['a', 'c']);
  });
});

describe('exporter row-level filtering', () => {
  it('skips rows with exporterEnableExporting:false', () => {
    const r1 = new GridRow('r1', { name: 'A' }, 0, 44);
    const r2 = new GridRow('r2', { name: 'B' }, 1, 44);
    r2.exporterEnableExporting = false;
    const csv = buildGridCsv([{ name: 'name', displayName: 'Name' }], [r1, r2]);
    expect(csv.split('\n').slice(1)).toEqual(['A']);
  });
});

describe('resolveExporterFilename', () => {
  it('returns the fallback when filename is undefined', () => {
    expect(resolveExporterFilename(undefined, 'download.csv', 'visible', 'visible')).toBe(
      'download.csv',
    );
  });

  it('invokes functions with the rowType + colType', () => {
    const fn = resolveExporterFilename(
      (row, col) => `${row}-${col}.csv`,
      'download.csv',
      'selected',
      'all',
    );
    expect(fn).toBe('selected-all.csv');
  });
});

describe('GRID_EXPORTER_CONSTANTS', () => {
  it('exports the same constant names as the old ui.grid.exporter module', () => {
    expect(GRID_EXPORTER_CONSTANTS.ALL).toBe('all');
    expect(GRID_EXPORTER_CONSTANTS.VISIBLE).toBe('visible');
    expect(GRID_EXPORTER_CONSTANTS.SELECTED).toBe('selected');
    expect(GRID_EXPORTER_CONSTANTS.selectionRowHeaderColName).toBe('selectionRowHeaderCol');
  });
});

describe('buildGridPdfDocDefinition', () => {
  it('produces a pdfMake-ready table with headers + rows', () => {
    const doc = buildGridPdfDocDefinition(
      [{ name: 'name', displayName: 'Name' }, { name: 'status', displayName: 'Status' }],
      [
        new GridRow('r1', { name: 'Alpha', status: 'Active' }, 0, 44),
        new GridRow('r2', { name: 'Beta', status: 'Pilot' }, 1, 44),
      ],
    );
    expect(doc.pageOrientation).toBe('landscape');
    expect(doc.pageSize).toBe('A4');
    expect(doc.content[0]!.table.headerRows).toBe(1);
    expect(doc.content[0]!.table.body.length).toBe(3); // header + 2 rows
    expect(doc.content[0]!.table.body[0]).toEqual([
      { text: 'Name', style: 'tableHeader' },
      { text: 'Status', style: 'tableHeader' },
    ]);
    expect(doc.content[0]!.table.body[1]).toEqual(['Alpha', 'Active']);
  });

  it('runs the customFormatter on the doc definition', () => {
    const doc = buildGridPdfDocDefinition(
      [{ name: 'name', displayName: 'Name' }],
      [new GridRow('r1', { name: 'Alpha' }, 0, 44)],
      {
        customFormatter: (d) => ({ ...d, pageOrientation: 'portrait' }),
      },
    );
    expect(doc.pageOrientation).toBe('portrait');
  });
});

describe('calculateGridPdfColumnWidths', () => {
  it('uses * for columns with no width', () => {
    expect(calculateGridPdfColumnWidths([{ name: 'a' }])).toEqual(['*']);
  });

  it('scales numeric widths to maxGridWidth', () => {
    const widths = calculateGridPdfColumnWidths(
      [{ name: 'a', width: '100' }, { name: 'b', width: '200' }],
      300,
    );
    // 100 + 200 = 300 base, scaled 1:1 to 300 max.
    expect(widths).toEqual([100, 200]);
  });
});

describe('formatGridPdfField', () => {
  it('handles null / undefined / booleans / numbers / strings / dates', () => {
    expect(formatGridPdfField(null)).toBe('');
    expect(formatGridPdfField(undefined)).toBe('');
    expect(formatGridPdfField(42)).toBe('42');
    expect(formatGridPdfField(true)).toBe('TRUE');
    expect(formatGridPdfField(false)).toBe('FALSE');
    expect(formatGridPdfField('hello "world"')).toBe('hello ""world""');
    const date = new Date('2026-05-07T00:00:00.000Z');
    expect(formatGridPdfField(date)).toBe('2026-05-07T00:00:00.000Z');
  });

  it('wraps the cell as a pdfMake-style text/alignment object when alignment is provided', () => {
    expect(formatGridPdfField('Alpha', 'right')).toEqual({
      text: 'Alpha',
      alignment: 'right',
    });
  });
});

// Menu tests live in `./grid.core.exporter-menu.spec.ts`.

describe('buildGridExcelSheetData', () => {
  it('produces a header row + data rows with {value, metadata} cells', () => {
    const sheet = buildGridExcelSheetData(
      [{ name: 'name', displayName: 'Name' }, { name: 'revenue', displayName: 'Revenue' }],
      [
        new GridRow('r1', { name: 'Alpha', revenue: 100 }, 0, 44),
        new GridRow('r2', { name: 'Beta', revenue: 200 }, 1, 44),
      ],
    );
    expect(sheet.length).toBe(3);
    expect(sheet[0]!.map((c) => c.value)).toEqual(['Name', 'Revenue']);
    expect(sheet[1]!.map((c) => c.value)).toEqual(['Alpha', 100]);
  });

  it('skips the header row when showHeader is false', () => {
    const sheet = buildGridExcelSheetData(
      [{ name: 'name', displayName: 'Name' }],
      [new GridRow('r1', { name: 'Alpha' }, 0, 44)],
      { showHeader: false },
    );
    expect(sheet.length).toBe(1);
    expect(sheet[0]!.map((c) => c.value)).toEqual(['Alpha']);
  });

  it('attaches the header style metadata from the provided styles map', () => {
    const sheet = buildGridExcelSheetData(
      [{ name: 'name', displayName: 'Name' }],
      [new GridRow('r1', { name: 'Alpha' }, 0, 44)],
      {},
      'visible',
      { header: { id: 'H1' } },
    );
    expect(sheet[0]![0]!.metadata).toEqual({ style: 'H1' });
  });
});

describe('formatGridExcelField', () => {
  it('handles null / numbers / strings / booleans / objects', () => {
    expect(formatGridExcelField(null)).toBe('');
    expect(formatGridExcelField(undefined)).toBe('');
    expect(formatGridExcelField(42)).toBe(42);
    expect(formatGridExcelField('Alpha')).toBe('Alpha');
    expect(formatGridExcelField(true)).toBe('TRUE');
    expect(formatGridExcelField(false)).toBe('FALSE');
    expect(formatGridExcelField({ a: 1 })).toBe('{"a":1}');
  });
});

describe('showHeader:false', () => {
  it('suppresses the header row', () => {
    const r1 = new GridRow('r1', { name: 'A' }, 0, 44);
    const csv = buildGridCsv(
      [{ name: 'name', displayName: 'Name' }],
      [r1],
      { showHeader: false },
    );
    expect(csv).toBe('A');
  });
});
