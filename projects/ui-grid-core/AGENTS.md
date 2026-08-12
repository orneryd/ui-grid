# @ornery/ui-grid-core — Agent Instructions

Pure TypeScript grid engine. Zero DOM dependencies. Provides the pipeline, sorting, filtering, grouping, pagination, cell editing, validation, export/import, infinite scroll, selection, tree-view, and i18n systems.

## Build & Test

```bash
npm run build:core           # tsup → dist/
npm test --prefix projects/ui-grid-core   # vitest (154 tests)
```

## Key Modules

| File | Responsibility |
|------|---------------|
| `grid.models.ts` | All shared interfaces (`GridOptions`, `GridColumnDef`, `GridRecord`, etc.) |
| `grid.api.ts` | `UiGridApi` — the public event/method surface consumers use |
| `grid.core.pipeline.ts` | Row pipeline: filter → sort → group → tree → paginate → virtualize |
| `grid.core.viewmodel.ts` | Pure functions: `gridColumnWidth`, `gridCellIndent`, display value formatting |
| `grid.core.filtering.ts` | Filter predicate logic |
| `grid.core.grouping.ts` | Group-by column aggregation |
| `grid.core.edit.ts` | Cell edit begin/commit/cancel commands |
| `grid.core.export.ts` | CSV/PDF export pipeline |
| `grid.core.i18n.ts` | Label resolution (`resolveGridLabels`) |
| `grid.core.selection.ts` | Row selection state machine |
| `grid.core.infinite-scroll.ts` | Infinite scroll state + direction management |
| `grid.core.validate.ts` | Cell validation registry |
| `grid.core.save-state.ts` | Save/restore grid state |
| `grid.constants.ts` | `SORT_DIRECTIONS`, feature-flag helpers |

## Architecture Rules

- **No DOM.** This package must never import browser APIs. It runs in Node, WASM, and browser alike.
- **Pure functions preferred.** State lives in the controller (vanilla package); core provides stateless transforms.
- **`GridOptions` is the source of truth.** Every feature is toggled via `enable*` booleans on `GridOptions`.
- **Pipeline is composable.** `defaultGridEngine.buildPipeline()` chains all transforms; the result is a `PipelineResult` with `displayItems` and `visibleRows`.

## Adding a Feature

1. Define types in `grid.models.ts`.
2. Add the pure logic in a new `grid.core.<feature>.ts` file.
3. Wire it into the pipeline in `grid.core.pipeline.ts` if it affects row visibility/order.
4. Expose API events/methods in `grid.api.ts`.
5. Export everything from the barrel `index.ts`.
6. The vanilla controller consumes the new exports; core never consumes vanilla.

## Do NOT

- Add DOM or browser imports
- Mutate input arrays — always return new arrays/objects
- Add default exports — use named exports only
- Break the build order: core has no internal monorepo deps
