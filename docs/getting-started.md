# Getting Started

Get up and running with `@ornery/ui-grid` in under five minutes.

## Install

```bash
npm install @ornery/ui-grid
```

**Peer dependencies:** `@angular/core`, `@angular/common`, `rxjs`, `tslib`.

## Minimal Angular Setup

The grid ships as a standalone component — no module imports required:

```typescript
import { Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';

@Component({
  selector: 'app-my-grid',
  imports: [UiGridComponent],
  template: `<app-ui-grid [options]="gridOptions" />`,
})
export class MyGridComponent {
  gridOptions: GridOptions = {
    id: 'my-grid',
    data: [
      { name: 'Alice', role: 'Engineer', salary: 120000 },
      { name: 'Bob', role: 'Designer', salary: 95000 },
    ],
    columnDefs: [
      { name: 'name' },
      { name: 'role' },
      { name: 'salary', type: 'number', align: 'end' },
    ],
  };
}
```

## Required GridOptions Fields

| Field        | Type                       | Description                                                 |
| ------------ | -------------------------- | ----------------------------------------------------------- |
| `id`         | `string`                   | Unique grid identifier (used for CSV filenames and row IDs) |
| `data`       | `readonly GridRecord[]`    | Array of row objects                                        |
| `columnDefs` | `readonly GridColumnDef[]` | Column definitions — each needs at minimum a `name`         |

## React

```bash
npm install @ornery/ui-grid-react @ornery/ui-grid-core
```

```tsx
import { UiGrid } from '@ornery/ui-grid-react';
import type { GridOptions } from '@ornery/ui-grid-core';

const options: GridOptions = {
  id: 'react-grid',
  data: [{ name: 'Alice', role: 'Engineer' }],
  columnDefs: [{ name: 'name' }, { name: 'role' }],
};

function App() {
  return <UiGrid options={options} />;
}
```

## Web Components

### Vanilla (`@ornery/ui-grid-vanilla`)

Framework-free, pure DOM with Shadow DOM. zero dependencies:

```bash
npm install @ornery/ui-grid-vanilla @ornery/ui-grid-core
```

Declarative setup now works directly in HTML:

```html
<ui-grid-element
  grid-id="vanilla-demo"
  enable-sorting
  enable-filtering
  column-defs='[{"name":"name"},{"name":"role"}]'
  data='[{"name":"Alice","role":"Engineer"}]'
>
</ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();
</script>
```

Or bind the same fields as individual JS properties:

For static HTML hosts with no package-aware build step, use the browser bundle emitted by `npm run build:vanilla`:

```html
<script type="module" src="./ui-grid-element.js"></script>

<ui-grid-element
  grid-id="static-grid"
  enable-sorting
  enable-filtering
  column-defs='[{"name":"name"},{"name":"role"}]'
  data='[{"name":"Alice","role":"Engineer"}]'
>
</ui-grid-element>
```

The repo build writes this file to `projects/ui-grid-vanilla/dist/browser/ui-grid-element.js`. It includes `@ornery/ui-grid-core` and auto-registers the element.

```html
<ui-grid-element id="my-grid"></ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  const grid = document.querySelector('#my-grid');
  grid.gridId = 'vanilla-props';
  grid.enableSorting = true;
  grid.enableFiltering = true;
  grid.columnDefs = [{ name: 'name' }, { name: 'role' }];
  grid.data = [{ name: 'Alice', role: 'Engineer' }];
</script>
```

The original bulk `options` property remains available when you need callbacks or function-valued configuration:

```html
<ui-grid-element id="my-grid"></ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement();

  document.querySelector('#my-grid').options = {
    id: 'vanilla-demo',
    data: [{ name: 'Alice', role: 'Engineer' }],
    columnDefs: [{ name: 'name' }, { name: 'role' }],
  };
</script>
```

## Run the Demo Locally

```bash
git clone https://github.com/orneryd/uiGrid.git
cd uiGrid
npm ci
npm start
```

Open `http://localhost:4200` to see the full demo with 100,000 rows, theming, and all features active. The live demo includes dedicated pages for Angular, React, Web Components, and Rust usage.

## Run the Rust-backed Demo Locally

If you want to exercise the Rust/WASM engine directly in the browser:

```bash
npm run start:vanilla
```

Open `http://127.0.0.1:4174/` to see the framework-agnostic vanilla demo that mounts the grid through the Rust-backed browser pipeline.

## Next Steps

- [Features](./features.md) — see everything the grid can do
- [Theming](./theming.md) — customize colors and layout via CSS custom properties
- [API Reference](./api-reference.md) — full GridOptions, GridColumnDef, and UiGridApi documentation
- [Web Component](./web-component.md) — Angular-backed and vanilla web component outputs
- [Rust / WASM](./rust.md) — use the Rust pipeline in Angular, React, or vanilla hosts
- [Rust / egui](./rust-egui.md) — native Rust `ui-grid-egui` adapter with pinning, export, and save/restore
