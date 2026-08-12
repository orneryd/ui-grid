import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  PLATFORM_ID,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FILTER_CONDITIONS,
  type GridBenchmarkResult,
  type GridOptions,
  type GridRecord,
  type UiGridApi,
} from '@ornery/ui-grid-core';
import { defineStandaloneUiGridElement, type VanillaUiGridElement } from '@ornery/ui-grid-vanilla';
import { CodeBlockComponent } from '../shared/code-block.component';
import { createDemoData } from '../shared/demo-data';
import {
  TradingLcg,
  TradingRow,
  createTradingRows,
  tickTradingRows,
  tradingColumnDefs,
} from '../shared/trading-data';

type DemoMode =
  | 'expandable'
  | 'tree'
  | 'templated'
  | 'pinning'
  | 'pagination'
  | 'trading'
  | 'infinite';

type WebComponentGridElement = VanillaUiGridElement & {
  getState(): unknown;
  setState(state: unknown): void;
  setData(rows: GridRecord[]): void;
  options: GridOptions;
};

type DeclarativeGridConfig = {
  readonly id: string;
  readonly title: string;
  readonly emptyMessage: string;
  readonly dataJson?: string;
  readonly columnDefsJson: string;
  readonly groupingJson?: string;
  readonly rowHeight: number;
  readonly virtualizationThreshold: number;
  readonly treeChildrenField?: string;
  readonly treeIndent?: number;
  readonly expandableRowHeight?: number;
  readonly enableSorting: boolean;
  readonly enableFiltering: boolean;
  readonly enableGrouping: boolean;
  readonly enableColumnMoving: boolean;
  readonly enableColumnResizing: boolean;
  readonly enableVirtualization: boolean;
  readonly enableCellEditOnFocus: boolean;
  readonly enablePinning: boolean;
  readonly enableExpandable: boolean;
  readonly enableTreeView: boolean;
  readonly showTreeExpandNoChildren: boolean;
  readonly enableRowSelection?: boolean;
  readonly enablePagination?: boolean;
  readonly enablePaginationControls?: boolean;
  readonly paginationPageSize?: number;
  readonly paginationPageSizesJson?: string;
  readonly enableInfiniteScroll?: boolean;
  readonly infiniteScrollUp?: boolean;
  readonly infiniteScrollDown?: boolean;
  readonly infiniteScrollRowsFromEnd?: number;
};

function createHarnessRows(count = 18): GridRecord[] {
  return Array.from({ length: count }, (_value, index) => ({
    id: `harness-row-${index + 1}`,
    name: `Harness Row ${index + 1}`,
    status: index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Pilot' : 'Expansion',
    revenue: 1200 + index * 75,
    renewalDate: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    account: { owner: `Owner ${index + 1}` },
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
        account: { owner: `Tree Owner ${index + 1}A` },
      },
      {
        id: `parent-${index + 1}-child-2`,
        name: `Child ${index + 1}.2`,
        status: 'Pilot',
        revenue: 900 + index * 60,
        account: { owner: `Tree Owner ${index + 1}B` },
      },
    ],
  }));
}

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

function createPinningRows(): GridRecord[] {
  return Array.from({ length: 20 }, (_value, index) => ({
    id: `pin-${index + 1}`,
    name: `Row ${index + 1}`,
    department: index % 3 === 0 ? 'Engineering' : index % 3 === 1 ? 'Design' : 'Sales',
    region:
      index % 4 === 0 ? 'West' : index % 4 === 1 ? 'East' : index % 4 === 2 ? 'Central' : 'South',
    q1: 1000 + index * 120,
    q2: 1100 + index * 95,
    q3: 900 + index * 140,
    q4: 1300 + index * 80,
    total: 4300 + index * 435,
    growth: `${(2.5 + index * 0.3).toFixed(1)}%`,
    status: index % 2 === 0 ? 'Active' : 'Review',
  }));
}

function createTradingDisplayRows(rows: readonly TradingRow[]): GridRecord[] {
  return rows.map((row) => ({
    id: row.id,
    symbol: row.symbol,
    exchange: row.exchange,
    sector: row.sector,
    price: row.price,
    bid: row.bid,
    ask: row.ask,
    change: row.change,
    changePct: row.changePct,
    high: row.high,
    low: row.low,
    volume: row.volume,
    lastSize: row.lastSize,
    priceColor: row.priceColor,
    changeColor: row.changeColor,
    priceStr: row.priceStr,
    bidStr: row.bidStr,
    askStr: row.askStr,
    changeStr: row.changeStr,
    changePctStr: row.changePctStr,
  }));
}

@Component({
  selector: 'app-web-components-page',
  imports: [RouterLink, CodeBlockComponent],
  templateUrl: './web-components.component.html',
  styleUrl: './web-components.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WebComponentsComponent {
  // ─── slot template markup strings (injected programmatically because
  //     Angular's compiler eats native <template> as ng-template) ────────
  private static readonly STATUS_PILL_TEMPLATE = `<span class="status-pill status-pill-{{valueLower}}">{{value}}</span>`;

  // Mirrors the Angular harness's <ng-template #renewalDateCell> visually.
  // The vanilla slot path is interpolation-only (no event binding) — the
  // host wires up a delegated `change` listener to persist the picked date
  // back into the row and re-render via setData().
  private static readonly RENEWAL_DATE_TEMPLATE =
    `<input type="date" class="browser-harness__date-picker" value="{{value}}" />`;

  private static readonly EXPANDABLE_ROW_TEMPLATE =
    `<article class="detail-card">` +
    `<strong>{{row.name}}</strong>` +
    `<p>Owner: {{row.account.owner}}</p>` +
    `<p>Renewal: {{row.renewalDate}}</p>` +
    `<p>Revenue: {{row.revenue}}</p>` +
    `</article>`;

  private static readonly TRADING_TEMPLATES: ReadonlyArray<[slotName: string, markup: string]> = [
    [
      'cell-price',
      `<span style="color:{{row.priceColor}};font-variant-numeric:tabular-nums">{{row.priceStr}}</span>`,
    ],
    [
      'cell-bid',
      `<span style="color:{{row.priceColor}};font-variant-numeric:tabular-nums">{{row.bidStr}}</span>`,
    ],
    [
      'cell-ask',
      `<span style="color:{{row.priceColor}};font-variant-numeric:tabular-nums">{{row.askStr}}</span>`,
    ],
    ['cell-change', `<span style="color:{{row.changeColor}}">{{row.changeStr}}</span>`],
    ['cell-changePct', `<span style="color:{{row.changeColor}}">{{row.changePctStr}}</span>`],
  ];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly primaryGridRef =
    viewChild.required<ElementRef<WebComponentGridElement>>('primaryGrid');
  private readonly demoGridRef =
    viewChild.required<ElementRef<WebComponentGridElement>>('demoGrid');
  private savedGridState: unknown = null;
  private readonly primaryData = createDemoData();
  private primaryGridApi: UiGridApi | null = null;
  private disposePrimaryVisibleRows: (() => void) | null = null;
  private disposePrimaryBenchmark: (() => void) | null = null;
  private disposePrimarySelection: (() => void) | null = null;
  private disposePrimarySelectionBatch: (() => void) | null = null;
  private tradingRows: TradingRow[] = createTradingRows();
  private readonly tradingRng = new TradingLcg(0x1a2b3c4d);
  private tradingIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly tradingDisplayDataSignal = signal<string>(
    JSON.stringify(createTradingDisplayRows(this.tradingRows)),
  );
  // Infinite-scroll demo state. Starts with a small batch; the grid's
  // needLoadMoreData event appends more rows on demand.
  private readonly INFINITE_PAGE_SIZE = 60;
  private readonly INFINITE_MAX_ROWS = 2000;
  private infiniteRows: GridRecord[] = createInfiniteRows(0, this.INFINITE_PAGE_SIZE);
  private readonly infiniteScrollDataSignal = signal<string>(JSON.stringify(this.infiniteRows));
  private readonly infiniteScrollColumnDefs = [
    { name: 'index', displayName: '#', width: '80px' },
    { name: 'event', displayName: 'Event', width: 'minmax(10rem, 0.9fr)' },
    { name: 'severity', displayName: 'Severity', width: '120px' },
    { name: 'source', displayName: 'Source', width: '140px' },
    { name: 'timestamp', displayName: 'Timestamp', width: 'minmax(12rem, 1fr)' },
  ] as const;
  private demoGridApi: UiGridApi | null = null;
  private disposeDemoInfinite: (() => void) | null = null;
  // Persistent rows for the templated demo so a date-picker change survives
  // the next render. Keyed by row id; mutated in place when the user picks
  // a new date and then re-published via setData().
  private templatedRows: GridRecord[] = createHarnessRows();
  private disposeTemplatedDateChange: (() => void) | null = null;
  private readonly primaryColumnDefs = [
    {
      name: 'name',
      displayName: 'Customer',
      width: 'minmax(14rem, 1.2fr)',
      enableCellEdit: true,
    },
    {
      name: 'company',
      width: 'minmax(12rem, 1fr)',
      enableCellEdit: true,
    },
    {
      name: 'revenue',
      type: 'number',
      align: 'end',
      width: 'minmax(10rem, 0.7fr)',
      filter: { condition: FILTER_CONDITIONS.greaterThan },
    },
    {
      name: 'status',
      width: 'minmax(8rem, 0.7fr)',
      filter: { condition: FILTER_CONDITIONS.exact },
    },
    {
      name: 'renewalDate',
      type: 'date',
      displayName: 'Renewal',
      width: 'minmax(11rem, 0.8fr)',
    },
    {
      name: 'owner',
      field: 'account.owner',
      displayName: 'Account Owner',
      width: 'minmax(11rem, 0.8fr)',
      enableCellEdit: true,
    },
  ] satisfies GridOptions['columnDefs'];
  private readonly primaryColumnDefsJson = JSON.stringify(this.primaryColumnDefs);
  private readonly baseHarnessColumnDefs = [
    { name: 'name', displayName: 'Customer', width: 'minmax(13rem, 1.1fr)' },
    { name: 'status', width: 'minmax(9rem, 0.7fr)' },
    {
      name: 'revenue',
      align: 'end',
      width: 'minmax(9rem, 0.7fr)',
      filter: { condition: FILTER_CONDITIONS.greaterThan },
    },
    {
      name: 'owner',
      field: 'account.owner',
      displayName: 'Owner',
      width: 'minmax(10rem, 0.8fr)',
    },
  ] satisfies GridOptions['columnDefs'];
  private readonly templatedColumnDefs = [
    { name: 'name', displayName: 'Customer', width: 'minmax(13rem, 1.1fr)' },
    {
      name: 'status',
      width: 'minmax(9rem, 0.7fr)',
      filter: { condition: FILTER_CONDITIONS.exact },
    },
    {
      name: 'revenue',
      displayName: 'Revenue',
      align: 'end',
      width: 'minmax(9rem, 0.7fr)',
      filter: { condition: FILTER_CONDITIONS.greaterThan },
    },
    {
      name: 'renewalDate',
      displayName: 'Renewal',
      type: 'date',
      width: 'minmax(11rem, 0.9fr)',
    },
    {
      name: 'owner',
      field: 'account.owner',
      displayName: 'Owner',
      width: 'minmax(10rem, 0.8fr)',
    },
  ] satisfies GridOptions['columnDefs'];
  private readonly pinningColumnDefs = [
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
  ] satisfies GridOptions['columnDefs'];
  private readonly tradingColumnDefsJson = JSON.stringify(
    tradingColumnDefs().map((column) => ({
      ...column,
      formatter: undefined,
    })),
  );
  protected readonly primaryGridActive = signal(true);
  protected readonly demoGridActive = signal(true);

  protected readonly mode = signal<DemoMode>('expandable');
  protected readonly visibleRowCount = signal(0);
  protected readonly selectedRowCount = signal(0);
  protected readonly benchmarkResult = signal<GridBenchmarkResult | null>(null);
  protected readonly savedStateJson = signal('No saved state captured yet.');
  protected readonly totalRows = signal(this.primaryData.length);
  protected readonly primaryConfig = computed<DeclarativeGridConfig>(() => ({
    id: 'ui-grid-web-components-primary',
    title: 'UI Grid Modernized (Web Component)',
    emptyMessage: 'No rows match the current filters.',
    columnDefsJson: this.primaryColumnDefsJson,
    groupingJson: JSON.stringify({ groupBy: ['status'] }),
    rowHeight: 48,
    virtualizationThreshold: 25,
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: true,
    enableColumnMoving: true,
    enableColumnResizing: true,
    enableVirtualization: true,
    enableCellEditOnFocus: true,
    enablePinning: false,
    enableExpandable: false,
    enableTreeView: false,
    showTreeExpandNoChildren: false,
  }));
  protected readonly demoConfig = computed<DeclarativeGridConfig>(() => {
    switch (this.mode()) {
      case 'tree':
        return {
          id: 'web-components-demo-tree',
          title: 'Web Components Demo: Tree',
          emptyMessage: 'No rows match the current filters.',
          dataJson: JSON.stringify(createTreeRows()),
          columnDefsJson: JSON.stringify(this.baseHarnessColumnDefs),
          rowHeight: 46,
          virtualizationThreshold: 1,
          treeChildrenField: 'children',
          treeIndent: 16,
          enableSorting: true,
          enableFiltering: true,
          enableGrouping: false,
          enableColumnMoving: false,
          enableColumnResizing: true,
          enableVirtualization: true,
          enableCellEditOnFocus: false,
          enablePinning: false,
          enableExpandable: false,
          enableTreeView: true,
          showTreeExpandNoChildren: false,
        };
      case 'templated':
        return {
          id: 'web-components-demo-templated',
          title: 'Web Components Demo: Templated',
          emptyMessage: 'No rows match the current filters.',
          dataJson: JSON.stringify(this.templatedRows),
          columnDefsJson: JSON.stringify(this.templatedColumnDefs),
          rowHeight: 46,
          virtualizationThreshold: 1,
          enableSorting: true,
          enableFiltering: true,
          enableGrouping: false,
          enableColumnMoving: false,
          enableColumnResizing: true,
          enableVirtualization: true,
          enableCellEditOnFocus: false,
          enablePinning: false,
          enableExpandable: false,
          enableTreeView: false,
          showTreeExpandNoChildren: false,
        };
      case 'pinning':
        return {
          id: 'web-components-demo-pinning',
          title: 'Web Components Demo: Pinning',
          emptyMessage: 'No rows',
          dataJson: JSON.stringify(createPinningRows()),
          columnDefsJson: JSON.stringify(this.pinningColumnDefs),
          rowHeight: 46,
          virtualizationThreshold: 1,
          enableSorting: true,
          enableFiltering: true,
          enableGrouping: false,
          enableColumnMoving: false,
          enableColumnResizing: true,
          enableVirtualization: true,
          enableCellEditOnFocus: false,
          enablePinning: true,
          enableExpandable: false,
          enableTreeView: false,
          showTreeExpandNoChildren: false,
        };
      case 'pagination':
        return {
          id: 'web-components-demo-pagination',
          title: 'Web Components Demo: Pagination',
          emptyMessage: 'No rows match the current filters.',
          dataJson: JSON.stringify(createHarnessRows(200)),
          columnDefsJson: JSON.stringify(this.baseHarnessColumnDefs),
          rowHeight: 46,
          virtualizationThreshold: 200,
          enableSorting: true,
          enableFiltering: true,
          enableGrouping: false,
          enableColumnMoving: false,
          enableColumnResizing: true,
          enableVirtualization: false,
          enableCellEditOnFocus: false,
          enablePinning: false,
          enableExpandable: false,
          enableTreeView: false,
          showTreeExpandNoChildren: false,
          enablePagination: true,
          enablePaginationControls: true,
          paginationPageSize: 25,
          paginationPageSizesJson: JSON.stringify([10, 25, 50, 100]),
        };
      case 'infinite':
        return {
          id: 'web-components-demo-infinite',
          title: 'Web Components Demo: Infinite Scroll',
          emptyMessage: 'No rows loaded yet.',
          dataJson: this.infiniteScrollDataSignal(),
          columnDefsJson: JSON.stringify(this.infiniteScrollColumnDefs),
          rowHeight: 40,
          virtualizationThreshold: 50,
          enableSorting: false,
          enableFiltering: false,
          enableGrouping: false,
          enableColumnMoving: false,
          enableColumnResizing: true,
          enableVirtualization: true,
          enableCellEditOnFocus: false,
          enablePinning: false,
          enableExpandable: false,
          enableTreeView: false,
          showTreeExpandNoChildren: false,
          enableInfiniteScroll: true,
          // Only load more when the user scrolls near the bottom — the
          // "top" direction is off so we demo forward-only infinite scroll.
          infiniteScrollUp: false,
          infiniteScrollDown: true,
          infiniteScrollRowsFromEnd: 20,
        };
      case 'trading':
        return {
          id: 'web-components-demo-trading',
          title: 'Web Components Demo: Trading Terminal',
          emptyMessage: 'No data',
          dataJson: this.tradingDisplayDataSignal(),
          columnDefsJson: this.tradingColumnDefsJson,
          rowHeight: 40,
          virtualizationThreshold: 64,
          enableSorting: true,
          enableFiltering: false,
          enableGrouping: false,
          enableColumnMoving: false,
          enableColumnResizing: true,
          enableVirtualization: false,
          enableCellEditOnFocus: false,
          enablePinning: false,
          enableExpandable: false,
          enableTreeView: false,
          showTreeExpandNoChildren: false,
        };
      default:
        return {
          id: 'web-components-demo-expandable',
          title: 'Web Components Demo: Expandable',
          emptyMessage: 'No rows match the current filters.',
          dataJson: JSON.stringify(createHarnessRows()),
          columnDefsJson: JSON.stringify(this.baseHarnessColumnDefs),
          rowHeight: 46,
          virtualizationThreshold: 1,
          expandableRowHeight: 112,
          enableSorting: true,
          enableFiltering: true,
          enableGrouping: false,
          enableColumnMoving: false,
          enableColumnResizing: true,
          enableVirtualization: true,
          enableCellEditOnFocus: false,
          enablePinning: false,
          enableExpandable: true,
          enableTreeView: false,
          showTreeExpandNoChildren: false,
          enableRowSelection: true,
        };
    }
  });
  protected readonly webComponentPrimarySnippet = computed(
    () => `<ui-grid-element
  id="primary-grid"
  grid-id="ui-grid-web-components-primary"
  title="UI Grid Modernized (Web Component)"
  empty-message="No rows match the current filters."
  row-height="48"
  virtualization-threshold="25"
  enable-sorting
  enable-filtering
  enable-grouping
  enable-column-moving
  enable-column-resizing
  enable-virtualization
  enable-cell-edit-on-focus>
  <template slot="cell-status" ngNonBindable>
    <span class="status-pill status-pill-{{valueLower}}">{{value}}</span>
  </template>
</ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  const grid = document.querySelector('#primary-grid');
  const columnDefs = [
    { name: 'name', displayName: 'Customer', width: 'minmax(14rem, 1.2fr)', enableCellEdit: true },
    { name: 'company', width: 'minmax(12rem, 1fr)', enableCellEdit: true },
    { name: 'revenue', type: 'number', align: 'end', width: 'minmax(10rem, 0.7fr)' },
    { name: 'status', width: 'minmax(8rem, 0.7fr)' },
    { name: 'renewalDate', type: 'date', displayName: 'Renewal', width: 'minmax(11rem, 0.8fr)' },
    { name: 'owner', field: 'account.owner', displayName: 'Account Owner', width: 'minmax(11rem, 0.8fr)', enableCellEdit: true },
  ];

  grid.setAttribute('grouping', JSON.stringify({ groupBy: ['status'] }));
  grid.setAttribute('column-defs', JSON.stringify(columnDefs));
  grid.setAttribute('data', JSON.stringify(rows));

  grid.options = {
    ...grid.options,
    benchmark: { iterations: 40 },
    onRegisterApi: (api) => {
      // hook benchmark, export, and saved-state buttons
    },
  };
</script>`,
  );
  protected readonly webComponentScenarioSnippet = computed(() => {
    switch (this.mode()) {
      case 'tree':
        return `<ui-grid-element
  id="demo-grid"
  grid-id="web-components-demo-tree"
  title="Web Components Demo: Tree"
  row-height="46"
  virtualization-threshold="1"
  tree-children-field="children"
  tree-indent="16"
  enable-sorting
  enable-filtering
  enable-column-resizing
  enable-tree-view
  enable-virtualization>
</ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  const grid = document.querySelector('#demo-grid');
  grid.setAttribute('column-defs', JSON.stringify(columnDefs));
  grid.setAttribute('data', JSON.stringify(treeRows));
</script>`;
      case 'templated':
        return `<ui-grid-element
  id="demo-grid"
  grid-id="web-components-demo-templated"
  title="Web Components Demo: Templated"
  row-height="46"
  virtualization-threshold="1"
  enable-sorting
  enable-filtering
  enable-column-resizing
  enable-virtualization>
  <template slot="cell-status" ngNonBindable>
    <span class="status-pill status-pill-{{valueLower}}">{{value}}</span>
  </template>
  <template slot="cell-renewalDate" ngNonBindable>
    <input type="date" class="browser-harness__date-picker" value="{{value}}" />
  </template>
</ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  const grid = document.querySelector('#demo-grid');
  grid.setAttribute('column-defs', JSON.stringify(columnDefs));
  grid.setAttribute('data', JSON.stringify(rows));
</script>`;
      case 'pinning':
        return `<ui-grid-element
  id="demo-grid"
  grid-id="web-components-demo-pinning"
  title="Web Components Demo: Pinning"
  row-height="46"
  virtualization-threshold="1"
  enable-sorting
  enable-filtering
  enable-column-resizing
  enable-pinning
  enable-virtualization>
</ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  const grid = document.querySelector('#demo-grid');
  grid.setAttribute('column-defs', JSON.stringify(columnDefs));
  grid.setAttribute('data', JSON.stringify(rows));
</script>`;
      case 'pagination':
        return `<ui-grid-element
  id="demo-grid"
  grid-id="web-components-demo-pagination"
  title="Web Components Demo: Pagination"
  row-height="46"
  enable-sorting
  enable-filtering
  enable-column-resizing
  enable-pagination
  enable-pagination-controls
  pagination-page-size="25"
  pagination-page-sizes="[10,25,50,100]">
</ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  const grid = document.querySelector('#demo-grid');
  grid.setAttribute('column-defs', JSON.stringify(columnDefs));
  grid.setAttribute('data', JSON.stringify(rows));
</script>`;
      case 'trading':
        return `<ui-grid-element
  id="trading-grid"
  grid-id="web-components-demo-trading"
  title="Web Components Demo: Trading Terminal"
  row-height="40"
  enable-sorting
  enable-column-resizing
  >
  <template slot="cell-price" ngNonBindable><span style="color:{{row.priceColor}};font-variant-numeric:tabular-nums">{{row.priceStr}}</span></template>
  <template slot="cell-bid" ngNonBindable><span style="color:{{row.priceColor}};font-variant-numeric:tabular-nums">{{row.bidStr}}</span></template>
  <template slot="cell-ask" ngNonBindable><span style="color:{{row.priceColor}};font-variant-numeric:tabular-nums">{{row.askStr}}</span></template>
  <template slot="cell-change" ngNonBindable><span style="color:{{row.changeColor}}">{{row.changeStr}}</span></template>
  <template slot="cell-changePct" ngNonBindable><span style="color:{{row.changeColor}}">{{row.changePctStr}}</span></template>
</ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  const grid = document.querySelector('#trading-grid');
  grid.setAttribute('column-defs', JSON.stringify(tradingColumnDefs));
  grid.setAttribute('data', JSON.stringify(rows));

  setInterval(() => {
    rows = tickTradingRows(rows, rng, 6);
    grid.setData(rows);
  }, 8);
</script>`;
      case 'infinite':
        return `<ui-grid-element
  id="infinite-grid"
  grid-id="web-components-demo-infinite"
  title="Web Components Demo: Infinite Scroll"
  row-height="40"
  virtualization-threshold="50"
  enable-virtualization
  enable-column-resizing
  enable-infinite-scroll
  infinite-scroll-down
  infinite-scroll-rows-from-end="20"></ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  const grid = document.querySelector('#infinite-grid');
  const columnDefs = [
    { name: 'index', displayName: '#', width: '80px' },
    { name: 'event', displayName: 'Event' },
    { name: 'severity', displayName: 'Severity', width: '120px' },
    { name: 'source', displayName: 'Source', width: '140px' },
    { name: 'timestamp', displayName: 'Timestamp' },
  ];
  const PAGE = 60;
  let rows = createRows(0, PAGE);

  grid.setAttribute('column-defs', JSON.stringify(columnDefs));
  grid.setAttribute('data', JSON.stringify(rows));

  grid.addEventListener('register-api', ({ detail: api }) => {
    api.infiniteScroll.on.needLoadMoreData(async () => {
      // Simulate a slow fetch.
      await new Promise((r) => setTimeout(r, 200));
      rows = rows.concat(createRows(rows.length, PAGE));
      grid.setAttribute('data', JSON.stringify(rows));
      await api.infiniteScroll.dataLoaded(false, rows.length < 2000);
    });
  });

  function createRows(start, count) {
    return Array.from({ length: count }, (_, i) => ({
      id: 'infinite-' + (start + i),
      index: start + i,
      event: 'Event #' + (start + i + 1),
      severity: ['info', 'warn', 'error', 'debug'][(start + i) % 4],
      source: ['auth', 'api', 'worker', 'scheduler', 'inventory'][(start + i) % 5],
      timestamp: new Date(2026, 0, 1, (start + i) % 24).toISOString(),
    }));
  }
</script>`;
      default:
        return `<ui-grid-element
  id="demo-grid"
  grid-id="web-components-demo-expandable"
  title="Web Components Demo: Expandable"
  row-height="46"
  virtualization-threshold="1"
  expandable-row-height="112"
  enable-sorting
  enable-filtering
  enable-column-resizing
  enable-expandable
  enable-virtualization
  enable-row-selection>
  <template slot="expandable-row" ngNonBindable>
    <article class="detail-card">
      <strong>{{row.name}}</strong>
      <p>Owner: {{row.account.owner}}</p>
      <p>Renewal: {{row.renewalDate}}</p>
      <p>Revenue: {{row.revenue}}</p>
    </article>
  </template>
</ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  const grid = document.querySelector('#demo-grid');
  grid.setAttribute('column-defs', JSON.stringify(columnDefs));
  grid.setAttribute('data', JSON.stringify(rows));
</script>`;
    }
  });
  protected readonly scenarios = [
    { label: 'Expandable', value: 'expandable' as const },
    { label: 'Tree', value: 'tree' as const },
    { label: 'Templated', value: 'templated' as const },
    { label: 'Pinning', value: 'pinning' as const },
    { label: 'Pagination', value: 'pagination' as const },
    { label: 'Trading', value: 'trading' as const },
    { label: 'Infinite scroll', value: 'infinite' as const },
  ];

  constructor() {
    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      await defineStandaloneUiGridElement();
      this.injectPrimaryGridTemplates();
      this.installPrimaryGridBridge();
      this.injectDemoGridTemplates();
      this.syncTradingLoop();
      this.syncInfiniteLoop();
    });

    inject(DestroyRef).onDestroy(() => {
      this.disposePrimaryVisibleRows?.();
      this.disposePrimaryBenchmark?.();
      this.disposePrimarySelection?.();
      this.disposePrimarySelectionBatch?.();
      this.disposeTemplatedDateChange?.();
      this.disposePrimaryVisibleRows = null;
      this.disposePrimaryBenchmark = null;
      this.disposePrimarySelection = null;
      this.disposePrimarySelectionBatch = null;
      this.disposeTemplatedDateChange = null;
      this.primaryGridApi = null;
      if (this.tradingIntervalId !== null) {
        clearInterval(this.tradingIntervalId);
        this.tradingIntervalId = null;
      }
    });
  }

  protected setMode(mode: DemoMode): void {
    if (this.mode() === mode) {
      return;
    }

    if (mode === 'trading') {
      this.tradingRows = createTradingRows();
      this.tradingDisplayDataSignal.set(JSON.stringify(createTradingDisplayRows(this.tradingRows)));
    }

    this.mode.set(mode);
    queueMicrotask(() => {
      this.injectDemoGridTemplates();
      this.syncTradingLoop();
      this.syncInfiniteLoop();
    });
  }

  protected captureState(): void {
    const grid = this.primaryGridRef().nativeElement;
    this.savedGridState = grid.getState();
    this.savedStateJson.set(JSON.stringify(this.savedGridState, null, 2));
  }

  protected restoreState(): void {
    if (!this.savedGridState) {
      return;
    }

    this.primaryGridRef().nativeElement.setState(this.savedGridState);
  }

  protected resetDemo(): void {
    this.savedGridState = null;
    this.visibleRowCount.set(0);
    this.selectedRowCount.set(0);
    this.benchmarkResult.set(null);
    this.savedStateJson.set('No saved state captured yet.');
    this.disposePrimaryVisibleRows?.();
    this.disposePrimaryBenchmark?.();
    this.disposePrimaryVisibleRows = null;
    this.disposePrimaryBenchmark = null;
    this.primaryGridApi = null;
    if (this.tradingIntervalId !== null) {
      clearInterval(this.tradingIntervalId);
      this.tradingIntervalId = null;
    }
    this.tradingRows = createTradingRows();
    this.tradingDisplayDataSignal.set(JSON.stringify(createTradingDisplayRows(this.tradingRows)));
    this.primaryGridActive.set(false);
    this.demoGridActive.set(false);
    queueMicrotask(() => {
      this.primaryGridActive.set(true);
      this.demoGridActive.set(true);
      queueMicrotask(() => {
        this.injectPrimaryGridTemplates();
        this.installPrimaryGridBridge();
        this.injectDemoGridTemplates();
        this.syncTradingLoop();
      });
    });
  }

  protected runBenchmark(): void {
    this.primaryGridApi?.core.benchmark();
  }

  protected exportCsv(): void {
    this.primaryGridApi?.core.exportCsv();
  }

  private installPrimaryGridBridge(): void {
    if (!isPlatformBrowser(this.platformId) || !this.primaryGridActive()) {
      return;
    }

    const grid = this.primaryGridRef().nativeElement;
    this.disposePrimaryVisibleRows?.();
    this.disposePrimaryBenchmark?.();
    this.disposePrimaryVisibleRows = null;
    this.disposePrimaryBenchmark = null;
    this.primaryGridApi = null;
    this.visibleRowCount.set(0);
    this.selectedRowCount.set(0);
    this.benchmarkResult.set(null);
    grid.options = {
      ...grid.options,
      data: this.primaryData,
      benchmark: {
        iterations: 40,
      },
      rowIdentity: (row) => String(row['id']),
      onRegisterApi: (api) => {
        this.primaryGridApi = api as UiGridApi;
        this.visibleRowCount.set(this.primaryGridApi.core.getVisibleRows().length);
        this.selectedRowCount.set(this.primaryGridApi.selection.getSelectedCount());
        this.disposePrimaryVisibleRows?.();
        this.disposePrimaryBenchmark?.();
        this.disposePrimarySelection?.();
        this.disposePrimarySelectionBatch?.();
        this.disposePrimaryVisibleRows = this.primaryGridApi.core.on.rowsVisibleChanged((rows) => {
          this.visibleRowCount.set(rows.length);
        });
        this.disposePrimaryBenchmark = this.primaryGridApi.core.on.benchmarkComplete((result) => {
          this.benchmarkResult.set(result as GridBenchmarkResult);
        });
        // Refresh the selected-rows stat on every selection change. Both
        // single and batch paths feed the same counter.
        const syncSelected = (): void => {
          if (this.primaryGridApi) {
            this.selectedRowCount.set(this.primaryGridApi.selection.getSelectedCount());
          }
        };
        this.disposePrimarySelection =
          this.primaryGridApi.selection.on.rowSelectionChanged(syncSelected);
        this.disposePrimarySelectionBatch =
          this.primaryGridApi.selection.on.rowSelectionChangedBatch(syncSelected);
      },
    } as GridOptions;
  }

  private injectSlotTemplate(element: HTMLElement, slotName: string, markup: string): void {
    let tmpl = element.querySelector<HTMLTemplateElement>(`template[slot="${slotName}"]`);
    if (tmpl) {
      tmpl.innerHTML = markup;
    } else {
      tmpl = document.createElement('template');
      tmpl.setAttribute('slot', slotName);
      tmpl.innerHTML = markup;
      element.appendChild(tmpl);
    }
  }

  private clearSlotTemplates(element: HTMLElement): void {
    element.querySelectorAll('template[slot]').forEach((t) => {
      t.remove();
    });
  }

  private injectPrimaryGridTemplates(): void {
    if (!isPlatformBrowser(this.platformId) || !this.primaryGridActive()) {
      return;
    }
    const el = this.primaryGridRef().nativeElement;
    this.injectSlotTemplate(el, 'cell-status', WebComponentsComponent.STATUS_PILL_TEMPLATE);
  }

  private injectDemoGridTemplates(): void {
    if (!isPlatformBrowser(this.platformId) || !this.demoGridActive()) {
      return;
    }
    const el = this.demoGridRef().nativeElement;
    this.clearSlotTemplates(el);
    this.disposeTemplatedDateChange?.();
    this.disposeTemplatedDateChange = null;
    const mode = this.mode();
    if (mode === 'expandable') {
      this.injectSlotTemplate(el, 'expandable-row', WebComponentsComponent.EXPANDABLE_ROW_TEMPLATE);
    } else if (mode === 'templated') {
      this.injectSlotTemplate(el, 'cell-status', WebComponentsComponent.STATUS_PILL_TEMPLATE);
      this.injectSlotTemplate(
        el,
        'cell-renewalDate',
        WebComponentsComponent.RENEWAL_DATE_TEMPLATE,
      );
      this.disposeTemplatedDateChange = this.bindTemplatedDateChange(el);
    } else if (mode === 'trading') {
      for (const [slotName, markup] of WebComponentsComponent.TRADING_TEMPLATES) {
        this.injectSlotTemplate(el, slotName, markup);
      }
    }
  }

  // The slot template path is interpolation-only, so the date-picker is
  // a real <input> with no event binding. Walk up to the body cell to
  // recover the row id, write the new value back into the row, then
  // re-publish via setData() so the grid re-renders.
  private bindTemplatedDateChange(el: WebComponentGridElement): () => void {
    const onChange = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== 'date') {
        return;
      }
      const cell = target.closest<HTMLElement>('.body-cell');
      if (!cell) return;
      const rowId = cell.getAttribute('data-row-id');
      const colName = cell.getAttribute('data-col-name');
      if (!rowId || colName !== 'renewalDate') return;
      const row = this.templatedRows.find((r) => String(r['id']) === rowId);
      if (!row) return;
      row['renewalDate'] = target.value;
      el.setData(this.templatedRows);
    };
    el.addEventListener('change', onChange);
    return () => el.removeEventListener('change', onChange);
  }

  private syncInfiniteLoop(): void {
    // Tear down any prior listener whenever the demo mode changes.
    this.disposeDemoInfinite?.();
    this.disposeDemoInfinite = null;
    this.demoGridApi = null;
    this.infiniteImperativeOptions = null;

    if (!isPlatformBrowser(this.platformId) || this.mode() !== 'infinite') {
      return;
    }

    // Reset the demo dataset whenever we enter the infinite scenario.
    this.infiniteRows = createInfiniteRows(0, this.INFINITE_PAGE_SIZE);
    this.infiniteScrollDataSignal.set(JSON.stringify(this.infiniteRows));

    const grid = this.demoGridRef().nativeElement;
    // The vanilla element accepts options imperatively — we use this only
    // to hook onRegisterApi for needLoadMoreData. All other config comes
    // from the attribute bindings in the template.
    this.infiniteImperativeOptions = {
      id: 'web-components-demo-infinite',
      columnDefs: [...this.infiniteScrollColumnDefs] as GridOptions['columnDefs'],
      data: this.infiniteRows,
      enableInfiniteScroll: true,
      infiniteScrollUp: false,
      infiniteScrollDown: true,
      infiniteScrollRowsFromEnd: 20,
      rowIdentity: (entity) => String((entity as { id: string }).id),
      onRegisterApi: (api) => {
        const gridApi = api as UiGridApi;
        // Controller re-registers this callback every setOptions pass — tear
        // down any prior subscription before wiring a fresh one so we don't
        // stack listeners.
        this.disposeDemoInfinite?.();
        this.demoGridApi = gridApi;
        this.disposeDemoInfinite = gridApi.infiniteScroll.on.needLoadMoreData(() => {
          this.handleInfiniteLoadMore(grid);
        });
      },
    };
    grid.options = this.infiniteImperativeOptions;
  }

  private handleInfiniteLoadMore(grid: WebComponentGridElement): void {
    if (!this.demoGridApi || !this.infiniteImperativeOptions) return;
    const api = this.demoGridApi;
    const imperativeOptions = this.infiniteImperativeOptions;
    // Simulated async load.
    window.setTimeout(() => {
      if (this.mode() !== 'infinite') return;
      const next = createInfiniteRows(this.infiniteRows.length, this.INFINITE_PAGE_SIZE);
      this.infiniteRows = this.infiniteRows.concat(next);
      // Mutate the stashed imperative options object in place so the
      // element's `activeOptions` ref sees the new data. Then re-assign
      // `grid.options` to trigger setOptions → refresh. Also sync the
      // signal so any attribute-driven re-parse reflects the same data.
      imperativeOptions.data = this.infiniteRows;
      this.infiniteScrollDataSignal.set(JSON.stringify(this.infiniteRows));
      grid.options = imperativeOptions;
      const hasMore = this.infiniteRows.length < this.INFINITE_MAX_ROWS;
      void api.infiniteScroll.dataLoaded(false, hasMore);
    }, 200);
  }
  private infiniteImperativeOptions: GridOptions | null = null;

  private syncTradingLoop(): void {
    if (this.tradingIntervalId !== null) {
      clearInterval(this.tradingIntervalId);
      this.tradingIntervalId = null;
    }

    if (!isPlatformBrowser(this.platformId) || this.mode() !== 'trading') {
      return;
    }

    const grid = this.demoGridRef().nativeElement;
    grid.setData(createTradingDisplayRows(this.tradingRows));
    this.tradingIntervalId = setInterval(() => {
      this.tradingRows = tickTradingRows(this.tradingRows, this.tradingRng, 6);
      grid.setData(createTradingDisplayRows(this.tradingRows));
    }, 8);
  }
}
