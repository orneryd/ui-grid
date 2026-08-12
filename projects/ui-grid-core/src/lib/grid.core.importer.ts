/**
 * Grid importer — pure logic ported from `ui.grid.importer`.
 *
 * The old module read a File via FileReader + CSV.parse / JSON.parse, built
 * an array of new entities keyed off the column defs, then handed them to
 * `gridOptions.importerDataAddCallback(grid, newObjects)` so the consumer
 * could merge them into its data source. The DOM bits (file picker, menu
 * item, FileReader) live in the vanilla element; everything here is pure.
 */

import { GridColumnDef, GridOptions, GridRecord } from './grid.models';

/** Header cells to column-name mapping. Matches the return shape of
 * `processHeaders` in the old module — each entry is the column field/name
 * to assign the value under, or `null` when the header didn't match any
 * existing column. */
export type GridImporterHeaderMapping = readonly (string | null)[];

/** The error keys the old module raised via `importerErrorCallback`. These
 * map 1:1 to i18n entries in `en-US.json` so consumers can translate them. */
export type GridImporterErrorKey =
  | 'importer.invalidJson'
  | 'importer.jsonNotarray'
  | 'importer.invalidCsv'
  | 'importer.noObjects'
  | 'importer.noHeaders';

/** Shape of the option matrix the importer reads. Mirrors the
 * `importer*` options documented in the old module. */
export interface GridImporterOptions {
  readonly enable?: boolean;
  readonly showMenu?: boolean;
  readonly processHeaders?: (headerRow: readonly string[]) => GridImporterHeaderMapping;
  readonly headerFilter?: (displayName: string) => string;
  readonly errorCallback?: (
    errorKey: GridImporterErrorKey,
    consoleMessage: string,
    context: unknown,
  ) => void;
  readonly dataAddCallback?: (newObjects: readonly GridRecord[]) => void;
  readonly newObject?: new () => GridRecord;
  readonly objectCallback?: (newObject: GridRecord) => GridRecord;
}

export function resolveGridImporterOptions(options: GridOptions): GridImporterOptions {
  return {
    enable: options.enableImporter,
    showMenu: options.importerShowMenu,
    processHeaders: options.importerProcessHeaders,
    headerFilter: options.importerHeaderFilter,
    errorCallback: options.importerErrorCallback,
    dataAddCallback: options.importerDataAddCallback,
    newObject: options.importerNewObject,
    objectCallback: options.importerObjectCallback,
  };
}

/** Build a lookup hash mapping every recognizable header value to the
 * column field/name that should receive that cell. Mirrors
 * `flattenColumnDefs` — we map `name` / `field` / `displayName` plus each
 * of their lower-cased forms, and optionally an `importerHeaderFilter`-
 * transformed displayName. */
export function flattenGridColumnDefsForImport(
  columnDefs: readonly GridColumnDef[],
  headerFilter?: (displayName: string) => string,
): Record<string, string> {
  const flattened: Record<string, string> = {};
  for (const columnDef of columnDefs) {
    const target = columnDef.field ?? columnDef.name;
    if (columnDef.name) {
      flattened[columnDef.name] = target;
      flattened[columnDef.name.toLowerCase()] = target;
    }
    if (columnDef.field) {
      flattened[columnDef.field] = target;
      flattened[columnDef.field.toLowerCase()] = target;
    }
    if (columnDef.displayName) {
      flattened[columnDef.displayName] = target;
      flattened[columnDef.displayName.toLowerCase()] = target;
    }
    if (columnDef.displayName && headerFilter) {
      const filtered = headerFilter(columnDef.displayName);
      flattened[filtered] = target;
      flattened[filtered.toLowerCase()] = target;
    }
  }
  return flattened;
}

/** Default `processHeaders` implementation — matches what the old module
 * called `service.processHeaders`. When no columnDefs are present the
 * header row is sanitized to attribute names (`/[^0-9a-zA-Z\-_]/g → '_'`);
 * otherwise each header is looked up in the flattened hash. */
export function defaultGridImporterProcessHeaders(
  columnDefs: readonly GridColumnDef[] | undefined,
  headerRow: readonly string[],
  headerFilter?: (displayName: string) => string,
): GridImporterHeaderMapping {
  if (!columnDefs || columnDefs.length === 0) {
    return headerRow.map((value) => value.replace(/[^0-9a-zA-Z\-_]/g, '_'));
  }
  const lookup = flattenGridColumnDefsForImport(columnDefs, headerFilter);
  return headerRow.map((value) => {
    if (lookup[value]) return lookup[value];
    const lower = typeof value === 'string' ? value.toLowerCase() : value;
    if (lookup[lower]) return lookup[lower];
    return null;
  });
}

/** Construct a fresh object for the importer to populate. Mirrors
 * `service.newObject` — uses `importerNewObject` when provided, otherwise
 * `{}`. */
export function createGridImporterNewObject(
  options: Pick<GridImporterOptions, 'newObject'>,
): GridRecord {
  if (options.newObject) {
    return new options.newObject();
  }
  return {};
}

/** Run the `objectCallback` hook if the consumer provided one, otherwise
 * return the object unchanged. */
export function applyGridImporterObjectCallback(
  options: Pick<GridImporterOptions, 'objectCallback'>,
  obj: GridRecord,
): GridRecord {
  if (options.objectCallback) return options.objectCallback(obj);
  return obj;
}

/** Parse a JSON file payload into an array of entities. Mirrors
 * `service.parseJson` + `importJsonClosure` from the old module —
 * non-array JSON produces an empty array + an i18n error callback.
 * Returns `null` when the text isn't valid JSON at all so the caller
 * can distinguish "bad file" from "empty file". */
export function parseGridImporterJson(
  source: string,
  options: Pick<GridImporterOptions, 'errorCallback'>,
): GridRecord[] | null {
  let loaded: unknown;
  try {
    loaded = JSON.parse(source);
  } catch {
    options.errorCallback?.(
      'importer.invalidJson',
      'File could not be processed, is it valid json? Content was: ',
      source,
    );
    return null;
  }
  if (!Array.isArray(loaded)) {
    options.errorCallback?.(
      'importer.jsonNotarray',
      'Import failed, file is not an array, file was: ',
      source,
    );
    return [];
  }
  return loaded as GridRecord[];
}

/** Parse a CSV file payload into an array of row arrays — the first row is
 * the header, the rest are data. Based on the CSV parser shipped with the
 * old `ui.grid.importer` module (which itself was borrowed from
 * excel.js/csv.js). Handles quoted values, escaped quotes and CRLF line
 * endings. Returns `null` when the input is empty / unreadable. */
export function parseGridImporterCsv(source: string): string[][] | null {
  if (typeof source !== 'string' || source.length === 0) return null;

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = (): void => {
    currentRow.push(field);
    field = '';
  };
  const pushRow = (): void => {
    pushField();
    rows.push(currentRow);
    currentRow = [];
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushField();
    } else if (char === '\n') {
      pushRow();
    } else if (char === '\r') {
      // Skip — \r\n line endings are consumed when we hit \n. A stray \r
      // on its own is treated as a newline to match the old parser.
      if (source[i + 1] !== '\n') pushRow();
    } else {
      field += char;
    }
  }
  if (field !== '' || currentRow.length > 0) pushRow();
  return rows.length > 0 ? rows : null;
}

/** Turn a CSV matrix (header + rows) into an array of entities, using the
 * provided header mapping to decide which column each cell lands in.
 * Mirrors `createCsvObjects` + the inner `forEach` that populates each
 * new object. */
export function buildGridImporterObjectsFromCsv(
  importArray: readonly (readonly string[])[],
  columnDefs: readonly GridColumnDef[] | undefined,
  options: GridImporterOptions,
): GridRecord[] | null {
  if (!importArray || importArray.length === 0) return null;

  const [headerRow, ...dataRows] = importArray;
  if (!headerRow) return null;
  const headerMapping = options.processHeaders
    ? options.processHeaders(headerRow)
    : defaultGridImporterProcessHeaders(columnDefs, headerRow, options.headerFilter);

  if (!headerMapping || headerMapping.length === 0) {
    options.errorCallback?.(
      'importer.noHeaders',
      'Column names could not be derived, content was: ',
      importArray,
    );
    return [];
  }

  const result: GridRecord[] = [];
  for (const row of dataRows) {
    if (!row) continue;
    let obj = createGridImporterNewObject(options);
    for (let i = 0; i < row.length; i++) {
      const key = headerMapping[i];
      if (key) obj[key] = row[i];
    }
    obj = applyGridImporterObjectCallback(options, obj);
    result.push(obj);
  }
  return result;
}

/** Turn a JSON payload into entities. Each parsed object is merged onto a
 * fresh newObject (so `importerNewObject` prototypes stay intact), then
 * piped through `objectCallback`. Mirrors `importJsonClosure`. */
export function buildGridImporterObjectsFromJson(
  parsed: readonly GridRecord[],
  options: GridImporterOptions,
): GridRecord[] {
  const result: GridRecord[] = [];
  for (const value of parsed) {
    let obj = createGridImporterNewObject(options);
    Object.assign(obj, value);
    obj = applyGridImporterObjectCallback(options, obj);
    result.push(obj);
  }
  return result;
}
