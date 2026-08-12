# @ornery/ui-grid-vanilla — Agent Instructions

The rendering engine. A framework-free custom element (`<ui-grid-element>`) that owns the Shadow DOM, CSS Grid layout, event handling, and the `VanillaGridController` state machine. Angular and React wrappers mount this element — they never render cells themselves.

## Build & Test

```bash
npm run build --prefix projects/ui-grid-vanilla   # tsup → dist/
npm test --prefix projects/ui-grid-vanilla        # vitest (138 tests)
```

Depends on `@ornery/ui-grid-core` — build core first.

## Key Files

| File | Responsibility |
|------|---------------|
| `grid-controller.ts` | `VanillaGridController` — all mutable grid state, snapshot emission, column width calculation |
| `ui-grid-standalone.element.ts` | Custom element class: lifecycle, render orchestration, scroll handling, ResizeObserver |
| `render.ts` | HTML string builders for header/filter/body cells |
| `patch.ts` | DOM-diffing fast path: patches existing shadow DOM without full re-render |
| `events.ts` | All event listeners: click, mousedown (resize drag), dblclick (auto-fit), keydown, scroll, drag-and-drop |
| `focus.ts` | CellNav focus management, `measureAutoColumnWidth` |
| `framework-slots.ts` | `FrameworkSlotBridge` — stages slot add/remove deltas, `flush()` dispatches `cellSlotsChanged` |
| `attribute-bridge.ts` | Parses HTML attributes into `GridOptions` |
| `templates/index.ts` | Markup fragment helpers (filterRow, bodyVirtual, bodyStatic) |
| `ui-grid-shell.template.ts` | Full shell template (grid-frame → grid-table → header-strip + filter-strip + body-viewport) |

## Architecture

### Render Paths

1. **`renderFull`** — Full innerHTML swap of the shadow DOM shell. Used on structure changes (column add/remove, virtualization toggle).
2. **`renderPatch`** — In-place DOM mutation. Header grid-template-columns, filter cells, body rows patched individually. Preserves focus and scroll.
3. **`renderVirtualBody`** — Scroll-triggered fast path. Only replaces `.grid-virtual-body` innerHTML + calls `frameworkSlots.flush()`.
4. **`patchCells`** — Data-only update. Iterates existing body cells, updates `.cell-content` innerHTML.

### Column Width (drawnWidth)

Column widths are resolved to **fixed pixel values** by `buildGridTemplateColumns()`, mirroring the old ui-grid's `updateColumnWidths`/`drawnWidth` approach:

- Fixed-px columns: used as-is
- Percentage columns: resolved against viewport width
- Flex columns (default `minmax(11rem, 1fr)`): remaining space divided equally, minimum 176px
- Selection row-header: fixed at configured width, not resizable

The element feeds its measured width to the controller via `setViewportWidth()`. The ResizeObserver keeps it current.

### State Management

`setOptions()` must NOT clobber interactive state. The controller tracks `lastOptions*` values and only applies declarative state when the consumer's value structurally changed. Interactive state that survives `setOptions`: sort, filters, expanded rows, selection, pagination, cell navigation, column widths, column order.

### Framework Slot System

1. Wrapper calls `setFrameworkRenderedSlots({ cells: ['colA', 'colB'] })`
2. Render emits `<slot name="cell-colA-rowId">` placeholders
3. `flush()` dispatches `cellSlotsChanged` with `{ added, removed }` deltas
4. Wrapper listens, creates framework views, appends to light DOM with matching `slot` attribute

## Per-Column Flags

- `enableColumnResizing: false` — no resize handle rendered, column width locked
- `enableColumnMoving: false` — not draggable, not a valid drop target

## Do NOT

- Skip `frameworkSlots.flush()` after rendering DOM that contains slot placeholders
- Call `setFrameworkRenderedSlots` on every options update — only on structural column changes
- Use `innerHTML` on `.grid-body-viewport` — it destroys scroll position; only patch inside `.body-grid`
- Forget to sync horizontal scroll after a full render (`syncHeaderHorizontalScroll`)
