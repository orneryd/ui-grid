import React from 'react';
import { createPortal } from 'react-dom';
import type {
  GridBenchmarkResult,
  GridOptions,
  GridCellTemplateContext,
  GridRecord,
  UiGridApi,
} from '@ornery/ui-grid-core';
import type {
  FrameworkCellSlot,
  FrameworkSlotDelta,
  UiGridStandaloneElement,
} from '@ornery/ui-grid-vanilla';
import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

export interface UiGridCellRenderers {
  [columnName: string]: (context: GridCellTemplateContext) => React.ReactNode;
}

export interface UiGridProps {
  options: GridOptions;
  onRegisterApi?: (api: UiGridApi) => void;
  cellRenderers?: UiGridCellRenderers;
  className?: string;
}

interface SlotEntry {
  slotName: string;
  columnName: string;
  rowId: string;
  context: GridCellTemplateContext;
  wrapper: HTMLSpanElement;
}

const TAG_NAME = 'ui-grid-element';
let definePromise: Promise<void> | null = null;

export function UiGrid({ options, onRegisterApi, cellRenderers, className }: UiGridProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const elementRef = React.useRef<UiGridStandaloneElement | null>(null);
  const [slots, setSlots] = React.useState<Map<string, SlotEntry>>(new Map());
  const cellRenderersRef = React.useRef(cellRenderers);
  cellRenderersRef.current = cellRenderers;
  const onRegisterApiRef = React.useRef(onRegisterApi);
  onRegisterApiRef.current = onRegisterApi;
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const currentSlotColumnsRef = React.useRef<string[]>([]);
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

    const mount = async () => {
      if (!definePromise) {
        definePromise = defineStandaloneUiGridElement(TAG_NAME);
      }
      await definePromise;
      if (disposed) return;

      el = document.createElement(TAG_NAME) as UiGridStandaloneElement;
      el.style.display = 'block';
      el.style.height = '100%';
      el.style.minHeight = '0';
      elementRef.current = el;
      container.appendChild(el);

      el.addEventListener('cellSlotsChanged', handleCellSlotsChanged);
      applyOptions(el, optionsRef.current);
    };

    void mount();

    return () => {
      disposed = true;
      if (benchmarkSubscriptionUnsubscribeRef.current) {
        benchmarkSubscriptionUnsubscribeRef.current();
        benchmarkSubscriptionUnsubscribeRef.current = null;
      }
      if (el) {
        el.removeEventListener('cellSlotsChanged', handleCellSlotsChanged);
        el.remove();
        elementRef.current = null;
      }
      setSlots(new Map());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update options when they change
  React.useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    applyOptions(el, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // Update existing slot contexts when data changes (same rows, new values)
  React.useEffect(() => {
    if (slots.size === 0 || !options.data) return;

    const dataById = new Map<string, GridRecord>();
    for (const row of options.data) {
      const id = String(row['id'] ?? '');
      if (id) dataById.set(id, row);
    }

    let changed = false;
    const nextSlots = new Map(slots);
    for (const [key, entry] of nextSlots) {
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

    if (changed) setSlots(nextSlots);
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
    const renderers = cellRenderersRef.current;
    const cellSlotColumns: string[] = [];

    if (renderers && opts.columnDefs) {
      for (const col of opts.columnDefs) {
        if (renderers[col.name]) {
          cellSlotColumns.push(col.name);
        }
      }
    }

    const wrappedOptions: GridOptions = {
      ...opts,
      onRegisterApi: (api) => {
        const wrappedApi = createWrappedGridApi(api as UiGridApi, opts);
        onRegisterApiRef.current?.(wrappedApi);
        opts.onRegisterApi?.(wrappedApi);
      },
    };

    el.options = wrappedOptions;

    const prev = currentSlotColumnsRef.current;
    const columnsChanged =
      cellSlotColumns.length !== prev.length || cellSlotColumns.some((name, i) => name !== prev[i]);

    if (columnsChanged) {
      currentSlotColumnsRef.current = cellSlotColumns;
      el.setFrameworkRenderedSlots({ cells: cellSlotColumns });
    }
  }

  function handleCellSlotsChanged(event: Event) {
    const detail = (event as CustomEvent<FrameworkSlotDelta<FrameworkCellSlot>>).detail;
    const el = elementRef.current;
    if (!el) return;
    if (detail.removed.length > 0 || detail.added.length > 0) {
      markWrapperRenderScheduled();
    }

    setSlots((prev) => {
      const next = new Map(prev);

      for (const slot of detail.removed) {
        const entry = next.get(slot.slotName);
        if (entry) {
          entry.wrapper.remove();
          next.delete(slot.slotName);
        }
      }

      for (const slot of detail.added) {
        const existing = next.get(slot.slotName);
        if (existing) {
          existing.wrapper.remove();
        }

        const wrapper = document.createElement('span');
        wrapper.setAttribute('slot', slot.slotName);
        el.appendChild(wrapper);

        next.set(slot.slotName, {
          slotName: slot.slotName,
          columnName: slot.columnName,
          rowId: slot.rowId,
          context: slot.context,
          wrapper,
        });
      }

      return next;
    });
  }

  // Render React portals into the slot wrappers
  const portals: React.ReactNode[] = [];
  const renderers = cellRenderers;
  if (renderers) {
    for (const [, entry] of slots) {
      const renderer = renderers[entry.columnName];
      if (renderer) {
        portals.push(createPortal(renderer(entry.context), entry.wrapper, entry.slotName));
      }
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
