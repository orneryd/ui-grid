# Features

Every feature is included free and open source. No enterprise tier, no license keys. Features can be individually tree-shaken at build time via compile-time feature flags.

## Feature Overview

| Feature            | Option Flag                 | Default | Description                                                         |
| ------------------ | --------------------------- | ------- | ------------------------------------------------------------------- |
| Sorting            | `enableSorting`             | `true`  | Click column headers to cycle asc / desc / none                     |
| Filtering          | `enableFiltering`           | `true`  | Per-column filter inputs with configurable conditions               |
| Row Grouping       | `enableGrouping`            | `false` | Nested multi-column grouping with collapsible headers               |
| Tree View          | `enableTreeView`            | `false` | Hierarchical data with expand/collapse per node                     |
| Expandable Rows    | `enableExpandable`          | `false` | Master/detail pattern with custom Angular templates                 |
| Cell Editing       | `enableCellEdit`            | `false` | Inline spreadsheet-style editing with keyboard nav                  |
| Pagination         | `enablePagination`          | `false` | Client-side or external pagination                                  |
| Infinite Scroll    | `infiniteScrollRowsFromEnd` | —       | Bi-directional infinite scroll with loading state                   |
| Column Moving      | `enableColumnMoving`        | `false` | Drag-and-drop column reordering                                     |
| CSV Export         | `gridApi.core.exportCsv()`  | —       | Export visible rows with formula-injection protection               |
| Virtual Scrolling  | `enableVirtualization`      | auto    | virtual scroll, auto-enabled at 40+ rows                            |
| Save/Restore State | `gridApi.saveState`         | —       | Serialize sort, filter, grouping, pagination, expansion state       |
| Auto Resize        | `enableAutoResize`          | `false` | ResizeObserver-driven viewport height recalculation                 |
| Custom Templates   | `cellTemplate`              | —       | Angular ng-template for fully custom cell rendering                 |
| Shadow DOM         | always                      | —       | Encapsulated styles with CSS custom property and `::part()` hooks   |
| Web Component      | `npm run build:vanilla`     | —       | Ship as `<ui-grid-element>` for package or no-bundler browser usage |
| SSR Support        | automatic                   | —       | Server-side rendering with platform-safe guards                     |
| i18n               | `labels`                    | en-US   | Override any UI string at runtime or bake in a locale at build time |

## Sorting

- Enabled by default (`enableSorting: true`)
- Click a column header to cycle: none → ascending → descending → none
- Per-column disable: `column.sortable = false`
- Custom comparator: `column.sortingAlgorithm = (a, b) => number`
- Programmatic: `gridApi.core.sortColumn('name', 'asc')`

## Filtering

- Enabled by default (`enableFiltering: true`)
- Built-in conditions: `contains`, `startsWith`, `endsWith`, `exact`, `notEqual`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`
- Wildcard support: terms with `*` auto-compile to regex
- Custom predicates: `column.filter.condition = (term, value, row, column) => boolean`
- RegExp conditions: `column.filter.condition = /pattern/i`

## Row Grouping

- Requires `enableGrouping: true`
- Multiple columns: `grouping: { groupBy: ['status', 'company'] }`
- Start collapsed: `grouping: { startCollapsed: true }`
- Per-column disable: `column.enableGrouping = false`
- Mutually exclusive with Tree View

## Compile-Time Feature Flags

Build custom bundles with only the features you need:

```bash
node scripts/build-grid.mjs --features sorting,filtering
```

Disabled features compile to `false` constants — the bundler tree-shakes all guarded code paths. See [Custom Builds](./custom-builds.md) for details.
