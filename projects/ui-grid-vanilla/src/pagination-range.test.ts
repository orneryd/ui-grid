import { describe, expect, it } from 'vitest';

import { createVanillaGridController } from './grid-controller';

const page = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, name: `Row ${i}` }));

describe('pagination range', () => {
  it('describes the server page within totalItems under external pagination', () => {
    const controller = createVanillaGridController({
      id: 'external-range',
      data: page(10),
      columnDefs: [{ name: 'name' }],
      enablePagination: true,
      useExternalPagination: true,
      paginationPageSize: 10,
      totalItems: 12,
    });

    let snapshot = controller.getSnapshot();
    expect([snapshot.firstRowIndex, snapshot.lastRowIndex]).toEqual([0, 9]);

    controller.setOptions({ ...controller.getSnapshot().options, data: page(2) });
    controller.seekPage(2);
    snapshot = controller.getSnapshot();
    expect([snapshot.firstRowIndex, snapshot.lastRowIndex]).toEqual([10, 11]);
    expect(snapshot.pipeline.visibleRows).toHaveLength(2);
  });

  it('keeps client-side ranges unchanged', () => {
    const controller = createVanillaGridController({
      id: 'client-range',
      data: page(12),
      columnDefs: [{ name: 'name' }],
      enablePagination: true,
      paginationPageSize: 10,
    });
    controller.seekPage(2);
    const snapshot = controller.getSnapshot();
    expect([snapshot.firstRowIndex, snapshot.lastRowIndex]).toEqual([10, 11]);
    expect(snapshot.pipeline.visibleRows).toHaveLength(2);
  });
});
