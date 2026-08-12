import { computePinnedOffset } from './grid.core.pinning';
import { GridColumnDef } from './grid.models';

describe('grid.core.pinning', () => {
  it('uses the min track width from minmax declarations when computing pinned offsets', () => {
    const visibleColumns: GridColumnDef[] = [
      { name: 'id', width: 'minmax(10rem, max-content)' },
      { name: 'company', width: 'minmax(16rem, max-content)' },
      { name: 'status', width: 'minmax(14rem, max-content)' },
    ];

    expect(
      computePinnedOffset(visibleColumns, { id: 'left', company: 'left' }, visibleColumns[1]!),
    ).toEqual({ side: 'left', offset: 'calc(10rem)' });

    expect(
      computePinnedOffset(visibleColumns, { company: 'right', status: 'right' }, visibleColumns[1]!),
    ).toEqual({ side: 'right', offset: 'calc(14rem)' });
  });
});