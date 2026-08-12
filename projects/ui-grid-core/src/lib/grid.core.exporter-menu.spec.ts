import { describe, expect, it } from 'vitest';
import { buildGridExporterMenuItems } from './grid.core.exporter-menu';

describe('buildGridExporterMenuItems', () => {
  it('emits 3 items by default (CSV only, no selection)', () => {
    const items = buildGridExporterMenuItems(
      { id: 'g', data: [], columnDefs: [] },
      {},
      { csvExport: () => {} },
      () => false,
    );
    expect(items.length).toBe(3);
    expect(items[0]!.shown()).toBe(true);
    expect(items[1]!.shown()).toBe(true);
    // Selected-rows item is hidden because hasSelection() is false.
    expect(items[2]!.shown()).toBe(false);
  });

  it('adds 3 PDF items when pdfExport is provided', () => {
    const items = buildGridExporterMenuItems(
      { id: 'g', data: [], columnDefs: [] },
      {},
      { csvExport: () => {}, pdfExport: () => {} },
      () => true,
    );
    expect(items.length).toBe(6);
    expect(items.every((i) => i.shown())).toBe(true);
  });

  it('adds 3 Excel items when excelExport is provided', () => {
    const items = buildGridExporterMenuItems(
      { id: 'g', data: [], columnDefs: [] },
      {},
      { csvExport: () => {}, excelExport: () => {} },
      () => true,
    );
    expect(items.length).toBe(6);
    // Last three should be the Excel entries.
    expect(items.slice(-3).every((i) => /excel/i.test(i.title) || i.title === '')).toBe(true);
  });

  it('uses the provided labels verbatim', () => {
    const items = buildGridExporterMenuItems(
      { id: 'g', data: [], columnDefs: [] },
      { exporterAllAsCsv: 'Everything as csv!' },
      { csvExport: () => {} },
    );
    expect(items[0]!.title).toBe('Everything as csv!');
  });

  it('honors exporterMenuCsv:false by hiding CSV rows', () => {
    const items = buildGridExporterMenuItems(
      { id: 'g', data: [], columnDefs: [], exporterMenuCsv: false },
      {},
      { csvExport: () => {}, pdfExport: () => {} },
      () => true,
    );
    const shown = items.filter((i) => i.shown());
    expect(shown.length).toBe(3);
    expect(shown.every((i) => /pdf/i.test(i.title) || i.title === '')).toBe(true);
  });

  it('honors exporterMenuExcel:false by hiding Excel rows', () => {
    const items = buildGridExporterMenuItems(
      { id: 'g', data: [], columnDefs: [], exporterMenuExcel: false },
      {},
      { csvExport: () => {}, excelExport: () => {} },
      () => true,
    );
    const shown = items.filter((i) => i.shown());
    expect(shown.length).toBe(3);
    expect(shown.every((i) => /csv/i.test(i.title) || i.title === '')).toBe(true);
  });

  it('respects exporterMenuItemOrder for the starting order value', () => {
    const items = buildGridExporterMenuItems(
      { id: 'g', data: [], columnDefs: [], exporterMenuItemOrder: 500 },
      {},
      { csvExport: () => {} },
    );
    expect(items[0]!.order).toBe(500);
    expect(items[1]!.order).toBe(501);
    expect(items[2]!.order).toBe(502);
  });
});
