/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  buildGridImporterObjectsFromCsv,
  buildGridImporterObjectsFromJson,
  defaultGridImporterProcessHeaders,
  flattenGridColumnDefsForImport,
  parseGridImporterCsv,
  parseGridImporterJson,
  resolveGridImporterOptions,
} from './grid.core.importer';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.importer.wasm-runner.mjs', import.meta.url));

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

const columnDefs = [
  { name: 'id', field: 'id' },
  { name: 'name', displayName: 'Full Name' },
  { name: 'status' },
];

describe('grid.core.importer wasm parity', () => {
  it('matches default option renaming for serializable importer fields', () => {
    const options = {
      id: 'g',
      data: [],
      columnDefs: [],
      enableImporter: true,
      importerShowMenu: false,
    };
    expect(runWasm('resolveGridImporterOptions', options)).toEqual(resolveGridImporterOptions(options));
  });

  it('matches flattened headers and default header processing', () => {
    expect(runWasm('flattenGridColumnDefsForImport', columnDefs)).toEqual(flattenGridColumnDefsForImport(columnDefs));
    expect(
      runWasm('defaultGridImporterProcessHeaders', { columnDefs, headerRow: ['id', 'FULL NAME', 'Foo'] }),
    ).toEqual(defaultGridImporterProcessHeaders(columnDefs, ['id', 'FULL NAME', 'Foo']));
    expect(
      runWasm('defaultGridImporterProcessHeaders', { columnDefs: null, headerRow: ['First Name', 'e/mail'] }),
    ).toEqual(defaultGridImporterProcessHeaders(undefined, ['First Name', 'e/mail']));
  });

  it('matches JSON and CSV parsing behavior', () => {
    expect(runWasm<any>('parseGridImporterJson', { source: '[{"id":1}]' })).toEqual({
      parsed: parseGridImporterJson('[{"id":1}]', {}),
      errorKey: null,
    });
    expect(runWasm<any>('parseGridImporterJson', { source: 'not json' })).toEqual({
      parsed: null,
      errorKey: 'importer.invalidJson',
    });
    expect(runWasm<any>('parseGridImporterJson', { source: '{"id":1}' })).toEqual({
      parsed: [],
      errorKey: 'importer.jsonNotarray',
    });
    expect(runWasm('parseGridImporterCsv', 'name,notes\n"Alpha, Inc","He said ""hi"""')).toEqual(
      parseGridImporterCsv('name,notes\n"Alpha, Inc","He said ""hi"""'),
    );
  });

  it('matches default object building from csv and json payloads', () => {
    const csv = [
      ['id', 'Full Name', 'status'],
      ['1', 'Alpha', 'Active'],
      ['2', 'Beta', 'Pilot'],
    ];
    expect(runWasm('buildGridImporterObjectsFromCsv', { importArray: csv, columnDefs })).toEqual(
      buildGridImporterObjectsFromCsv(csv, columnDefs, {}),
    );
    expect(runWasm('buildGridImporterObjectsFromJson', [{ id: 1 }, { id: 2 }])).toEqual(
      buildGridImporterObjectsFromJson([{ id: 1 }, { id: 2 }], {}),
    );
  });
});
