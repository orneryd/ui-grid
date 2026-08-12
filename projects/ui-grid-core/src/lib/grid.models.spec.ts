import { GridRow } from './grid.models';

describe('GridRow', () => {
  it('tracks visibility reasons until all are cleared', () => {
    const row = new GridRow('row-1', { id: 1 }, 0, 52);

    expect(row.uid).toMatch(/^row-\d+$/);
    expect(row.visible).toBe(true);
    expect(row.isSelected).toBe(false);
    expect(row.height).toBe(52);

    row.setThisRowInvisible('filter');
    row.setThisRowInvisible('manual');

    expect(row.visible).toBe(false);
    expect([...row.invisibleReasons]).toEqual(['filter', 'manual']);

    row.clearThisRowInvisible('filter');
    expect(row.visible).toBe(false);
    expect([...row.invisibleReasons]).toEqual(['manual']);

    row.clearThisRowInvisible('manual');
    expect(row.visible).toBe(true);
    expect([...row.invisibleReasons]).toEqual([]);
  });
});