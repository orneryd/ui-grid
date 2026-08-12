# @ornery/ui-grid-vanilla

A vanilla Web Components wrapper for `@ornery/ui-grid-core`. Renders a high-performance data grid as a custom element with no framework dependency.

## Architecture

The grid is built as a composition of autonomous custom elements, each following the `@ornery/web-components` pattern:

```
<ui-grid-element>                  ← main grid element (shadow DOM)
  ├── ui-grid-shell.html           ← declarative grid layout template
  ├── ui-grid-empty.html           ← empty/no-options state template
  │
  ├── <ui-grid-header-cell>        ← column header (sort, group, pin, resize)
  ├── <ui-grid-filter-cell>        ← column filter input (shadow DOM + .html template)
  ├── <ui-grid-body-cell>          ← data cell (class-managed, perf-optimized)
  ├── <ui-grid-group-row>          ← grouping disclosure row (shadow DOM + .html template)
  ├── <ui-grid-pagination>         ← pagination controls (shadow DOM + .html template)
  └── <ui-grid-template>           ← declarative reusable template factory
```

### Component Pattern

Components follow the standard `@ornery/web-components` lifecycle:

```js
import template from './my-component.html';

class MyComponent extends HTMLElement {
  // 1. Attach shadow DOM in constructor
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // 2. Declare instance properties as template context
  myProp = 'default';

  // 3. Render in connectedCallback
  connectedCallback() {
    this.myProp = this.getAttribute('data-my-prop') ?? 'default';
    template(this).connect(); // auto-renders into shadowRoot
  }
}
```

The `.html` template uses ES6 template literal syntax:

```html
<div class="my-class">${this.myProp}</div>
```

Templates are compiled at build time by `@ornery/web-components/vite` (or `/webpack`, `/esbuild`, `/rollup`).

### Performance Strategy

- **Hot-path components** (`ui-grid-body-cell`, `ui-grid-header-cell`) skip `template().connect()` entirely — the parent pre-renders innerHTML as a string, and the component only manages CSS classes via `attributeChangedCallback`. This avoids DOM construction overhead per cell.
- **Low-frequency components** (`ui-grid-filter-cell`, `ui-grid-group-row`, `ui-grid-pagination`) use full `template(this).connect()` with shadow DOM for encapsulation and declarative rendering.

### Template Bindings

Cell and row slot templates support dual binding syntax:

| Syntax  | Example         | Description                                           |
| ------- | --------------- | ----------------------------------------------------- |
| `{{ }}` | `{{value}}`     | Mustache-style, original grid syntax                  |
| `${ }`  | `${this.value}` | ES6 template literal, `@ornery/web-components` native |

Both resolve against the same context: `{ $implicit, value, valueText, row, column, rowIndex }`.

## Installation

```bash
npm install @ornery/ui-grid-vanilla @ornery/ui-grid-core
```

## Usage

### No-Bundler Browser Usage

Use the browser bundle when a static HTML host needs to consume the grid without Vite, Webpack, tsup, or another package-aware build step. The bundle includes `@ornery/ui-grid-core` and registers `<ui-grid-element>` when the module loads.

After `npm run build:vanilla` from the repo root, the browser-ready file is written to `projects/ui-grid-vanilla/dist/browser/ui-grid-element.js`.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>UI Grid Browser Bundle</title>
    <script type="module" src="./ui-grid-element.js"></script>
  </head>
  <body>
    <ui-grid-element
      grid-id="static-grid"
      enable-sorting
      enable-filtering
      column-defs='[{"name":"name"},{"name":"role"},{"name":"salary","type":"number","align":"end"}]'
      data='[{"name":"Alice","role":"Engineer","salary":120000},{"name":"Bob","role":"Designer","salary":95000}]'
    >
    </ui-grid-element>
  </body>
</html>
```

For imperative setup in the same no-bundler environment, import from that same file:

```html
<div id="grid"></div>

<script type="module">
  import { mountVanillaUiGrid } from './ui-grid-element.js';

  await mountVanillaUiGrid(document.querySelector('#grid'), {
    id: 'static-mounted-grid',
    columnDefs: [{ name: 'name' }, { name: 'role' }],
    data: [{ name: 'Alice', role: 'Engineer' }],
    enableSorting: true,
    enableFiltering: true,
  });
</script>
```

The package `dist/index.js` file is CommonJS for Node/package consumers, and `dist/index.mjs` is package ESM for bundlers or import-map setups. Use `dist/browser/ui-grid-element.js` for direct browser loading.

### Imperative (JavaScript)

```js
import { mountVanillaUiGrid } from '@ornery/ui-grid-vanilla';

const grid = await mountVanillaUiGrid(document.getElementById('grid'), {
  id: 'my-grid',
  columnDefs: [
    { name: 'name', field: 'name', displayName: 'Name' },
    { name: 'age', field: 'age', displayName: 'Age', align: 'end' },
  ],
  data: [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ],
  enableSorting: true,
  enableFiltering: true,
});
```

### Declarative (HTML attributes)

```html
<ui-grid-element
  grid-id="my-grid"
  enable-sorting
  enable-filtering
  column-defs='[{"name":"name","field":"name"},{"name":"age","field":"age","align":"end"}]'
  data='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
>
</ui-grid-element>
```

### Custom Cell Templates (slots)

```html
<ui-grid-element id="grid">
  <!-- Mustache syntax -->
  <template slot="cell-name">
    <strong>{{value}}</strong>
  </template>

  <!-- ES6 syntax -->
  <template slot="cell-age">
    <span style="color: ${this.value > 30 ? 'red' : 'green'}">${this.value}</span>
  </template>
</ui-grid-element>
```

### Declarative Reusable Templates

Define reusable components from HTML alone with `<template is="ui-grid-template">`:

```html
<!-- Define a badge component -->
<template is="ui-grid-template" name="ui-status-badge" status="unknown">
  <style>
    :host {
      display: inline-block;
    }
    .badge {
      padding: 2px 8px;
      border-radius: 4px;
    }
    .badge-active {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-inactive {
      background: #fee2e2;
      color: #991b1b;
    }
  </style>
  <span class="badge badge-${this.status}">${this.status}</span>
</template>

<!-- Use it in a grid cell slot -->
<ui-grid-element>
  <template slot="cell-status">
    <ui-status-badge status="{{value}}"></ui-status-badge>
  </template>
</ui-grid-element>
```

## Bundler Setup

### Vite

```js
import { defineConfig } from 'vite';
import webComponents from '@ornery/web-components/vite';

export default defineConfig({
  plugins: [webComponents()],
});
```

### Webpack 5

```js
import webComponents from '@ornery/web-components/webpack';

export default {
  plugins: [webComponents()],
};
```

### tsup (esbuild)

```ts
import { defineConfig } from 'tsup';
import webComponents from '@ornery/web-components/esbuild';

export default defineConfig({
  esbuildPlugins: [webComponents()],
});
```

## API

### `mountVanillaUiGrid(target, options, rustModule?, tagName?)`

Mount a grid into a target element. Returns the grid element.

### `defineStandaloneUiGridElement(tagName?)`

Register the `<ui-grid-element>` custom element (and all sub-components).

### `UIGridTemplate`

Exported class for the `<template is="ui-grid-template">` element. Auto-registered when the grid is defined.

### Grid Element Properties

See `VanillaUiGridElement` type — all `GridOptions` fields are available as both HTML attributes and JS properties.
