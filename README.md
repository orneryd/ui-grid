[![CI](https://github.com/orneryd/ui-grid/actions/workflows/ci.yml/badge.svg)](https://github.com/orneryd/ui-grid/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/orneryd/ui-grid/badge.svg?branch=main)](https://coveralls.io/github/orneryd/ui-grid?branch=main)
[![npm](https://img.shields.io/npm/v/@ornery/ui-grid)](https://www.npmjs.com/package/@ornery/ui-grid)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE.md)

#### [Discord Community](https://discord.gg/Baz4w8ZWN)

# UI Grid — 5.x

**The modern web data grid for Angular, React, and Web Components. Every feature is free and open source.**

Rust, WASM implementation, egui, and native adapter source and documentation live in [orneryd/uiGrid](https://github.com/orneryd/uiGrid).

v5.x + is in use by my other project, [NornicDB](https://github.com/orneryd/NornicDB), in the web ui components (It's a high-performance golang graph+vector database if you want to take a look)

A from-scratch rewrite of the original by the original author. Same `gridOptions` / `columnDefs` / `onRegisterApi` api surface, modern Angular signals internals, and zero legacy baggage.

Just like the original grid, it will **NEVER** be monetized. This is purely my contribution to the greater community.

It proves that the datagrid cabal wants you to think it's hard to write a data grid. Well, it's not, and nobody should be paying to group data.

**[Live Demo & Docs](https://orneryd.github.io/ui-grid/)** | **[npm](https://www.npmjs.com/package/@ornery/ui-grid)** | **[Rust Project](https://github.com/orneryd/uiGrid)** | **[Used by NornicDB](https://orneryd.github.io/NornicDB/)**

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

| Guide                                             | Description                                            |
| ------------------------------------------------- | ------------------------------------------------------ |
| [Getting Started](./docs/getting-started.md)      | Install, minimal setup, run the demo                   |
| [Features](./docs/features.md)                    | Overview of all features with code examples            |
| [Theming](./docs/theming.md)                      | CSS custom properties, `::part()` hooks, sample themes |
| [API Reference](./docs/api-reference.md)          | GridOptions, GridColumnDef, UiGridApi                  |
| [Cell Editing](./docs/cell-editing.md)            | Keyboard navigation, conditional editing, API          |
| [Tree View](./docs/tree-view.md)                  | Hierarchical data, options, API                        |
| [Expandable Rows](./docs/expandable-rows.md)      | Master/detail, template context, API                   |
| [Custom Builds](./docs/custom-builds.md)          | Feature flags, build presets, locale baking            |
| [Web Component](./docs/web-component.md)          | Vanilla `<ui-grid-element>` custom element usage       |
| [Internationalization](./docs/i18n.md)            | Runtime overrides, build-time locales                  |
| [Accessibility](./docs/accessibility.md)          | ARIA roles, keyboard navigation, screen reader support |
| [Rust Project](https://github.com/orneryd/uiGrid) | Rust/WASM implementation, egui, and native adapters    |

Interactive versions of all web documentation are also available in the [live demo](https://orneryd.github.io/ui-grid/).

---

## Development

```bash
npm start          # Dev server at localhost:4200
npm test           # Run tests (Vitest)
npm run build      # Production build
npm run build:library   # Build the library (ng-packagr)
npm run start:vanilla   # Run the framework-neutral browser demo at 127.0.0.1:4174
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


## 🌐 Web Resources & Interactive Index
- [FOOD TRUCK CHEF](https://learnaction.github.io/food-truck-chef.html)
- [CATEGORY CASUAL 9](https://welearnaction.onrender.com/category-casual-9.html)
- [CATEGORY CLASSIC98](https://welearnaction.onrender.com/category-classic98.html)
- [CATEGORY ARMY40](https://welearnaction.onrender.com/category-army40.html)
- [CATEGORY CUTE62](https://welearnaction.onrender.com/category-cute62.html)
- [CATEGORY CONTROLLER](https://welearnaction.onrender.com/category-controller.html)
- [CATEGORY BASKETBALL](https://welearnaction.onrender.com/category-basketball.html)
- [CATEGORY BUILDING182](https://welearnaction.onrender.com/category-building182.html)
- [CATEGORY LOVE12](https://learnaction.netlify.app/category-love12.html)
- [CATEGORY CASUAL971](https://welearnaction.onrender.com/category-casual971.html)
- [CATEGORY CASUAL](https://welearnaction.onrender.com/category-casual.html)
- [STICKMAN ROGUE ONLINE](https://learnaction.netlify.app/stickman-rogue-online.html)
- [IMPOSTOR AMONG SPACE](https://learnaction.netlify.app/impostor-among-space.html)
- [CATEGORY MAHJONG 2](https://learnaction.netlify.app/category-mahjong-2.html)
- [CATEGORY TOWER DEFENSE](https://welearnaction.onrender.com/category-tower-defense.html)
- [CATEGORY TETRIS36](https://learnaction.netlify.app/category-tetris36.html)
- [CATEGORY SHOP49](https://welearnaction.onrender.com/category-shop49.html)
- [CATEGORY COLOR195](https://welearnaction.onrender.com/category-color195.html)
- [CATEGORY BATTLE524](https://welearnaction.onrender.com/category-battle524.html)
- [CATEGORY ANIMAL](https://welearnaction.onrender.com/category-animal.html)
- [BILLIARD DIAMOND CHALLENGE](https://learnaction.netlify.app/billiard-diamond-challenge.html)
- [CATEGORY RACING127](https://welearnaction.onrender.com/category-racing127.html)
- [CATEGORY SIMULATION 3](https://welearnaction.onrender.com/category-simulation-3.html)
- [STAND ON THE RIGHT COLOR ROBBY](https://learnaction.netlify.app/stand-on-the-right-color-robby.html)
- [MERGE SMITH](https://learnaction.netlify.app/merge-smith.html)
- [WORDLING DAILY WORD CHALLENGE](https://learnaction.netlify.app/wordling-daily-word-challenge.html)
- [CATEGORY MOBILE2 095](https://welearnaction.onrender.com/category-mobile2-095.html)
- [CATEGORY FOOTBALL](https://welearnaction.onrender.com/category-football.html)
- [CATEGORY PUZZLE 2](https://learnaction.netlify.app/category-puzzle-2.html)
- [CATEGORY PLATFORM258](https://learnaction.netlify.app/category-platform258.html)
- [CATEGORY MANAGEMENT](https://learnaction.netlify.app/category-management.html)
- [CATEGORY MATCH 3](https://learnaction.netlify.app/category-match-3.html)
- [CATEGORY CAR376](https://welearnaction.onrender.com/category-car376.html)
- [TOWER OF HELL OBBY BLOX](https://learnaction.netlify.app/tower-of-hell-obby-blox.html)
- [CATEGORY SNIPER39](https://learnaction.netlify.app/category-sniper39.html)
- [CATEGORY ESCAPE 2](https://learnaction.netlify.app/category-escape-2.html)
- [CATEGORY CASUAL 2](https://welearnaction.onrender.com/category-casual-2.html)
- [CATEGORY HORROR](https://learnaction.netlify.app/category-horror.html)
- [CATEGORY DRESS UP](https://welearnaction.onrender.com/category-dress-up.html)
- [FLYORDIEIO](https://learnaction.netlify.app/flyordieio.html)
- [ULTIMATE YATZY](https://learnaction.netlify.app/ultimate-yatzy.html)
- [CATEGORY DIRT BIKE](https://welearnaction.onrender.com/category-dirt-bike.html)
- [FARM DEFENSE](https://learnaction.netlify.app/farm-defense.html)
- [CATEGORY DEEP IMMERSIVE24](https://welearnaction.onrender.com/category-deep-immersive24.html)
- [CATEGORY MINECRAFT](https://welearnaction.onrender.com/category-minecraft.html)
- [CATEGORY FPS 2](https://welearnaction.onrender.com/category-fps-2.html)
- [CATEGORY SHOOTER](https://welearnaction.onrender.com/category-shooter.html)
- [CATEGORY SHOOTER 2](https://learnaction.netlify.app/category-shooter-2.html)
- [CARD QUEST 10 MINUTE ADVENTURE](https://learnaction.netlify.app/card-quest-10-minute-adventure.html)
- [ZOMBIE RODEO MULTIPLICATION](https://learnaction.netlify.app/zombie-rodeo-multiplication.html)
- [MERGE BALLS SHOOTER 2048 CONNECT FRUITS](https://learnaction.netlify.app/merge-balls-shooter-2048-connect-fruits.html)
- [CATEGORY RACING DRIVING](https://welearnaction.onrender.com/category-racing-driving.html)
- [CATEGORY TOWER DEFENSE 2](https://welearnaction.onrender.com/category-tower-defense-2.html)
- [EASTER GLAMPING TRIP](https://learnaction.netlify.app/easter-glamping-trip.html)
- [HAMSTERCYCLE](https://learnaction.netlify.app/hamstercycle.html)
- [TOWER DEFENSE DRAGON MERGE](https://learnaction.netlify.app/tower-defense-dragon-merge.html)
- [I AM SECURITY](https://learnaction.netlify.app/i-am-security.html)
- [CATEGORY IDLE GAMES](https://learnaction.netlify.app/category-idle-games.html)
- [IMAGE CROSSWORD](https://learnaction.netlify.app/image-crossword.html)
- [CYBERPUNK CITY FASHION](https://learnaction.netlify.app/cyberpunk-city-fashion.html)
- [CATEGORY BIKE63](https://welearnaction.onrender.com/category-bike63.html)
- [SUMMER MAZE](https://learnaction.netlify.app/summer-maze.html)
- [PUSH PUSH CAT](https://learnaction.netlify.app/push-push-cat.html)
- [FREDDYS NIGHTMARES RETURN HORROR NEW YEAR](https://learnaction.netlify.app/freddys-nightmares-return-horror-new-year.html)
- [HAPPY FLUFFY CUBES](https://learnaction.netlify.app/happy-fluffy-cubes.html)
- [COFFEE COLOR BLOCKS](https://learnaction.netlify.app/coffee-color-blocks.html)
- [CATEGORY RACING127](https://learnaction.netlify.app/category-racing127.html)
- [MY KITTIES CATWORLD](https://learnaction.netlify.app/my-kitties-catworld.html)
- [MERRY CHRISTMAS STICKMAN](https://learnaction.netlify.app/merry-christmas-stickman.html)
- [OVERTIDE IO](https://learnaction.netlify.app/overtide-io.html)
- [CATEGORY GUN238](https://learnaction.netlify.app/category-gun238.html)
- [CATEGORY PENALTY16](https://welearnaction.onrender.com/category-penalty16.html)
- [CATEGORY THINKY](https://learnaction.netlify.app/category-thinky.html)
- [COLOR BLOCK BLAST 3](https://learnaction.netlify.app/color-block-blast-3.html)
- [MONEY MAN 3D](https://learnaction.netlify.app/money-man-3d.html)
- [SWORD AND SPIN](https://learnaction.netlify.app/sword-and-spin.html)
- [RED STICKMAN VS CRAFTMANS 2](https://learnaction.netlify.app/red-stickman-vs-craftmans-2.html)
- [CATEGORY FLASH 2](https://welearnaction.onrender.com/category-flash-2.html)
- [CATEGORY SPEED158](https://welearnaction.onrender.com/category-speed158.html)
- [CATEGORY PREMIUM PERKS71](https://welearnaction.onrender.com/category-premium-perks71.html)
- [GRENADE SIMULATOR](https://learnaction.netlify.app/grenade-simulator.html)
- [ACADEMY ASSAULT](https://learnaction.netlify.app/academy-assault.html)
- [TAILOR STYLIST FASHION DIARY](https://learnaction.netlify.app/tailor-stylist-fashion-diary.html)
- [TRUE LOVE CALCULATOR NZW](https://learnaction.netlify.app/true-love-calculator-nzw.html)
- [ROOM SORT FLOOR PLAN](https://learnaction.netlify.app/room-sort-floor-plan.html)
- [SITEMAP](https://thequizzone.pages.dev/sitemap.html)
- [CATEGORY CONTROLLER 2](https://welearnaction.onrender.com/category-controller-2.html)
- [CATEGORY BIKE 2](https://welearnaction.onrender.com/category-bike-2.html)
- [ONLINE PORTAL](https://ilearnworldpt.pages.dev/)
- [MOJICON SPRING CONNECT](https://learnaction.netlify.app/mojicon-spring-connect.html)
- [CATEGORY STUNT128](https://welearnaction.onrender.com/category-stunt128.html)
- [BLOCK PIXEL GUN APOCALYPSE 3](https://learnaction.netlify.app/block-pixel-gun-apocalypse-3.html)
- [CATEGORY CASUAL 9](https://learnaction.netlify.app/category-casual-9.html)
- [CATEGORY 1 PLAYER139](https://learnaction.netlify.app/category-1-player139.html)
- [CATEGORY CAR 2](https://welearnaction.onrender.com/category-car-2.html)
- [INDEX8](https://learnaction.github.io/index8.html)
- [INDEX10](https://welearnaction.onrender.com/index10.html)
- [ONLINE PORTAL](https://studyquests.pages.dev/)
- [CATEGORY ADVENTURE 3](https://welearnaction.onrender.com/category-adventure-3.html)
- [VR WORLD](https://welearnaction.onrender.com/vr-world.html)
- [NUMBER MASTER](https://learnaction.netlify.app/number-master.html)
- [HARVESTING VEGGIES](https://learnaction.netlify.app/harvesting-veggies.html)
- [SAVE HER TOUR](https://welearnaction.onrender.com/save-her-tour.html)
- [CATEGORY BATTLESHIP19](https://learnaction.netlify.app/category-battleship19.html)
- [PRIVACY](https://cryptotify.netlify.app/privacy.html)
- [CATEGORY CASUAL971](https://learnaction.github.io/category-casual971.html)
- [CATEGORY IO](https://learnaction.github.io/category-io.html)
- [CATEGORY 3D1 371](https://learnaction.github.io/category-3d1-371.html)
- [DIGWORM IO](https://welearnaction.onrender.com/digworm-io.html)
- [SNOW RACE 3D FUN RACING](https://learnaction.netlify.app/snow-race-3d-fun-racing.html)
- [CATEGORY CONTROLLER 2](https://learnaction.github.io/category-controller-2.html)
- [CATEGORY SOCCER 2](https://learnaction.netlify.app/category-soccer-2.html)
- [CATEGORY CASUAL](https://learnaction.github.io/category-casual.html)
- [MAHJONG PET QUEST](https://welearnaction.onrender.com/mahjong-pet-quest.html)
- [FNF UNBLOCKED ITALIAN BRAINROT](https://learnaction.netlify.app/fnf-unblocked-italian-brainrot.html)
- [ROOM SORT FLOOR PLAN](https://welearnaction.onrender.com/room-sort-floor-plan.html)
- [SCARY BABY YELLOW GAME](https://learnaction.netlify.app/scary-baby-yellow-game.html)
- [MAX CRUSHER CRAZY DESTRUCTION AND CAR CRASHES](https://learnaction.netlify.app/max-crusher-crazy-destruction-and-car-crashes.html)
- [CATEGORY BOARDGAMES](https://learnaction.github.io/category-boardgames.html)
- [FIND OBJECTS HIDDEN ITEM](https://welearnaction.onrender.com/find-objects-hidden-item.html)
- [CATEGORY BALL175](https://welearnaction.onrender.com/category-ball175.html)
- [CONTACT](https://learnaction.github.io/contact.html)
- [INDEX15](https://welearnaction.onrender.com/index15.html)
- [SITEMAP](https://ilearnworldjp.pages.dev/sitemap.html)
- [BRAINROT MOB CLASH 3D](https://learnaction.netlify.app/brainrot-mob-clash-3d.html)
- [2048 BLOCKS DESTRUCTION](https://welearnaction.onrender.com/2048-blocks-destruction.html)
- [MAGE AND MONSTERS](https://welearnaction.onrender.com/mage-and-monsters.html)
- [CATEGORY PARTY23](https://welearnaction.onrender.com/category-party23.html)
- [GROW WARSIO](https://welearnaction.onrender.com/grow-warsio.html)
- [PRIVACY](https://ilearnworldjp.pages.dev/privacy.html)
