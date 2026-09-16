import { createErrorBoundary, createSignal, runWithOwner, untrack, type Owner } from 'solid-js';
import { render, type JSX } from '@solidjs/web';
import type {
  GridExpandableTemplateContext,
  GridOptions,
  UiGridApi,
} from '@ornery/ui-grid-core';
import type {
  FrameworkExpandableRowSlot,
  FrameworkSlotDelta,
  UiGridStandaloneElement,
} from '@ornery/ui-grid-vanilla';

export type UiGridDetailRenderer = (context: GridExpandableTemplateContext) => JSX.Element;

interface DetailEntry {
  slot: FrameworkExpandableRowSlot;
  wrapper: HTMLDivElement;
  renderer: UiGridDetailRenderer;
  isFailed: () => boolean;
  update: (context: GridExpandableTemplateContext) => void;
  dispose: () => void;
}

export function createDetailRendererBridge(
  element: UiGridStandaloneElement,
  owner: Owner | null,
  reportRendererError: (error: unknown) => void,
) {
  const entries = new Map<string, DetailEntry>();
  let renderer: UiGridDetailRenderer | undefined;
  let enabled = false;
  let options: GridOptions;
  let api: UiGridApi | undefined;

  function remove(name: string) {
    const entry = entries.get(name);
    if (!entry) return;
    entries.delete(name);
    entry.dispose();
    entry.wrapper.remove();
  }

  function mount(slot: FrameworkExpandableRowSlot) {
    if (!renderer) return;
    remove(slot.slotName);
    const mountedRenderer = renderer;
    const wrapper = document.createElement('div');
    wrapper.slot = slot.slotName;
    element.appendChild(wrapper);
    let update!: DetailEntry['update'];
    let failed = false;
    try {
      const dispose = runWithOwner(owner, () => render(() => {
        const [context, setContext] = createSignal(slot.context);
        update = setContext;
        const props: GridExpandableTemplateContext = {
          get $implicit() { return context().$implicit; },
          get row() { return context().row; },
          get expanded() { return context().expanded; },
          get rowIndex() { return context().rowIndex; },
        };
        const rendered = createErrorBoundary(
          () => mountedRenderer(props),
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
        renderer: mountedRenderer,
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
    if (!api || !options) return;
    const rows = new Map(api.core.getVisibleRows().map((row, index) => [row.id, { row, index }]));
    for (const entry of entries.values()) {
      const current = rows.get(entry.slot.rowId);
      if (!current) continue;
      const context: GridExpandableTemplateContext = {
        $implicit: current.row.entity,
        row: current.row.entity,
        expanded: current.row.expanded,
        rowIndex: current.index,
      };
      entry.slot = { ...entry.slot, context, rowIndex: current.index };
      entry.update(context);
    }
  }

  function onSlots(event: Event) {
    untrack(() => {
      const delta = (event as CustomEvent<FrameworkSlotDelta<FrameworkExpandableRowSlot>>).detail;
      for (const slot of delta.removed) remove(slot.slotName);
      for (const slot of delta.added) mount(slot);
      refresh();
    });
  }
  element.addEventListener('expandableRowSlotsChanged', onSlots);

  return {
    registerApi(next: UiGridApi) {
      api = next;
    },
    configure(nextOptions: GridOptions, nextRenderer?: UiGridDetailRenderer) {
      options = nextOptions;
      renderer = nextRenderer;
      refresh();
      for (const entry of [...entries.values()]) {
        if (entry.renderer !== renderer || entry.isFailed()) {
          const slot = entry.slot;
          remove(slot.slotName);
          mount(slot);
        }
      }
      const nextEnabled = Boolean(renderer);
      if (enabled !== nextEnabled) {
        enabled = nextEnabled;
        element.setFrameworkRenderedSlots({ expandableRow: enabled });
      }
      refresh();
    },
    refresh,
    dispose() {
      element.removeEventListener('expandableRowSlotsChanged', onSlots);
      for (const name of [...entries.keys()]) remove(name);
    },
  };
}
