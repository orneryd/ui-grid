import { GridColumnDef, GridHeaderTemplateContext, GridOptions, GridRow } from './grid.models';
import { getCellValue, titleize, toCsvValue } from './grid.utils';
import { buildGridCellContext, formatGridCellDisplayValue } from './grid.core.display';

export function headerLabel(column: GridColumnDef): string {
  return column.displayName ?? titleize(column.name);
}

export function buildGridHeaderContext(column: GridColumnDef): GridHeaderTemplateContext {
  const value = headerLabel(column);
  return {
    $implicit: value,
    value,
    column,
  };
}

export function formatGridHeaderDisplayValue(context: GridHeaderTemplateContext): string {
  return context.column.headerRenderer ? context.column.headerRenderer(context) : context.value;
}

/** Which rows the exporter should include. Mirrors the old grid's
 * `rowTypes` argument on `gridApi.exporter.csvExport` / `pdfExport`:
 * - `all`: every row in the original data (pre-filter, pre-paging).
 * - `visible`: rows currently visible in the pipeline (post-filter + page).
 * - `selected`: rows currently selected. */
export type GridExporterRowType = 'all' | 'visible' | 'selected';

/** Which columns the exporter should include. Mirrors the old grid's
 * `colTypes` argument:
 * - `all`: every column, including hidden ones.
 * - `visible`: columns currently rendered in the grid. */
export type GridExporterColumnType = 'all' | 'visible';

export const GRID_EXPORTER_CONSTANTS = Object.freeze({
  featureName: 'exporter',
  rowHeaderColName: 'treeBaseRowHeaderCol',
  selectionRowHeaderColName: 'selectionRowHeaderCol',
  ALL: 'all',
  VISIBLE: 'visible',
  SELECTED: 'selected',
  CSV_CONTENT: 'CSV_CONTENT',
  BUTTON_LABEL: 'BUTTON_LABEL',
  FILE_NAME: 'FILE_NAME',
} as const);

const AUTO_SUPPRESSED_COLUMNS: ReadonlySet<string> = new Set<string>([
  GRID_EXPORTER_CONSTANTS.selectionRowHeaderColName,
  GRID_EXPORTER_CONSTANTS.rowHeaderColName,
]);

/** Full option matrix for the exporter. Field-for-field parity with the
 * old `ui.grid.exporter` options.
 *
 * `fieldCallback` / `fieldFormatCallback` mirror `exporterFieldCallback` /
 * `exporterFieldFormatCallback` — the former returns a different value, the
 * latter returns a format string that wraps each cell. `suppressColumns`
 * mirrors `exporterSuppressColumns`. `allDataFn` is the supplier called when
 * `rowType === 'all'` needs more data than the grid has in memory.
 * `headerFilterUseName` swaps header labels for display names when true
 * (ui-grid used column.name instead when false).
 * `headerFilter` is the final name transformer applied after all other
 * header logic — equivalent to `exporterHeaderFilter` in the old module. */
export interface GridExporterOptions {
  readonly csvColumnSeparator?: string;
  readonly csvFilename?: string | ((rowType: GridExporterRowType, colType: GridExporterColumnType) => string);
  readonly headerFilterUseName?: boolean;
  readonly headerFilter?: (displayName: string, column: GridColumnDef) => string;
  readonly headerTemplate?: string;
  readonly showHeader?: boolean;
  readonly fieldCallback?: (row: GridRow, column: GridColumnDef, value: unknown) => unknown;
  readonly fieldFormatCallback?: (
    row: GridRow,
    column: GridColumnDef,
    value: unknown,
  ) => string | undefined | null;
  readonly fieldApplyFilters?: boolean;
  readonly suppressColumns?: readonly string[];
  readonly olderExcelCompatibility?: boolean;
  readonly isExcelCompatible?: boolean;
  readonly allDataFn?: () => readonly GridRow[] | Promise<readonly GridRow[]>;
  readonly csvLinkElement?: HTMLElement | null;
  readonly menuItemOrder?: number;
  readonly menuCsv?: boolean;
  readonly menuAllData?: boolean;
  readonly menuVisibleData?: boolean;
  readonly menuSelectedData?: boolean;
  readonly suppressMenu?: boolean;
  readonly menuLabel?: string;
}

const UTF8_BOM = '﻿';

function resolveHeader(
  column: GridColumnDef,
  options: GridExporterOptions | undefined,
): string {
  const raw = options?.headerFilterUseName === true
    ? column.name
    : (column.displayName ?? titleize(column.name));
  if (options?.headerFilter) {
    return options.headerFilter(raw, column);
  }
  return raw;
}

/** Determine which columns the exporter should emit. Mirrors the old grid's
 * `getColumnHeaders` + `getData` column logic — it auto-suppresses the
 * selection / tree row-header columns and honours `exporterSuppressExport`
 * / `exporterSuppressColumns` (column-def flag and grid-option list). */
export function filterExporterColumns(
  columns: readonly GridColumnDef[],
  options: GridExporterOptions | undefined,
  colType: GridExporterColumnType,
): GridColumnDef[] {
  const suppressed = new Set(options?.suppressColumns ?? []);
  return columns.filter((column) => {
    if (AUTO_SUPPRESSED_COLUMNS.has(column.name)) return false;
    if (suppressed.has(column.name)) return false;
    if (column.exporterSuppressExport === true) return false;
    if (colType === 'all') return true;
    return column.visible !== false;
  });
}

function cellValueForExport(
  row: GridRow,
  column: GridColumnDef,
  options: GridExporterOptions | undefined,
): string {
  const rawValue = formatGridCellDisplayValue(buildGridCellContext(row, column));
  // The old exporter lets consumers override the raw value (pre-format)
  // via fieldCallback, and then optionally transform the final string via
  // fieldFormatCallback. When fieldCallback runs the return value replaces
  // the cell, but the formatter still runs on the display string.
  let value: string = rawValue;
  if (options?.fieldCallback) {
    const override = options.fieldCallback(row, column, rawValue);
    if (override !== undefined && override !== null) {
      value = typeof override === 'string' ? override : String(override);
    }
  }
  if (options?.fieldFormatCallback) {
    const format = options.fieldFormatCallback(row, column, value);
    if (format !== undefined && format !== null) {
      value = format;
    }
  }
  return value;
}

/** Resolve the output filename. Mirrors the old grid's handling of
 * `exporterCsvFilename` / `exporterExcelFilename` as either a string or a
 * function `(grid, rowType, colType) => string`. */
export function resolveExporterFilename(
  filename: string | ((rowType: GridExporterRowType, colType: GridExporterColumnType) => string) | undefined,
  fallback: string,
  rowType: GridExporterRowType,
  colType: GridExporterColumnType,
): string {
  if (typeof filename === 'function') return filename(rowType, colType);
  if (typeof filename === 'string' && filename.length > 0) return filename;
  return fallback;
}

/** Legacy entry point — kept for backwards compatibility with earlier
 * callers. New callers should prefer `buildGridCsv`. */
export function exportCsvRows(
  columns: readonly GridColumnDef[],
  rows: readonly GridRow[],
  formatCell?: (row: GridRow, column: GridColumnDef) => string,
): string {
  const header = columns.map((column) => toCsvValue(headerLabel(column))).join(',');
  const body = rows.map((row) =>
    columns
      .map((column) =>
        toCsvValue(
          formatCell
            ? formatCell(row, column)
            : formatGridCellDisplayValue(buildGridCellContext(row, column)),
        ),
      )
      .join(','),
  );
  return [header, ...body].join('\n');
}

/** Build a CSV string from the given columns + rows, honoring the full
 * exporter option matrix. Ports `ui.grid.exporter.service#formatAsCsv` and
 * related helpers. */
export function buildGridCsv(
  columns: readonly GridColumnDef[],
  rows: readonly GridRow[],
  options: GridExporterOptions = {},
  colType: GridExporterColumnType = 'visible',
): string {
  const sep = options.csvColumnSeparator ?? ',';
  const effectiveColumns = filterExporterColumns(columns, options, colType);

  // Skip any row flagged as non-exportable. Mirrors old grid's
  // `exporterEnableExporting` row-level flag.
  const exportableRows = rows.filter((row) => row.exporterEnableExporting !== false);

  const showHeader = options.showHeader !== false;
  const headerCells = effectiveColumns
    .map((column) => toCsvValue(resolveHeader(column, options), sep))
    .join(sep);
  const headerTemplate = options.headerTemplate;
  const header = !showHeader
    ? ''
    : headerTemplate
      ? headerTemplate.replace('HEADER_VALUES', headerCells)
      : headerCells;

  const body = exportableRows.map((row) =>
    effectiveColumns
      .map((column) => toCsvValue(cellValueForExport(row, column, options), sep))
      .join(sep),
  );

  const lines = showHeader ? [header, ...body] : body;
  const csv = lines.join('\n');
  return options.olderExcelCompatibility ? UTF8_BOM + csv : csv;
}

/** Shape matches pdfMake's table cell descriptor (string or alignment-wrapped object). */
export type GridExporterPdfCell = string | { text: string; alignment?: string };

/** Minimal subset of pdfMake's docDefinition we emit. Kept as a plain
 * object so consumers can pass it directly to pdfMake.createPdf(...). */
export interface GridExporterPdfDocDefinition {
  pageOrientation: string;
  pageSize: string;
  content: Array<{
    style: string;
    table: {
      headerRows: number;
      widths: Array<number | string>;
      body: Array<Array<GridExporterPdfCell>>;
    };
    layout?: unknown;
  }>;
  styles: {
    tableStyle: unknown;
    tableHeader: unknown;
  };
  defaultStyle: unknown;
  header?: unknown;
  footer?: unknown;
  layout?: unknown;
}

/** PDF-specific bits of the exporter option matrix. Pure-data, consumable
 * by consumers that want to render the doc themselves. */
export interface GridExporterPdfOptions {
  orientation?: string;
  pageSize?: string;
  maxGridWidth?: number;
  defaultStyle?: unknown;
  tableStyle?: unknown;
  tableHeaderStyle?: unknown;
  layout?: unknown;
  header?: unknown;
  footer?: unknown;
  customFormatter?: (
    docDefinition: GridExporterPdfDocDefinition,
  ) => GridExporterPdfDocDefinition;
  filename?: string | ((rowType: GridExporterRowType, colType: GridExporterColumnType) => string);
}

/** Format a single field as a PDF cell. Mirrors `formatFieldAsPdfString`
 * from the old module (no quotes, booleans → TRUE/FALSE, dates JSON-serialised
 * without wrapping quotes). */
export function formatGridPdfField(value: unknown, alignment?: string): GridExporterPdfCell {
  let text: string;
  if (value === null || value === undefined) {
    text = '';
  } else if (typeof value === 'number') {
    text = value.toString();
  } else if (typeof value === 'boolean') {
    text = value ? 'TRUE' : 'FALSE';
  } else if (typeof value === 'string') {
    text = value.replace(/"/g, '""');
  } else if (value instanceof Date) {
    text = JSON.stringify(value).replace(/^"/, '').replace(/"$/, '');
  } else {
    text = JSON.stringify(value).replace(/^"/, '').replace(/"$/, '');
  }
  return alignment ? { text, alignment } : text;
}

/** Computes PDF column widths. Ports `calculatePdfHeaderWidths` from the
 * old module — treats '*' as 100, percent strings as a share of the
 * numeric-width base, then scales the whole thing to `maxGridWidth`. */
export function calculateGridPdfColumnWidths(
  columns: readonly GridColumnDef[],
  maxGridWidth = 720,
): Array<number | string> {
  const widths = columns.map((column) => parsePdfColumnWidth(column.width));
  let baseGridWidth = 0;
  for (const width of widths) {
    if (typeof width === 'number') baseGridWidth += width;
  }

  let extra = 0;
  const resolved: Array<number | string> = widths.map((value) => {
    if (value === '*') {
      extra += 100;
      return '*';
    }
    if (typeof value === 'string' && /%/.test(value)) {
      const percent = parseInt(value, 10);
      if (Number.isFinite(percent)) {
        const asNumber = (baseGridWidth * percent) / 100;
        extra += asNumber;
        return asNumber;
      }
    }
    return value;
  });

  const gridWidth = baseGridWidth + extra;
  if (gridWidth === 0) {
    return resolved.map((w) => (w === '*' ? w : 1));
  }
  return resolved.map((value) =>
    value === '*' ? '*' : (Number(value) * maxGridWidth) / gridWidth,
  );
}

function parsePdfColumnWidth(width: string | undefined): number | string {
  if (!width) return '*';
  if (width === '*') return '*';
  if (/%$/.test(width)) return width;
  const num = parseInt(width, 10);
  return Number.isFinite(num) ? num : width;
}

/** Build a pdfMake-ready doc definition. Pure — the caller is responsible
 * for piping this through `pdfMake.createPdf(doc).open()` (or equivalent). */
export function buildGridPdfDocDefinition(
  columns: readonly GridColumnDef[],
  rows: readonly GridRow[],
  pdfOptions: GridExporterPdfOptions = {},
  exporterOptions: GridExporterOptions = {},
  colType: GridExporterColumnType = 'visible',
): GridExporterPdfDocDefinition {
  const effectiveColumns = filterExporterColumns(columns, exporterOptions, colType);
  const maxWidth = pdfOptions.maxGridWidth ?? 720;
  const widths = calculateGridPdfColumnWidths(effectiveColumns, maxWidth);

  const headerRow: Array<GridExporterPdfCell> = effectiveColumns.map((column) => ({
    text: resolveHeader(column, exporterOptions),
    style: 'tableHeader',
  }));

  const body: Array<Array<GridExporterPdfCell>> = rows
    .filter((row) => row.exporterEnableExporting !== false)
    .map((row) =>
      effectiveColumns.map((column) => {
        const raw = cellValueForExport(row, column, exporterOptions);
        return formatGridPdfField(raw, column.exporterPdfAlign);
      }),
    );

  const doc: GridExporterPdfDocDefinition = {
    pageOrientation: pdfOptions.orientation ?? 'landscape',
    pageSize: pdfOptions.pageSize ?? 'A4',
    content: [
      {
        style: 'tableStyle',
        table: {
          headerRows: 1,
          widths,
          body: [headerRow, ...body],
        },
      },
    ],
    styles: {
      tableStyle: pdfOptions.tableStyle ?? { margin: [0, 5, 0, 15] },
      tableHeader: pdfOptions.tableHeaderStyle ?? { bold: true, fontSize: 12, color: 'black' },
    },
    defaultStyle: pdfOptions.defaultStyle ?? { fontSize: 11 },
  };

  if (pdfOptions.layout !== undefined) doc.layout = pdfOptions.layout;
  if (pdfOptions.header !== undefined) doc.header = pdfOptions.header;
  if (pdfOptions.footer !== undefined) doc.footer = pdfOptions.footer;
  if (pdfOptions.customFormatter) {
    return pdfOptions.customFormatter(doc);
  }
  return doc;
}

/** Pluck the PDF-specific options out of GridOptions, same shape the old
 * module expected. Unprefixed field names keep the core module decoupled
 * from `GridOptions`' exporter* prefixing. */
export function resolveGridExporterPdfOptions(
  options: GridOptions,
): GridExporterPdfOptions {
  const customFormatter = options.exporterPdfCustomFormatter;
  return {
    orientation: options.exporterPdfOrientation,
    pageSize: options.exporterPdfPageSize,
    maxGridWidth: options.exporterPdfMaxGridWidth,
    defaultStyle: options.exporterPdfDefaultStyle,
    tableStyle: options.exporterPdfTableStyle,
    tableHeaderStyle: options.exporterPdfTableHeaderStyle,
    layout: options.exporterPdfLayout,
    header: options.exporterPdfHeader,
    footer: options.exporterPdfFooter,
    customFormatter: customFormatter
      ? (doc) => customFormatter(doc) as GridExporterPdfDocDefinition
      : undefined,
    filename: options.exporterPdfFilename,
  };
}

/** A single Excel cell payload — the old module produced
 * `{value, metadata: {style}}` entries that ExcelBuilder consumes. */
export interface GridExporterExcelCell {
  value: string | number | boolean;
  metadata?: { style?: unknown } | null;
}

/** The 2D array of cells produced by `buildGridExcelSheetData`. Feeds
 * directly into `sheet.setData(...)` when ExcelBuilder is available. */
export type GridExporterExcelSheetData = GridExporterExcelCell[][];

/** Excel-specific options. Mirrors the old module's
 * `exporterExcel*` bundle. */
export interface GridExporterExcelOptions {
  filename?: string | ((rowType: GridExporterRowType, colType: GridExporterColumnType) => string);
  sheetName?: string | ((rowType: GridExporterRowType, colType: GridExporterColumnType) => string);
  header?: unknown;
  columnScaleFactor?: number;
  customFormatters?: (context: { workbook?: unknown; docDefinition: { styles: Record<string, unknown> } }) => {
    styles: Record<string, unknown>;
  };
}

/** Formats a single cell value the way ExcelBuilder expects. Ports
 * `formatFieldAsExcel` (the old module returned the raw value for numbers
 * / strings, 'TRUE' / 'FALSE' for booleans, stringified everything else). */
export function formatGridExcelField(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return JSON.stringify(value);
}

/** Build the 2D cell grid ExcelBuilder consumes. The first row is the
 * header, followed by one row per data row. Matches the shape produced
 * by `formatAsExcel` in the old module. */
export function buildGridExcelSheetData(
  columns: readonly GridColumnDef[],
  rows: readonly GridRow[],
  exporterOptions: GridExporterOptions = {},
  colType: GridExporterColumnType = 'visible',
  styles?: Record<string, { id?: unknown }>,
): GridExporterExcelSheetData {
  const effectiveColumns = filterExporterColumns(columns, exporterOptions, colType);
  const showHeader = exporterOptions.showHeader !== false;

  const sheetData: GridExporterExcelSheetData = [];

  if (showHeader) {
    const headerRow = effectiveColumns.map((column) => {
      const align = column.align ?? '';
      const styleKey = align === 'center' ? 'headerCenter' : align === 'end' ? 'headerRight' : 'header';
      const metadata = styles?.[styleKey]?.id !== undefined ? { style: styles[styleKey]!.id } : null;
      return {
        value: resolveHeader(column, exporterOptions),
        metadata,
      } satisfies GridExporterExcelCell;
    });
    sheetData.push(headerRow);
  }

  const exportableRows = rows.filter((row) => row.exporterEnableExporting !== false);
  for (const row of exportableRows) {
    const cells = effectiveColumns.map((column) => {
      // Excel cells preserve native numeric / boolean types so spreadsheets
      // can sort + aggregate them. The CSV path stringifies because CSV is
      // a text format; Excel has a real cell type system.
      const raw = getCellValue(row.entity, column);
      return {
        value: formatGridExcelField(raw),
      } satisfies GridExporterExcelCell;
    });
    sheetData.push(cells);
  }

  return sheetData;
}

/** Pluck Excel-specific options out of `GridOptions`. */
export function resolveGridExporterExcelOptions(
  options: GridOptions,
): GridExporterExcelOptions {
  return {
    filename: options.exporterExcelFilename,
    sheetName: options.exporterExcelSheetName,
    header: options.exporterExcelHeader,
    columnScaleFactor: options.exporterColumnScaleFactor,
    customFormatters: options.exporterExcelCustomFormatters,
  };
}

// Menu-building logic now lives in `./grid.core.exporter-menu.ts`. The
// public `buildGridExporterMenuItems` / `GridExporterMenuItem` / labels
// type stay re-exported from the bridge so consumers don't need a new
// import.

/** Translate a `GridOptions` object into the exporter's option matrix.
 * Each option field maps 1:1 from `exporter*` to the stripped name used
 * internally, matching the shape of the old `ui.grid.exporter` module. */
export function resolveGridExporterOptions(options: GridOptions): GridExporterOptions {
  return {
    csvColumnSeparator: options.exporterCsvColumnSeparator,
    csvFilename: options.exporterCsvFilename,
    headerFilterUseName: options.exporterHeaderFilterUseName,
    headerFilter: options.exporterHeaderFilter,
    headerTemplate: options.exporterHeaderTemplate,
    fieldCallback: options.exporterFieldCallback,
    fieldFormatCallback: options.exporterFieldFormatCallback,
    fieldApplyFilters: options.exporterFieldApplyFilters,
    suppressColumns: options.exporterSuppressColumns,
    olderExcelCompatibility: options.exporterOlderExcelCompatibility,
    isExcelCompatible: options.exporterIsExcelCompatible,
    allDataFn: options.exporterAllDataFn,
    csvLinkElement: options.exporterCsvLinkElement,
    menuItemOrder: options.exporterMenuItemOrder,
    menuCsv: options.exporterMenuCsv,
    menuAllData: options.exporterMenuAllData,
    menuVisibleData: options.exporterMenuVisibleData,
    menuSelectedData: options.exporterMenuSelectedData,
    suppressMenu: options.exporterSuppressMenu,
    menuLabel: options.exporterMenuLabel,
    showHeader: options.exporterShowHeader,
  };
}
