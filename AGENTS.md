# UI Grid — Agent Instructions

Multi-platform data grid. Framework-neutral core with Angular, React, vanilla web component, Rust/egui, and C/LVGL targets.

## Architecture

```
projects/ui-grid-core/     Pure TypeScript engine (pipeline, sorting, filtering, grouping, etc.)
projects/ui-grid-vanilla/  <ui-grid-element> custom element — the rendering engine
projects/ui-grid-react/    React wrapper (mounts vanilla element, projects via portals)
projects/ui-grid/          Angular wrapper (mounts vanilla element, projects via ng-template)
crates/                    Rust core, egui adapter, WASM bridge, C ABI
src/app/                   Angular demo/docs application
```

The vanilla element is the single renderer. Angular and React wrappers mount `<ui-grid-element>` and project framework templates into it via `setFrameworkRenderedSlots()` + `cellSlotsChanged` events.

## Build Commands

```bash
npm start                    # Dev server (Angular demo app) at localhost:4200
npm run build                # Full production build (wasm + react + vanilla + angular app)
npm run build:core           # Build @ornery/ui-grid-core (tsup)
npm run build:library        # Build core + vanilla + wasm + Angular library (ng-packagr)
npm run build:pages          # GitHub Pages production build
npm test                     # All test suites
npm run test:angular         # Angular tests (vitest via ng)
npm run test:react           # React tests (vitest)
npm run test:vanilla         # Vanilla tests (vitest)
npm run test:rust            # Rust tests (cargo test --workspace)
```

## Package Dependencies (build order)

1. `@ornery/ui-grid-core` — no internal deps
2. `@ornery/ui-grid-vanilla` — depends on core
3. `@ornery/ui-grid-react` — depends on core + vanilla
4. `@ornery/ui-grid` (Angular) — depends on core + vanilla

Always build in this order. The `build:library` script handles this automatically.

## Coding Conventions

- TypeScript strict mode everywhere
- No comments unless explaining a non-obvious "why"
- No default exports — use named exports
- Grid options use the `GridOptions` interface; columns use `GridColumnDef`
- Row identity: `rowIdentity: (row) => String(row['id'])`
- Feature flags: `enable*` boolean options (e.g., `enableSorting`, `enableFiltering`)
- All user-facing strings go through the i18n label system (`resolveGridLabels`)
- CSS custom properties prefixed `--ui-grid-*`
- Shadow DOM encapsulation — never pierce from outside

## State Management in the Controller

The `VanillaGridController` owns all mutable grid state. Key rule: `setOptions()` must NOT clobber interactive state. It tracks `lastOptions*` values and only applies declarative state (grouping, pinning, scroll directions) when the consumer's value structurally changed from the previous pass.

Interactive state that survives `setOptions`: sort, filters, expanded rows, selection, pagination, cell navigation, column widths, column order.

## Testing

- Unit tests: vitest for all JS/TS packages
- Test files: `*.test.ts` / `*.test.tsx` colocated with source
- Shadow DOM testing: query via `el.shadowRoot.querySelector()`
- jsdom lacks `adoptedStyleSheets` — polyfilled in test-setup files
- Rust: `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`

## Do NOT

- Add Angular Elements references — that build target was removed
- Import from `dist/` paths within the monorepo during development (use tsconfig path mappings)
- Use `zone.runOutsideAngular` for event handlers that create Angular views (they need zone for CD)
- Call `setFrameworkRenderedSlots` on every options update — only when template columns structurally change
- Skip `frameworkSlots.flush()` after rendering new DOM that contains slot placeholders
- Add `node_modules/`, `dist/`, or `.angular/cache/` to commits
