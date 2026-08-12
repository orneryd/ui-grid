import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { buildGridExporterMenuItems } from './grid.core.exporter-menu';
import { buildGridImporterMenuItems } from './grid.core.importer-menu';
import { buildGridRowEditMenuItems } from './grid.core.row-edit-menu';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.menu.wasm-runner.mjs', import.meta.url));

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

function normalize(items: Array<{ title: string; order: number; shown: boolean }>) {
  return items.map(({ title, order, shown }) => ({ title, order, shown }));
}

describe('grid.core.menu wasm parity', () => {
  it('matches exporter menu descriptors', () => {
    const options = { id: 'g', data: [], columnDefs: [], exporterMenuItemOrder: 500 };
    const labels = { exporterAllAsCsv: 'Everything as csv!' };
    const tsItems = buildGridExporterMenuItems(
      options,
      labels,
      { csvExport: () => {}, pdfExport: () => {}, excelExport: () => {} },
      () => true,
    ).map((item) => ({ title: item.title, order: item.order, shown: item.shown() }));

    const wasmItems = runWasm<any[]>('buildGridExporterMenuItems', {
      options,
      labels,
      hasSelection: true,
      includePdf: true,
      includeExcel: true,
    });

    expect(normalize(wasmItems)).toEqual(normalize(tsItems));
  });

  it('matches importer menu descriptors', () => {
    const options = { id: 'g', data: [], columnDefs: [], enableImporter: true };
    const labels = { importerTitle: 'Import' };
    const tsItems = buildGridImporterMenuItems(options, labels, { importAFile: () => {} }).map((item) => ({
      title: item.title,
      order: item.order,
      shown: item.shown(),
    }));
    const wasmItems = runWasm<any[]>('buildGridImporterMenuItems', { options, labels });

    expect(normalize(wasmItems)).toEqual(normalize(tsItems));
  });

  it('matches row-edit menu descriptors', () => {
    const options = { id: 'g', data: [], columnDefs: [], rowEditMenuItemOrder: 300 };
    const labels = { rowEditFlushAll: 'Save changes', rowEditRetryErrors: 'Retry errored rows' };
    const tsItems = buildGridRowEditMenuItems(
      options,
      labels,
      { flushDirtyRows: async () => {}, retryErroredRows: async () => {} },
      { hasDirtyRows: () => true, hasErrorRows: () => false },
    ).map((item) => ({ title: item.title, order: item.order, shown: item.shown() }));
    const wasmItems = runWasm<any[]>('buildGridRowEditMenuItems', {
      options,
      labels,
      hasDirtyRows: true,
      hasErrorRows: false,
    });

    expect(normalize(wasmItems)).toEqual(normalize(tsItems));
  });
});