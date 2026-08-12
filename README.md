[![CI](https://github.com/orneryd/uiGrid/actions/workflows/ci.yml/badge.svg)](https://github.com/orneryd/uiGrid/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/orneryd/uiGrid/badge.svg?branch=main)](https://coveralls.io/github/orneryd/uiGrid?branch=main)
[![npm](https://img.shields.io/npm/v/@ornery/ui-grid)](https://www.npmjs.com/package/@ornery/ui-grid)
[![crates.io](https://img.shields.io/crates/v/ui-grid-egui)](https://crates.io/crates/ui-grid-egui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.md)

#### [Discord Community](https://discord.gg/Baz4w8ZWN)

# UI Grid — Remastered

**The modern multi-platform data grid. Every feature free and open source. Built for Angular, Web-Components, React, native Rust/egui, and native C/LVGL.**

A from-scratch rewrite of the original [AngularJS ui-grid](https://github.com/angular-ui/ui-grid) — by the original author. Same `gridOptions` / `columnDefs` / `onRegisterApi` api surface, modern Angular signals internals, and zero legacy baggage.

Just like the original grid, it will **NEVER** be monetized. This is purely my contribution to the greater community.

It proves that the datagrid cabal wants you to think it's hard to write a data grid. Well, it's not, and nobody should be paying to group data.

**[Live Demo & Docs](https://orneryd.github.io/uiGrid/)** | **[npm](https://www.npmjs.com/package/@ornery/ui-grid)** | **[crates.io](https://crates.io/crates/ui-grid-egui)** | **[Used by NornicDB](https://orneryd.github.io/NornicDB/)**

---

## Why Remastered?

- **Original authorship** — built by the same engineer who created AngularJS ui-grid, with a decade of hindsight on what worked and what didn't
- **Familiar API** — if you used the original ui-grid, you already know this one: `gridOptions`, `columnDefs`, `onRegisterApi`, `gridApi.core.*`
- **Modern internals** — shared vanilla web component core with Shadow DOM encapsulation; Angular and React wrappers are thin bridges that project framework templates into the vanilla element via slot-based portals
- **No legacy** — no `$scope`, no Bower, no Grunt, no jQuery, no module system from 2013

---

## Feature Comparison

Everything below ships free and MIT-licensed. No enterprise tier, no license keys, no per-developer fees.

| Feature                   | UI Grid  | ag-Grid Community | ag-Grid Enterprise |    Vaadin Grid    |   Kendo UI   |   Syncfusion    |
| ------------------------- | :------: | :---------------: | :----------------: | :---------------: | :----------: | :-------------: |
| Sorting                   | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| Filtering                 | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| **Row Grouping**          | **Free** |         —         |    ~$999/dev/yr    |         —         |     Paid     |   Community\*   |
| **Tree Data**             | **Free** |         —         |    ~$999/dev/yr    |       Free        |     Paid     |   Community\*   |
| **Master/Detail Rows**    | **Free** |         —         |    ~$999/dev/yr    |         —         |     Paid     |   Community\*   |
| **Inline Cell Editing**   | **Free** |       Free        |         —          | Pro ~$159/dev/mo  |     Paid     |   Community\*   |
| Row Selection             | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| Column Resizing           | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| CSV Export                | **Free** |       Free        |         —          |         —         |     Paid     |   Community\*   |
| **Excel Export**          | **Free** |         —         |    ~$999/dev/yr    |         —         |     Paid     |   Community\*   |
| **PDF Export**            | **Free** |         —         |    ~$999/dev/yr    |         —         |     Paid     |   Community\*   |
| Virtual Scrolling         | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| Pagination                | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| Column Pinning            | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| Column Reordering         | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| **Save/Restore State**    | **Free** |       Free        |         —          |         —         |     Paid     |        —        |
| Infinite Scroll           | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| **Keyboard Cell Nav**     | **Free** |       Free        |         —          |         —         |     Paid     |   Community\*   |
| **Row Edit (dirty/save)** | **Free** |         —         |         —          |         —         |      —       |        —        |
| **Cell Validation**       | **Free** |         —         |         —          |         —         |      —       |        —        |
| **CSV/JSON Import**       | **Free** |         —         |         —          |         —         |      —       |        —        |
| **Shadow DOM**            | **Free** |         —         |         —          |         —         |      —       |        —        |
| **Web Component Build**   | **Free** |         —         |         —          |      Native       |      —       |        —        |
| **Feature Tree-Shaking**  | **Free** |         —         |         —          |         —         |      —       |        —        |
| **SSR Support**           | **Free** |         —         |    ~$999/dev/yr    |         —         |      —       |        —        |
| i18n (6 locales built-in) | **Free** |       Free        |         —          |       Free        |     Paid     |   Community\*   |
| React                     | **Yes**  |      Wrapper      |      Wrapper       |        No         |   Wrapper    |     Wrapper     |
| Rust/egui Native          | **Yes**  |        No         |         No         |        No         |      No      |       No        |
| C/LVGL Native             | **Yes**  |        No         |         No         |        No         |      No      |       No        |
| Angular                   | **Yes**  |      Wrapper      |      Wrapper       |        No         |   Wrapper    |     Wrapper     |
| **License**               | **MIT**  |        MIT        |     Commercial     |   Apache/Comm.    |  Commercial  | Comm./Community |
| **Price**                 |  **$0**  |        $0         |    ~$999/dev/yr    | $159/dev/mo (Pro) | ~$799/dev/yr |    See below    |

> **Bold** = features where UI Grid gives you for free what competitors charge for or don't offer at all.
>
> _Syncfusion Community license is free for companies with <$1M annual revenue, ≤5 developers, and ≤$3M outside capital. Their paid tier requires a custom quote. Kendo UI ranges $799–$1,299/dev/yr depending on support level. Prices are approximate and subject to change._

---

## Quick Start

```bash
npm install @ornery/ui-grid
```

### Angular Component

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
    onRegisterApi: (api) => {
      this.gridApi = api;
    },
  };
}
```

### React

```bash
npm install @ornery/ui-grid-react @ornery/ui-grid-core @ornery/ui-grid-vanilla
```

```tsx
import { UiGrid } from '@ornery/ui-grid-react';
import type { GridOptions } from '@ornery/ui-grid-core';

function MyGrid() {
  const options: GridOptions = {
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

  return <UiGrid options={options} />;
}
```

### Web Components (Vanilla)

The grid's rendering engine is a framework-free custom element (`<ui-grid-element>`) built on `@ornery/ui-grid-core` with pure DOM rendering and Shadow DOM encapsulation. Both the Angular and React wrappers are thin bridges around this same element — they mount `<ui-grid-element>`, pass options, and project framework-specific templates into it via a slot-based portal system.

```bash
npm install @ornery/ui-grid-vanilla @ornery/ui-grid-core
```

No-bundler browser usage is supported by the browser bundle. It includes the core runtime and registers `<ui-grid-element>` when loaded:

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

When building from this repo, `npm run build:vanilla` writes that file to `projects/ui-grid-vanilla/dist/browser/ui-grid-element.js`. Use that browser bundle for static script-tag consumption; `projects/ui-grid-vanilla/dist/index.js` is CommonJS and `projects/ui-grid-vanilla/dist/index.mjs` is the package ESM entry for bundlers or import-map setups.

Declarative HTML usage:

```html
<ui-grid-element
  grid-id="vanilla-demo"
  title="Team Roster"
  enable-sorting
  enable-filtering
  column-defs='[
    { "name": "name" },
    { "name": "role" },
    { "name": "salary", "type": "number", "align": "end" }
  ]'
  data='[
    { "name": "Alice", "role": "Engineer", "salary": 120000 },
    { "name": "Bob", "role": "Designer", "salary": 95000 }
  ]'
>
</ui-grid-element>

<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

  await defineStandaloneUiGridElement(); // registers <ui-grid-element>
</script>
```

Supported declarative inputs include boolean flags (`enable-sorting`, `enable-filtering`), scalar attributes (`grid-id`, `title`, `row-height`), and JSON attributes (`column-defs`, `data`).

For callbacks, function-valued column definitions, or high-frequency updates, use the `options` property:

```typescript
import { mountVanillaUiGrid } from '@ornery/ui-grid-vanilla';

await mountVanillaUiGrid(document.getElementById('app'), {
  id: 'mounted-grid',
  data: [{ name: 'Alice', role: 'Engineer' }],
  columnDefs: [{ name: 'name' }, { name: 'role' }],
});
```

### Native Rust / egui

```toml
[dependencies]
ui-grid-egui = "0.1"
ui-grid-core = "0.1"
```

```rust
use ui_grid_egui::{EguiColumnExt, EguiGrid, GridThemePreset};
use ui_grid_core::models::{GridColumnDef, GridOptions};

let mut grid = EguiGrid::new();
let theme = GridThemePreset::DefaultDark.build();
let mut column_ext: Vec<EguiColumnExt> = vec![];

// Each frame, inside your egui UI:
grid.show(ui, &mut options, &columns, &mut column_ext, &theme);
```

To run the interactive demo app locally:

```bash
git clone https://github.com/orneryd/uiGrid.git
cd uiGrid
cargo run -p ui-grid-egui --example demo --release
```

See [docs/rust-egui.md](./docs/rust-egui.md) for pinning, CSV export, save/restore state, and custom column extensions.

### Native C / LVGL

The C adapter sits on top of the same Rust core and C ABI contract used by the other foreign bindings. The current demo uses LVGL with the SDL desktop backend.

Prerequisites:

- Rust 1.95+
- CMake 3.20+
- SDL2

```bash
brew install sdl2
cargo build -p ui-grid-c-abi
cmake -S crates/ui-grid-lvgl -B target/ui-grid-lvgl
cmake --build target/ui-grid-lvgl -j4
./target/ui-grid-lvgl/ui-grid-lvgl-demo
```

The LVGL demo currently exercises the native C grid shell with sorting, grouping, pinning, state save/restore, theme presets, live trading-row updates, and the shared projection/command contract.

---

## Features

- **Sorting** — click column headers to cycle asc/desc/none, custom comparators, programmatic API
- **Filtering** — per-column inputs with conditions: contains, exact, startsWith, endsWith, greaterThan, regex, custom predicates
- **Row Grouping** — nested multi-column grouping with collapsible group headers
- **Tree View** — hierarchical data with expand/collapse per node, arbitrary nesting depth
- **Expandable Rows** — master/detail pattern with custom templates (Angular `ng-template`, React render prop, or vanilla `<template>` slot)
- **Cell Editing** — inline spreadsheet-style editing with full keyboard navigation (Tab, Enter, Escape), edit-on-focus, Enter/Tab commit+move across editable columns
- **Keyboard Cell Navigation** — Arrow/Tab/Home/End navigation with wrap/clamp modes, focus persistence across re-renders, `keyDownOverrides` for custom key handling, full `gridApi.cellNav` surface
- **Row Selection** — click/shift/ctrl/drag-paint mouse selection, keyboard (Space, Ctrl+A), row-header checkbox column, select-all header, `isRowSelectable` hook, 13 options, 18 API methods, 3 events
- **Column Resizing** — drag column borders to resize, programmatic API, persisted via save/restore state
- **Row Edit** — dirty/saving/error row lifecycle with `rowEditWaitInterval` debounce, `setSavePromise` pattern, auto-retry on error, visual row state indicators
- **Cell Validation** — declarative per-column `validators` (built-in `required`, `minLength`, `maxLength` + custom), async validator support, invalid cell markers with error messages, `gridApi.validate` surface
- **Pagination** — client-side or external pagination with configurable page sizes
- **Infinite Scroll** — bi-directional infinite scrolling with loading state management, `needLoadMoreData`/`needLoadMoreDataTop` events, full public API
- **Column Pinning** — freeze columns left or right with CSS `position: sticky`, programmatic API, save/restore state
- **Column Moving** — HTML5 native drag-and-drop column reordering
- **CSV Export** — download visible/selected/all rows with formula-injection protection, full option matrix (separator, header filter, field callbacks, BOM compatibility)
- **Excel Export** — ExcelBuilder-compatible sheet data with native numeric/boolean types preserved, configurable filename/sheet/header/custom formatters
- **PDF Export** — pdfMake-ready document definition with orientation/page size/styles/header/footer/custom formatter, auto-download when pdfMake is available
- **CSV/JSON Import** — file picker or programmatic import, full CSV parser (quoted values, escaped quotes, CRLF), header-to-column mapping, integrates with row-edit for dirty marking
- **Export/Import Menu** — `buildGridExporterMenuItems()` with per-format and per-scope flags, i18n-driven menu labels
- **Virtual Scrolling** — virtual scroll viewport, auto-enabled at 40+ rows
- **Save/Restore State** — serialize and restore sort, filters, grouping, collapsed groups, pinning, column order, column widths, pagination, selection, focused cell, tree/expandable expansion, and scroll position (per-field opt-in flags)
- **Native Rust and C Grids** — shared Rust core with native Rust/egui and native C/LVGL adapters driven by the same projection and command contract
- **Auto Resize** — ResizeObserver-driven viewport height recalculation
- **Custom Cell Templates** — Angular `ng-template`, React `cellRenderers` map (per-column render functions), vanilla `<template>` slots with slot-based portal projection
- **Shadow DOM** — encapsulated styles with CSS custom property and `::part()` hooks
- **Web Component** — ships as `<ui-grid-element>`, a framework-free vanilla custom element (`@ornery/ui-grid-vanilla`); Angular and React wrappers mount this same element and project templates into it
- **Feature-Flag Builds** — compile-time tree-shaking of unused features
- **i18n** — 6 locales built-in (English, Spanish, French, German, Japanese, Simplified Chinese), runtime `gridApi.i18n` for language switching, fallback chain (`options.labels` → current locale → en-US), register additional locales via `gridApi.i18n.add()`
- **SSR Support** — server-side rendering with platform-safe guards

---

## Theming

The grid renders inside Shadow DOM. Customize it via the public `--ui-grid-*` CSS custom properties:

```css
.my-app {
  --ui-grid-surface: #1e1b2e;
  --ui-grid-accent: #8b5cf6;
  --ui-grid-header-background: #2d2640;
  --ui-grid-cell-color: #e2e0f0;
  --ui-grid-border-color: rgba(139, 92, 246, 0.2);
  --ui-grid-row-hover: #322e4a;
}
```

Legacy `--app-ui-grid-*` aliases remain supported as a fallback for older app themes, but new consumer theming should target only `--ui-grid-*`.

Target structural elements with `::part()`:

```css
app-ui-grid::part(header) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

See [docs/theming.md](./docs/theming.md) for the full CSS variable reference grouped by grid section, `::part()` hooks, and the demo app's 4-mode theme system.

---

## Custom Builds

Ship only the features you use:

```bash
# Only sorting and filtering — everything else is tree-shaken
node scripts/build-grid.mjs --features sorting,filtering

# Bake in a locale at build time
node scripts/build-grid.mjs --features sorting,filtering,pagination --locale i18n/fr-FR.json

# See all available flags
node scripts/build-grid.mjs --list
```

See [docs/custom-builds.md](./docs/custom-builds.md) for the full feature flag table and build presets.

---

## Documentation

| Guide                                        | Description                                            |
| -------------------------------------------- | ------------------------------------------------------ |
| [Getting Started](./docs/getting-started.md) | Install, minimal setup, run the demo                   |
| [Features](./docs/features.md)               | Overview of all features with code examples            |
| [Theming](./docs/theming.md)                 | CSS custom properties, `::part()` hooks, sample themes |
| [API Reference](./docs/api-reference.md)     | GridOptions, GridColumnDef, UiGridApi                  |
| [Cell Editing](./docs/cell-editing.md)       | Keyboard navigation, conditional editing, API          |
| [Tree View](./docs/tree-view.md)             | Hierarchical data, options, API                        |
| [Expandable Rows](./docs/expandable-rows.md) | Master/detail, template context, API                   |
| [Custom Builds](./docs/custom-builds.md)     | Feature flags, build presets, locale baking            |
| [Web Component](./docs/web-component.md)     | Vanilla `<ui-grid-element>` custom element usage       |
| [Internationalization](./docs/i18n.md)       | Runtime overrides, build-time locales                  |
| [Accessibility](./docs/accessibility.md)     | ARIA roles, keyboard navigation, screen reader support |
| [Rust / WASM](./docs/rust.md)                | Rust pipeline in Angular, React, and vanilla hosts     |
| [Rust / egui](./docs/rust-egui.md)           | Native egui adapter with pinning, export, save/restore |
| `README native C / LVGL section`             | Native C/LVGL build and demo run instructions          |

Interactive versions of all documentation are also available in the [live demo](https://orneryd.github.io/uiGrid/).

---

## Development

```bash
npm start          # Dev server at localhost:4200
npm test           # Run tests (Vitest)
npm run build      # Production build
npm run build:library   # Build the library (ng-packagr)
npm run build:rust:web  # Build the browser-native Rust/WASM artifact
npm run start:vanilla   # Run the Rust-backed browser demo at 127.0.0.1:4174
```

### Rust / egui

Requires [Rust 1.95+](https://rustup.rs/).

```bash
cargo test --workspace                                    # Run all Rust tests
cargo clippy --workspace --all-targets -- -D warnings     # Lint
cargo run -p ui-grid-egui --example demo --release        # Run the native egui demo app
```

### C / LVGL

Requires SDL2 plus the Rust/C ABI build.

```bash
brew install sdl2
cargo build -p ui-grid-c-abi
cmake -S crates/ui-grid-lvgl -B target/ui-grid-lvgl
cmake --build target/ui-grid-lvgl -j4
./target/ui-grid-lvgl/ui-grid-lvgl-demo                  # Run the native C/LVGL demo app
```

---

## Compatibility

| Dependency | Version |
| ---------- | ------- |
| Angular    | 21.2    |
| TypeScript | 5.9     |
| RxJS       | 7.8     |
| Node       | 22.20   |
| npm        | 11.11   |
| Rust       | 1.95+   |
| egui       | 0.34    |

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Run `npm test` to ensure all tests pass
4. Submit a pull request

---

## License

[MIT](./LICENSE.md)
