/** @jsxImportSource @solidjs/web */
import { createSignal } from 'solid-js';
import { UiGrid, type GridOptions, type UiGridCellRenderers } from '@ornery/ui-grid-solid';

const renderers: UiGridCellRenderers = {
  name: (context) => <strong>{String(context.value)}</strong>,
};

export default function GridRoute() {
  const [rows, setRows] = createSignal([
    { id: 1, name: 'Alice', role: 'Engineer' },
    { id: 2, name: 'Bob', role: 'Designer' },
  ]);
  const options = (): GridOptions => ({
    id: 'solid-start-users',
    data: rows(),
    columnDefs: [{ name: 'name' }, { name: 'role' }],
    rowIdentity: (row) => String(row['id']),
    enableSorting: true,
  });

  return <main>
    <h1>SolidStart uiGrid</h1>
    <button onClick={() => setRows((current) => current.map((row) => (
      row.id === 1 ? { ...row, name: 'Alicia' } : row
    )))}>Update data</button>
    <a href="/about">Navigate away</a>
    <div style={{ height: '400px' }}>
      <UiGrid options={options()} cellRenderers={renderers} />
    </div>
  </main>;
}
