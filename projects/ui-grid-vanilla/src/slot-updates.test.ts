import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createVanillaGridController } from './grid-controller';
import { mountVanillaUiGrid, type UiGridApi } from './index';
import type { FrameworkFilterSlot, FrameworkSlotDelta } from './framework-slots';

async function waitFor<T>(resolve: () => T | null | undefined, timeoutMs = 5000): Promise<T> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = resolve();
    if (value) return value;
    await new Promise((next) => window.setTimeout(next, 20));
  }
  throw new Error('Timed out waiting for expected element state');
}

describe('framework slot updates', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function mount(id: string) {
    const tag = 'ui-grid-element-slot-updates-test';
    let api: UiGridApi | undefined;
    const grid = await mountVanillaUiGrid(
      document.getElementById('app')!,
      {
        id,
        enableFiltering: true,
        data: [
          { id: 'r1', name: 'Alpha' },
          { id: 'r2', name: 'Beta' },
        ],
        columnDefs: [{ name: 'name' }],
        onRegisterApi: (registered) => {
          api = registered as UiGridApi;
        },
      },
      undefined,
      tag,
    );
    await waitFor(() => api);
    await waitFor(() => grid.shadowRoot?.querySelector('.body-cell'));
    return { grid, api: api! };
  }

  it('turns filter slots on after the first render', async () => {
    const { grid } = await mount('slot-toggle');
    const root = grid.shadowRoot!;
    expect(root.querySelector('ui-grid-filter-cell[data-column="name"]')).not.toBeNull();

    const deltas: FrameworkSlotDelta<FrameworkFilterSlot>[] = [];
    grid.addEventListener('filterSlotsChanged', (event) =>
      deltas.push((event as CustomEvent<FrameworkSlotDelta<FrameworkFilterSlot>>).detail),
    );
    grid.setFrameworkRenderedSlots({ filters: ['name'] });

    await waitFor(() => root.querySelector('slot[name="filter-name"]'));
    expect(root.querySelector('ui-grid-filter-cell[data-column="name"]')).toBeNull();
    expect(deltas.at(-1)?.added.map((slot) => slot.slotName)).toEqual(['filter-name']);
  });

  it('reports a filter slot whose value changed as updated', async () => {
    const { grid } = await mount('slot-updated');
    grid.setFrameworkRenderedSlots({ filters: ['name'] });
    await waitFor(() => grid.shadowRoot!.querySelector('slot[name="filter-name"]'));

    const deltas: FrameworkSlotDelta<FrameworkFilterSlot>[] = [];
    grid.addEventListener('filterSlotsChanged', (event) =>
      deltas.push((event as CustomEvent<FrameworkSlotDelta<FrameworkFilterSlot>>).detail),
    );
    (grid as unknown as { controller: { setFilter(name: string, value: string): void } }).controller.setFilter('name', 'Al');

    const delta = await waitFor(() => deltas.find((d) => (d.updated ?? []).length > 0));
    expect(delta.added).toEqual([]);
    expect(delta.removed).toEqual([]);
    expect(delta.updated?.map((slot) => [slot.slotName, slot.value])).toEqual([['filter-name', 'Al']]);
  });

  it.each(['left', 'right'] as const)('keeps %s-pinned filter slots aligned after resizing', async (side) => {
    const { grid } = await mount(`slot-resize-${side}`);
    const pinned = side === 'left' ? { pinnedLeft: true } : { pinnedRight: true };
    grid.options = {
      ...grid.options,
      enablePinning: true,
      columnDefs: [
        { name: 'name', width: '180px', ...pinned },
        { name: 'other', width: '120px', ...pinned },
      ],
    };
    const filtered = side === 'left' ? 'other' : 'name';
    const resized = side === 'left' ? 'name' : 'other';
    grid.setFrameworkRenderedSlots({ filters: [filtered] });
    const slot = await waitFor(() => grid.shadowRoot!.querySelector(`slot[name="filter-${filtered}"]`));
    const wrapper = slot.parentElement!;
    expect(wrapper.style[side]).toBe(side === 'left' ? 'calc(180px)' : 'calc(120px)');
    const controller = (grid as unknown as { controller: ReturnType<typeof createVanillaGridController> }).controller;
    controller.setColumnWidthOverride(resized, 240);
    await waitFor(() => grid.shadowRoot!.querySelector(`[data-column="${resized}"]`));
    expect(wrapper.style[side]).toBe('calc(240px)');
    expect(wrapper.querySelector('slot')).toBe(slot);
    expect(wrapper.classList.contains('is-pinned')).toBe(true);
  });

  it('fires emptyStateSlotsChanged and the original singular name', async () => {
    const { grid } = await mount('empty-event');
    const seen: string[] = [];
    grid.addEventListener('emptyStateSlotsChanged', () => seen.push('plural'));
    grid.addEventListener('emptyStateSlotChanged', () => seen.push('singular'));

    grid.setFrameworkRenderedSlots({ emptyState: true });
    grid.options = { ...grid.options, data: [] };

    await waitFor(() => seen.length >= 2);
    expect(seen.slice(0, 2)).toEqual(['plural', 'singular']);
  });
});

describe('columnSizeChanged', () => {
  it('fires with the column and its new width when a column is resized', () => {
    const controller = createVanillaGridController({
      id: 'column-size',
      data: [{ id: 'r1', name: 'Alpha' }],
      columnDefs: [{ name: 'name' }],
    });
    const events: Array<[string, string]> = [];
    controller.gridApi.core.on.columnSizeChanged((name, width) => events.push([name, width]));

    controller.setColumnWidthOverride('name', 180.4);
    controller.setColumnWidthOverride('name', 180);

    expect(events).toEqual([['name', '180px']]);
  });
});
