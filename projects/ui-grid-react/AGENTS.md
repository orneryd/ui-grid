# @ornery/ui-grid-react — Agent Instructions

Thin React wrapper. Mounts the vanilla `<ui-grid-element>` custom element and projects React render functions into it via the slot-based portal system.

## Build & Test

```bash
npm run build --prefix projects/ui-grid-react   # tsup → dist/
npm test --prefix projects/ui-grid-react        # vitest (18 tests)
```

Depends on `@ornery/ui-grid-core` + `@ornery/ui-grid-vanilla` — build both first.

## Key Files

| File | Responsibility |
|------|---------------|
| `UiGrid.tsx` | React component wrapping the vanilla element |
| `mountUiGrid.tsx` | Imperative mount API: `mountUiGrid(host, { options, cellRenderers })` |
| `vanillaAdapter.ts` | Bridges React lifecycle to the vanilla element (options, event listeners) |
| `useGridState.ts` | React hook for grid state subscription |
| `useVirtualScroll.ts` | Virtual scroll hook |
| `gridStateMath.ts` | Pure math for grid layout calculations |
| `rustWasmGridEngine.ts` | Optional WASM engine integration |
| `ui-grid.css` | Wrapper-level styles |

## Architecture

### Mount Pattern

```tsx
mountUiGrid(hostElement, {
  options: gridOptions,
  cellRenderers: {
    status: ({ value }) => <Pill>{value}</Pill>,
    price: ({ value, row }) => styledCell(String(value), row.color),
  },
});
```

### Cell Renderer Flow

1. `mountUiGrid` calls `el.setFrameworkRenderedSlots({ cells: Object.keys(cellRenderers) })`
2. Listens for `cellSlotsChanged` events
3. For each added slot: calls the matching render function, creates a React portal, appends to light DOM with `slot` attribute
4. For removed slots: unmounts the portal

### `styledCell` Helper

Quick inline-styled cell without creating a full component:
```tsx
styledCell(text: string, color: string, extraStyles?: CSSProperties)
```

## Conventions

- No class components — functional components + hooks only
- External deps: `react`, `react-dom` (peer), `@ornery/ui-grid-core`, `@ornery/ui-grid-vanilla`
- The React wrapper never renders grid cells itself — it delegates to the vanilla element
- `cellRenderers` map keys must match `columnDef.name` values

## Do NOT

- Import from `dist/` paths — use tsconfig path mappings
- Call `setFrameworkRenderedSlots` on every render — only when `cellRenderers` keys change
- Forget to clean up portals on unmount
- Add Angular or vanilla rendering logic here — this package only bridges React ↔ vanilla
