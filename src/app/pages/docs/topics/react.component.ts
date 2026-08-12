import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FILTER_CONDITIONS,
  GridBenchmarkResult,
  GridCellTemplateContext,
  GridOptions,
  GridRecord,
  GridSavedState,
  UiGridApi,
} from '@ornery/ui-grid';
import { mountUiGrid, styledCell, datePickerCell, updateUiGrid } from '@ornery/ui-grid-react';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createDemoData } from '../../shared/demo-data';
import {
  TradingLcg,
  TradingRow,
  createTradingRows,
  fmtChange,
  fmtChangePct,
  fmtPrice,
  tickTradingRows,
  tradingColumnDefs,
} from '../../shared/trading-data';

type ReactRoot = ReturnType<typeof mountUiGrid>;

type DemoMode =
  | 'expandable'
  | 'tree'
  | 'templated'
  | 'pinning'
  | 'pagination'
  | 'infinite'
  | 'trading';

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

@Component({
  selector: 'app-docs-react',
  imports: [RouterLink, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="react-page-shell">
      <header class="page-hero">
        <div class="page-copy">
          <p class="eyebrow">Root Demo App</p>
          <h1>React Wrapper</h1>
          <p class="page-summary">
            The React wrapper (<code>&#64;ornery/ui-grid-react</code>) mounts the vanilla
            <code>&lt;ui-grid-element&gt;</code> and projects React render functions into it via a
            slot-based portal system. Same primary surface as Angular, plus the aligned harness
            scenarios.
          </p>
          <p class="page-links">
            <a routerLink="/home" class="demo-link">Angular Demo</a>
            <a routerLink="/web-components" class="demo-link demo-link-secondary">Web Components</a>
            <a routerLink="/rust" class="demo-link demo-link-secondary">Rust</a>
            <a routerLink="/docs" class="demo-link demo-link-secondary">Docs</a>
          </p>
        </div>
        <div class="page-actions">
          <button type="button" class="demo-button" (click)="captureState()">Capture State</button>
          <button type="button" class="demo-button demo-button-secondary" (click)="restoreState()">
            Restore State
          </button>
          <button type="button" class="demo-button demo-button-secondary" (click)="resetDemo()">
            Reset Demo
          </button>
        </div>
      </header>

      <section class="demo-panel">
        <header class="panel-header">
          <div>
            <h2>100K Rows Demo</h2>
            <p>
              Same primary dataset and options as Angular home: sorting, filtering, grouping, column
              moving, virtualization, and inline editing.
            </p>
          </div>
        </header>
        <section class="react-primary-shell">
          <header class="react-primary-shell__header">
            <div>
              <p class="react-primary-shell__eyebrow">React package demo</p>
              <h3>{{ primaryOptions().title ?? 'UI Grid' }}</h3>
              <p>
                Familiar <code>gridOptions</code> and <code>onRegisterApi</code>, rebuilt with React
                hooks, virtualization, grouping, sorting, filtering, and column ordering.
              </p>
            </div>
            <div class="react-primary-shell__actions">
              <button type="button" class="demo-button" (click)="runBenchmark()">Benchmark</button>
              <button type="button" class="demo-button demo-button-secondary" (click)="exportCsv()">
                Export CSV
              </button>
              <div class="react-primary-shell__stats">
                <span>{{ visibleRowCount() }}</span>
                <small>visible rows</small>
              </div>
            </div>
          </header>

          <section class="react-primary-shell__metrics" aria-label="React grid metrics">
            <article>
              <strong>{{ primaryOptions().enableVirtualization === false ? 'Off' : 'On' }}</strong>
              <span>virtualization</span>
            </article>
            <article>
              <strong>{{ primaryOptions().grouping?.groupBy?.length ?? 0 }}</strong>
              <span>group columns</span>
            </article>
            <article>
              <strong>{{ benchmarkResult()?.averageMs?.toFixed(2) || '—' }}</strong>
              <span>benchmark avg</span>
            </article>
          </section>

          <div class="react-primary-shell__toolbar">
            <div>
              <strong>{{ visibleRowCount() }}</strong>
              <span>of {{ totalRows() }} rows</span>
            </div>
            <p>
              <code>gridOptions</code> compatibility layer: sorting, filtering, grouping, column
              moving, templating, and virtualized rendering.
            </p>
          </div>

          <div class="react-demo-frame">
            <div #primaryReactDemoHost class="react-demo-host react-demo-host-primary"></div>
          </div>
        </section>
      </section>

      <section class="demo-panel state-panel">
        <div>
          <h2>Saved State</h2>
          <p>
            Use the shared API: <code>gridApi.saveState.save()</code> and
            <code>gridApi.saveState.restore(...)</code>.
          </p>
        </div>
        <pre>{{ savedStateJson() }}</pre>
      </section>

      <section class="demo-panel usage-panel">
        <header class="panel-header">
          <div>
            <h2>React Demo Code</h2>
            <p>
              These snippets match the live React wrapper demos on this page: the 100K primary grid
              and the pinning harness.
            </p>
          </div>
        </header>
        <div class="code-grid">
          <app-code-block lang="tsx" [code]="reactPrimarySnippet" />
          <app-code-block lang="tsx" [code]="reactPinningSnippet" />
        </div>
      </section>

      <section class="demo-panel usage-panel">
        <header class="panel-header">
          <div>
            <h2>Cell Renderers</h2>
            <p>
              Pass a <code>cellRenderers</code> map to <code>mountUiGrid</code> /
              <code>updateUiGrid</code> for custom cell rendering. Each key is a column name, each
              value receives a typed context object.
            </p>
          </div>
        </header>
        <div class="code-grid">
          <app-code-block lang="tsx" [code]="reactCellRendererSnippet" />
          <app-code-block lang="tsx" [code]="reactExpandableRendererSnippet" />
        </div>
      </section>

      <section class="demo-panel">
        <header class="panel-header">
          <div>
            <h2>Scenario Harness</h2>
            <p>
              Same scenarios as Angular: expandable, tree, templated, pinning, pagination, infinite
              scroll, and trading.
            </p>
          </div>
        </header>
        <div class="scenario-switch" role="tablist" aria-label="React demo scenarios">
          @for (scenario of scenarios; track scenario.value) {
            <button
              type="button"
              class="scenario-button"
              [class.scenario-button-active]="mode() === scenario.value"
              [attr.aria-selected]="mode() === scenario.value"
              (click)="setMode(scenario.value)"
            >
              {{ scenario.label }}
            </button>
          }
        </div>
        <div class="react-demo-frame">
          <div #reactDemoHost class="react-demo-host"></div>
        </div>
        @if (demoError(); as error) {
          <p class="react-demo-error">{{ error }}</p>
        }
      </section>
    </main>
  `,
  styles: `
    .react-page-shell {
      min-height: 100vh;
      width: min(1380px, calc(100% - 2rem));
      margin: 0 auto;
      padding: clamp(1rem, 2vw, 2rem);
      display: grid;
      gap: 1.25rem;
    }

    .page-hero,
    .demo-panel {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--card-border);
      border-radius: var(--theme-radius);
      background: var(--panel-surface);
      box-shadow: var(--card-shadow);
      backdrop-filter: var(--theme-card-filter);
    }

    .page-hero {
      padding: clamp(1rem, 1.5vw, 1.75rem);
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: end;
      background:
        radial-gradient(
          circle at top right,
          color-mix(in srgb, var(--teal-strong) 18%, transparent),
          transparent 30%
        ),
        linear-gradient(145deg, var(--panel-surface-strong), var(--panel-surface-alt));
    }

    .page-copy {
      display: grid;
      gap: 0.6rem;
      max-width: 60rem;
    }

    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.76rem;
      font-weight: 800;
      color: var(--teal-strong);
    }

    .page-copy h1,
    .panel-header h2 {
      margin: 0;
      color: var(--ink-strong);
    }

    .page-summary,
    .panel-header p,
    .state-panel p {
      margin: 0;
      line-height: 1.6;
      color: color-mix(in srgb, var(--ink-strong) 74%, var(--teal-strong) 26%);
    }

    .page-links,
    .page-actions,
    .scenario-switch {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .demo-link,
    .demo-button,
    .scenario-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--theme-switch-radius);
      padding: 0.6rem 1rem;
      font: inherit;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
      transition:
        filter 160ms ease,
        box-shadow 160ms ease;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--teal-strong) 85%, black),
        color-mix(in srgb, var(--teal-strong) 65%, black)
      );
      color: #051017;
      border: 1px solid color-mix(in srgb, var(--teal-strong) 40%, transparent);
      box-shadow: 0 12px 24px rgba(8, 39, 61, 0.18);
    }

    // \`transform\` on hover promotes the button to its own compositing
    // layer, which makes the grid's sticky filter strip flicker as
    // Chromium repaints the surrounding stacking context. Use
    // \`filter: brightness\` for the same visual feedback without
    // forcing a new compositor layer.
    .demo-link:hover,
    .demo-button:hover,
    .scenario-button:hover {
      filter: brightness(1.06);
    }

    .demo-link-secondary,
    .demo-button-secondary,
    .scenario-button-active {
      background: color-mix(in srgb, var(--teal-strong) 14%, var(--panel-surface-strong));
      color: var(--teal-strong);
      border: 1px solid color-mix(in srgb, var(--teal-strong) 25%, transparent);
      box-shadow: none;
    }

    .demo-panel {
      padding: clamp(0.85rem, 1.5vw, 1.25rem);
      display: grid;
      gap: 1rem;
    }

    .panel-header,
    .state-panel {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: start;
    }

    .state-panel pre {
      margin: 0;
      padding: 1rem;
      border-radius: calc(var(--theme-radius) - 6px);
      border: 1px solid color-mix(in srgb, var(--ink-strong) 14%, transparent);
      background: color-mix(in srgb, var(--panel-surface-strong) 82%, black 18%);
      color: var(--ink-strong);
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      white-space: pre;
      word-break: normal;
      overflow-wrap: normal;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }

    /* overflow: visible on both axes. Setting only overflow-x: auto causes
       browsers to coerce overflow-y: visible into overflow-y: auto (per the
       spec), which produced an extra vertical scrollbar on the frame in
       addition to the grid's own body-viewport scrollbar — visible in
       Chrome/Firefox on Linux. Horizontal overflow is owned by the grid's
       body viewport internally, so the outer frame doesn't need its own
       scroll axis. */
    .react-demo-frame {
      border: 1px solid color-mix(in srgb, var(--teal-strong) 24%, var(--card-border));
      border-radius: calc(var(--theme-radius) - 6px);
      padding: clamp(0.5rem, 1.2vw, 0.9rem);
      background: color-mix(in srgb, var(--panel-surface-strong) 86%, transparent);
      width: 100%;
      overflow: visible;
    }

    .react-primary-shell {
      display: grid;
      gap: 1rem;
    }

    .react-primary-shell__header {
      display: grid;
      gap: 1rem;
    }

    .react-primary-shell__header h3,
    .react-primary-shell__header p,
    .react-primary-shell__toolbar p {
      margin: 0;
    }

    .react-primary-shell__eyebrow {
      margin: 0 0 0.35rem;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--teal-strong);
    }

    .react-primary-shell__header p,
    .react-primary-shell__metrics span,
    .react-primary-shell__toolbar p,
    .react-primary-shell__stats small {
      color: color-mix(in srgb, var(--ink-strong) 74%, var(--teal-strong) 26%);
    }

    .react-primary-shell__actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .react-primary-shell__stats {
      display: inline-grid;
      min-width: 7rem;
      padding: 0.8rem 1rem;
      border-radius: calc(var(--theme-radius) - 6px);
      border: 1px solid color-mix(in srgb, var(--ink-strong) 12%, transparent);
      background: color-mix(in srgb, var(--panel-surface-strong) 82%, white);
    }

    .react-primary-shell__stats span {
      font-size: 1.8rem;
      font-weight: 800;
      line-height: 1;
    }

    .react-primary-shell__metrics {
      display: grid;
      gap: 0.85rem;
      grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    }

    .react-primary-shell__metrics article {
      display: grid;
      gap: 0.2rem;
      padding: 0.9rem 1rem;
      border-radius: calc(var(--theme-radius) - 6px);
      border: 1px solid color-mix(in srgb, var(--ink-strong) 12%, transparent);
      background: color-mix(in srgb, var(--panel-surface-strong) 84%, white);
    }

    .react-primary-shell__metrics strong {
      font-size: 1.45rem;
      line-height: 1.1;
    }

    .react-primary-shell__toolbar {
      display: grid;
      gap: 0.5rem;
      padding: 0.9rem 1rem;
      border-radius: calc(var(--theme-radius) - 6px);
      border: 1px solid color-mix(in srgb, var(--ink-strong) 12%, transparent);
      background: color-mix(in srgb, var(--panel-surface-strong) 88%, white);
    }

    .react-primary-shell__toolbar strong {
      margin-right: 0.4rem;
    }

    /* Match the vanilla harness sizing: 620px scenario host, taller primary
       demo. Keeping the heights inline with the other framework demos keeps
       visual parity across the docs Angular / React / Web Component pages. */
    .react-demo-host {
      height: 620px;
    }

    .react-demo-host-primary {
      height: 54rem;
    }

    .react-demo-error {
      margin: 0;
      color: color-mix(in srgb, #dc2626 74%, var(--ink-strong));
      font-weight: 700;
    }

    .code-grid {
      display: grid;
      gap: 1rem;
      min-width: 0;
    }

    @media (max-width: 960px) {
      .react-page-shell {
        width: min(100%, calc(100% - 1rem));
        padding: 0.5rem;
      }

      .page-hero,
      .panel-header,
      .state-panel {
        display: grid;
      }

      .state-panel pre {
        font-size: 0.75rem;
        line-height: 1.5;
      }
    }
  `,
})
export class DocsReactComponent {
  @ViewChild('primaryReactDemoHost', { static: true })
  private readonly primaryReactDemoHost?: ElementRef<HTMLElement>;
  @ViewChild('reactDemoHost', { static: true })
  private readonly reactDemoHost?: ElementRef<HTMLElement>;

  private readonly destroyRef = inject(DestroyRef);
  private primaryReactRoot: ReactRoot | null = null;
  private harnessReactRoot: ReactRoot | null = null;
  private primaryGridApi: UiGridApi | null = null;
  private disposePrimaryVisibleRows: (() => void) | null = null;
  private disposePrimaryBenchmark: (() => void) | null = null;
  private savedGridState: GridSavedState | null = null;
  private readonly primaryData = createDemoData();
  private tradingRows: TradingRow[] = createTradingRows();
  private readonly tradingRng = new TradingLcg(0xabcdef12);
  private tradingIntervalId: ReturnType<typeof setInterval> | null = null;
  private readonly INFINITE_PAGE_SIZE = 60;
  private readonly INFINITE_MAX_ROWS = 2000;
  private infiniteRows: GridRecord[] = createInfiniteRows(0, 60);
  private harnessGridApi: UiGridApi | null = null;
  private disposeInfiniteScroll: (() => void) | null = null;

  protected readonly mode = signal<DemoMode>('expandable');
  protected readonly demoError = signal<string | null>(null);
  protected readonly visibleRowCount = signal(0);
  protected readonly benchmarkResult = signal<GridBenchmarkResult | null>(null);
  protected readonly savedStateJson = signal('No saved state captured yet.');
  protected readonly totalRows = signal(this.primaryData.length);
  protected readonly reactPrimarySnippet = `import { UiGrid } from '@ornery/ui-grid-react';
import { FILTER_CONDITIONS, type GridOptions } from '@ornery/ui-grid-core';

const options: GridOptions = {
  id: 'ui-grid-modern-react',
  data: createDemoData(),
  rowHeight: 48,
  enableSorting: true,
  enableFiltering: true,
  enableGrouping: true,
  enableColumnMoving: true,
  enableVirtualization: true,
  enableCellEditOnFocus: true,
  virtualizationThreshold: 25,
  grouping: { groupBy: ['status'] },
  rowIdentity: (row) => String(row['id']),
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
};

export function AccountsGrid() {
  return <UiGrid options={options} className="react-docs-demo-grid" />;
}`;
  protected readonly reactPinningSnippet = `const pinningOptions: GridOptions = {
  id: 'react-demo-pinning',
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
};`;
  protected readonly reactCellRendererSnippet = `import { mountUiGrid, styledCell } from '@ornery/ui-grid-react';
import type { GridCellTemplateContext } from '@ornery/ui-grid-core';

// cellRenderers is a map of column name → render function.
// Each function receives GridCellTemplateContext and returns a ReactNode.
//
// GridCellTemplateContext shape:
//   $implicit / value  — raw cell value (unknown)
//   row                — full row data record (GridRecord)
//   column             — GridColumnDef descriptor for this cell
//   rowIndex           — 0-based visible row index

mountUiGrid(host, {
  options,
  cellRenderers: {
    status: ({ value }: GridCellTemplateContext) => {
      const cls = String(value).toLowerCase();
      return styledCell(String(value), 'inherit', {
        borderRadius: '999px',
        padding: '0.2rem 0.55rem',
        background: \`var(--pill-bg-\${cls})\`,
      });
    },
    price: ({ value, row }: GridCellTemplateContext) =>
      styledCell(String(value), String(row['priceColor'])),
  },
});`;

  protected readonly reactExpandableRendererSnippet = `import { mountUiGrid } from '@ornery/ui-grid-react';
import type { GridOptions } from '@ornery/ui-grid-core';

// Expandable rows are configured via grid options.
// The vanilla element handles expand/collapse rendering.

const options: GridOptions = {
  // ...
  enableExpandable: true,
  expandableRowHeight: 112,
};

mountUiGrid(host, { options });`;

  protected readonly scenarios = [
    { label: 'Expandable', value: 'expandable' as const },
    { label: 'Tree', value: 'tree' as const },
    { label: 'Templated', value: 'templated' as const },
    { label: 'Pinning', value: 'pinning' as const },
    { label: 'Pagination', value: 'pagination' as const },
    { label: 'Infinite', value: 'infinite' as const },
    { label: 'Trading', value: 'trading' as const },
  ];

  constructor() {
    afterNextRender(() => {
      void this.mountPrimaryDemo();
      void this.mountReactDemo();
    });

    this.destroyRef.onDestroy(() => {
      this.primaryReactRoot?.unmount();
      this.harnessReactRoot?.unmount();
      this.primaryReactRoot = null;
      this.harnessReactRoot = null;
      this.disposePrimaryVisibleRows?.();
      this.disposePrimaryBenchmark?.();
      this.disposePrimaryVisibleRows = null;
      this.disposePrimaryBenchmark = null;
      this.primaryGridApi = null;
      this.disposeInfiniteScroll?.();
      this.disposeInfiniteScroll = null;
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

    if (mode !== 'trading' && this.tradingIntervalId !== null) {
      clearInterval(this.tradingIntervalId);
      this.tradingIntervalId = null;
    }

    if (mode !== 'infinite') {
      this.disposeInfiniteScroll?.();
      this.disposeInfiniteScroll = null;
    }

    if (mode === 'infinite') {
      this.infiniteRows = createInfiniteRows(0, this.INFINITE_PAGE_SIZE);
    }

    this.mode.set(mode);
    void this.mountReactDemo();
  }

  protected captureState(): void {
    if (!this.primaryGridApi) {
      return;
    }

    this.savedGridState = this.primaryGridApi.saveState.save();
    this.savedStateJson.set(JSON.stringify(this.savedGridState, null, 2));
  }

  protected restoreState(): void {
    if (!this.savedGridState || !this.primaryGridApi) {
      return;
    }

    this.primaryGridApi.saveState.restore(this.savedGridState);
  }

  protected resetDemo(): void {
    this.savedGridState = null;
    this.visibleRowCount.set(0);
    this.benchmarkResult.set(null);
    this.savedStateJson.set('No saved state captured yet.');
    void this.mountPrimaryDemo();
    void this.mountReactDemo();
  }

  protected runBenchmark(): void {
    this.primaryGridApi?.core.benchmark();
  }

  protected exportCsv(): void {
    this.primaryGridApi?.core.exportCsv();
  }

  private async mountPrimaryDemo(): Promise<void> {
    const host = this.primaryReactDemoHost?.nativeElement;
    if (!host) {
      return;
    }

    this.primaryReactRoot?.unmount();
    this.primaryReactRoot = null;
    this.disposePrimaryVisibleRows?.();
    this.disposePrimaryBenchmark?.();
    this.disposePrimaryVisibleRows = null;
    this.disposePrimaryBenchmark = null;
    this.primaryGridApi = null;
    this.visibleRowCount.set(0);
    this.benchmarkResult.set(null);

    try {
      this.primaryReactRoot = mountUiGrid(host, {
        options: this.primaryOptions(),
        className: 'react-docs-demo-grid react-docs-demo-grid-primary',
        cellRenderers: { status: this.statusCellRenderer },
        onRegisterApi: (api: UiGridApi) => {
          this.primaryGridApi = api;
          this.visibleRowCount.set(api.core.getVisibleRows().length);
          this.disposePrimaryVisibleRows = api.core.on.rowsVisibleChanged((rows) => {
            this.visibleRowCount.set(rows.length);
          });
          this.disposePrimaryBenchmark = api.core.on.benchmarkComplete((result) => {
            this.benchmarkResult.set(result as GridBenchmarkResult);
          });
        },
      });
      this.demoError.set(null);
    } catch (error) {
      this.demoError.set(error instanceof Error ? error.message : String(error));
    }
  }

  private async mountReactDemo(): Promise<void> {
    const host = this.reactDemoHost?.nativeElement;
    if (!host) {
      return;
    }

    this.harnessReactRoot?.unmount();
    this.harnessReactRoot = null;

    try {
      const mode = this.mode();

      if (mode === 'trading') {
        this.tradingRows = createTradingRows();
        const cellRenderers = this.makeTradingCellRenderers();
        this.harnessReactRoot = mountUiGrid(host, {
          options: this.tradingOptions(),
          className: 'react-docs-demo-grid',
          cellRenderers,
        });
        if (this.tradingIntervalId === null) {
          this.tradingIntervalId = setInterval(() => {
            if (!this.harnessReactRoot || this.mode() !== 'trading') return;
            this.tradingRows = tickTradingRows(this.tradingRows, this.tradingRng, 6);
            updateUiGrid(this.harnessReactRoot, {
              options: this.tradingOptions(),
              className: 'react-docs-demo-grid',
              cellRenderers,
            });
          }, 10);
        }
        this.demoError.set(null);
        return;
      }

      const props: Parameters<typeof mountUiGrid>[1] = {
        options: this.optionsForMode(mode),
        className: 'react-docs-demo-grid',
      };

      if (mode !== 'infinite') {
        props.cellRenderers = { status: this.statusCellRenderer };
      }

      if (mode === 'templated') {
        props.cellRenderers = {
          ...props.cellRenderers,
          renewalDate: (context: GridCellTemplateContext) =>
            datePickerCell(String(context.value ?? ''), (newValue) => {
              context.row['renewalDate'] = newValue;
            }),
        };
      }

      if (mode === 'infinite') {
        props.onRegisterApi = (api: UiGridApi) => {
          this.harnessGridApi = api;
          this.setupInfiniteScroll(api);
        };
      }

      this.harnessReactRoot = mountUiGrid(host, props);
      this.demoError.set(null);
    } catch (error) {
      this.demoError.set(error instanceof Error ? error.message : String(error));
    }
  }

  private makeTradingCellRenderers(): NonNullable<
    Parameters<typeof mountUiGrid>[1]['cellRenderers']
  > {
    const priceRenderer = (context: GridCellTemplateContext) => {
      const row = context.row as TradingRow;
      const name = context.column.name as 'price' | 'bid' | 'ask';
      const preFormatted =
        name === 'price' ? row['priceStr'] : name === 'bid' ? row['bidStr'] : row['askStr'];
      return styledCell(
        String(preFormatted ?? fmtPrice(context.value)),
        String(row['priceColor'] ?? 'inherit'),
      );
    };
    return {
      price: priceRenderer,
      bid: priceRenderer,
      ask: priceRenderer,
      change: (context: GridCellTemplateContext) => {
        const row = context.row as TradingRow;
        return styledCell(
          String(row['changeStr'] ?? fmtChange(context.value)),
          String(row['changeColor'] ?? 'inherit'),
        );
      },
      changePct: (context: GridCellTemplateContext) => {
        const row = context.row as TradingRow;
        return styledCell(
          String(row['changePctStr'] ?? fmtChangePct(context.value)),
          String(row['changeColor'] ?? 'inherit'),
        );
      },
    };
  }

  private readonly statusCellRenderer = (context: GridCellTemplateContext) =>
    styledCell(String(context.value), 'inherit', {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '999px',
      padding: '0.2rem 0.55rem',
      fontSize: '0.85rem',
      fontWeight: '600',
      background:
        context.value === 'Active'
          ? 'color-mix(in srgb, #16a34a 14%, transparent)'
          : context.value === 'Pilot'
            ? 'color-mix(in srgb, #2563eb 14%, transparent)'
            : 'color-mix(in srgb, #d97706 14%, transparent)',
      color:
        context.value === 'Active' ? '#166534' : context.value === 'Pilot' ? '#1e40af' : '#92400e',
    });

  private tradingOptions() {
    return {
      id: 'react-demo-trading',
      title: 'React Demo: Trading Terminal',
      emptyMessage: 'No data',
      rowIdentity: (row: GridRecord) => String(row['id']),
      data: this.tradingRows,
      rowHeight: 40,
      enableSorting: true,
      enableFiltering: false,
      enableGrouping: false,
      enableColumnMoving: false,
      enableVirtualization: true,
      virtualizationThreshold: 1,
      columnDefs: tradingColumnDefs(),
    };
  }

  protected primaryOptions(): GridOptions {
    return {
      id: 'ui-grid-modern-react',
      title: 'UI Grid Modernized (React)',
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
    };
  }

  private optionsForMode(mode: DemoMode): GridOptions {
    switch (mode) {
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
      default:
        return this.expandableOptions();
    }
  }

  private baseOptions(data: readonly GridRecord[]): GridOptions {
    return {
      id: `react-demo-${this.mode()}`,
      title: `React Demo: ${this.mode().charAt(0).toUpperCase()}${this.mode().slice(1)}`,
      emptyMessage: 'No rows match the current filters.',
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
          formatter: (value) => `$${value}`,
        },
        {
          name: 'owner',
          field: 'account.owner',
          displayName: 'Owner',
          width: 'minmax(10rem, 0.8fr)',
        },
      ],
    };
  }

  private expandableOptions(): GridOptions {
    return {
      ...this.baseOptions(createHarnessRows()),
      enableExpandable: true,
      expandableRowHeight: 112,
      enableRowSelection: true,
    };
  }

  private treeOptions(): GridOptions {
    return {
      ...this.baseOptions(createTreeRows()),
      enableTreeView: true,
      treeChildrenField: 'children',
      showTreeExpandNoChildren: false,
      treeIndent: 16,
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
          filter: { condition: FILTER_CONDITIONS.exact },
        },
        {
          name: 'revenue',
          displayName: 'Revenue',
          align: 'end',
          width: 'minmax(9rem, 0.7fr)',
          filter: { condition: FILTER_CONDITIONS.greaterThan },
          formatter: (value) =>
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(Number(value ?? 0)),
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
      ],
    };
  }

  private pinningOptions(): GridOptions {
    const data = Array.from({ length: 20 }, (_value, index) => ({
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

    return {
      id: 'react-demo-pinning',
      title: 'React Demo: Pinning',
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

  private paginationOptions(): GridOptions {
    return {
      id: 'react-demo-pagination',
      title: 'React Demo: Pagination',
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
          formatter: (value) => `$${value}`,
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
      ],
    };
  }

  private infiniteOptions(): GridOptions {
    return {
      id: 'react-demo-infinite',
      title: 'React Demo: Infinite Scroll',
      emptyMessage: 'No rows loaded yet.',
      rowIdentity: (row) => String(row['id']),
      data: this.infiniteRows,
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
      ],
    };
  }

  private setupInfiniteScroll(api: UiGridApi): void {
    this.disposeInfiniteScroll?.();
    this.disposeInfiniteScroll = api.infiniteScroll.on.needLoadMoreData(async () => {
      if (this.infiniteRows.length >= this.INFINITE_MAX_ROWS) {
        await api.infiniteScroll.dataLoaded(false, false);
        return;
      }
      const newRows = createInfiniteRows(this.infiniteRows.length, this.INFINITE_PAGE_SIZE);
      this.infiniteRows = [...this.infiniteRows, ...newRows];
      if (this.harnessReactRoot) {
        updateUiGrid(this.harnessReactRoot, {
          options: { ...this.infiniteOptions(), data: this.infiniteRows },
          className: 'react-docs-demo-grid',
        });
      }
      await api.infiniteScroll.dataLoaded(false, this.infiniteRows.length < this.INFINITE_MAX_ROWS);
    });
  }
}
