import { mountVanillaUiGrid } from '../src/index';
import type { GridOptions, UiGridApi } from '../src/index';
import type { GridBenchmarkResult } from '@ornery/ui-grid-core';

const statuses = ['Active', 'Expansion', 'Enterprise', 'Pilot'] as const;
const companies = ['Northwind', 'Blue Harbor', 'Forge Group', 'Larkspur', 'Atlas'] as const;
const owners = ['Casey Tran', 'Jordan Silva', 'Priya Rao', 'Evan Brooks', 'Mina Patel'] as const;

function createDemoData(count = 100_000) {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i + 1}`,
    name: `Customer ${i + 1}`,
    company: companies[i % companies.length],
    revenue: 40000 + i * 1350,
    status: statuses[i % statuses.length],
    renewalDate: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`,
    account: { owner: owners[i % owners.length] },
  }));
}

const options: GridOptions = {
  id: 'vanilla-demo-grid',
  title: 'UI Grid Vanilla Demo',
  emptyMessage: 'No rows match the current filters.',
  rowHeight: 48,
  enableSorting: true,
  enableFiltering: true,
  enableGrouping: true,
  enableColumnResizing: true,
  enableVirtualization: true,
  virtualizationThreshold: 25,
  grouping: { groupBy: ['status'] },
  benchmark: { iterations: 40 },
  onRegisterApi: (api) => {
    gridApi = api as UiGridApi;
    syncVisibleRows();
    unsubscribeVisibleRows?.();
    unsubscribeBenchmark?.();
    unsubscribeVisibleRows = gridApi.core.on.rowsVisibleChanged((rows) => {
      updateVisibleRows(rows.length);
    });
    unsubscribeBenchmark = gridApi.core.on.benchmarkComplete((result) => {
      updateBenchmark(result as GridBenchmarkResult);
    });
  },
  columnDefs: [
    { name: 'name', displayName: 'Customer', width: 'minmax(14rem, 1.2fr)' },
    { name: 'company', width: 'minmax(12rem, 1fr)' },
    {
      name: 'revenue',
      type: 'number',
      align: 'end',
      width: 'minmax(10rem, 0.7fr)',
    },
    { name: 'status', width: 'minmax(8rem, 0.7fr)' },
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
    },
  ],
  data: createDemoData(),
};

const mountPoint = document.getElementById('app');
const visibleRowsValue = document.getElementById('visible-rows-value');
const visibleRowsInline = document.getElementById('visible-rows-inline');
const totalRowsValue = document.getElementById('total-rows-value');
const benchmarkAvgValue = document.getElementById('benchmark-avg-value');
const benchmarkButton = document.getElementById('benchmark-button') as HTMLButtonElement | null;
const exportButton = document.getElementById('export-button') as HTMLButtonElement | null;

let gridApi: UiGridApi | null = null;
let unsubscribeVisibleRows: (() => void) | null = null;
let unsubscribeBenchmark: (() => void) | null = null;

function updateVisibleRows(count: number) {
  if (visibleRowsValue) visibleRowsValue.textContent = String(count);
  if (visibleRowsInline) visibleRowsInline.textContent = String(count);
}

function updateBenchmark(result: GridBenchmarkResult | null) {
  if (benchmarkAvgValue) {
    benchmarkAvgValue.textContent = result?.averageMs?.toFixed(2) ?? '—';
  }
}

function syncVisibleRows() {
  updateVisibleRows(gridApi?.core.getVisibleRows().length ?? 0);
}

if (!mountPoint) {
  throw new Error('Expected vanilla demo mount point');
}

if (totalRowsValue) {
  totalRowsValue.textContent = String(options.data.length);
}

benchmarkButton?.addEventListener('click', () => {
  gridApi?.core.benchmark();
});

exportButton?.addEventListener('click', () => {
  gridApi?.core.exportCsv();
});

void mountVanillaUiGrid(mountPoint, options).catch((error) => {
  console.error(error);
  mountPoint.textContent = error instanceof Error ? error.message : String(error);
});
