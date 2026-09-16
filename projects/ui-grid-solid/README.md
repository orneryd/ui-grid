# @ornery/ui-grid-solid

SolidJS adapter for the existing uiGrid web component. Grid behavior, state,
rendering and event subscriptions stay in the vanilla renderer and core.

## Install

```sh
npm install @ornery/ui-grid-solid @ornery/ui-grid-core @ornery/ui-grid-vanilla solid-js@2.0.0-rc.4 @solidjs/web@2.0.0-rc.4
```

This package is developed against `solid-js@2.0.0-rc.4`. SolidJS 1 is not supported.
Use a SolidJS JSX compiler/plugin with `jsxImportSource: "@solidjs/web"`.

```tsx
import { createSignal } from 'solid-js';
import { UiGrid, type UiGridApi } from '@ornery/ui-grid-solid';

export function App() {
  const [rows, setRows] = createSignal([{ id: 1, name: 'Alice' }]);
  let api: UiGridApi | undefined;
  return <div style={{ height: '400px' }}>
    <button onClick={() => setRows([{ id: 1, name: 'Bob' }])}>Update</button>
    <UiGrid
      options={{
        id: 'users', data: rows(), columnDefs: [{ name: 'name' }],
        rowIdentity: (row) => String(row['id']), enableSorting: true,
      }}
      onRegisterApi={(value) => { api = value; }}
      onError={(error) => console.error(error)}
    />
  </div>;
}
```

`options` uses the existing `GridOptions` type. Replace options/data through
signals; mutating a plain array in place does not notify Solid. Top-level
reactive option getters are tracked. Updates assign options to the same element,
preserving the controller's interactive state. Give the parent a definite height.

`onRegisterApi` receives a compatible `UiGridApi` whose mutating operations also
refresh the Solid renderer bridges; `options.onRegisterApi` also runs. As in
vanilla, registration callbacks may run again on options updates.
Use `api.core.on` and other existing API event groups for subscriptions, and
dispose application-owned subscriptions with Solid's `onCleanup`.

## Lifecycle and SSR

The server export renders only a host div. The vanilla module is dynamically
imported inside a client effect. Disposing the component cancels pending mount
work and removes the element, invoking vanilla's `disconnectedCallback` cleanup.
Initialization failures call `onError` when supplied, otherwise surface globally.

**Correction to the contribution plan:** the published `solid-js@2.0.0-rc.4`
package does not export `onMount`. This adapter uses SolidJS's two-argument
`createEffect` with a constant client guard for mounting, and a separate tracked
effect for options. It does not use `onSettled` as a mount hook.

Source exports use the `solid` condition so SolidStart can compile for its target.
Precompiled browser and server ESM exports are also included.

The [`examples/solid-start`](examples/solid-start) route example covers server
rendering, a reactive data update after hydration, and route navigation that
unmounts and remounts the grid.

## Local development

```sh
npm ci --prefix projects/ui-grid-solid
npm run build:solid
npm run test:solid
npm run start:solid
```

`build:solid` builds core, vanilla, then Solid using a cross-platform Node script.
In PowerShell environments that block npm.ps1, use `npm.cmd` for these commands.

## Solid JSX cells

Pass `cellRenderers`, keyed by column name:

```tsx
const cellRenderers: UiGridCellRenderers = {
  name: (context) => <strong>{String(context.value)}</strong>,
};
// Import UiGridCellRenderers from @ornery/ui-grid-solid.
<UiGrid options={options()} cellRenderers={cellRenderers} />;
```

Each renderer runs under the grid's Solid context and receives reactive getters
for `value`, `$implicit`, `row`, `column`, and `rowIndex`. Read these getters
inside JSX or tracked computations; do not destructure them into plain values.
Cell-local signals survive value updates while the slot remains mounted.

The bridge follows vanilla slot events and API row updates. Removed/virtualized
cells dispose their Solid roots. Replacing a renderer function remounts its
cells; removing it restores vanilla rendering. Keep renderer functions stable
when local state should survive. Grid teardown removes all renderer roots and
the bridge's API subscription.

Renderer failures are reported through `onError`. The failed cell stays isolated
from the grid and remounts on the next options update, allowing it to recover.
The API returned by `onRegisterApi` wraps `core.benchmark()` so its result and
`benchmarkComplete` event include completion of the Solid renderer bridge.

The demo loads 100,000 rows across three columns by default. Click **Move Name column** to exercise
`api.core.moveColumn()`.

## Solid JSX headers

Pass `headerRenderers`, also keyed by column name:

```tsx
const headerRenderers: UiGridHeaderRenderers = {
  name: (context) => <strong>{context.value} (Solid)</strong>,
};
// Import UiGridHeaderRenderers from @ornery/ui-grid-solid.
<UiGrid options={options()} headerRenderers={headerRenderers} />;
```

Header context exposes reactive `value`, `$implicit`, and `column` getters.
Local signals survive title and column option updates while the header remains
mounted. Hiding or removing a column disposes its root; showing it mounts a new
root. Renderer failures call `onError` and retry on the next options update.

Clicking a projected header cycles sorting through ascending, descending, and
none. An interactive child can call `event.preventDefault()` to suppress that
sort for its click. Programmatic column movement through
`api.core.moveColumn()` keeps projected headers aligned with the grid. A custom
header replaces the vanilla header contents, so it should render any additional
controls the application needs.

## Solid JSX expandable details

Pass one `detailRenderer` and enable expandable rows:

```tsx
const detailRenderer: UiGridDetailRenderer = (context) => (
  <section>
    <strong>{String(context.row['name'])}</strong>
    <span>Row {context.rowIndex}</span>
  </section>
);

<UiGrid
  options={{
    ...options(),
    enableExpandable: true,
    expandableRowHeight: 120,
  }}
  detailRenderer={detailRenderer}
/>;
```

Import `UiGridDetailRenderer` from `@ornery/ui-grid-solid`. The renderer receives
reactive `row`, `$implicit`, `rowIndex`, and `expanded` getters. Its Solid root
stays mounted while the same expanded detail remains visible, so local state
survives data updates, sorting, and index changes.

Use the existing `api.expandable.toggleRowExpansion()`, `expandAllRows()`, and
`collapseAllRows()` operations to control details. Collapsing, filtering out,
virtualizing out, or removing a row disposes its detail root. Errors are isolated
through `onError` and retry on the next options update.

## Solid JSX cell editors

Pass `cellEditors`, keyed by column name, and enable editing for the grid and
column:

```tsx
const cellEditors: UiGridCellEditors = {
  role: (context) => <select
    value={context.value}
    onChange={(event) => context.setValue(event.currentTarget.value)}
  >
    <option value="Engineer">Engineer</option>
    <option value="Designer">Designer</option>
  </select>,
};

<UiGrid
  options={{
    ...options(),
    enableCellEdit: true,
    columnDefs: [{ name: 'role', enableCellEdit: true }],
  }}
  cellEditors={cellEditors}
/>;
```

Import `UiGridCellEditors` from `@ornery/ui-grid-solid`. The reactive context
contains `value`, `$implicit`, `row`, `column`, `rowIndex`, `setValue`, `commit`,
and `cancel`. The first input, select, textarea, or focusable element receives
focus when editing starts.

Enter commits, Escape cancels, and moving focus outside the editor commits.
The Solid editor bridge follows the public editing events and uses vanilla's
internal editor input to synchronize values. The existing Grid API remains
responsible for parsing typed values, updating nested fields, raising edit
events, validation, and restoring cell rendering.
Buttons can invoke `context.commit()` or `context.cancel()` directly. The Solid
root is disposed whenever the edit session ends or the grid unmounts. Renderer
failures call `onError` and retry on the next options update.
