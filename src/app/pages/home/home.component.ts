import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FILTER_CONDITIONS,
  GridBenchmarkResult,
  GridCellTemplateContext,
  GridColumnDef,
  GridOptions,
  GridSavedState,
  UiGridApi,
  UiGridComponent,
} from '@ornery/ui-grid';
import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';
import { GridBrowserHarnessComponent } from '../../grid-browser-harness.component';
import { CodeBlockComponent } from '../shared/code-block.component';
import { createDemoData } from '../shared/demo-data';
import {
  createTradingRows,
  tickTradingRows,
  TradingLcg,
  type TradingRow,
} from '../shared/trading-data';

type AngularSurface = 'native' | 'element';
type AngularElementMode = 'expandable' | 'tree' | 'templated' | 'pinning' | 'trading';

type AngularGridElement = HTMLElement & {
  options: GridOptions;
  setPropertyOption(key: keyof GridOptions, value: unknown): void;
};

type DeclarativeGridConfig = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly emptyMessage: string;
  readonly rowHeight: number;
  readonly dataJson: string;
  readonly columnDefsJson: string;
  readonly groupingJson?: string;
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
  readonly virtualizationThreshold: number;
};

function createHarnessRows(count = 18): Record<string, unknown>[] {
  return Array.from({ length: count }, (_value, index) => ({
    id: `harness-row-${index + 1}`,
    name: `Harness Row ${index + 1}`,
    status: index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Pilot' : 'Expansion',
    revenue: 1200 + index * 75,
    renewalDate: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    account: { owner: `Owner ${index + 1}` },
  }));
}

function createTreeRows(): Record<string, unknown>[] {
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

function createPinningRows(): Record<string, unknown>[] {
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

function declarativeTradingDisplayRows(rows: TradingRow[]): Record<string, unknown>[] {
  return rows.map((row: TradingRow) => ({
    id: row.id,
    symbol: row.symbol,
    exchange: row.exchange,
    sector: row.sector,
    price: row.priceStr,
    bid: row.bidStr,
    ask: row.askStr,
    change: row.changeStr,
    changePct: row.changePctStr,
    high: row.high.toFixed(2),
    low: row.low.toFixed(2),
    volume: row.volume.toLocaleString('en-US'),
    lastSize: row.lastSize,
    priceColor: row.priceColor,
    changeColor: row.changeColor,
  }));
}

function createDeclarativeTradingRows(): Record<string, unknown>[] {
  return declarativeTradingDisplayRows(createTradingRows());
}

@Component({
  selector: 'app-page-home',
  imports: [UiGridComponent, GridBrowserHarnessComponent, RouterLink, CodeBlockComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomeComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly statusTemplate =
    viewChild<TemplateRef<GridCellTemplateContext>>('statusTemplate');
  private readonly priceColorTemplate =
    viewChild<TemplateRef<GridCellTemplateContext>>('priceColorTemplate');
  private readonly changeColorTemplate =
    viewChild<TemplateRef<GridCellTemplateContext>>('changeColorTemplate');
  private readonly scenarioGrid = viewChild<ElementRef<AngularGridElement>>('scenarioGrid');
  private savedGridState: GridSavedState | null = null;
  private readonly primaryData = createDemoData();
  private primaryElementDataJsonCache: string | null = null;
  private tradingElementRows: TradingRow[] = [];
  private readonly tradingElementRng = new TradingLcg(0xabcdef42);
  private tradingElementIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly tradingElementDataSignal = signal<string>(
    JSON.stringify(createDeclarativeTradingRows()),
  );
  protected readonly gridApi = signal<UiGridApi | null>(null);
  protected readonly surface = signal<AngularSurface>('native');
  protected readonly elementMode = signal<AngularElementMode>('expandable');
  protected readonly visibleRowCount = signal(0);
  protected readonly selectedRowCount = signal(0);
  protected readonly benchmarkResult = signal<GridBenchmarkResult | null>(null);
  protected readonly savedStateJson = signal('No saved state captured yet.');
  protected readonly totalRows = computed(() => this.primaryData.length);
  protected readonly groupColumnCount = computed(
    () => this.options().grouping?.groupBy?.length ?? 0,
  );
  protected readonly virtualizationLabel = computed(() =>
    this.options().enableVirtualization === false ? 'Off' : 'On',
  );
  protected readonly elementScenarios = [
    { label: 'Expandable', value: 'expandable' as const },
    { label: 'Tree', value: 'tree' as const },
    { label: 'Templated', value: 'templated' as const },
    { label: 'Pinning', value: 'pinning' as const },
    { label: 'Trading', value: 'trading' as const },
  ];
  protected readonly angularDemoSnippet = `import { Component, computed, signal } from '@angular/core';
import {
  FILTER_CONDITIONS,
  type GridOptions,
  type UiGridApi,
  UiGridComponent,
} from '@ornery/ui-grid';

@Component({
  selector: 'app-accounts-grid',
  imports: [UiGridComponent],
  template: '<app-ui-grid [options]="options()" />',
})
export class AccountsGridComponent {
  private readonly gridApi = signal<UiGridApi | null>(null);

  protected readonly options = computed<GridOptions>(() => ({
    id: 'ui-grid-modern',
    data: createDemoData(),
    rowHeight: 48,
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: true,
    enableColumnMoving: true,
    enableColumnResizing: true,
    enableVirtualization: true,
    enableCellEditOnFocus: true,
    virtualizationThreshold: 25,
    grouping: { groupBy: ['status'] },
    rowIdentity: (row) => String(row['id']),
    onRegisterApi: (api) => this.gridApi.set(api as UiGridApi),
    columnDefs: [
      { name: 'name', displayName: 'Customer', enableCellEdit: true },
      { name: 'company', enableCellEdit: true },
      {
        name: 'revenue',
        type: 'number',
        align: 'end',
        filter: { condition: FILTER_CONDITIONS.greaterThan },
      },
      { name: 'status', filter: { condition: FILTER_CONDITIONS.exact } },
      { name: 'renewalDate', type: 'date', displayName: 'Renewal' },
      { name: 'owner', field: 'account.owner', displayName: 'Account Owner' },
    ],
  }));
}`;
  protected readonly angularStateSnippet = `captureState(): void {
  const api = this.gridApi();
  if (!api) {
    return;
  }

  this.savedGridState = api.saveState.save();
}

restoreState(): void {
  if (!this.savedGridState) {
    return;
  }

  this.gridApi()?.saveState.restore(this.savedGridState);
}`;
  protected readonly angularElementSnippet = [
    `import { CUSTOM_ELEMENTS_SCHEMA, Component, computed } from '@angular/core';`,
    `import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';`,
    '',
    `@Component({`,
    `  selector: 'app-accounts-grid-element-demo',`,
    `  schemas: [CUSTOM_ELEMENTS_SCHEMA],`,
    `  template: \``,
    `<ui-grid-element`,
    `  grid-id="ui-grid-modern-element"`,
    `  title="UI Grid Modernized (Vanilla Web Component)"`,
    `  enable-sorting`,
    `  enable-filtering`,
    `  enable-grouping`,
    `  enable-column-moving`,
    `  enable-column-resizing`,
    `  enable-virtualization`,
    `  enable-cell-edit-on-focus`,
    `  row-height="48"`,
    `  virtualization-threshold="25"`,
    `  [attr.grouping]="groupingJson()"`,
    `  [attr.column-defs]="columnDefsJson()"`,
    `  [attr.data]="dataJson()">`,
    `</ui-grid-element>\`,`,
    `})`,
    `export class AccountsGridElementDemoComponent {`,
    `  readonly groupingJson = computed(() => JSON.stringify({ groupBy: ['status'] }));`,
    `  readonly columnDefsJson = computed(() => JSON.stringify(columnDefs));`,
    `  readonly dataJson = computed(() => JSON.stringify(createDemoData()));`,
    '',
    `  constructor() {`,
    `    void defineStandaloneUiGridElement();`,
    `  }`,
    `}`,
  ].join('\n');
  protected readonly angularElementDifferenceSnippet = `This tab uses the vanilla web component from @ornery/ui-grid-vanilla.

- Framework-free rendering via the vanilla <ui-grid-element>
- Declarative attributes for markup-first setup
- Same element used on the /web-components page`;
  protected readonly options = computed<GridOptions>(() => ({
    id: 'ui-grid-modern',
    title: 'UI Grid Modernized',
    emptyMessage: 'No rows match the current filters.',
    rowHeight: 48,
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: true,
    enableColumnMoving: true,
    enableColumnResizing: true,
    enableVirtualization: true,
    enableCellEditOnFocus: true,
    enableRowSelection: true,
    enableFullRowSelection: true,
    virtualizationThreshold: 25,
    grouping: {
      groupBy: ['status'],
    },
    benchmark: {
      iterations: 40,
    },
    rowIdentity: (row) => String(row['id']),
    onRegisterApi: (api) => this.gridApi.set(api as UiGridApi),
    columnDefs: [
      {
        name: 'name',
        displayName: 'Customer',
        width: 'minmax(14rem, 1.2fr)',
        enableCellEdit: true,
      },
      { name: 'company', width: 'minmax(12rem, 1fr)', enableCellEdit: true },
      {
        name: 'revenue',
        type: 'number',
        align: 'end',
        width: 'minmax(10rem, 0.7fr)',
        filter: { condition: FILTER_CONDITIONS.greaterThan },
        formatter: (value) =>
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
          }).format(Number(value ?? 0)),
      },
      {
        name: 'status',
        width: 'minmax(8rem, 0.7fr)',
        filter: { condition: FILTER_CONDITIONS.exact },
        cellTemplate: this.statusTemplate() ?? undefined,
      },
      {
        name: 'renewalDate',
        type: 'date',
        displayName: 'Renewal',
        width: 'minmax(11rem, 0.8fr)',
        formatter: (value) => new Date(String(value)).toLocaleDateString('en-US'),
      },
      {
        name: 'owner',
        field: 'account.owner',
        displayName: 'Account Owner',
        width: 'minmax(11rem, 0.8fr)',
        enableCellEdit: true,
      },
    ],
    data: this.primaryData,
  }));

  protected readonly elementPrimaryConfig = computed<DeclarativeGridConfig>(() => ({
    id: 'ui-grid-modern-element',
    title: 'UI Grid Modernized (Angular Element)',
    description:
      'The vanilla web component from @ornery/ui-grid-vanilla configured with declarative HTML attributes.',
    emptyMessage: 'No rows match the current filters.',
    rowHeight: 48,
    dataJson: this.elementPrimaryDataJson(),
    columnDefsJson: JSON.stringify([
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
    ]),
    groupingJson: JSON.stringify({ groupBy: ['status'] }),
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
    virtualizationThreshold: 25,
  }));

  protected readonly elementScenarioConfig = computed<DeclarativeGridConfig>(() => {
    const base = {
      emptyMessage: 'No rows match the current filters.',
      rowHeight: 46,
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
      virtualizationThreshold: 1,
    } as const;

    switch (this.elementMode()) {
      case 'tree':
        return {
          ...base,
          id: 'angular-element-demo-tree',
          title: 'Browser Harness: Tree',
          description:
            'Tree rows rendered through the Angular-backed custom element attribute surface.',
          dataJson: JSON.stringify(createTreeRows()),
          columnDefsJson: JSON.stringify([
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
          ]),
          treeChildrenField: 'children',
          treeIndent: 16,
          enableTreeView: true,
        };
      case 'templated':
        return {
          ...base,
          id: 'angular-element-demo-templated',
          title: 'Browser Harness: Templated',
          description:
            'The same templated scenario dataset, rendered as declarative element markup using plain-text cells.',
          dataJson: JSON.stringify(createHarnessRows()),
          columnDefsJson: JSON.stringify([
            { name: 'name', displayName: 'Customer', width: 'minmax(13rem, 1.1fr)' },
            {
              name: 'status',
              width: 'minmax(9rem, 0.7fr)',
              filter: { condition: FILTER_CONDITIONS.exact },
            },
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
          ]),
        };
      case 'pinning':
        return {
          ...base,
          id: 'angular-element-demo-pinning',
          title: 'Browser Harness: Pinning',
          description: 'Pinned columns rendered through the Angular-backed custom element.',
          dataJson: JSON.stringify(createPinningRows()),
          columnDefsJson: JSON.stringify([
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
          ]),
          enablePinning: true,
        };
      case 'trading':
        return {
          ...base,
          id: 'angular-element-demo-trading',
          title: 'Browser Harness: Trading Terminal',
          description:
            'Trading rows rendered declaratively through the Angular-backed custom element.',
          emptyMessage: 'No data',
          rowHeight: 40,
          dataJson: this.tradingElementDataSignal(),
          columnDefsJson: JSON.stringify([
            { name: 'symbol', displayName: 'Symbol', width: '100px' },
            { name: 'exchange', displayName: 'Exch', width: '80px' },
            { name: 'sector', displayName: 'Sector', width: '120px' },
            { name: 'price', displayName: 'Price', width: '110px', align: 'end' },
            { name: 'bid', displayName: 'Bid', width: '100px', align: 'end' },
            { name: 'ask', displayName: 'Ask', width: '100px', align: 'end' },
            { name: 'change', displayName: 'Chg', width: '100px', align: 'end' },
            { name: 'changePct', displayName: 'Chg %', width: '90px', align: 'end' },
            { name: 'high', displayName: 'High', width: '100px', align: 'end' },
            { name: 'low', displayName: 'Low', width: '100px', align: 'end' },
            { name: 'volume', displayName: 'Volume', width: '90px', align: 'end' },
            { name: 'lastSize', displayName: 'Last Sz', width: '80px', align: 'end' },
          ]),
          enableFiltering: false,
        };
      default:
        return {
          ...base,
          id: 'angular-element-demo-expandable',
          title: 'Browser Harness: Expandable',
          description: 'Expandable rows rendered through the Angular-backed custom element.',
          dataJson: JSON.stringify(createHarnessRows()),
          columnDefsJson: JSON.stringify([
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
          ]),
          enableExpandable: true,
          expandableRowHeight: 112,
        };
    }
  });

  constructor() {
    afterNextRender(async () => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      // Both the Angular wrapper and the web-components page use the same
      // vanilla element, so share the single 'ui-grid-element' registration.
      await defineStandaloneUiGridElement('ui-grid-element');
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.tradingElementIntervalId !== null) {
        clearInterval(this.tradingElementIntervalId);
        this.tradingElementIntervalId = null;
      }
    });

    effect((onCleanup) => {
      const api = this.gridApi();
      if (!api) {
        this.visibleRowCount.set(0);
        this.selectedRowCount.set(0);
        return;
      }

      this.visibleRowCount.set(api.core.getVisibleRows().length);
      this.selectedRowCount.set(api.selection.getSelectedCount());
      const unsubscribeVisibleRows = api.core.on.rowsVisibleChanged((rows) => {
        this.visibleRowCount.set(rows.length);
      });
      const unsubscribeBenchmark = api.core.on.benchmarkComplete((result) => {
        this.benchmarkResult.set(result as GridBenchmarkResult);
      });
      const syncSelected = (): void => {
        this.selectedRowCount.set(api.selection.getSelectedCount());
      };
      const unsubscribeSelection = api.selection.on.rowSelectionChanged(syncSelected);
      const unsubscribeSelectionBatch = api.selection.on.rowSelectionChangedBatch(syncSelected);

      onCleanup(() => {
        unsubscribeVisibleRows();
        unsubscribeBenchmark();
        unsubscribeSelection();
        unsubscribeSelectionBatch();
      });
    });
  }

  protected setSurface(surface: AngularSurface): void {
    this.surface.set(surface);
  }

  protected setElementMode(mode: AngularElementMode): void {
    if (this.tradingElementIntervalId !== null) {
      clearInterval(this.tradingElementIntervalId);
      this.tradingElementIntervalId = null;
    }

    this.elementMode.set(mode);
    this.applyTradingColumnDefs(mode);

    if (mode === 'trading') {
      this.tradingElementRows = createTradingRows();
      this.tradingElementDataSignal.set(
        JSON.stringify(declarativeTradingDisplayRows(this.tradingElementRows)),
      );
      this.tradingElementIntervalId = setInterval(() => {
        this.tradingElementRows = tickTradingRows(
          this.tradingElementRows,
          this.tradingElementRng,
          6,
        );
        this.tradingElementDataSignal.set(
          JSON.stringify(declarativeTradingDisplayRows(this.tradingElementRows)),
        );
      }, 10);
    }
  }

  private applyTradingColumnDefs(mode: AngularElementMode): void {
    const element = this.scenarioGrid()?.nativeElement;
    if (!element) {
      return;
    }

    if (mode !== 'trading') {
      element.options = {} as unknown as GridOptions;
      return;
    }

    const priceTemplate = this.priceColorTemplate() ?? undefined;
    const changeTemplate = this.changeColorTemplate() ?? undefined;
    const colDefs: GridColumnDef[] = [
      { name: 'symbol', displayName: 'Symbol', width: '100px' },
      { name: 'exchange', displayName: 'Exch', width: '80px' },
      { name: 'sector', displayName: 'Sector', width: '120px' },
      {
        name: 'price',
        displayName: 'Price',
        width: '110px',
        align: 'end',
        cellTemplate: priceTemplate,
      },
      {
        name: 'bid',
        displayName: 'Bid',
        width: '100px',
        align: 'end',
        cellTemplate: priceTemplate,
      },
      {
        name: 'ask',
        displayName: 'Ask',
        width: '100px',
        align: 'end',
        cellTemplate: priceTemplate,
      },
      {
        name: 'change',
        displayName: 'Chg',
        width: '100px',
        align: 'end',
        cellTemplate: changeTemplate,
      },
      {
        name: 'changePct',
        displayName: 'Chg %',
        width: '90px',
        align: 'end',
        cellTemplate: changeTemplate,
      },
      { name: 'high', displayName: 'High', width: '100px', align: 'end' },
      { name: 'low', displayName: 'Low', width: '100px', align: 'end' },
      { name: 'volume', displayName: 'Volume', width: '90px', align: 'end' },
      { name: 'lastSize', displayName: 'Last Sz', width: '80px', align: 'end' },
    ];
    element.options = { columnDefs: colDefs } as unknown as GridOptions;
  }

  protected runBenchmark(): void {
    this.gridApi()?.core.benchmark();
  }

  protected exportCsv(): void {
    this.gridApi()?.core.exportCsv();
  }

  protected captureState(): void {
    const api = this.gridApi();
    if (!api) {
      return;
    }

    this.savedGridState = api.saveState.save();
    this.savedStateJson.set(JSON.stringify(this.savedGridState, null, 2));
  }

  protected restoreState(): void {
    if (!this.savedGridState) {
      return;
    }

    this.gridApi()?.saveState.restore(this.savedGridState);
  }

  private elementPrimaryDataJson(): string {
    if (this.primaryElementDataJsonCache === null) {
      this.primaryElementDataJsonCache = JSON.stringify(this.primaryData);
    }

    return this.primaryElementDataJsonCache;
  }
}
