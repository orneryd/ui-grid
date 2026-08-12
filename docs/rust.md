# Rust / WASM

Use UI Grid's Rust pipeline in Angular, React, or vanilla hosts without changing the public `gridOptions` / `columnDefs` surface. The host framework still renders the grid; Rust owns the shared pipeline and state math.

## What runs in Rust today

- Filtering, sorting, grouping, and pagination
- Pinning state, tree flattening, and virtualization math
- Save-state normalization and shared pipeline output

## Angular Usage

Register the engine once, then keep using the Angular component normally:

```typescript
import { Component, computed } from '@angular/core';
import { UiGridComponent, type GridOptions } from '@ornery/ui-grid';
import { enableUiGridWasmEngine } from '@ornery/ui-grid-core';

await enableUiGridWasmEngine();

@Component({
  selector: 'app-rust-wasm-angular-demo',
  imports: [UiGridComponent],
  template: '<app-ui-grid [options]="options()" />',
})
export class RustWasmAngularDemoComponent {
  protected readonly options = computed<GridOptions>(() => ({
    id: 'rust-wasm-angular',
    data: createDemoData(),
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: true,
    enablePinning: true,
    grouping: { groupBy: ['status'] },
    columnDefs: [
      { name: 'name', pinnedLeft: true },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end' },
      { name: 'owner', field: 'account.owner' },
    ],
  }));
}
```

## React Usage

The React wrapper provides a matching helper for the same Rust pipeline:

```tsx
import { UiGrid, enableReactUiGridWasmEngine } from '@ornery/ui-grid-react';
import { type GridOptions } from '@ornery/ui-grid-core';

await enableReactUiGridWasmEngine();

const options: GridOptions = {
  id: 'rust-wasm-react',
  data,
  enableSorting: true,
  enableFiltering: true,
  enablePinning: true,
  columnDefs: [
    { name: 'name', pinnedLeft: true },
    { name: 'department' },
    { name: 'region' },
    { name: 'total', align: 'end' },
  ],
};

export function RustWasmReactGrid() {
  return <UiGrid options={options} />;
}
```

## Vanilla / Web Component Usage

For a plain browser host, register the module and then mount the standalone element:

```typescript
import initWasm, * as wasmModule from '../../../dist/ui-grid-wasm-web/ui_grid_wasm.js';
import {
  defineStandaloneUiGridElement,
  registerVanillaUiGridRustModule,
  type VanillaUiGridElement,
} from '@ornery/ui-grid-vanilla';

await registerVanillaUiGridRustModule(
  {
    default: initWasm,
    build_pipeline_js: wasmModule.build_pipeline_js,
  },
  '/dist/ui-grid-wasm-web/ui_grid_wasm_bg.wasm',
);

await defineStandaloneUiGridElement();

const grid = document.querySelector('ui-grid-element') as VanillaUiGridElement;
grid.gridId = options.id;
grid.columnDefs = options.columnDefs;
grid.data = options.data;
grid.enableSorting = options.enableSorting ?? true;
grid.enableFiltering = options.enableFiltering ?? true;

// Use the full options object when you need callbacks or function-valued fields.
grid.options = options;
```

## Feature Recipes

These options stay identical across Angular, React, and vanilla renderers:

```typescript
const options = {
  enableSorting: true,
  enableFiltering: true,
  enableGrouping: true,
  enableTreeView: true,
  enableExpandable: true,
  enablePinning: true,
  grouping: { groupBy: ['status'] },
  treeChildrenField: 'children',
  columnDefs: [
    { name: 'name', pinnedLeft: true },
    { name: 'status' },
    { name: 'revenue', type: 'number', align: 'end' },
  ],
};
```

## Save & Restore State

```typescript
let savedState = null;

const options = {
  onRegisterApi: (api) => {
    savedState = api.saveState.save();
    api.saveState.restore(savedState);
  },
};
```

## Prerequisites

- Node.js 22+
- npm 11+
- Rust stable via `rustup`
- `wasm-pack`

If you do not already have the Rust toolchain and `wasm-pack` installed:

```bash
curl https://sh.rustup.rs -sSf | sh
cargo install wasm-pack
```

## Install dependencies

From the repo root:

```bash
npm ci
cd projects/ui-grid-vanilla && npm install && cd ../..
```

## Build the Rust browser artifact

Build the browser-native WASM package used by the vanilla demo:

```bash
npm run build:rust:web
```

This writes the browser-targeted WASM package to:

```text
dist/ui-grid-wasm-web/
```

## Build the compiled library entry

The vanilla demo intentionally consumes the compiled Angular library output rather than raw source files.

```bash
npm run build:library
```

This writes the compiled package to:

```text
dist/ui-grid/
```

## Run the Rust-backed browser demo

From the repo root:

```bash
npm run start:vanilla
```

That command builds the compiled library, rebuilds the browser-native Rust/WASM package, and starts the vanilla demo server.

Open this URL in your browser:

```text
http://127.0.0.1:4174/
```

## Manual workflow

If you want tighter control over each step instead of using the combined script:

```bash
npm run build:library
npm run build:rust:web
npm run start --prefix projects/ui-grid-vanilla -- --host 127.0.0.1 --port 4174
```

## Useful validation commands

```bash
npm run test:angular -- --watch=false
npm run test:react
npm run test:vanilla
npm run build:rust:wasm
npm run build:rust:web
```

## Current boundary

The browser wrappers still own DOM rendering and framework integration. Rust currently owns the shared pipeline, state transitions, and pinning math; native Rust rendering lives in `ui-grid-egui`.

If you want the native Rust widget adapter instead, see [Rust / egui](./rust-egui.md).
