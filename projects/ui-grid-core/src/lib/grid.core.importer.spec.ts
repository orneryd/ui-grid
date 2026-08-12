import { describe, expect, it, vi } from 'vitest';
import {
  buildGridImporterObjectsFromCsv,
  buildGridImporterObjectsFromJson,
  defaultGridImporterProcessHeaders,
  flattenGridColumnDefsForImport,
  parseGridImporterCsv,
  parseGridImporterJson,
  resolveGridImporterOptions,
} from './grid.core.importer';
import { GridColumnDef, GridOptions } from './grid.models';

const columnDefs: GridColumnDef[] = [
  { name: 'id', field: 'id' },
  { name: 'name', displayName: 'Full Name' },
  { name: 'status' },
];

describe('flattenGridColumnDefsForImport', () => {
  it('maps every form (name / field / displayName, plus lowercase) to the target field', () => {
    const lookup = flattenGridColumnDefsForImport(columnDefs);
    expect(lookup['id']).toBe('id');
    expect(lookup['ID']).toBeUndefined(); // uppercase isn't mapped directly
    expect(lookup['Full Name']).toBe('name');
    expect(lookup['full name']).toBe('name');
    expect(lookup['status']).toBe('status');
  });

  it('includes an `importerHeaderFilter`-transformed displayName when provided', () => {
    const lookup = flattenGridColumnDefsForImport(columnDefs, (name) => `*${name}*`);
    expect(lookup['*Full Name*']).toBe('name');
    expect(lookup['*full name*']).toBe('name');
  });
});

describe('defaultGridImporterProcessHeaders', () => {
  it('creates attr names from headers when no columnDefs exist', () => {
    expect(defaultGridImporterProcessHeaders(undefined, ['First Name', 'Last-Name', 'e/mail'])).toEqual([
      'First_Name',
      'Last-Name',
      'e_mail',
    ]);
  });

  it('matches column headers case-insensitively, falls back to null for unknowns', () => {
    expect(defaultGridImporterProcessHeaders(columnDefs, ['id', 'FULL NAME', 'Foo'])).toEqual([
      'id',
      'name',
      null,
    ]);
  });
});

describe('parseGridImporterJson', () => {
  it('returns the parsed array when valid', () => {
    const result = parseGridImporterJson('[{"id":1}]', {});
    expect(result).toEqual([{ id: 1 }]);
  });

  it('invokes errorCallback with invalidJson when the input is garbage', () => {
    const errorCallback = vi.fn();
    const result = parseGridImporterJson('not json', { errorCallback });
    expect(result).toBeNull();
    expect(errorCallback).toHaveBeenCalledWith(
      'importer.invalidJson',
      expect.any(String),
      'not json',
    );
  });

  it('invokes errorCallback with jsonNotarray when the JSON is not an array', () => {
    const errorCallback = vi.fn();
    const result = parseGridImporterJson('{"id":1}', { errorCallback });
    expect(result).toEqual([]);
    expect(errorCallback).toHaveBeenCalledWith(
      'importer.jsonNotarray',
      expect.any(String),
      '{"id":1}',
    );
  });
});

describe('parseGridImporterCsv', () => {
  it('splits a simple two-row csv into arrays', () => {
    expect(parseGridImporterCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('honors quoted values with commas and escaped quotes', () => {
    expect(parseGridImporterCsv('name,notes\n"Alpha, Inc","He said ""hi"""')).toEqual([
      ['name', 'notes'],
      ['Alpha, Inc', 'He said "hi"'],
    ]);
  });

  it('tolerates CRLF line endings', () => {
    expect(parseGridImporterCsv('a,b\r\n1,2\r\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('returns null for empty input', () => {
    expect(parseGridImporterCsv('')).toBeNull();
  });
});

describe('buildGridImporterObjectsFromCsv', () => {
  it('maps CSV rows onto column fields', () => {
    const csv = [
      ['id', 'Full Name', 'status'],
      ['1', 'Alpha', 'Active'],
      ['2', 'Beta', 'Pilot'],
    ];
    expect(buildGridImporterObjectsFromCsv(csv, columnDefs, {})).toEqual([
      { id: '1', name: 'Alpha', status: 'Active' },
      { id: '2', name: 'Beta', status: 'Pilot' },
    ]);
  });

  it('passes each object through the objectCallback', () => {
    const csv = [
      ['id', 'name'],
      ['1', 'Alpha'],
    ];
    const objectCallback = vi.fn((obj) => ({ ...obj, wrapped: true }));
    const result = buildGridImporterObjectsFromCsv(csv, columnDefs, { objectCallback });
    expect(result).toEqual([{ id: '1', name: 'Alpha', wrapped: true }]);
    expect(objectCallback).toHaveBeenCalledTimes(1);
  });
});

describe('buildGridImporterObjectsFromJson', () => {
  it('merges each parsed entry onto a fresh new-object', () => {
    class Seed {
      [key: string]: unknown;
      seed = true;
    }
    const parsed = [{ id: 1 }, { id: 2 }];
    const out = buildGridImporterObjectsFromJson(parsed, {
      newObject: Seed,
    });
    expect(out).toEqual([
      { seed: true, id: 1 },
      { seed: true, id: 2 },
    ]);
  });
});

describe('resolveGridImporterOptions', () => {
  it('renames importer* grid options onto the internal shape', () => {
    const options: GridOptions = {
      id: 'g',
      data: [],
      columnDefs: [],
      enableImporter: true,
      importerShowMenu: false,
      importerHeaderFilter: (name) => name,
    };
    expect(resolveGridImporterOptions(options)).toMatchObject({
      enable: true,
      showMenu: false,
      headerFilter: options.importerHeaderFilter,
    });
  });
});
