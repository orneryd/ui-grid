import { Component, DestroyRef, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import {
  FILTER_CONDITIONS,
  GridCellTemplateContext,
  GridExpandableTemplateContext,
  GridOptions,
  GridRecord,
  UiGridApi,
  UiGridComponent
} from '@ornery/ui-grid';
import {
  TradingLcg,
  TradingRow,
  createTradingRows,
  fmtChange,
  fmtChangePct,
  fmtPrice,
  tickTradingRows,
  tradingColumnDefs,
} from './pages/shared/trading-data';

type HarnessMode = 'expandable' | 'tree' | 'templated' | 'pinning' | 'pagination' | 'infinite' | 'trading';

function createInfiniteRows(start: number, count: number): GridRecord[] {
  return Array.from({ length: count }, (_unused, i) => {
    const idx = start + i;
    return {
      id: `infinite-${idx}`,
      index: idx,
      event: `Event #${idx + 1}`,
      severity: ['info', 'warn', 'error', 'debug'][idx % 4],
      source: ['auth', 'api', 'worker', 'scheduler', 'inventory'][idx % 5],
      timestamp: new Date(2026, 0, 1, idx % 24, (idx * 3) % 60).toISOString(),
    };
  });
}

function createHarnessRows(count = 18): GridRecord[] {
  return Array.from({ length: count }, (_value, index) => ({
    id: `harness-row-${index + 1}`,
    name: `Harness Row ${index + 1}`,
    status: index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Pilot' : 'Expansion',
    revenue: 1200 + index * 75,
    renewalDate: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    account: { owner: `Owner ${index + 1}` }
  }));
}

function createTreeRows(): GridRecord[] {
  return Array.from({ length: 6 }, (_value, index) => ({
    id: `parent-${index + 1}`,
    name: `Parent ${index + 1}`,
    status: index % 2 === 0 ? 'Active' : 'Pilot',
    revenue: 3000 + index * 225,
    account: { owner: `Tree Owner ${index + 1}` },
    children: [
      {
        id: `parent-${index + 1}-child-1`,
        name: `Child ${index + 1}.1`,
        status: 'Expansion',
        revenue: 700 + index * 50,
        account: { owner: `Tree Owner ${index + 1}A` }
      },
      {
        id: `parent-${index + 1}-child-2`,
        name: `Child ${index + 1}.2`,
        status: 'Pilot',
        revenue: 900 + index * 60,
        account: { owner: `Tree Owner ${index + 1}B` }
      }
    ]
  }));
}

@Component({
  selector: 'app-grid-browser-harness',
  imports: [UiGridComponent],
  template: `
    <section class="browser-harness">
      <header class="browser-harness__header">
        <div>
          <p class="browser-harness__eyebrow">Browser Harness</p>
          <h2>Virtual scroll branch harness</h2>
          <p>
            Use this in a real browser while running the app to exercise virtual-scroll branches that jsdom does
            not reliably materialize in the unit runner.
          </p>
        </div>
        <div class="browser-harness__modes" role="tablist" aria-label="Browser harness scenarios">
          @for (scenario of scenarios; track scenario.value) {
            <button
              type="button"
              class="browser-harness__mode"
              [class.browser-harness__mode-active]="mode() === scenario.value"
              [class.browser-harness__mode-trading]="scenario.value === 'trading'"
              [attr.aria-selected]="mode() === scenario.value"
              (click)="setMode(scenario.value)">
              {{ scenario.label }}
            </button>
          }
        </div>
      </header>

      <ng-template #status let-value>
        <span class="browser-harness__status"
          [class.browser-harness__status--active]="value === 'Active'"
          [class.browser-harness__status--pilot]="value === 'Pilot'"
          [class.browser-harness__status--expansion]="value === 'Expansion'">
          {{ value }}
        </span>
      </ng-template>

      <ng-template #renewalDateCell let-value let-row="row">
        <input
          type="date"
          class="browser-harness__date-picker"
          [value]="value"
          (change)="onDateChange($event, row)" />
      </ng-template>

      <ng-template #detail let-row>
        <div class="browser-harness__detail">{{ row.name }} browser detail</div>
      </ng-template>

      <ng-template #tradingPriceCell let-value let-row="row">
        <span [style.color]="$any(row)['priceColor']" style="font-variant-numeric:tabular-nums">{{ fmtTradingPrice(value) }}</span>
      </ng-template>
      <ng-template #tradingChangeCell let-value let-row="row">
        <span [style.color]="$any(row)['changeColor']">{{ fmtTradingChange(value) }}</span>
      </ng-template>
      <ng-template #tradingChangePctCell let-value let-row="row">
        <span [style.color]="$any(row)['changeColor']">{{ fmtTradingChangePct(value) }}</span>
      </ng-template>

      <app-ui-grid [options]="options()" (apiReady)="onApiReady($event)" />
    </section>
  `,
  styles: `
    :host {
      display: block;
      margin-top: 2rem;
      --browser-harness-border: var(--app-browser-harness-border, color-mix(in srgb, currentColor 12%, transparent));
      --browser-harness-panel: var(--app-browser-harness-panel, color-mix(in srgb, currentColor 4%, transparent));
      --browser-harness-button-bg: var(--app-browser-harness-button-bg, var(--ui-grid-surface, white));
      --browser-harness-button-text: var(--app-browser-harness-button-text, currentColor);
      --browser-harness-button-active-bg: var(--app-browser-harness-button-active-bg, var(--ui-grid-accent, #14212d));
      --browser-harness-button-active-text: var(--app-browser-harness-button-active-text, var(--ui-grid-surface, white));
      --browser-harness-status-bg: var(--app-browser-harness-status-bg, var(--ui-grid-status-active-bg, #d7efe5));
      --browser-harness-status-text: var(--app-browser-harness-status-text, var(--ui-grid-status-active-color, #0c4c32));
      --browser-harness-detail-bg: var(--app-browser-harness-detail-bg, color-mix(in srgb, var(--ui-grid-accent, #14212d) 12%, var(--ui-grid-surface, white)));
      --browser-harness-detail-text: var(--app-browser-harness-detail-text, var(--ui-grid-cell-color, currentColor));
    }

    .browser-harness {
      display: grid;
      gap: 1rem;
    }

    .browser-harness__header {
      display: grid;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border: 1px solid var(--browser-harness-border);
      border-radius: 1rem;
      background: linear-gradient(135deg, var(--browser-harness-panel), transparent);
    }

    .browser-harness__eyebrow {
      margin: 0 0 0.35rem;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .browser-harness__header h2,
    .browser-harness__header p {
      margin: 0;
    }

    .browser-harness__modes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .browser-harness__mode {
      border: 1px solid var(--browser-harness-border);
      border-radius: 999px;
      background: var(--browser-harness-button-bg);
      color: var(--browser-harness-button-text);
      padding: 0.55rem 0.9rem;
      cursor: pointer;
      font: inherit;
    }

    .browser-harness__mode-active {
      background: var(--browser-harness-button-active-bg);
      color: var(--browser-harness-button-active-text);
    }

    .browser-harness__mode-trading {
      background: color-mix(in srgb, #22c55e 14%, var(--browser-harness-button-bg));
      color: color-mix(in srgb, #22c55e 80%, currentColor);
      border-color: color-mix(in srgb, #22c55e 30%, transparent);
    }

    .browser-harness__mode-trading.browser-harness__mode-active {
      background: color-mix(in srgb, #22c55e 85%, black);
      color: #051a0e;
    }

    .browser-harness__status {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 0.2rem 0.55rem;
      background: var(--browser-harness-status-bg);
      color: var(--browser-harness-status-text);
      font-size: 0.85rem;
      font-weight: 600;
    }

    .browser-harness__status--active {
      background: color-mix(in srgb, #16a34a 14%, transparent);
      color: #166534;
    }

    .browser-harness__status--pilot {
      background: color-mix(in srgb, #2563eb 14%, transparent);
      color: #1e40af;
    }

    .browser-harness__status--expansion {
      background: color-mix(in srgb, #d97706 14%, transparent);
      color: #92400e;
    }

    .browser-harness__date-picker {
      font: inherit;
      font-size: 0.85rem;
      border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
      border-radius: 6px;
      padding: 0.2rem 0.4rem;
      background: var(--ui-grid-surface, white);
      color: inherit;
      cursor: pointer;
    }

    .browser-harness__date-picker:focus {
      outline: 2px solid var(--ui-grid-accent, #2563eb);
      outline-offset: 1px;
    }

    .browser-harness__detail {
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      background: var(--browser-harness-detail-bg);
      color: var(--browser-harness-detail-text);
      font-weight: 600;
    }
  `
})
export class GridBrowserHarnessComponent {
  private readonly tradingPriceCell =
    viewChild<TemplateRef<GridCellTemplateContext>>('tradingPriceCell');
  private readonly tradingChangeCell =
    viewChild<TemplateRef<GridCellTemplateContext>>('tradingChangeCell');
  private readonly tradingChangePctCell =
    viewChild<TemplateRef<GridCellTemplateContext>>('tradingChangePctCell');

  private readonly tradingRows = signal<TradingRow[]>(createTradingRows());
  private readonly tradingRng = new TradingLcg(0xabcdef12);
  private tradingIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly INFINITE_PAGE_SIZE = 60;
  private readonly INFINITE_MAX_ROWS = 2000;
  private infiniteRows = signal<GridRecord[]>(createInfiniteRows(0, 60));
  private harnessApi: UiGridApi | null = null;
  private disposeInfiniteScroll: (() => void) | null = null;

  protected readonly fmtTradingPrice = fmtPrice;
  protected readonly fmtTradingChange = fmtChange;
  protected readonly fmtTradingChangePct = fmtChangePct;

  protected readonly mode = signal<HarnessMode>('expandable');
  protected readonly scenarios = [
    { label: 'Expandable', value: 'expandable' },
    { label: 'Tree', value: 'tree' },
    { label: 'Templated', value: 'templated' },
    { label: 'Pinning', value: 'pinning' },
    { label: 'Pagination', value: 'pagination' },
    { label: 'Infinite', value: 'infinite' },
    { label: 'Trading', value: 'trading' },
  ] as const;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.tradingIntervalId !== null) {
        clearInterval(this.tradingIntervalId);
        this.tradingIntervalId = null;
      }
      this.disposeInfiniteScroll?.();
      this.disposeInfiniteScroll = null;
    });
  }

  private readonly statusTemplate = viewChild<TemplateRef<GridCellTemplateContext>>('status');
  private readonly renewalDateTemplate = viewChild<TemplateRef<GridCellTemplateContext>>('renewalDateCell');
  private readonly detailTemplate = viewChild<TemplateRef<GridExpandableTemplateContext>>('detail');

  protected readonly options = computed<GridOptions>(() => {
    switch (this.mode()) {
      case 'tree':
        return this.treeOptions();
      case 'templated':
        return this.templatedOptions();
      case 'pinning':
        return this.pinningOptions();
      case 'pagination':
        return this.paginationOptions();
      case 'infinite':
        return this.infiniteOptions();
      case 'trading':
        return this.tradingOptions();
      default:
        return this.expandableOptions();
    }
  });

  protected setMode(mode: HarnessMode): void {
    if (this.mode() === mode) return;
    if (mode !== 'trading' && this.tradingIntervalId !== null) {
      clearInterval(this.tradingIntervalId);
      this.tradingIntervalId = null;
    }
    if (mode !== 'infinite') {
      this.disposeInfiniteScroll?.();
      this.disposeInfiniteScroll = null;
    }
    if (mode === 'infinite') {
      this.infiniteRows.set(createInfiniteRows(0, this.INFINITE_PAGE_SIZE));
    }
    this.mode.set(mode);
    if (mode === 'trading' && this.tradingIntervalId === null) {
      this.tradingIntervalId = setInterval(() => {
        this.tradingRows.set(tickTradingRows(this.tradingRows(), this.tradingRng, 6));
      }, 10);
    }
  }

  protected onApiReady(api: UiGridApi): void {
    this.harnessApi = api;
    if (this.mode() === 'infinite') {
      this.setupInfiniteScroll(api);
    }
  }

  private setupInfiniteScroll(api: UiGridApi): void {
    this.disposeInfiniteScroll?.();
    this.disposeInfiniteScroll = api.infiniteScroll.on.needLoadMoreData(async () => {
      const current = this.infiniteRows();
      if (current.length >= this.INFINITE_MAX_ROWS) {
        await api.infiniteScroll.dataLoaded(false, false);
        return;
      }
      const newRows = createInfiniteRows(current.length, this.INFINITE_PAGE_SIZE);
      const combined = [...current, ...newRows];
      this.infiniteRows.set(combined);
      await api.infiniteScroll.dataLoaded(false, combined.length < this.INFINITE_MAX_ROWS);
    });
  }

  private baseOptions(data: readonly GridRecord[]): GridOptions {
    return {
      id: `browser-harness-${this.mode()}`,
      title: `Browser Harness: ${this.mode().charAt(0).toUpperCase()}${this.mode().slice(1)}`,
      emptyMessage: 'No browser harness rows',
      rowIdentity: (row) => String(row['id']),
      data,
      rowHeight: 46,
      enableSorting: true,
      enableFiltering: true,
      enableGrouping: false,
      enableColumnMoving: false,
      enableVirtualization: true,
      virtualizationThreshold: 1,
      columnDefs: [
        { name: 'name', displayName: 'Customer', width: 'minmax(13rem, 1.1fr)' },
        { name: 'status', width: 'minmax(9rem, 0.7fr)' },
        {
          name: 'revenue',
          align: 'end',
          width: 'minmax(9rem, 0.7fr)',
          filter: { condition: FILTER_CONDITIONS.greaterThan },
          formatter: (value) => `$${value}`
        },
        { name: 'owner', field: 'account.owner', displayName: 'Owner', width: 'minmax(10rem, 0.8fr)' }
      ]
    };
  }

  private expandableOptions(): GridOptions {
    return {
      ...this.baseOptions(createHarnessRows()),
      enableExpandable: true,
      expandableRowHeight: 112,
      expandableRowTemplate: this.detailTemplate() ?? undefined,
      enableRowSelection: true
    };
  }

  private treeOptions(): GridOptions {
    return {
      ...this.baseOptions(createTreeRows()),
      enableTreeView: true,
      treeChildrenField: 'children',
      showTreeExpandNoChildren: false,
      treeIndent: 16
    };
  }

  private pinningOptions(): GridOptions {
    const data = Array.from({ length: 20 }, (_v, i) => ({
      id: `pin-${i + 1}`,
      name: `Row ${i + 1}`,
      department: i % 3 === 0 ? 'Engineering' : i % 3 === 1 ? 'Design' : 'Sales',
      region: i % 4 === 0 ? 'West' : i % 4 === 1 ? 'East' : i % 4 === 2 ? 'Central' : 'South',
      q1: 1000 + i * 120,
      q2: 1100 + i * 95,
      q3: 900 + i * 140,
      q4: 1300 + i * 80,
      total: 4300 + i * 435,
      growth: `${(2.5 + i * 0.3).toFixed(1)}%`,
      status: i % 2 === 0 ? 'Active' : 'Review',
    }));
    return {
      id: 'browser-harness-pinning',
      title: 'Browser Harness: Pinning',
      emptyMessage: 'No rows',
      rowIdentity: (row) => String(row['id']),
      data,
      rowHeight: 46,
      enableSorting: true,
      enableFiltering: true,
      enablePinning: true,
      enableVirtualization: true,
      virtualizationThreshold: 1,
      columnDefs: [
        { name: 'name', displayName: 'Name', width: '160px', pinnedLeft: true },
        { name: 'department', displayName: 'Department', width: '180px' },
        { name: 'region', displayName: 'Region', width: '140px' },
        { name: 'q1', displayName: 'Q1 Revenue', width: '180px', align: 'end' },
        { name: 'q2', displayName: 'Q2 Revenue', width: '180px', align: 'end' },
        { name: 'q3', displayName: 'Q3 Revenue', width: '180px', align: 'end' },
        { name: 'q4', displayName: 'Q4 Revenue', width: '180px', align: 'end' },
        { name: 'total', displayName: 'Total', width: '150px', align: 'end' },
        { name: 'growth', displayName: 'Growth', width: '140px', align: 'end' },
        { name: 'status', displayName: 'Status', width: '150px' },
      ],
    };
  }

  private templatedOptions(): GridOptions {
    return {
      ...this.baseOptions(createHarnessRows()),
      columnDefs: [
        { name: 'name', displayName: 'Customer', width: 'minmax(13rem, 1.1fr)' },
        {
          name: 'status',
          width: 'minmax(9rem, 0.7fr)',
          cellTemplate: this.statusTemplate() ?? undefined,
          filter: { condition: FILTER_CONDITIONS.exact }
        },
        {
          name: 'revenue',
          displayName: 'Revenue',
          align: 'end',
          width: 'minmax(9rem, 0.7fr)',
          filter: { condition: FILTER_CONDITIONS.greaterThan },
          formatter: (value) =>
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value ?? 0))
        },
        {
          name: 'renewalDate',
          displayName: 'Renewal',
          type: 'date',
          width: 'minmax(11rem, 0.9fr)',
          cellTemplate: this.renewalDateTemplate() ?? undefined,
        },
        { name: 'owner', field: 'account.owner', displayName: 'Owner', width: 'minmax(10rem, 0.8fr)' }
      ]
    };
  }

  protected onDateChange(event: Event, row: GridRecord): void {
    const input = event.target as HTMLInputElement;
    row['renewalDate'] = input.value;
  }

  private paginationOptions(): GridOptions {
    return {
      id: 'browser-harness-pagination',
      title: 'Browser Harness: Pagination',
      emptyMessage: 'No rows match the current filters.',
      rowIdentity: (row) => String(row['id']),
      data: createHarnessRows(200),
      rowHeight: 46,
      enableSorting: true,
      enableFiltering: true,
      enableColumnResizing: true,
      enableVirtualization: false,
      enablePagination: true,
      enablePaginationControls: true,
      paginationPageSize: 25,
      paginationPageSizes: [10, 25, 50, 100],
      columnDefs: [
        { name: 'name', displayName: 'Customer', width: 'minmax(13rem, 1.1fr)' },
        { name: 'status', width: 'minmax(9rem, 0.7fr)' },
        {
          name: 'revenue',
          align: 'end',
          width: 'minmax(9rem, 0.7fr)',
          filter: { condition: FILTER_CONDITIONS.greaterThan },
          formatter: (value) => `$${value}`
        },
        { name: 'renewalDate', displayName: 'Renewal', type: 'date', width: 'minmax(11rem, 0.9fr)' },
        { name: 'owner', field: 'account.owner', displayName: 'Owner', width: 'minmax(10rem, 0.8fr)' }
      ]
    };
  }

  private infiniteOptions(): GridOptions {
    return {
      id: 'browser-harness-infinite',
      title: 'Browser Harness: Infinite Scroll',
      emptyMessage: 'No rows loaded yet.',
      rowIdentity: (row) => String(row['id']),
      data: this.infiniteRows(),
      rowHeight: 40,
      enableSorting: false,
      enableFiltering: false,
      enableColumnResizing: true,
      enableVirtualization: true,
      virtualizationThreshold: 50,
      enableInfiniteScroll: true,
      infiniteScrollUp: false,
      infiniteScrollDown: true,
      infiniteScrollRowsFromEnd: 20,
      columnDefs: [
        { name: 'index', displayName: '#', width: '80px' },
        { name: 'event', displayName: 'Event', width: 'minmax(10rem, 0.9fr)' },
        { name: 'severity', displayName: 'Severity', width: '120px' },
        { name: 'source', displayName: 'Source', width: '140px' },
        { name: 'timestamp', displayName: 'Timestamp', width: 'minmax(12rem, 1fr)' },
      ]
    };
  }

  private tradingOptions(): GridOptions {
    const priceTpl = this.tradingPriceCell() ?? undefined;
    const changeTpl = this.tradingChangeCell() ?? undefined;
    const changePctTpl = this.tradingChangePctCell() ?? undefined;
    const colDefs = tradingColumnDefs().map((col) => {
      if (col.name === 'price' || col.name === 'bid' || col.name === 'ask') {
        return { ...col, cellTemplate: priceTpl };
      }
      if (col.name === 'change') return { ...col, cellTemplate: changeTpl };
      if (col.name === 'changePct') return { ...col, cellTemplate: changePctTpl };
      return col;
    });
    return {
      id: 'browser-harness-trading',
      title: 'Browser Harness: Trading Terminal',
      emptyMessage: 'No data',
      rowIdentity: (row) => String(row['id']),
      data: this.tradingRows(),
      rowHeight: 40,
      enableSorting: true,
      enableFiltering: false,
      enableGrouping: false,
      enableColumnMoving: false,
      enableVirtualization: true,
      virtualizationThreshold: 1,
      columnDefs: colDefs,
    };
  }
}