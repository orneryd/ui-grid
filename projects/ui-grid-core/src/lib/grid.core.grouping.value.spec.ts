import { describe, expect, it } from 'vitest';

import { buildGridDisplayItems } from './grid.core.grouping';
import { GridOptions, GridRow } from './grid.models';

const options: GridOptions = { id: 'g', data: [], columnDefs: [], enableGrouping: true };
const rows = [
  { id: 'a', payment: { status: 'Paid' }, done: true },
  { id: 'b', payment: { status: 'Due' }, done: false },
  { id: 'c', payment: { status: 'Paid' }, done: true },
].map((entity, i) => new GridRow(entity.id, entity, i, 44));

const groups = (columnDefs: GridOptions['columnDefs'], groupBy: string) =>
  buildGridDisplayItems(rows, columnDefs, options, [groupBy], {})
    .filter((item) => item.kind === 'group')
    .map((item) => (item.kind === 'group' ? [item.label, item.count] : null));

describe('grouping value', () => {
  it('groups on the column field', () => {
    expect(groups([{ name: 'invoice', field: 'payment.status' }], 'invoice')).toEqual([
      ['Paid', 2],
      ['Due', 1],
    ]);
  });

  it('groups on the column valueGetter', () => {
    const status = { name: 'status', valueGetter: (row: Record<string, unknown>) => (row['done'] ? 'Finished' : 'Open') };
    expect(groups([status], 'status')).toEqual([
      ['Finished', 2],
      ['Open', 1],
    ]);
  });

  it('prefers groupingValue over the cell value', () => {
    const column = { name: 'invoice', field: 'payment.status', groupingValue: () => 'All' };
    expect(groups([column], 'invoice')).toEqual([['All', 3]]);
  });

  it('keeps grouping by name path for plain columns', () => {
    expect(groups([{ name: 'payment.status' }], 'payment.status')).toEqual([
      ['Paid', 2],
      ['Due', 1],
    ]);
  });
});
