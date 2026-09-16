import {
  createErrorBoundary,
  createSignal,
  runWithOwner,
  untrack,
  type Owner,
} from 'solid-js';
import { render, type JSX } from '@solidjs/web';
import {
  buildGridHeaderContext,
  SORT_DIRECTIONS,
  type GridHeaderTemplateContext,
  type GridOptions,
  type SortDirection,
  type UiGridApi,
} from '@ornery/ui-grid-core';
import type {
  FrameworkHeaderSlot,
  FrameworkSlotDelta,
  UiGridStandaloneElement,
} from '@ornery/ui-grid-vanilla';

export interface UiGridHeaderRenderers {
  [columnName: string]: (context: GridHeaderTemplateContext) => JSX.Element;
}

interface HeaderEntry {
  slot: FrameworkHeaderSlot;
  wrapper: HTMLSpanElement;
  renderer: UiGridHeaderRenderers[string];
  isFailed: () => boolean;
  update: (context: GridHeaderTemplateContext) => void;
  dispose: () => void;
}

export function createHeaderRendererBridge(
  element: UiGridStandaloneElement,
  owner: Owner | null,
  reportRendererError: (error: unknown) => void,
) {
  const entries = new Map<string, HeaderEntry>();
  let renderers: UiGridHeaderRenderers = {};
  let columns: string[] = [];
  let options: GridOptions;
  let api: UiGridApi | undefined;
  let disposeSortListener: (() => void) | undefined;
  let sortedColumn: string | null = null;
  let sortDirection: SortDirection = SORT_DIRECTIONS.none;

  function remove(name: string) {
    const entry = entries.get(name);
    if (!entry) return;
    entries.delete(name);
    entry.dispose();
    entry.wrapper.remove();
  }

  function mount(slot: FrameworkHeaderSlot) {
    const renderer = renderers[slot.columnName];
    if (!renderer) return;
    remove(slot.slotName);
    const wrapper = document.createElement('span');
    wrapper.slot = slot.slotName;
    wrapper.addEventListener('click', (event) => {
      if (event.defaultPrevented || !api || options.enableSorting === false) return;
      const column = options.columnDefs.find((candidate) => candidate.name === slot.columnName);
      if (!column || column.sortable === false || column.enableSorting === false) return;
      const current = sortedColumn === slot.columnName ? sortDirection : SORT_DIRECTIONS.none;
      const next = current === SORT_DIRECTIONS.none
        ? SORT_DIRECTIONS.asc
        : current === SORT_DIRECTIONS.asc
          ? SORT_DIRECTIONS.desc
          : SORT_DIRECTIONS.none;
      api.core.sortColumn(slot.columnName, next);
    });
    element.appendChild(wrapper);
    let update!: HeaderEntry['update'];
    let failed = false;
    try {
      const dispose = runWithOwner(owner, () => render(() => {
        const [context, setContext] = createSignal(slot.context);
        update = setContext;
        const props: GridHeaderTemplateContext = {
          get $implicit() { return context().$implicit; },
          get value() { return context().value; },
          get column() { return context().column; },
        };
        const rendered = createErrorBoundary(
          () => renderer(props),
          (error) => {
            failed = true;
            queueMicrotask(() => untrack(() => reportRendererError(error())));
            return undefined;
          },
        );
        return rendered();
      }, wrapper));
      entries.set(slot.slotName, {
        slot,
        wrapper,
        renderer,
        isFailed: () => failed,
        update,
        dispose,
      });
    } catch (error) {
      wrapper.remove();
      throw error;
    }
  }

  function refresh() {
    if (!options) return;
    for (const entry of entries.values()) {
      const column = options.columnDefs.find((candidate) => candidate.name === entry.slot.columnName);
      if (!column) continue;
      const context = buildGridHeaderContext(column);
      entry.slot = { ...entry.slot, context };
      entry.update(context);
    }
  }

  function onSlots(event: Event) {
    untrack(() => {
      const delta = (event as CustomEvent<FrameworkSlotDelta<FrameworkHeaderSlot>>).detail;
      for (const slot of delta.removed) remove(slot.slotName);
      for (const slot of delta.added) mount(slot);
      refresh();
    });
  }
  element.addEventListener('headerSlotsChanged', onSlots);

  return {
    registerApi(next: UiGridApi) {
      disposeSortListener?.();
      api = next;
      disposeSortListener = api.core.on.sortChanged((columnName, direction) => {
        sortedColumn = columnName;
        sortDirection = direction;
      });
    },
    configure(nextOptions: GridOptions, nextRenderers: UiGridHeaderRenderers = {}) {
      options = nextOptions;
      renderers = nextRenderers;
      refresh();
      for (const entry of [...entries.values()]) {
        if (entry.renderer !== renderers[entry.slot.columnName] || entry.isFailed()) {
          const slot = entry.slot;
          remove(slot.slotName);
          mount(slot);
        }
      }
      const nextColumns = options.columnDefs
        .filter((column) => renderers[column.name])
        .map((column) => column.name)
        .sort();
      if (columns.length !== nextColumns.length || columns.some((name, index) => name !== nextColumns[index])) {
        columns = nextColumns;
        element.setFrameworkRenderedSlots({ headers: columns });
      }
      refresh();
    },
    refresh,
    dispose() {
      disposeSortListener?.();
      disposeSortListener = undefined;
      element.removeEventListener('headerSlotsChanged', onSlots);
      for (const name of [...entries.keys()]) remove(name);
    },
  };
}
