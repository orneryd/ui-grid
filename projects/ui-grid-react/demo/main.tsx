import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { UiGrid } from '../src/index';
import type { GridBenchmarkResult, GridOptions, UiGridApi } from '../src/index';
import { FILTER_CONDITIONS } from '@ornery/ui-grid-core';
import '../src/ui-grid.css';
import './demo.css';

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

const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function App() {
  const [gridApi, setGridApi] = useState<UiGridApi | null>(null);
  const [visibleRowCount, setVisibleRowCount] = useState(0);
  const [benchmarkResult, setBenchmarkResult] = useState<GridBenchmarkResult | null>(null);
  const data = useMemo(() => createDemoData(), []);

  const options = useMemo<GridOptions>(
    () => ({
      id: 'react-demo-grid',
      title: 'UI Grid React Demo',
      emptyMessage: 'No rows match the current filters.',
      rowHeight: 48,
      viewportHeight: 620,
      enableSorting: true,
      enableFiltering: true,
      enableGrouping: true,
      enableColumnMoving: true,
      enableColumnResizing: true,
      enableVirtualization: true,
      enableCellEditOnFocus: true,
      virtualizationThreshold: 25,
      grouping: { groupBy: ['status'] },
      benchmark: { iterations: 40 },
      rowIdentity: (row) => String(row['id']),
      onRegisterApi: (api) => setGridApi(api as UiGridApi),
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
          formatter: (value) => currencyFormat.format(Number(value ?? 0)),
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
      data,
    }),
    [data],
  );

  useEffect(() => {
    if (!gridApi) {
      return;
    }

    setVisibleRowCount(gridApi.core.getVisibleRows().length);

    const disposeVisibleRows = gridApi.core.on.rowsVisibleChanged((rows) => {
      setVisibleRowCount(rows.length);
    });
    const disposeBenchmark = gridApi.core.on.benchmarkComplete((result) => {
      setBenchmarkResult(result);
    });

    return () => {
      disposeVisibleRows();
      disposeBenchmark();
    };
  }, [gridApi]);

  return (
    <section className="react-demo-shell">
      <header className="react-demo-shell__header">
        <div>
          <p className="react-demo-shell__eyebrow">React package demo</p>
          <h2>{options.title ?? 'UI Grid'}</h2>
          <p>
            Familiar <code>gridOptions</code> and <code>onRegisterApi</code>, rebuilt with React
            hooks, virtualization, grouping, sorting, filtering, column ordering, and Excel-style
            column resizing with drag handles plus double-click auto fit.
          </p>
        </div>

        <div className="react-demo-shell__actions">
          <button
            type="button"
            className="react-demo-shell__button"
            onClick={() => gridApi?.core.benchmark()}
          >
            Benchmark
          </button>
          <button
            type="button"
            className="react-demo-shell__button react-demo-shell__button-secondary"
            onClick={() => gridApi?.core.exportCsv()}
          >
            Export CSV
          </button>
          <div className="react-demo-shell__stats">
            <span>{visibleRowCount}</span>
            <small>visible rows</small>
          </div>
        </div>
      </header>

      <section className="react-demo-shell__metrics" aria-label="React grid metrics">
        <article>
          <strong>{options.enableVirtualization ? 'On' : 'Off'}</strong>
          <span>virtualization</span>
        </article>
        <article>
          <strong>{options.grouping?.groupBy?.length ?? 0}</strong>
          <span>group columns</span>
        </article>
        <article>
          <strong>{benchmarkResult?.averageMs?.toFixed(2) || '—'}</strong>
          <span>benchmark avg</span>
        </article>
      </section>

      <div className="react-demo-shell__toolbar">
        <div>
          <strong>{visibleRowCount}</strong>
          <span>of {data.length} rows</span>
        </div>
        <p>
          <code>gridOptions</code> compatibility layer: sorting, filtering, grouping, column moving,
          column resizing, templating, and virtualized rendering.
        </p>
      </div>

      <UiGrid options={options} onRegisterApi={options.onRegisterApi} />
    </section>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
