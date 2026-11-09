import { describe, expect, it } from 'vitest';

import { createVanillaGridController } from './grid-controller';

const make = (pinClient: boolean) =>
  createVanillaGridController({
    id: 'selection-pinning',
    data: [{ id: 'r1', client: 'A', amount: 1 }],
    columnDefs: [
      { name: 'client', width: '200px', ...(pinClient ? { pinnedLeft: true } : {}) },
      { name: 'amount', width: '120px' },
    ],
    enablePinning: true,
    enableRowSelection: true,
    enableRowHeaderSelection: true,
    selectionRowHeaderWidth: 30,
  });

const column = (controller: ReturnType<typeof make>, name: string) =>
  controller.getSnapshot().visibleColumns.find((candidate) => candidate.name === name)!;

describe('selection column pinning', () => {
  it('pins the selection column with left-pinned columns and offsets them past it', () => {
    const controller = make(true);
    const selection = column(controller, 'selectionRowHeaderCol');
    const client = column(controller, 'client');

    expect(controller.isPinned(selection)).toBe(true);
    expect(controller.pinnedOffset(selection)).toEqual({ side: 'left', offset: '0px' });
    expect(controller.pinnedOffset(client)).toEqual({ side: 'left', offset: 'calc(30px)' });
    expect(controller.isPinnedLeftLast(client)).toBe(true);
    expect(controller.getSnapshot().pinnedColumns).toEqual({ client: 'left' });
  });

  it('leaves the selection column unpinned when nothing is pinned left', () => {
    const controller = make(false);
    expect(controller.isPinned(column(controller, 'selectionRowHeaderCol'))).toBe(false);
  });
});
