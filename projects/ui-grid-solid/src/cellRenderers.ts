import { createErrorBoundary, createSignal, runWithOwner, untrack, type Owner } from 'solid-js';
import { render, type JSX } from '@solidjs/web';
import { getCellValue, type GridCellTemplateContext, type GridOptions, type UiGridApi } from '@ornery/ui-grid-core';
import type { FrameworkCellSlot, FrameworkSlotDelta, UiGridStandaloneElement } from '@ornery/ui-grid-vanilla';

export interface UiGridCellRenderers {
  [columnName: string]: (context: GridCellTemplateContext) => JSX.Element;
}

interface CellEntry {
  slot: FrameworkCellSlot;
  wrapper: HTMLSpanElement;
  renderer: UiGridCellRenderers[string];
  isFailed: () => boolean;
  update: (context: GridCellTemplateContext) => void;
  dispose: () => void;
}

export function createCellRendererBridge(
  element: UiGridStandaloneElement,
  owner: Owner | null,
  reportRendererError: (error: unknown) => void,
) {
  const entries = new Map<string, CellEntry>();
  let renderers: UiGridCellRenderers = {};
  let columns: string[] = [];
  let options: GridOptions;
  let api: UiGridApi | undefined;

  function remove(name: string) {
    const entry = entries.get(name);
    if (!entry) return;
    entries.delete(name);
    entry.dispose();
    entry.wrapper.remove();
  }

  function mount(slot: FrameworkCellSlot) {
    const renderer = renderers[slot.columnName];
    if (!renderer) return;
    remove(slot.slotName);
    const wrapper = document.createElement('span');
    wrapper.slot = slot.slotName;
    element.appendChild(wrapper);
    let update!: CellEntry['update'];
    let failed = false;
    try {
      const dispose = runWithOwner(owner, () => render(() => {
        const [context, setContext] = createSignal(slot.context);
        let resetBoundary: (() => void) | undefined;
        update = (value) => {
          setContext(value);
          if (resetBoundary) queueMicrotask(() => resetBoundary?.());
        };
        // Stable getters keep cell-local state alive as row values change.
        const props: GridCellTemplateContext = {
          get $implicit() { return context().$implicit; },
          get value() { return context().value; },
          get row() { return context().row; },
          get column() { return context().column; },
          get rowIndex() { return context().rowIndex; },
        };
        const rendered = createErrorBoundary(
          () => renderer(props),
          (error, reset) => {
            failed = true;
            resetBoundary = () => {
              resetBoundary = undefined;
              reset();
            };
            queueMicrotask(() => untrack(() => reportRendererError(error())));
            return undefined;
          },
        );
        return rendered();
      }, wrapper));
      entries.set(slot.slotName, { slot, wrapper, renderer, isFailed: () => failed, update, dispose });
    } catch (error) {
      wrapper.remove();
      throw error;
    }
  }

  function refresh() {
    if (!api || !options) return;
    const rows = new Map(api.core.getVisibleRows().map((row, index) => [row.id, { row, index }]));
    for (const entry of entries.values()) {
      const current = rows.get(entry.slot.rowId);
      const column = options.columnDefs.find((column) => column.name === entry.slot.columnName);
      if (!current || !column) continue;
      const value = getCellValue(current.row.entity, column);
      const context = { $implicit: value, value, row: current.row.entity, column, rowIndex: current.index };
      entry.slot = { ...entry.slot, context, rowIndex: current.index };
      entry.update(context);
    }
  }

  function onSlots(event: Event) {
    untrack(() => {
      const delta = (event as CustomEvent<FrameworkSlotDelta<FrameworkCellSlot>>).detail;
      for (const slot of delta.removed) remove(slot.slotName);
      for (const slot of delta.added) mount(slot);
      refresh();
    });
  }
  element.addEventListener('cellSlotsChanged', onSlots);

  return {
    registerApi(next: UiGridApi) {
      if (api === next) return;
      api = next;
    },
    configure(nextOptions: GridOptions, nextRenderers: UiGridCellRenderers = {}) {
      options = nextOptions;
      renderers = nextRenderers;
      const nextColumns = options.columnDefs.filter((column) => renderers[column.name]).map((column) => column.name).sort();
      refresh();
      for (const entry of [...entries.values()]) {
        if (entry.renderer !== renderers[entry.slot.columnName] || entry.isFailed()) {
          const slot = entry.slot;
          remove(slot.slotName);
          mount(slot);
        }
      }
      if (columns.length !== nextColumns.length || columns.some((name, index) => name !== nextColumns[index])) {
        columns = nextColumns;
        element.setFrameworkRenderedSlots({ cells: columns });
      }
      refresh();
    },
    refresh,
    dispose() {
      element.removeEventListener('cellSlotsChanged', onSlots);
      for (const name of [...entries.keys()]) remove(name);
    },
  };
}
