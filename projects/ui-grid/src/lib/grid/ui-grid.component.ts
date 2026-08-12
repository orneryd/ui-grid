import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EmbeddedViewRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { defineStandaloneUiGridElement, UiGridStandaloneElement } from '@ornery/ui-grid-vanilla';
import type { FrameworkCellSlot, FrameworkSlotDelta } from '@ornery/ui-grid-vanilla';
import type {
  GridBenchmarkResult,
  GridCellTemplateContext,
  GridColumnDef,
  GridOptions,
  GridRecord,
  GridTemplateRefLike,
  UiGridApi,
} from '@ornery/ui-grid-core';

const TAG_NAME = 'ui-grid-element';

@Component({
  selector: 'app-ui-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './ui-grid.component.scss',
  host: {
    ngSkipHydration: 'true',
  },
  template: ``,
})
export class UiGridComponent implements AfterViewInit, OnDestroy {
  readonly options = input<GridOptions>({
    id: '__ui-grid-pending__',
    data: [],
    columnDefs: [],
  });

  readonly apiReady = output<UiGridApi>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly appRef = inject(ApplicationRef);

  private gridElement: UiGridStandaloneElement | null = null;
  private elementReady = false;
  private listenerAttached = false;
  private slotViews = new Map<
    string,
    { view: EmbeddedViewRef<GridCellTemplateContext>; columnName: string; rowId: string }
  >();
  private templateColumns = new Map<string, GridTemplateRefLike<GridCellTemplateContext>>();
  private currentSlotColumnNames: string[] = [];
  private benchmarkSubscriptionUnsubscribe: (() => void) | null = null;

  constructor() {
    effect(() => {
      const opts = this.options();
      untracked(() => {
        if (!this.elementReady || !this.gridElement) return;
        this.applyOptions(opts);
      });
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    await this.zone.runOutsideAngular(async () => {
      await defineStandaloneUiGridElement(TAG_NAME);

      const el = document.createElement(TAG_NAME) as UiGridStandaloneElement;
      this.gridElement = el;
      this.hostRef.nativeElement.appendChild(el);

      this.applyOptions(this.options());
      this.elementReady = true;
    });
  }

  ngOnDestroy(): void {
    this.destroyAllSlotViews();

    if (this.benchmarkSubscriptionUnsubscribe) {
      this.benchmarkSubscriptionUnsubscribe();
      this.benchmarkSubscriptionUnsubscribe = null;
    }

    if (this.gridElement) {
      this.gridElement.removeEventListener('cellSlotsChanged', this.onCellSlotsChanged);
      this.gridElement.remove();
      this.gridElement = null;
    }
  }

  private createWrappedGridApi(api: UiGridApi, opts: GridOptions): UiGridApi {
    const benchmarkListeners = new Set<(result: GridBenchmarkResult) => void>();
    const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());
    // Clean up previous underlying subscription if it exists
    if (this.benchmarkSubscriptionUnsubscribe) {
      this.benchmarkSubscriptionUnsubscribe();
    }
    // Subscribe to underlying benchmarkComplete and forward to wrapper listeners
    this.benchmarkSubscriptionUnsubscribe = api.core.on.benchmarkComplete((result) => {
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
            await Promise.resolve();
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

  private applyOptions(opts: GridOptions): void {
    const el = this.gridElement!;

    this.zone.runOutsideAngular(() => {
      // Extract Angular TemplateRef columns
      const cellSlotColumns: string[] = [];
      const newTemplateColumns = new Map<string, GridTemplateRefLike<GridCellTemplateContext>>();

      if (opts.columnDefs) {
        for (const col of opts.columnDefs) {
          if (col.cellTemplate?.createEmbeddedView) {
            cellSlotColumns.push(col.name);
            newTemplateColumns.set(col.name, col.cellTemplate);
          }
        }
      }

      // Register the event listener once
      if (!this.listenerAttached) {
        el.addEventListener('cellSlotsChanged', this.onCellSlotsChanged);
        this.listenerAttached = true;
      }

      // Determine if the template column set changed structurally
      const columnsChanged =
        cellSlotColumns.length !== this.currentSlotColumnNames.length ||
        cellSlotColumns.some((name, i) => name !== this.currentSlotColumnNames[i]);

      this.templateColumns = newTemplateColumns;

      if (columnsChanged) {
        // Structural change — destroy all views and reconfigure slots
        this.destroyAllSlotViews();
        this.currentSlotColumnNames = cellSlotColumns;
      }

      // Strip cellTemplate from columnDefs before passing to the element
      const cleanedColumnDefs: GridColumnDef[] | undefined = opts.columnDefs?.map((col) => {
        if (col.cellTemplate?.createEmbeddedView) {
          const { cellTemplate: _removed, ...rest } = col;
          return rest as GridColumnDef;
        }
        return col;
      });

      const wrappedOptions: GridOptions = {
        ...opts,
        columnDefs: cleanedColumnDefs,
        onRegisterApi: (api) => {
          const wrappedApi = this.createWrappedGridApi(api as UiGridApi, opts);
          this.zone.run(() => this.apiReady.emit(wrappedApi));
          opts.onRegisterApi?.(wrappedApi);
        },
      };

      el.options = wrappedOptions;

      if (columnsChanged) {
        // Triggers re-render → flush → cellSlotsChanged with all cells as added
        el.setFrameworkRenderedSlots({ cells: cellSlotColumns });
      } else if (this.slotViews.size > 0) {
        // Data-only update — refresh existing view contexts in place
        this.updateSlotViewContexts(opts.data ?? []);
      }
    });
  }

  private updateSlotViewContexts(data: readonly GridRecord[]): void {
    const dataById = new Map<string, GridRecord>();
    for (const row of data) {
      const id = String(row['id'] ?? '');
      if (id) dataById.set(id, row);
    }

    // Batch change detection for all slot views to avoid excessive sync cycles during scroll
    const viewsNeedingCheck: EmbeddedViewRef<GridCellTemplateContext>[] = [];
    
    for (const [, entry] of this.slotViews) {
      const row = dataById.get(entry.rowId);
      if (!row) continue;

      const col = this.findColumnDef(entry.columnName);
      const value = col?.field ? this.getNestedValue(row, col.field) : row[entry.columnName];

      entry.view.context.$implicit = value;
      entry.view.context.value = value;
      entry.view.context.row = row;
      viewsNeedingCheck.push(entry.view);
    }

    // Batch all change detection calls at once instead of individually
    // This significantly improves performance during virtualized scrolling
    this.zone.run(() => {
      for (const view of viewsNeedingCheck) {
        view.detectChanges();
      }
    });
  }

  private findColumnDef(name: string): GridColumnDef | undefined {
    return this.options()?.columnDefs?.find((c) => c.name === name);
  }

  private getNestedValue(obj: GridRecord, field: string): unknown {
    const parts = field.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private destroyAllSlotViews(): void {
    const el = this.gridElement;
    for (const entry of this.slotViews.values()) {
      this.appRef.detachView(entry.view);
      entry.view.destroy();
    }
    this.slotViews.clear();
    if (el) {
      el.querySelectorAll(':scope > [slot]').forEach((node) => node.remove());
    }
  }

  private readonly onCellSlotsChanged = (event: Event): void => {
    const detail = (event as CustomEvent<FrameworkSlotDelta<FrameworkCellSlot>>).detail;
    const el = this.gridElement!;

    for (const slot of detail.removed) {
      const entry = this.slotViews.get(slot.slotName);
      if (entry) {
        this.appRef.detachView(entry.view);
        entry.view.destroy();
        this.slotViews.delete(slot.slotName);
      }
      el.querySelector(`:scope > [slot="${slot.slotName}"]`)?.remove();
    }

    for (const slot of detail.added) {
      const templateRef = this.templateColumns.get(slot.columnName);
      if (!templateRef?.createEmbeddedView) continue;

      const viewRef = templateRef.createEmbeddedView(
        slot.context,
      ) as EmbeddedViewRef<GridCellTemplateContext>;
      this.appRef.attachView(viewRef);
      // Note: Skip detectChanges() here - the view is created with correct initial context
      // and will update via updateSlotViewContexts() when data actually changes.
      // Calling detectChanges() on every added slot during scroll causes excessive
      // synchronous change detection cycles (hundreds per scroll frame on 100K rows).

      const wrapper = document.createElement('span');
      wrapper.setAttribute('slot', slot.slotName);
      for (const node of viewRef.rootNodes) {
        wrapper.appendChild(node);
      }
      el.appendChild(wrapper);

      const oldEntry = this.slotViews.get(slot.slotName);
      if (oldEntry) {
        this.appRef.detachView(oldEntry.view);
        oldEntry.view.destroy();
      }
      this.slotViews.set(slot.slotName, {
        view: viewRef,
        columnName: slot.columnName,
        rowId: slot.rowId,
      });
    }
  };
}
