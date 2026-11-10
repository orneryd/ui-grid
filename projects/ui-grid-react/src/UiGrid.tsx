import React from 'react';
import { createPortal } from 'react-dom';
import type {
  GridBenchmarkResult,
  GridOptions,
  GridCellTemplateContext,
  GridExpandableTemplateContext,
  GridHeaderTemplateContext,
  GridRecord,
  UiGridApi,
} from '@ornery/ui-grid-core';
import type {
  FrameworkCellSlot,
  FrameworkEmptyStateSlot,
  FrameworkExpandableRowSlot,
  FrameworkFilterSlot,
  FrameworkHeaderSlot,
  FrameworkSlotDelta,
  UiGridStandaloneElement,
} from '@ornery/ui-grid-vanilla';

export interface UiGridCellRenderers {
  [columnName: string]: (context: GridCellTemplateContext) => React.ReactNode;
}

export interface UiGridHeaderRenderers {
  [columnName: string]: (context: GridHeaderTemplateContext) => React.ReactNode;
}

export interface UiGridFilterRenderers {
  [columnName: string]: (slot: FrameworkFilterSlot) => React.ReactNode;
}

export interface UiGridProps {
  options: GridOptions;
  onRegisterApi?: (api: UiGridApi) => void;
  cellRenderers?: UiGridCellRenderers;
  headerRenderers?: UiGridHeaderRenderers;
  filterRenderers?: UiGridFilterRenderers;
  expandableRowRenderer?: (context: GridExpandableTemplateContext) => React.ReactNode;
  emptyStateRenderer?: (slot: FrameworkEmptyStateSlot) => React.ReactNode;
  className?: string;
}

type SlotKind = 'cell' | 'header' | 'filter' | 'expandable' | 'empty';

interface SlotEntry {
  kind: SlotKind;
  slotName: string;
  columnName: string;
  rowId: string;
  context: GridCellTemplateContext;
  payload: unknown;
  wrapper: HTMLElement;
}

interface SlotKindDescriptor {
  eventName: string;
  wrapperTag: 'span' | 'div';
  toEntry: (slot: any) => Pick<SlotEntry, 'columnName' | 'rowId' | 'context' | 'payload'>;
}

const NO_CONTEXT = undefined as unknown as GridCellTemplateContext;

const SLOT_KINDS: Record<SlotKind, SlotKindDescriptor> = {
  cell: {
    eventName: 'cellSlotsChanged',
    wrapperTag: 'span',
    toEntry: (slot: FrameworkCellSlot) => ({
      columnName: slot.columnName,
      rowId: slot.rowId,
      context: slot.context,
      payload: slot,
    }),
  },
  header: {
    eventName: 'headerSlotsChanged',
    wrapperTag: 'span',
    toEntry: (slot: FrameworkHeaderSlot) => ({
      columnName: slot.columnName,
      rowId: '',
      context: NO_CONTEXT,
      payload: slot,
    }),
  },
  filter: {
    eventName: 'filterSlotsChanged',
    wrapperTag: 'span',
    toEntry: (slot: FrameworkFilterSlot) => ({
      columnName: slot.columnName,
      rowId: '',
      context: NO_CONTEXT,
      payload: slot,
    }),
  },
  expandable: {
    eventName: 'expandableRowSlotsChanged',
    wrapperTag: 'div',
    toEntry: (slot: FrameworkExpandableRowSlot) => ({
      columnName: '',
      rowId: slot.rowId,
      context: NO_CONTEXT,
      payload: slot,
    }),
  },
  empty: {
    eventName: 'emptyStateSlotsChanged',
    wrapperTag: 'div',
    toEntry: (slot: FrameworkEmptyStateSlot) => ({
      columnName: '',
      rowId: '',
      context: NO_CONTEXT,
      payload: slot,
    }),
  },
};

const SLOT_KIND_NAMES = Object.keys(SLOT_KINDS) as SlotKind[];

const TAG_NAME = 'ui-grid-element';
let definePromise: Promise<void> | null = null;

export function UiGrid({
  options,
  onRegisterApi,
  cellRenderers,
  headerRenderers,
  filterRenderers,
  expandableRowRenderer,
  emptyStateRenderer,
  className,
}: UiGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const elementRef = React.useRef<UiGridStandaloneElement | null>(null);
  const [slots, setSlots] = React.useState<Map<string, SlotEntry>>(new Map());
  // Source of truth for slot entries. Event handlers and effects derive the
  // next map from this ref (never from a render-time `slots` snapshot), and
  // DOM work happens outside state updaters, so a data refresh can't drop
  // slots that were added in the same commit.
  const slotsRef = React.useRef<Map<string, SlotEntry>>(new Map());
  const commitSlots = (next: Map<string, SlotEntry>) => {
    slotsRef.current = next;
    setSlots(next);
  };
  const cellRenderersRef = React.useRef(cellRenderers);
  cellRenderersRef.current = cellRenderers;
  const slotConfigSignature = [
    Object.keys(cellRenderers ?? {}).join('\u0000'),
    Object.keys(headerRenderers ?? {}).join('\u0000'),
    Object.keys(filterRenderers ?? {}).join('\u0000'),
    expandableRowRenderer ? '1' : '0',
    emptyStateRenderer ? '1' : '0',
  ].join('\u0001');
  const slotConfigRef = React.useRef({
    cellRenderers,
    headerRenderers,
    filterRenderers,
    expandableRowRenderer,
    emptyStateRenderer,
  });
  slotConfigRef.current = {
    cellRenderers,
    headerRenderers,
    filterRenderers,
    expandableRowRenderer,
    emptyStateRenderer,
  };
  const onRegisterApiRef = React.useRef(onRegisterApi);
  onRegisterApiRef.current = onRegisterApi;
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const appliedSlotConfigRef = React.useRef<string | null>(null);
  const wrapperRenderVersionRef = React.useRef(0);
  const scheduledWrapperRenderVersionRef = React.useRef(0);
  const wrapperRenderWaitersRef = React.useRef<Array<{ target: number; resolve: () => void }>>([]);
  const benchmarkSubscriptionUnsubscribeRef = React.useRef<(() => void) | null>(null);

  React.useLayoutEffect(() => {
    wrapperRenderVersionRef.current += 1;
    const ready = wrapperRenderWaitersRef.current.filter(
      (waiter) => waiter.target <= wrapperRenderVersionRef.current,
    );
    if (ready.length === 0) {
      return;
    }
    wrapperRenderWaitersRef.current = wrapperRenderWaitersRef.current.filter(
      (waiter) => waiter.target > wrapperRenderVersionRef.current,
    );
    for (const waiter of ready) {
      waiter.resolve();
    }
  });

  // Clean up underlying benchmark subscription if it's still active
  React.useEffect(() => {
    return () => {
      if (benchmarkSubscriptionUnsubscribeRef.current) {
        benchmarkSubscriptionUnsubscribeRef.current();
        benchmarkSubscriptionUnsubscribeRef.current = null;
      }
    };
  }, []);

  // Mount the vanilla element once
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let el: UiGridStandaloneElement | null = null;
    let disposed = false;
    const slotListeners = {} as Record<SlotKind, (event: Event) => void>;
    for (const kind of SLOT_KIND_NAMES) {
      slotListeners[kind] = (event) => handleSlotsChanged(kind, event);
    }

    const mount = async () => {
      if (!definePromise) {
        definePromise = import('@ornery/ui-grid-vanilla').then(({ defineStandaloneUiGridElement }) =>
          defineStandaloneUiGridElement(TAG_NAME),
        );
      }
      await definePromise;
      if (disposed) return;

      el = document.createElement(TAG_NAME) as UiGridStandaloneElement;
      el.style.display = 'block';
      el.style.height = '100%';
      el.style.minHeight = '0';
      elementRef.current = el;

      for (const kind of SLOT_KIND_NAMES) {
        el.addEventListener(SLOT_KINDS[kind].eventName, slotListeners[kind]);
      }
      // Flag slots and set options before the element connects so the first
      // render emits every <slot> placeholder (the vanilla patch path does not
      // swap already-rendered filter cells for placeholders).
      syncSlotConfig(el);
      applyOptions(el, optionsRef.current);
      container.appendChild(el);
    };

    void mount();

    return () => {
      disposed = true;
      if (benchmarkSubscriptionUnsubscribeRef.current) {
        benchmarkSubscriptionUnsubscribeRef.current();
        benchmarkSubscriptionUnsubscribeRef.current = null;
      }
      if (el) {
        for (const kind of SLOT_KIND_NAMES) {
          el.removeEventListener(SLOT_KINDS[kind].eventName, slotListeners[kind]);
        }
        el.remove();
        elementRef.current = null;
      }
      commitSlots(new Map());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-register slots only when the renderer key sets / flags change
  React.useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    syncSlotConfig(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotConfigSignature]);

  // Update options when they change
  React.useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    applyOptions(el, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // Update existing slot contexts when data changes (same rows, new values)
  React.useEffect(() => {
    const current = slotsRef.current;
    if (current.size === 0 || !options.data) return;

    const dataById = new Map<string, GridRecord>();
    for (const row of options.data) {
      const id = String(row['id'] ?? '');
      if (id) dataById.set(id, row);
    }

    let changed = false;
    const nextSlots = new Map(current);
    for (const [key, entry] of nextSlots) {
      if (entry.kind !== 'cell') continue;
      const row = dataById.get(entry.rowId);
      if (!row) continue;

      const col = options.columnDefs?.find((c) => c.name === entry.columnName);
      const value = col?.field ? getNestedValue(row, col.field) : row[entry.columnName];

      if (entry.context.value !== value || entry.context.row !== row) {
        markWrapperRenderScheduled();
        nextSlots.set(key, {
          ...entry,
          context: { ...entry.context, $implicit: value, value, row },
        });
        changed = true;
      }
    }

    if (changed) commitSlots(nextSlots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.data]);

  function markWrapperRenderScheduled() {
    scheduledWrapperRenderVersionRef.current = Math.max(
      scheduledWrapperRenderVersionRef.current,
      wrapperRenderVersionRef.current + 1,
    );
  }

  function waitForScheduledWrapperRender(): Promise<void> {
    const target = scheduledWrapperRenderVersionRef.current;
    if (target <= wrapperRenderVersionRef.current) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      wrapperRenderWaitersRef.current.push({ target, resolve });
    });
  }

  function createWrappedGridApi(api: UiGridApi, opts: GridOptions): UiGridApi {
    const benchmarkListeners = new Set<(result: GridBenchmarkResult) => void>();
    const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());
    // Clean up previous underlying subscription if it exists
    if (benchmarkSubscriptionUnsubscribeRef.current) {
      benchmarkSubscriptionUnsubscribeRef.current();
    }
    // Subscribe to underlying benchmarkComplete and forward to wrapper listeners
    benchmarkSubscriptionUnsubscribeRef.current = api.core.on.benchmarkComplete((result) => {
      for (const listener of benchmarkListeners) {
        listener(result);
      }
    });

    return {
      ...api,
      core: {
        ...api.core,
        on: {
          ...api.core.on,
          benchmarkComplete: (listener) => {
            benchmarkListeners.add(listener);
            return () => benchmarkListeners.delete(listener);
          },
        },
        benchmark: async (iterations?: number) => {
          const loops = Math.max(1, iterations ?? opts.benchmark?.iterations ?? 25);
          const started = now();
          let lastResult: GridBenchmarkResult | null = null;

          for (let index = 0; index < loops; index += 1) {
            lastResult = await api.core.benchmark(1);
            await waitForScheduledWrapperRender();
          }

          const totalMs = now() - started;

          const result: GridBenchmarkResult = {
            iterations: loops,
            totalMs,
            averageMs: totalMs / loops,
            visibleRows: lastResult?.visibleRows ?? 0,
            renderedItems: lastResult?.renderedItems ?? 0,
          };

          for (const listener of benchmarkListeners) {
            listener(result);
          }
          return result;
        },
      },
    };
  }

  function applyOptions(el: UiGridStandaloneElement, opts: GridOptions) {
    const wrappedOptions: GridOptions = {
      ...opts,
      onRegisterApi: (api) => {
        const wrappedApi = createWrappedGridApi(api as UiGridApi, opts);
        onRegisterApiRef.current?.(wrappedApi);
        opts.onRegisterApi?.(wrappedApi);
      },
    };

    el.options = wrappedOptions;
  }

  function syncSlotConfig(el: UiGridStandaloneElement) {
    if (appliedSlotConfigRef.current === slotConfigSignature) return;
    appliedSlotConfigRef.current = slotConfigSignature;
    const config = slotConfigRef.current;
    el.setFrameworkRenderedSlots({
      cells: Object.keys(config.cellRenderers ?? {}),
      headers: Object.keys(config.headerRenderers ?? {}),
      filters: Object.keys(config.filterRenderers ?? {}),
      expandableRow: !!config.expandableRowRenderer,
      emptyState: !!config.emptyStateRenderer,
    });
  }

  function handleSlotsChanged(kind: SlotKind, event: Event) {
    const detail = (event as CustomEvent<FrameworkSlotDelta<{ slotName: string }>>).detail;
    const el = elementRef.current;
    if (!el) return;
    const descriptor = SLOT_KINDS[kind];
    if (detail.removed.length > 0 || detail.added.length > 0 || (detail.updated?.length ?? 0) > 0) {
      markWrapperRenderScheduled();
    }

    const next = new Map(slotsRef.current);

    const replacing = new Set(detail.added.map((slot) => slot.slotName));
    for (const slot of detail.removed) {
      if (replacing.has(slot.slotName)) continue;
      const entry = next.get(slot.slotName);
      if (entry) {
        entry.wrapper.remove();
        next.delete(slot.slotName);
      }
    }

    for (const slot of detail.added) {
      const existing = next.get(slot.slotName);
      if (existing) {
        next.set(slot.slotName, { ...existing, ...descriptor.toEntry(slot) });
        continue;
      }

      const wrapper = document.createElement(descriptor.wrapperTag);
      wrapper.setAttribute('slot', slot.slotName);
      el.appendChild(wrapper);

      next.set(slot.slotName, {
        kind,
        slotName: slot.slotName,
        ...descriptor.toEntry(slot),
        wrapper,
      });
    }

    // Same slot, new payload (e.g. a filter's value): re-render in place.
    for (const slot of detail.updated ?? []) {
      const entry = next.get(slot.slotName);
      if (entry) next.set(slot.slotName, { ...entry, ...descriptor.toEntry(slot) });
    }

    commitSlots(next);
  }

  // Render React portals into the slot wrappers
  const portals: React.ReactNode[] = [];
  for (const [, entry] of slots) {
    const content = renderSlotEntry(entry);
    if (content !== undefined) {
      portals.push(createPortal(content, entry.wrapper, entry.slotName));
    }
  }

  function renderSlotEntry(entry: SlotEntry): React.ReactNode | undefined {
    switch (entry.kind) {
      case 'cell': {
        const renderer = cellRenderers?.[entry.columnName];
        return renderer ? renderer(entry.context) : undefined;
      }
      case 'header': {
        const renderer = headerRenderers?.[entry.columnName];
        return renderer ? renderer((entry.payload as FrameworkHeaderSlot).context) : undefined;
      }
      case 'filter': {
        const renderer = filterRenderers?.[entry.columnName];
        return renderer ? renderer(entry.payload as FrameworkFilterSlot) : undefined;
      }
      case 'expandable':
        return expandableRowRenderer
          ? expandableRowRenderer((entry.payload as FrameworkExpandableRowSlot).context)
          : undefined;
      case 'empty':
        return emptyStateRenderer
          ? emptyStateRenderer(entry.payload as FrameworkEmptyStateSlot)
          : undefined;
    }
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ display: 'block', height: '100%', minHeight: 0 }}
    >
      {portals}
    </div>
  );
}

function getNestedValue(obj: GridRecord, field: string): unknown {
  const parts = field.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
