# @ornery/ui-grid (Angular) — Agent Instructions

Thin Angular wrapper. Mounts the vanilla `<ui-grid-element>` custom element and projects Angular `ng-template` views into it via the slot-based portal system.

## Build & Test

```bash
ng build uiGridPackage                  # ng-packagr → dist/ui-grid
ng test --watch=false                   # vitest via Angular CLI (48 tests)
```

Depends on `@ornery/ui-grid-core` + `@ornery/ui-grid-vanilla` — build both first.

## Key Files

| File | Responsibility |
|------|---------------|
| `src/lib/grid/ui-grid.component.ts` | `UiGridComponent` — the Angular wrapper |
| `src/lib/grid/ui-grid.component.scss` | Host element styles |
| `src/lib/grid/ui-grid.component.spec.ts` | Unit tests |

## Architecture

### Component Design

- **Standalone** component with `CUSTOM_ELEMENTS_SCHEMA`
- **OnPush** change detection — the vanilla element handles its own rendering
- **Signal inputs**: `options` input (signal-based)
- **Output**: `apiReady` emits the `UiGridApi` instance

### Template Projection Flow

1. Angular `columnDefs` may include `cellTemplate` (a `TemplateRef<GridCellTemplateContext>`)
2. `applyOptions()` extracts template columns, strips `cellTemplate` before passing to the element
3. Calls `el.setFrameworkRenderedSlots({ cells: templateColumnNames })` on structural change
4. Listens for `cellSlotsChanged` (CustomEvent) on the vanilla element
5. For each added slot: `templateRef.createEmbeddedView(context)` → `appRef.attachView` → append root nodes to a `<span slot="...">` in light DOM
6. For each removed slot: detach + destroy the view

### `onCellSlotsChanged` Handler

- Creates `EmbeddedViewRef` for each added slot
- Calls `detectChanges()` on the new view immediately
- Appends view root nodes wrapped in `<span slot="slotName">`
- Tracks views in `slotViews` Map keyed by slot name

### Data-Only Updates

When `options` change but template columns haven't changed structurally, `updateSlotViewContexts()` patches existing view contexts in-place (`$implicit`, `value`, `row`) and calls `detectChanges()` on each — no slot add/remove.

## Conventions

- `zone.runOutsideAngular` for vanilla element creation and options application (no zone needed for DOM writes to the custom element)
- `zone.run()` for `apiReady` emission (so Angular change detection picks it up)
- Never call `setFrameworkRenderedSlots` unless template columns structurally changed

## Do NOT

- Add `zone.run()` around the `cellSlotsChanged` handler — the vanilla element fires these during render, Angular views don't need zone for initial creation
- Import Angular Elements (`@angular/elements`) — that build target was removed
- Reference `dist/` paths — use tsconfig path mappings
- Call `setFrameworkRenderedSlots` on every `applyOptions` — only when column set changes
- Skip `appRef.attachView()` for created views — they won't get change detection otherwise
