import { createSignal, onCleanup } from 'solid-js';
import { render } from '@solidjs/web';
import { UiGrid } from '../src';
import './styles.css';
import type {
  UiGridApi,
  UiGridCellRenderers,
  UiGridCellEditors,
  UiGridDetailRenderer,
} from '../src';

const cellRenderers: UiGridCellRenderers = {
  name: (context) => {
    const [clicks, setClicks] = createSignal(0);
    return <button class="person-cell" onClick={() => setClicks((value) => value + 1)}>
      <span class="avatar">{String(context.value).slice(0, 2).toUpperCase()}</span>
      <span class="person-copy">
        <strong>{String(context.value)}</strong>
        <small>{clicks() === 0 ? 'Click to interact' : `${clicks()} interaction${clicks() === 1 ? '' : 's'}`}</small>
      </span>
    </button>;
  },
  role: (context) => <span class={`role-pill role-${String(context.value).toLowerCase().replace(' ', '-')}`}>
    <span class="role-dot" />
    {String(context.value)}
  </span>,
  status: (context) => <span class={`status-pill status-${String(context.value).toLowerCase()}`}>
    <span class="role-dot" />
    {String(context.value)}
  </span>,
  revenue: (context) => <strong class="money-cell">
    ${Number(context.value ?? 0).toLocaleString('en-US')}
  </strong>,
};

const cellEditors: UiGridCellEditors = {
  role: (context) => <select class="role-editor" value={String(context.value ?? '')}
    onChange={(event) => context.setValue(event.currentTarget.value)}>
    <option value="Engineer">Engineer</option>
    <option value="Designer">Designer</option>
    <option value="Product Manager">Product Manager</option>
  </select>,
};

const detailRenderer: UiGridDetailRenderer = (context) => (
  <section class="detail-card">
    <span class="detail-avatar">{String(context.row['name']).slice(0, 2).toUpperCase()}</span>
    <div>
      <span class="detail-kicker">Profile preview</span>
      <strong>{String(context.row['name'])}</strong>
      <p>{String(context.row['role'])} · Row index {context.rowIndex}</p>
    </div>
  </section>
);

export function App() {
  const [data, setData] = createSignal(
    Array.from({ length: 100_000 }, (_, id) => {
      const roles = ['Engineer', 'Designer', 'Product Manager'];
      const companies = ['Northstar Labs', 'Acme Studio', 'Orbit Systems', 'Pioneer Works'];
      const regions = ['Singapore', 'Jakarta', 'Bangkok', 'Sydney'];
      return {
        id,
        name: `User ${id}`,
        company: companies[id % companies.length],
        email: `user${id}@example.com`,
        role: roles[id % roles.length],
        status: id % 5 === 0 ? 'Away' : 'Active',
        revenue: 24_000 + ((id * 7919) % 180_000),
        region: regions[id % regions.length],
      };
    }),
  );
  let api: UiGridApi | undefined;
  let nameMoved = false;

  const moveNameColumn = () => {
    api?.core.moveColumn(nameMoved ? 2 : 1, nameMoved ? 1 : 2);
    nameMoved = !nameMoved;
  };

  return <main class="app-shell">
    <header class="hero">
      <div class="hero-copy">
        <span class="eyebrow"><span class="eyebrow-dot" /> SolidJS adapter</span>
        <h1>Fast data, <span>clear decisions.</span></h1>
        <p>Explore 100,000 rows through a reactive SolidJS interface backed by uiGrid's virtualized engine.</p>
      </div>
      <div class="hero-stat">
        <strong>100K</strong>
        <span>live records</span>
      </div>
    </header>

    <section class="grid-card">
      <div class="toolbar">
        <div>
          <span class="section-label">Team directory</span>
          <h2>People & roles</h2>
        </div>
        <div class="toolbar-actions">
          <button class="button button-secondary" id="move-name-column" onClick={moveNameColumn}>
            <span aria-hidden="true">⇆</span> Move name column
          </button>
          <button class="button button-primary" onClick={() => setData((rows) => [...rows, {
            id: rows.length + 1,
            name: `User ${rows.length + 1}`,
            company: 'Northstar Labs',
            email: `user${rows.length + 1}@example.com`,
            role: rows.length % 2 === 0 ? 'Engineer' : 'Designer',
            status: 'Active',
            revenue: 48_000,
            region: 'Jakarta',
          }])}>
            <span aria-hidden="true">＋</span> Add row
          </button>
        </div>
      </div>

      <div class="tip-bar">
        <span class="tip-icon" aria-hidden="true">i</span>
        <span>Use the header buttons to <strong>sort</strong> or <strong>group</strong>, expand a row for details, or double-click <strong>Role</strong> to edit.</span>
      </div>

      <div class="grid-frame">
        <UiGrid
          cellRenderers={cellRenderers}
          cellEditors={cellEditors}
          detailRenderer={detailRenderer}
          onRegisterApi={(value) => { api = value; }}
          options={{
            id: 'solid-demo',
            data: data(),
            columnDefs: [
              { name: 'id', displayName: 'ID', width: '90px' },
              { name: 'name', displayName: 'Customer', width: 'minmax(220px, 1.2fr)' },
              { name: 'company', displayName: 'Company', width: 'minmax(180px, 1fr)' },
              { name: 'email', displayName: 'Email', width: 'minmax(220px, 1.2fr)' },
              { name: 'role', displayName: 'Role', width: '170px', enableCellEdit: true },
              { name: 'status', displayName: 'Status', width: '130px' },
              { name: 'revenue', displayName: 'Revenue', width: '150px' },
              { name: 'region', displayName: 'Region', width: '140px' },
            ],
            rowIdentity: (row) => String(row['id']),
          enableSorting: true,
          enableGrouping: true,
          enableColumnMoving: true,
            enableCellEdit: true,
            enableExpandable: true,
            expandableRowHeight: 90,
            enableVirtualization: true,
            virtualizationThreshold: 40,
            minRowsToShow: 10,
          }}
        />
      </div>
      <footer class="grid-footer">
        <span><span class="status-dot" /> Virtualization active</span>
        <span>SolidJS · uiGrid 1.0.8</span>
      </footer>
    </section>
  </main>;
}

export function StressApp() {
  const data = Array.from({ length: 100_000 }, (_, id) => ({ id, name: `Row ${id}` }));
  let liveRenderers = 0;
  let peakRenderers = 0;
  let disposedRenderers = 0;
  const updateMetrics = () => {
    document.documentElement.dataset.liveRenderers = String(liveRenderers);
    document.documentElement.dataset.peakRenderers = String(peakRenderers);
    document.documentElement.dataset.disposedRenderers = String(disposedRenderers);
  };
  const renderers: UiGridCellRenderers = {
    name: (context) => {
      liveRenderers++;
      peakRenderers = Math.max(peakRenderers, liveRenderers);
      updateMetrics();
      onCleanup(() => {
        liveRenderers--;
        disposedRenderers++;
        updateMetrics();
      });
      return <span>{String(context.value)}</span>;
    },
  };
  return <div id="stress-grid" style={{ height: '480px' }}>
    <UiGrid options={{
      id: 'solid-stress', data, columnDefs: [{ name: 'name' }],
      rowIdentity: (row) => String(row['id']), enableVirtualization: true,
      virtualizationThreshold: 40, minRowsToShow: 10,
    }} cellRenderers={renderers} />
  </div>;
}

render(() => location.search.includes('stress') ? <StressApp /> : <App />, document.getElementById('app')!);
