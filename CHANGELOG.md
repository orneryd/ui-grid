# Changelog

## v1.0.8 — 2026-07-01

### Changed

- **Dependency refresh for the web suite** — upgraded the npm workspace to the latest framework and build stack, including Angular 22, React 19.2, TypeScript 6, Vite 8, Vitest 4.1, jsdom 29, tsup 8.5, ng-packagr 22, and current supporting type/test packages. Root and package-local lockfiles were regenerated for the 1.0.8 release.
- **Node 26 toolchain** — local package metadata and GitHub Actions workflows now target Node 26.4.0 with npm 11.17.0, satisfying Angular 22's runtime floor and keeping CI aligned with the publish toolchain.
- **Looser published framework peers** — `@ornery/ui-grid` now peers on `@angular/common` / `@angular/core >=17.3.0` and `rxjs ^6.5.3 || ^7.4.0`, matching the wrapper's actual `input()` / `output()` API floor instead of the repo's current Angular dev version. `@ornery/ui-grid-react` now peers on `react >=18.0.0` and `react-dom >=18.0.0` so React consumers can install newer framework majors without package-manager conflicts.
- **TypeScript 6 config migration** — removed deprecated `baseUrl` usage from project tsconfigs and made root path mappings explicitly relative. Core and vanilla declaration builds now use `tsc --emitDeclarationOnly` instead of tsup's DTS worker, avoiding tsup's internal deprecated `baseUrl` injection while preserving the existing JS bundles.

### Fixed

- **Package builds under TypeScript 6** — `@ornery/ui-grid-core` and `@ornery/ui-grid-vanilla` now emit declarations cleanly with explicit `rootDir` / declaration configs. The Angular package build also continues to emit FESM and DTS bundles successfully under the upgraded toolchain.

## rust-v1.0.8 — 2026-07-01

### Changed

- **Rust dependency refresh** — updated the Cargo workspace to current crate versions, including `anyhow` 1.0.103, `js-sys` 0.3.103, `wasm-bindgen` 0.2.126, `wasm-bindgen-test` 0.3.76, `regex` 1.12.4, `rmp-serde` 1.3.1, `serde_json` 1.0.150, `jiff` 0.2.31, and the egui stack (`egui`, `egui_extras`, `eframe`) 0.35.
- **Rust release metadata aligned to 1.0.8** — workspace crate manifests and internal crate dependency versions were synced so `ui-grid-core`, `ui-grid-egui`, `ui-grid-wasm`, and `ui-grid-c-abi` publish against the 1.0.8 crate set.

### Fixed

- **egui 0.35 deprecation cleanup** — replaced deprecated `Panel::show_inside` / `CentralPanel::show_inside` calls with `show` in the egui adapter and demo so `cargo clippy --workspace --all-targets --all-features -- -D warnings` passes with the upgraded egui stack.

## v1.0.7 — 2026-06-19

### Added

- **No-bundler vanilla browser bundle** — `@ornery/ui-grid-vanilla` now emits `dist/browser/ui-grid-element.js`, a browser ESM file that bundles the core runtime and auto-registers `<ui-grid-element>` for static HTML hosts. The Web Component docs now distinguish this direct browser artifact from the package `dist/index.js` CommonJS entry and package `dist/index.mjs` ESM entry.

### Changed

- **Wasm parity merge** — the `wasm-parity` feature branch is merged into main. The Rust/WASM core now reaches functional parity with the TypeScript engine across sorting (including `SortKind::DeferToHost` for JS `sortingAlgorithm` callbacks), tree building (with `rowIdentity` callback bridging), filtering (with prepared-filter fast path and wildcard-fallback correctness), validation (with `HostValidatorMarker` for consumer-registered validators), and row-searcher condition reporting. Wasm parity specs lock the contract so any future Rust-side drift is caught against TS.
- **Angular 21.2.17** — all `@angular/*` framework and dev-tool packages bumped to latest 21.2.x patches, resolving 8 security advisories (DoS, XSS, information leak).
- **Build dependency hardening** — npm `overrides` force fixed versions of `@babel/core` (7.29.7), `esbuild` (0.28.1), `piscina` (5.2.0), `undici` (7.28.0), and `vite` (7.3.5) to resolve transitive build-time advisories. All are build-only deps; none ship to production.

### Fixed

- SSR `renderApplication` now passes `allowedHosts: ['localhost']` — required by Angular 21.2.17's host validation.
- Missing `@testing-library/dom` peer dependency added to `@ornery/ui-grid-react` devDependencies.
- Rust row-searcher `parsed_condition_tag` correctly reports `"contains"` (instead of `"regex"`) for auto-detected literal contains and wildcard-fallback filter conditions, matching TypeScript semantics.

## rust-v1.0.6 — 2026-05-20

Rust core + `ui-grid-egui` adapter reach functional parity with the canonical TypeScript engine and the vanilla web component. The web suite (Angular / React / Web Components) is unchanged; this release scopes to `ui-grid-core`, `ui-grid-egui`, and `ui-grid-c-abi`. Wasm-parity specs lock the contract in so any future Rust-side drift is caught against TS.

### Added — Rust core (parity ports of existing TS APIs)

- **`rowIdentity` JS callback bridge** — closures can't cross the wasm boundary via serde, so `build_grid_rows_js`, `build_pipeline_js`, and `resolve_grid_row_id_js` now pluck the JS callback off the live `JsValue` and pre-resolve identities (recursively, for tree mode) into `row_identity_overrides` before deserialization. Rust drops the `row_id_field` lookup entirely; TS drops the bridge bypass in `grid.core.wasm-bridge.ts`.
- **Identity-cached `buildGridRows`** — mirrors the TS `rowsCache` keyed on `(data, options, hidden, expanded, rowSize)` reference identity. Public surface: `get_cached_grid_pipeline_rows`, `clear_grid_pipeline_rows_cache`. Cache is cleared on `mark_dirty()` and at the start of `run_grid_benchmark` so stale entries from recycled allocator addresses can't cause false hits.
- **Prepared-filter fast path** — `prepare_grid_column_filters` (per-column, once) + `matches_grid_row_prepared_filters` (per-row, no allocation), with wasm shims so JS callers can opt in. Pipeline now uses the prepared variant.
- **Async validators** — `RunGridCellValidatorsRunner::{Pending, Ready}` and `run_grid_cell_validators_async` mirror the TS `Promise<string[]>` shape without pulling in a Rust async runtime. Hosts step the runner manually or call `run_to_completion`.
- **`GridValidatorRegistry.set_validator` / `get_validator`** bridged through wasm with `HostValidatorMarker` + `RegisteredValidatorMessage`. Closures stay JS-side; the bridge calls back into JS for non-built-in validators while Rust's built-in `required` / `minLength` / `maxLength` short-circuit locally.
- **`KeyOverrideSpec`** — Rust analog of TS `GridKeyEventOverride`. `GridOptions::key_down_overrides: Vec<KeyOverrideSpec>` lets consumers opt out of any built-in keydown (Ctrl+A, F2, Home/End, Space, etc.). Match supports `key_code`, `key`, and modifier combinations.
- **`SortKind::DeferToHost`** — `guess_sort_kind` returns this variant for columns with `sortingAlgorithm`. The wasm bridge falls back to TS sort for those columns only; columns without a custom algorithm continue sorting in Rust.
- **Generic exporter registry** — new `crates/ui-grid-core/src/exporter_registry.rs` with `register_grid_exporter` / `unregister_grid_exporter` / `export_grid` and a thread-safe `OnceLock<RwLock<HashMap<String, Arc<dyn GridExporter>>>>`. `GridExportScope::{Visible, All, Selected}`, `GridRegisteredExportContext`, `GridExportResult`, `GridExporter` trait. Built-in CSV exporter auto-registered via `init_default_grid_exporters` so `export_grid("csv", ctx)` works without setup.
- **`run_grid_benchmark`** — host-agnostic Rust analog of TS `gridApi.core.benchmark(iterations) -> Promise<GridBenchmarkResult>`. Returns `{iterations, total_ms, average_ms, visible_rows, rendered_items}`. Egui demo wires it to a Benchmark button.
- **`resolve_exporter_filename`, `build_grid_header_context`, `format_grid_header_display_value`** ported from TS so Rust hosts (egui) compute exporter filenames and templated header values identically to the web suite.
- **Column-width persistence in `GridSavedState`** — `column_width_overrides: BTreeMap<String, String>` mirrors the TS `columnWidthOverrides` (gated by `saveWidths`). Save / restore round-trips the user's resize state across hosts.
- **`has_sorting_algorithm` flag on `GridColumnDef`** — set by the wasm bridge so Rust can detect sorting-algorithm columns without seeing the JS callback.

### Added — Egui adapter (vanilla web-component feature parity)

- **Row selection chrome** — synthetic `selectionRowHeaderCol` injected when `enable_row_selection` + `enable_row_header_selection` are on. Per-row checkbox + select-all header. Width auto-scales to `2 × icon_width` (theme-driven) so the column stays narrow regardless of egui style overrides. Synthetic column is excluded from drag-reorder and the data-column min-width floor.
- **Selection interactions** — Ctrl/Cmd-click adds to selection (additive); plain click is single-select; Shift-click extends to range. `Ctrl+A` selects all selectable rows; `Space` toggles the focused row. Drag-paint multi-row selection: press a row, drag across other rows — every row whose rect contains the pointer becomes the endpoint, the anchor→endpoint range is selected. `enableFullRowSelection`, `noUnselect`, `modifierKeysToMultiSelect`, `enableSelectionBatchEvent` honored.
- **Validation chrome** — invalid cells (rows whose `$$invalid<col>` flag is set by `runGridCellValidators`) get a red border + tinted background. Hover shows the joined error messages tooltip via `get_grid_cell_error_messages`. `enable_select_all` honoured; the select-all checkbox auto-disables when no rows are selectable.
- **Row-edit lifecycle decoration** — `mark_row_dirty`, `mark_row_saving`, `mark_row_clean`, `mark_row_error` paint the row with theme-supplied tints (`row_dirty_background`, `row_saving_background`, `row_error_background`). Mutually-exclusive priority: error > saving > dirty.
- **Grid-level renderer hooks**:
  - `with_group_row_renderer(fn)` — caller paints the entire group row, returns `GridGroupRowAction` (defaults: `None`, returns `Toggle` when chevron is clicked).
  - `with_expandable_row_renderer(fn)` — caller paints the entire detail row.
  - `with_empty_state_renderer(fn)` — caller paints the empty state when filters knock all rows out.
  - `with_selection_checkbox_renderer(fn)` — caller replaces both the per-row and select-all checkboxes (`ctx.row = Some(...)` for per-row, `ctx.is_header = true` for select-all).
- **Per-column hooks on `EguiColumnExt`**:
  - `with_filter_renderer(fn)` — replace the default filter `TextEdit` with any control (dropdown, range slider, etc.). Mutate `&mut String` and return `true` to re-run the pipeline.
  - `with_header_controls_renderer(fn)` — caller paints the sort / group / pin / move chrome; signals intent by pushing `EguiHeaderAction::{ToggleGrouping, CycleSort, PinLeft, PinRight, Unpin, MoveLeft, MoveRight}`.
  - `with_cell_editor(fn)` — replace the default editor; returns `true` when the value changed.
  - `with_cell_renderer(fn)` — full custom cell paint.
  - `with_formatter(fn)` — string formatter applied before the default label paints.
- **Editor input-type switching** — date columns use `egui_extras::DatePickerButton` (jiff `Date`), boolean columns use a checkbox, numeric columns use a numeric `TextEdit`. Hosts can still override via `with_cell_editor`.
- **Keyboard navigation** — Arrow keys / Tab / Shift-Tab move focus; Enter and `F2` begin edit; `Home` / `End` jump to row start/end; `Ctrl+Home` / `Ctrl+End` to first/last row; first-character keypress on a focused cell begins edit pre-seeded with that character.
- **Pagination chrome** — range label `M – N of total`, page-size combo reads `paginationPageSizes` from options, prev/next visually disabled at edges (in addition to the click guard).
- **Column auto-fit on resize-handle double-click** — double-clicking the resize gripper measures the header label + visible cell content via `egui::Fonts::layout_no_wrap` and writes the result into `column_widths`. Reserves 28px per visible header control (sort / group / pin) so the title isn't clobbered.
- **`column_widths` overrides synced from drag-resize** — each header cell's actual rendered width is captured back into the shared `column_widths` map after the user releases the pointer, so the outer scroll-area / pinned-region width math tracks the real table width and there's no empty scrollable space.
- **Pin / unpin preserves column widths** — pre-fit pass on first paint measures every column without a declared width or override and stores the result in the shared `column_widths` map; all four table layouts (unpinned single + pinned left / center / right) consult the same map, so widths survive pin/unpin.
- **Group / expand / tree chevron lands on the first data column** — `primary_data_column_index` skips the synthetic selection column so the leading control doesn't paint inside the checkbox cell when row selection + expandable / tree are on at the same time.
- **Header label truncation** — labels render inside a rect bounded by the controls' left edge, with `Label::truncate()` so titles ellipsise instead of being clobbered by sort / group / pin chrome.
- **Filter input "clear" button** — inline ✕ when the active filter is non-empty.
- **Save / restore state with `column_widths`** — `EguiGrid::column_width_overrides()` reader + `set_column_width_override` writer; round-trips through `GridSavedState`.
- **Theme fields for selection + validation + row-edit chrome** — `GridTheme` gained `row_selected_background`, `row_selected_indicator`, `cell_invalid_border`, `cell_invalid_background`, `row_dirty_background`, `row_saving_background`, `row_error_background`. Populated across all four presets (default light/dark, wireframe light/dark). Mirrors the TS `--ui-grid-*` CSS variables.
- **Custom selection-checkbox context** — new `GridSelectionCheckboxContext { row, options, theme, enabled, is_header }` for the new selection-checkbox renderer hook.
- **Group / expandable / empty-state contexts** — `GridGroupRowContext`, `GridExpandableRowContext`, `GridEmptyStateContext` give renderer closures access to the row/group, options, columns, theme, and (for groups) the collapsed flag.
- **Header / cell / filter contexts** — `GridHeaderControlsContext`, `GridCellContext`, `GridFilterContext` give per-column renderer closures access to the column, labels, icons, theme, and (for headers) sort direction / pin direction / capability flags.

### Added — `ui-grid-c-abi`

- **Stable C-facing ABI** — opaque engine lifecycle + JSON / MessagePack transport helpers + projection / state APIs; native hosts can drive the shared engine without embedding Rust types directly.
- **C++ wrapper** — `ui-grid-cpp` with RAII engine management, typed sort/group/pin command builders, JSON and MessagePack helpers.
- **LVGL native prototype** — `ui-grid-lvgl` adapter with theme/column extension headers and an SDL-backed demo.

### Changed

- **`expand_detail` icon default flipped to `chevronRight`** — collapsed → right / expanded → down, matching the tree-toggle convention. The C-ABI fixture `projection-envelope-v0.1.0.json` was regenerated.
- **`GridSavedState` round-trips** — empty `Vec` / `BTreeMap` / `Option` fields are now skipped during serialization so empty-input round-trips produce `{}` instead of `{sort: null, pagination: null, columnOrder: [], …}`. Matches TS shape.
- **`row_state` / `edit` return shapes** aligned with TS:
  - `ToggleGridRowExpandedResult` / `ToggleGridTreeRowExpandedResult` are named-field structs (was tuples → `[bool, {…}]`).
  - `clear_grid_edit_session` returns a `ClearGridEditSessionResult` struct (was a tuple).
  - `find_next_grid_cell` returns `FindNextGridCellResult { row, column }` (was just `GridCellPosition`; TS callers expect resolved row + column).
  - `enable_cell_edit_on_focus` is now `Option<bool>` so a column with `Some(false)` correctly opts out even when grid-level focus-edit is on.
- **`row_searcher::guess_condition`** now emits a literal-substring regex for the default contains case. Previously emitted `Comparator(Contains)`, but `run_column_filter` had no `Contains` arm in the comparator branch — it fell through to `_ => true`, so the filter silently matched every row. Tree filtering, pipeline filtering, and the row-searcher contains test were all visibly wrong before.
- **`tree::resolve_row_id`** now honours `options.row_identity_overrides`, the hidden serde field populated by the wasm bridge from the JS `rowIdentity` callback.
- **Demo app expanded** — exercises every new feature behind a toolbar toggle: row selection, validation, row-edit save/discard, grouping, tree view, expandable, pinning, infinite scroll, theme switching across all four presets, generic exporter registry (placeholder PDF), benchmark probe button, auto-fit button, custom group / expandable / empty-state renderers.

### Fixed — Rust core

- **`tree::resolve_row_id`** ignored the `rowIdentity` callback in tree mode; the bridge now seeds `row_identity_overrides` and tree resolution honours it.
- **`row-sorter`** silently fell through for `sortingAlgorithm` columns; `SortKind::DeferToHost` now flags those for the wasm bridge to handle.
- **`state` shape drift** between Rust and TS round-trips (above).
- **Wasm-parity coverage** — added 14 new `*.wasm-parity.spec.ts` files (tree, grouping, pagination, pinning, filtering, sorting, viewmodel, identity, row-state, edit, pipeline, state, infinite-scroll, display) so any future Rust-side bug is caught against the canonical TS implementation.

### Fixed — Egui adapter

- **Pinning no longer grows the last column** — the 3-table pinned layout (left / center / right) sized each region from `count × 176px` and the center table's last column used `Column::remainder()`, which silently expanded to fill leftover space whenever a column was pinned. Region widths now come from the actual declared column widths, and `draw_table` accepts a `fill_remainder` flag that's `true` only for the unpinned single-table layout.
- **Pin / unpin no longer resets columns to a 120px scrunched fallback** — egui_extras keeps its column widths inside a private per-table `TableState` keyed by `id_salt`, so widths measured in the unpinned table were lost when a column moved into the pinned region (and vice versa). The pre-fit pass on first paint stores measurements in the shared `column_widths` map, so all four table layouts agree on widths.
- **Drag-resize syncs back to the outer layout** — egui_extras' built-in resize handle widened the header cell but the outer scroll-area's `min_width` (computed from `column_widths`) didn't follow. The grid now captures each header cell's actual rendered width back into `column_widths` on pointer release.
- **Double-click on the resize handle now auto-fits the column** — egui_extras 0.34.1's built-in dblclick check reads the response under `ui.id().with("resize_column").with(i)` but the actual handle is registered under `state_id.with("resize_column").with(i)`, so the IDs never match. We read the response under the correct id, run our own `auto_fit_column`, and call `TableBuilder::reset()` so the new override takes effect immediately.
- **Drag-paint multi-row selection across rows** — egui only fires `response.dragged()` on the cell that received the press, so dragging across rows never expanded the selection past the anchor. Replaced with a pointer-rect hit test on every cell during an active drag-paint session.
- **Selection chrome no longer hides the expand chevron under selection + expandable** — leading-controls path now uses `primary_data_column_index` so the chevron lands on the first data column instead of the synthetic checkbox cell.
- **Header label truncates with ellipsis instead of being clobbered by controls** — controls render right-to-left first; the label renders inside a rect bounded by the controls' left edge with `Label::truncate()`.
- **Synthetic selection column drag-reorder disabled** — the column is now excluded from both drag-source and drop-target paths.
- **Selection checkbox centred on every theme** — replaced the hardcoded 30px column with `2 × icon_width` so theme overrides to `Style::spacing.icon_width` flow through, and centred the checkbox via `scope_builder + centered_and_justified` instead of `horizontal_centered`.

## v1.0.6 — 2026-05-18

### Added

- **Rust core feature parity with the canonical TypeScript engine** — `@ornery/ui-grid-core`'s WASM build now mirrors all fourteen ported pipeline modules (viewmodel, identity, row-state, edit, display, infinite-scroll, pinning, pagination, sorting, filtering, tree, grouping, state, pipeline) and a new wasm-parity spec suite locks the contract in. Each TS module has a subprocess-driven parity test that runs the wasm shim and asserts byte-identical output for the same input fixtures.
- **Rust ↔ JS callback bridge for `rowIdentity`** — closures can't cross the wasm boundary via serde, so the bridge now plucks the JS `rowIdentity` callback off the live `JsValue` and pre-resolves identities (recursively, for tree mode) before serde deserializes. `build_grid_rows_js` / `build_pipeline_js` and `resolve_grid_row_id_js` now use the wasm path consistently.
- **WebAssembly performance pass** — cleaner wasm-bridge plumbing reduces per-call overhead on hot paths, and demo apps disable wasm module auto-registration so consumers opt in explicitly.
- **Vitest config across the workspace + CI coverage reporting** — added a shared vitest config and brought CI coverage reporting back online so test gates run consistently across packages.
- **Row selection on the expandable harness across all wrappers** — the Angular, React, and Web Components "expandable" demos now also enable `enableRowSelection`, so the selection checkbox column appears alongside the expand toggle. Live demos exercise the same UX surface across all three frameworks.
- **Egui parity plan** — added a planning doc describing how the egui adapter will reach parity with the web-suite features (selection / validate / row-edit, keys / filters / pagination, new-core APIs).
- **Date-picker slot template on the Web Components templated harness** — the vanilla demo now renders an interactive `<input type="date">` for the renewal column via a slot template, with a delegated change handler that walks back to the body cell, mutates the row in place, and re-publishes through `setData()` so picked values persist.

### Changed

- **Expand/tree toggle leads the cell content instead of trailing it** — the disclosure chevron now sits on the leading edge of the primary cell, in front of the row label, matching the tree-toggle convention. The `margin-inline-start: auto` override that previously pushed the expand toggle to the trailing edge has been removed; both initial render and patch paths emit the toggle before `.cell-content`.
- **Host element establishes its own stacking + paint context** — `:host` now sets `isolation: isolate` and `contain: layout paint`, so sibling repaints in the surrounding page (e.g. button hover transforms on the demo pages) don't invalidate the grid's sticky filter strip. Fixes the filter-row flicker observed on the React and vanilla demos while Angular was already flicker-free via its component view encapsulation.
- **Viewport-width measurement under-estimates by 2px** — the body viewport's `overflow-x: auto` plus sub-pixel rounding on the host box made tracks resolve ~1–2px wider than the actual renderable width, surfacing a spurious default horizontal scrollbar. `setViewportWidth` now floors and subtracts a 2px safety margin.
- **Demo button hover effects no longer use `transform`** — the web-components and React docs pages dropped `transform: translateY(-1px)` on `.scenario-button:hover` (and friends) in favour of a plain background gradient shift. `transform`/`filter` promote the button to its own compositing layer; combined with the host isolation fix this removes both the trigger and the surface for filter-row repaint flicker.
- **Per-row patch fingerprint cache for selection / focus / expand toggles** — `patchExistingRows` now fingerprints each row's visual state (selection, focus, expand, dirty/saving/error, tree level, per-column validity, entity reference) and skips `patchBodyCell` when nothing relevant changed. Selection / focus / expand toggles now repaint only the affected row plus the previously- and newly-focused cells, instead of `O(rows × cols)`. Caches are cleared on full re-mount, slow-path innerHTML rebuild, `setFrameworkRenderedSlots`, and template `MutationObserver` firing.
- **`setFrameworkRenderedSlots` exposed on `VanillaUiGridElement`** — external consumers no longer need to cast the element to call it. `controller.getEditingCellKey()` is also exposed for the patch path.

### Fixed

- **Framework-slot wrappers (Angular embedded views, React portals) survive across patch passes** — the patch path's per-row fingerprint short-circuit was skipping `stageCell` for unchanged rows, so `frameworkSlots.flush()` diffed an empty pending set against a full last set and emitted a spurious `cellSlotsChanged removed` for every cell. Custom-rendered cells were torn down on first paint and only reappeared after a scroll triggered a virtual-body rebuild that re-staged everything. Added `FrameworkSlotBridge.carryRowCells(rowId)` and call it from `patchExistingRows` when `canSkip` is true so the row's known slots carry forward and the diff is a no-op.
- **Cell selection retention bug across shadow boundaries** — click handlers used `closest('.body-cell')` which stops at shadow boundaries, so clicks on framework-projected light-DOM cell content (Angular `ng-template`, React render props) never resolved to the body cell. The previously focused cell kept its `cell-focused` class, making multiple cells appear "selected" simultaneously. Replaced every `closest('.body-cell')` call in `events.ts` with a new `bodyCellFromEvent()` helper that walks `composedPath()`, which crosses the shadow boundary correctly.
- **Expand toggle no longer attaches to the row-selection checkbox cell** — `isGridPrimaryColumn` returned true for `visibleColumns[0]`, but when row selection is enabled the synthetic `selectionRowHeaderCol` is prepended at index 0, so the tree/expand toggle and indent calc attached to the checkbox cell instead of the first data column. Skip the `selectionRowHeaderCol` sentinel in `isGridPrimaryColumn` (TS and Rust core, kept identical so wasm-parity specs still hold).
- **React demo page double scrollbar on Linux** — `.react-demo-frame` had `overflow-x: auto`. Per the CSS spec, when one axis is non-visible the other is coerced from `visible` to `auto`, so the frame grew its own vertical scrollbar in addition to the grid's body-viewport scrollbar. Switched to `overflow: visible`; horizontal overflow is owned by the grid's body viewport internally.
- **Vanilla `MutationObserver` infinite-loop with framework wrappers** — the observer fired on every slot mutation, including the `<span slot="cell-…">` projection wrappers Angular and React append for cell rendering. Each mutation triggered `ensureController` → `setOptions` → `refresh` → `cellSlotsChanged`, which made the wrapper append more spans, ad infinitum. The observer now filters to `<template>`-typed slot mutations (the consumer-template surface it actually cares about). React tests also moved to happy-dom now that the loop is gone.
- **Rust core ↔ TS core divergences** — fixed a set of silently-different outputs that the new parity specs caught:
  - `row_state::ToggleGridRowExpandedResult` / `ToggleGridTreeRowExpandedResult` now serialize as named-field structs instead of tuples (which produced `[bool, {...}]` instead of `{expanded, nextExpandedRows}`).
  - `edit::clear_grid_edit_session` now returns a `ClearGridEditSessionResult` struct (was a tuple).
  - `edit::find_next_grid_cell` now returns `FindNextGridCellResult { row, column }` (was just `GridCellPosition`; TS callers expect resolved row + column).
  - `edit::should_grid_edit_on_focus`: `GridColumnDef.enable_cell_edit_on_focus` is now `Option<bool>` so a column with `Some(false)` correctly opts out even when `GridOptions.enable_cell_edit_on_focus` is `Some(true)` — TS uses `??` coalescing, so an explicit `false` wins over options-level true.
  - `state::GridSavedState` now skips serializing empty `Vec` / `BTreeMap` / `Option` fields so empty-input round-trips produce `{}` rather than `{sort: null, pagination: null, columnOrder: [], …}`.
  - `row_searcher::guess_condition` now emits a literal-substring regex for the default contains case. Previously emitted `Comparator(Contains)`, but `run_column_filter` had no `Contains` arm in the comparator branch — it fell through to `_ => true`, so the filter silently matched every row. Tree filtering, pipeline filtering, and the row-searcher contains test were all visibly wrong before.
  - `tree::resolve_row_id` now honours `options.row_identity_overrides`, the hidden serde field populated by the wasm bridge from the JS `rowIdentity` callback.
  - `c-abi` fixture regenerated to drop the now-skipped `enableCellEditOnFocus` default-emit so the deterministic engine round-trip stays stable.

## v1.0.3 — 2026-05-08

### Changed

- **Per-column header icons now hide on opt-out instead of rendering disabled** — columns with `sortable: false`, `enableSorting: false`, or `enableGrouping: false` no longer render their sort or group buttons in the header, matching the legacy ui-grid `ng-if` hide pattern and the existing pin behavior. The grid-level `enableSorting` / `enableGrouping` master flags still gate the entire feature.
- **npm publish pipeline now mirrors the runtime dependency graph** — the web suite publishes as `core → vanilla → {react, angular}`, with the React and Angular jobs waiting on `publish-vanilla` and polling the registry for the vanilla tarball before building.

### Fixed

- **Per-column `enableCellEdit: false` is now honored when the grid is globally enabled** — `VanillaGridController.beginCellEdit` guards on `isCellEditable`, so opted-out columns can no longer enter edit mode via double-click, F2, Enter, printable keys, or the post-Tab/Enter `resumeEdit` hop. Brings the vanilla and Angular hosts in line with the React wrapper, which already enforced this.

## v1.0.0 — 2026-05-08

### Added

- **Major web-suite feature expansion across Angular, React, and Web Components** — the shared grid runtime now ships row selection, keyboard cell navigation, infinite scroll, row edit workflows, cell validation, CSV/JSON import, CSV/Excel/PDF export, pagination, richer i18n coverage, and custom component/template integration across the web hosts.
- **Full declarative and imperative Web Component surface** — `@ornery/ui-grid-vanilla` now exposes a much broader framework-free custom-element API, including stronger attribute/property bridging, standalone mounting helpers, better template projection, and documentation/examples that cover both declarative markup-first usage and programmatic control.
- **Expanded docs and live examples for the new grid capabilities** — the docs app now includes dedicated user-facing guides and demos for exporting, importing, selection, save state, validation, pagination, infinite scroll, keyboard navigation, pinning, column moving, and custom components.

### Changed

- **1.0.0 unifies the web packages around one shared runtime** — Angular and React now act as thin framework bridges over the same vanilla custom-element engine, giving all three web surfaces closer feature parity and a more consistent behavior model.
- **Angular package setup is lighter for consumers** — `@ornery/ui-grid` now wraps the shared vanilla runtime directly, reducing Angular-specific package surface and aligning the Angular package more closely with the cross-framework architecture.
- **React package positioning moved to the shared web-component runtime** — `@ornery/ui-grid-react` now depends on the vanilla package as part of its public integration model, so React consumers inherit the same underlying grid engine and slot/template behavior as the other web hosts.

## v0.1.10 — 2026-05-05

### Added

- **Stable C-facing ABI over the Rust grid core** — added `ui-grid-c-abi`, exposing opaque engine lifecycle, JSON and MessagePack transport helpers, projection/state APIs, C smoke examples, and a projection benchmark so native hosts can drive the shared grid engine without embedding Rust types directly.
- **C++ wrapper for the native ABI** — added `ui-grid-cpp` with RAII engine management, typed sort/group/pin command builders, JSON and MessagePack projection helpers, and smoke examples for a higher-level native integration surface.
- **Initial LVGL native C prototype** — added `ui-grid-lvgl`, including the first LVGL-backed adapter, theme/column extension headers, and an SDL-backed demo app that proves the native widget path end to end.
- **Native adapter roadmap documentation** — added a dedicated plan for the Rust C ABI, C++, Go, and follow-on native adapter work so the non-web host strategy is documented alongside the prototype.

### Changed

- **Version sync now covers the full monorepo with one command** — the release sync script now updates npm package manifests, npm lockfiles, Cargo workspace versioning, crate-to-crate Rust dependency versions, Cargo.lock, and internal peer metadata cleanup in one pass.
- **Project docs and positioning now include native C/LVGL support explicitly** — refreshed the root README and native adapter docs so the repo presents Angular, React, Web Components, Rust/egui, and native C/LVGL as first-class delivery targets.
- **Column resizing behavior is now consistent across Angular, React, and vanilla hosts** — all three web surfaces now support the same drag-resize, double-click auto-fit, hover indicator, and container-filling demo behavior, including smoother virtualized resizing paths that avoid per-mousemove full rerenders.

### Fixed

- **Cross-suite resize polish and parity issues** — fixed missing React resize handle styling, removed header scrollbar artifacts during resize, and aligned the Angular, React, and vanilla demos so the column resize affordances behave the same across the web suite.
- **Angular and Rust CI follow-up regressions** — corrected the Angular custom-element CI issue and refreshed the ABI fixture data needed to keep the Rust/native test path green after the new adapter work landed.

## v0.1.9 — 2026-05-05

### Added

- **Angular Elements declarative surface parity** — `@ornery/ui-grid` now supports declarative HTML attributes, mirrored JS properties, and attribute-to-options synchronization so the Angular-backed custom element can be configured markup-first like the vanilla build.
- **Custom-element coverage for declarative and imperative mixing** — added Angular and vanilla tests that verify declarative `data` / `column-defs` rendering and confirm later imperative augmentation does not discard attribute-derived state.
- **Cross-framework renderer/template docs** — expanded the docs app and Web Component docs with Angular `TemplateRef` context tables, vanilla slot-template token references, and React cell/expandable renderer context examples.
- **Release version-sync tooling** — added a dedicated version-sync workflow for package manifests and npm lockfiles to keep the `0.1.9` release metadata aligned across the repo.

### Changed

- **Web Component documentation now distinguishes the two shipped outputs clearly** — refreshed the README, Getting Started, and Web Component docs so Angular Elements and vanilla custom elements are described separately, with their shared declarative surface and their differing runtime expectations called out explicitly.
- **Angular home demos now showcase both host surfaces** — the home page now has separate Angular Native and Angular Element modes, with dedicated Angular Element scenario harnesses for expandable, tree, templated, pinning, and trading demos.
- **Web Components demo host moved to declarative attribute-driven setup** — the primary and scenario grids on the web-components page are now configured from declarative attributes first, with template injection and imperative bridge wiring layered on top only where needed.
- **Release metadata refreshed for `0.1.9`** — regenerated the root and package-local npm lockfiles after syncing internal package versions to the next intended web release version.

### Fixed

- **Vanilla custom-element option augmentation no longer drops declarative data** — reading `grid.options`, spreading it, and writing it back now preserves attribute-derived `data` and `columnDefs` instead of resetting the declarative surface.
- **Angular Element trading terminal now live-updates correctly** — the home-page Angular-backed custom element trading harness now drives live ticks and applies the intended colorized cell templates for price and change columns.
- **Vanilla trading demo now reattaches slot templates and resumes ticking after mode switches** — the web-components Trading scenario correctly reinjects its slot templates and restarts the live-update loop when switching between scenarios.
- **Declarative web-component docs and demos now match runtime behavior** — the live examples, code snippets, and docs pages were brought back into sync for attribute-driven setup, template slots, and high-frequency data updates.

## v0.1.8-hotfix-1 — 2026-05-04

### Fixed

- **Public theming tokens work directly again across the web packages** — normalized the runtime styles in the shared core and React wrapper so consumer overrides can target the documented `--ui-grid-*` CSS custom properties again, while `--app-ui-grid-*` aliases continue to work as well.
- **Theming docs now match the shipped runtime behavior** — simplified the README and theming guide back to the supported public token surface

## v0.1.8 (web suite) — 2026-05-04

### Added

- **Trading terminal demos across Angular, React, and vanilla docs surfaces** — added a shared market-data generator plus live trading-terminal demos to the Angular home page, the React docs page, the Web Components page, and the browser harness so all three web hosts now showcase the same high-frequency update scenario next to the existing pinning demos.
- **Declarative vanilla custom-element API** — `@ornery/ui-grid-vanilla` now supports a full declarative configuration surface on `<ui-grid-element>`, including observed HTML attributes, mirrored JS properties, and attribute-to-options synchronization for framework-free usage.
- **Custom header rendering for non-Angular hosts** — added `headerRenderer` support through the shared core model and export helpers, with React and vanilla integrations plus tests so wrapper consumers can override header content without forking the grid.

### Changed

- **Shipped wrappers now render only the grid** — moved hero/metrics/toolbar/benchmark chrome out of the React wrapper, Angular component template, and vanilla custom element and into the demo hosts instead, so published package consumers get the grid surface only.
- **Benchmark presentation is aligned across the web suite** — Angular, React, and vanilla primary demos now expose the same benchmark controls, visible-row metrics, grouping/virtualization summary, and benchmark-average readout for side-by-side comparison.
- **Docs and examples refreshed for the new API surface** — updated `README.md`, Getting Started, API Reference, Web Component, and Rust/WASM documentation to cover the declarative vanilla API, the benchmark/demo host split, and the latest wrapper usage patterns.

### Fixed

- **Vanilla trading scroll performance** — the Web Components trading demo no longer replaces the entire grid render tree on every price tick; it now uses incremental data refresh and virtualization-aware body updates so scrolling stays smooth under live updates.
- **React styles packaging and web-suite bundling** — fixed package output so `@ornery/ui-grid-react/styles` resolves to an emitted CSS asset and cleaned up bundling/packaging issues across the web suite demo surfaces and library outputs.

## rust-v0.1.8 — 2026-05-04

### Added

- **egui trading terminal demo** — the native Rust demo now includes a dedicated trading example with live-ticking sample data and trading-specific columns, expanding the egui showcase beyond the existing customer-grid scenarios.

### Changed

- **Rust demo app refreshed around the new trading surface** — updated the egui example app and shared demo data wiring so the native showcase can present the new trading workflow cleanly alongside the existing grid capabilities.
- **Rust docs reorganized around the two Rust delivery paths** — refreshed `docs/rust.md`, `docs/rust-egui.md`, and the egui README so Rust/WASM browser usage and native egui usage are documented separately with clearer install, usage, and demo guidance.

### Fixed

- **egui demo/widget polish** — applied the supporting widget and example cleanup needed for the new demo flow, including the small `grid_widget.rs` adjustments and Rust hygiene follow-up (`cargo fmt` / clippy) that keep the native adapter aligned with the current shared grid behavior.

## v0.1.7-hotfix — 2026-05-02

### Fixed

- **Angular / web components / vanilla horizontal scroll layout** — `.grid-frame` was using `display: flex; flex-direction: column` with `.grid-table` as a `flex: 1 1 auto` child. When scrolled to the far right, the flex sizing model caused column tracks to misalign with their headers. Changed both selectors in `grid.core.styles.scss` to match the React wrapper's simpler approach: `.grid-frame` keeps only `overflow: hidden` and `.grid-table` uses `display: grid`. All three non-React host types (Angular, web components, vanilla) share this file, so all three are fixed by the single change.
- **React demo `mountUiGrid` import (TS2305)** — `src/types/ornery-ui-grid-react.d.ts` contained an ambient `declare module` block that overrode the tsconfig `paths` alias and resolved `@ornery/ui-grid-react` to the stale `dist/index.d.mts`, which did not export `mountUiGrid`. Deleted the ambient declaration file so the `paths` alias (`projects/ui-grid-react/src/index.ts`) resolves correctly. Added `"jsx": "react-jsx"` to `tsconfig.json` and included the React source in `tsconfig.app.json` includes so the React demo page compiles without errors.
- **GitHub Pages broken image** — The egui screenshot on the `/rust` page used an absolute path (`/docs/screenshots/pinning-100k.png`) which does not resolve under the Pages sub-path. Changed to a root-relative path (`docs/screenshots/pinning-100k.png`) and copied the asset to `public/docs/screenshots/` so it is bundled with the Angular build output.

### Added

- **`/rust` top-level page** — new hero page at `/rust` with a switchable tab layout: _Rust / WASM_ (browser delivery) and _egui Native_ (desktop/native delivery). Replaces the previous docs-embedded Rust landing and presents both delivery paths as first-class options.
- **egui pinned-grid screenshot** — `docs/screenshots/pinning-100k.png` added to the egui tab of the Rust page, showing fixed headers and pinned-column layout at 100 k rows.

## v0.1.7 — 2026-05-01

### Rust

- Brought eGui widget into feature partiy with angular, pinnable columns, save load state, CSV/overridable export, overridable controls, a11y, 118n, and more...
- Added a new top-level Rust landing page at `/rust` with a hero header and switchable Rust/WASM and egui tabs.
- Expanded the Rust / egui docs with install, minimal usage, feature recipes, pinning, save/restore state, CSV export, column extensions, and a native demo workflow.
- Added a pinned-grid screenshot at the top of the egui section to show the native desktop layout and fixed-header / pinned-column behavior.
- Refreshed the Rust docs to present Rust/WASM and egui as complementary delivery paths for browser and native hosts.

### Added

- **`@ornery/ui-grid-core` package** — shared logic (grid engine, state, filtering, sorting, grouping, pagination, pinning, infinite scroll, tree, WASM bridge) is now published as a standalone package with zero Angular and zero React peer dependencies. React, Angular, and the new Vanilla/Web Component builds all consume it.
- **Vanilla / Web Component build (`@ornery/ui-grid-vanilla`)** — full-featured grid delivered as native Custom Elements with no framework runtime requirement. Reaches feature parity with the Angular and React wrappers.
- **Drag-and-drop column reordering** — column headers in the React wrapper can now be dragged to reorder columns interactively.
- New CI workflows for Vanilla (`ci-vanilla.yml`) and Rust (`rust.yml`). The Rust workflow triggers only on changes to Rust source files.
- Single unified release workflow (`publish.yml`) triggered by a `v*` tag: publishes `ui-grid-core` first, then React, Vanilla, and Web in parallel once the core version is available on the npm registry.

### Changed

- **React install no longer pulls in Angular peer dependencies.** Angular-specific deps (`@angular/core`, `@angular/common`, `rxjs`) were runtime-polluting React installs; they now live only in the Angular (`@ornery/ui-grid`) package.
- Grid business logic extracted from `@ornery/ui-grid` (Angular) and `@ornery/ui-grid-react` into `@ornery/ui-grid-core`. All three framework packages are now thin wrappers over the shared core.
- Individual package publish workflows (`publish-core.yml`, `publish-react.yml`, `publish-vanilla.yml`) are manual-only fallbacks; the `v*` tag drives the full release suite automatically.

### Fixed

- Vanilla package manifest no longer ships with a `file:` dependency on `ui-grid-core`; uses a proper semver range so the published package resolves correctly.

## v0.1.6 (web) — 2026-04-30

### Added

- **Column pinning across Angular and React** — freeze columns left or right with CSS `position: sticky`, `enablePinning`, `pinnedLeft`/`pinnedRight`, save/restore support, and `gridApi.pinning.pinColumn()` for programmatic control.
- Angular/React header pin controls with explicit left/right actions, direct unpinning, and matching pinning labels in `GridLabels` and `en-US.json`.
- React wrapper docs page mounted inside the Angular docs app so wrapper behavior can be verified directly in the published documentation.
- Expanded `--ui-grid-*` CSS variable coverage for pinning, layout, controls, scrolling, and state styling.
- Release packaging now includes the Rust/WASM core artifacts and CI provisions the Rust toolchains needed to build them.

### Changed

- Framework wrappers now route more work through the Rust/WASM core where it improves performance without changing the public API.
- React docs/demo column widths and header layout were widened so header text and pin controls fit cleanly.
- Docs and Pages packaging were updated so the published site can bundle and serve the React wrapper consistently.

### Fixed

- Pin button behavior now matches between Angular and React, including left/right pin selection, pin-state icon behavior, and unpin flows.
- React pinned-column ordering, sticky offsets, and virtualized header/body alignment were corrected.
- GitHub Pages now mounts the React docs island correctly in production, including local alias/resolver fixes for `@ornery/ui-grid-react` and wrapper-owned mounting to avoid React runtime mismatches.
- React virtualization tests and docs build type resolution were updated for the current wrapper output and import surface.
- Pin button visibility uses the same opt-out behavior as the rest of the grid feature flags, and React cell focusing now escapes selector values safely.

## v0.1.2 (Rust crates) — 2026-04-30

### Added

- Rust packaging, screenshots, and documentation updates for the crate workspace and WASM distribution.
- CI/build pipeline support for Rust toolchains and packaging the WASM core alongside the web deliverables.

### Changed

- Framework wrappers now use as much of the Rust/WASM core as possible without regressing interactive performance.
- Bumped the Rust workspace crates from `0.1.1` to `0.1.2` via the workspace-level `Cargo.toml`.

### Fixed

- **egui: Row expansion click handling** — expand/collapse icons in `ui-grid-egui` no longer lose clicks to the full-cell overlay.
- Clicking the expand icon now selects the row without focusing the cell or entering edit mode.
- Double-clicking the expand icon no longer triggers cell editing.
- Expand icon hit target increased from `16x16` to `24x24` for easier interaction.

## v0.1.5 (web) — 2026-04-30

### Added

- **Column Pinning** — freeze columns left/right via CSS `position: sticky`. New `enablePinning` option on `GridOptions` and `GridColumnDef`, `pinnedLeft`/`pinnedRight` column def properties, and `gridApi.pinning.pinColumn()` programmatic API. Pinning state is included in save/restore. Implemented for both Angular and React.
- Header pin control for choosing left or right pinning, with direct unpin on already-pinned columns.
- `FEATURE_PINNING` compile-time feature flag for tree-shaking.
- Pinning labels (`pinColumn`, `pinLeft`, `pinRight`, `unpin`) added to `GridLabels` and `en-US.json`.
- Pinned column styles with opaque backgrounds and edge shadow indicators.
- Expanded public `--ui-grid-*` CSS variable coverage for layout, controls, scrolling, pinning, and state styling. See [Theming](./docs/theming.md).

### Fixed

- Pin button visibility now uses opt-out pattern (`enablePinning !== false`) consistent with other features.
- Reduced redundant `pinnedOffset()` calls per cell in Angular and React renders.
- Removed unnecessary `as any` casts in `buildInitialPinnedState`.
- Added `CSS.escape()` to selector-based cell focusing in React to prevent selector injection from special characters in row IDs.

## v0.1.1 (Rust crates) — 2026-04-30

### Fixed

- **egui: Row expansion click handling** — Expand/collapse icons in `ui-grid-egui` were not responding to clicks because the full-cell click overlay was stealing interaction from the icon button. Replaced the interactive icon button with a passive visual icon and moved click handling into the cell overlay with hit-testing against the icon rect.
- Clicking the expand icon now selects the row without focusing the cell or entering edit mode.
- Double-clicking the expand icon no longer triggers cell editing.
- Expand icon hit target increased from 16×16 to 24×24 for easier clicking.

### Changed

- Bumped all Rust crate versions from 0.1.0 to 0.1.1 (workspace-level `Cargo.toml`).

## v0.1.3 - 2026-04-28

### Added

- React wrapper package (`@ornery/ui-grid-react`) with `useGridState` hook, `useVirtualScroll` hook, render-prop templating, and full CSS theming parity. Ships ESM + CJS + `.d.ts` via tsup. Peer-depends on `@ornery/ui-grid` for 100% core reuse.
- Build-time feature flags (`grid.features.ts`): 12 const boolean flags enabling bundler dead-code elimination. Custom build script (`scripts/build-grid.mjs`) with `--features` and `--locale` flags.
- Internationalization: `GridLabels` interface (26 keys) backed by `i18n/en-US.json`, overridable at runtime via `GridOptions.labels` and at build time via `--locale`.
- Accessibility: ARIA grid pattern roles, SVG icons replacing text symbols, `aria-label` and `sr-only` screen reader text on all interactive controls. Remediation plan at `docs/plans/a11y-remediation.md`.
- Pure-TS core extraction: `grid.core.pipeline.ts`, `grid.core.viewmodel.ts`, `grid.core.edit.ts`, `grid.core.display.ts`, `grid.core.sorting.ts`, `grid.core.filtering.ts`, `grid.core.grouping.ts`, `grid.core.pagination.ts`, `grid.core.tree.ts`, `grid.core.state.ts`, `grid.core.export.ts`, `grid.core.identity.ts`, `grid.core.row-state.ts`, `grid.core.infinite-scroll.ts`, and `grid.core.types.ts` with zero Angular dependencies.
- Command and event layer: `ui-grid.commands.ts`, `ui-grid.events.ts`, `ui-grid.host.ts`, and `ui-grid.state.ts` separating Angular orchestration from pure logic.
- SSR harness component (`grid-ssr-harness.component.ts`) and server-side rendering guards.
- Documentation site with routed pages for Getting Started, Features, API Reference, Cell Editing, Expandable Rows, Tree View, Theming, i18n, Custom Builds, Web Component, Accessibility, and React.
- React CI workflow (`.github/workflows/ci-react.yml`).
- Library presets via `scripts/build-library-preset.mjs` with separate public API entry points (`public-api.core.ts`, `public-api.full.ts`, `public-api.minimal.ts`, `public-api.react.ts`).
- Combined `npm test` script that runs both Angular and React test suites.

### Changed

- Slimmed `ui-grid.component.ts` from monolithic class to thin rendering layer delegating to core modules and command functions.
- Moved grid styles from `ui-grid.component.scss` into shared `grid.core.styles.scss` with new `.toggle-icon`, `.pagination-icon`, and `.group-disclosure-icon` styles.
- Refactored demo app with routed layout, cleaner theme controls, and browser harness integration.
- Updated `README.md` for new project structure and feature set.

### Fixed

- jsdom cross-realm `dispatchEvent` error in CI: replaced `new KeyboardEvent()` with `document.createEvent()` + `initEvent()` + property descriptors to work around realm-checking validation.
- Keyboard event handling for cell editing in test environment (`bubbles: false` to prevent double-handling).

## v0.1.1 - 2026-04-27

### Added

- Demo theming for default and wireframe modes with light and dark variants.
- A 100,000-row demo dataset to showcase virtualization and performance.
- GitHub Pages deployment and packaging automation for the demo and library builds.
- CI coverage upload to Coveralls and expanded library coverage around the grid, filters, and API wrappers.

### Changed

- Updated the demo shell styling, removed the shark logo study, and improved header contrast.
- Raised the production style budget to accommodate the expanded demo UI.
- Narrowed CI and Pages triggers to project-relevant paths.
- Improved the demo harness and styles so theme variables pass cleanly through the shadow DOM layers.

### Security

- Hardened CSV export against spreadsheet formula injection.
- Blocked prototype-polluting dotted paths in nested property access and writes.
- Escaped filter text before regex construction, capped wildcard expansion, and sanitized restored state keys and filenames.

## v0.1.0 - 2026-04-27

Initial public release of `@ornery/ui-grid`.

### Features

- Angular 21 standalone grid component
- Shadow DOM encapsulation with CSS custom properties and `part` hooks
- Sorting, filtering, grouping, and column moving
- Virtualized rendering with Angular CDK
- Inline cell editing with spreadsheet-style keyboard navigation
- Pagination controls and programmatic pagination API
- Infinite scroll hooks
- Auto-resize hooks
- CSV export
- Benchmark hook
- Transient save/restore state support
- Tree view and expandable-row support
- Web component build output
- Browser demo app for GitHub Pages

### Usage Examples

#### Basic Angular usage

```ts
import { Component } from '@angular/core';
import { UiGridComponent } from '@ornery/ui-grid';

@Component({
  selector: 'app-customers',
  imports: [UiGridComponent],
  template: `<app-ui-grid [options]="gridOptions" />`,
})
export class CustomersComponent {
  gridOptions = {
    id: 'customers',
    title: 'Customers',
    data: [
      { id: '1', name: 'Bob', status: 'Active', revenue: 1200 },
      { id: '2', name: 'Alice', status: 'Pilot', revenue: 900 },
    ],
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'status' },
      { name: 'revenue', align: 'end' },
    ],
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: true,
    enableColumnMoving: true,
  };
}
```

#### Cell templating

```ts
import { Component, TemplateRef, viewChild } from '@angular/core';
import { GridCellTemplateContext, UiGridComponent } from '@ornery/ui-grid';

@Component({
  selector: 'app-templated-grid',
  imports: [UiGridComponent],
  template: `
    <ng-template #statusTemplate let-value>
      <span class="status-pill">{{ value }}</span>
    </ng-template>

    <app-ui-grid [options]="gridOptions" />
  `,
})
export class TemplatedGridComponent {
  private readonly statusTemplate =
    viewChild.required<TemplateRef<GridCellTemplateContext>>('statusTemplate');

  readonly gridOptions = {
    id: 'templated-customers',
    data: [
      { id: '1', name: 'Bob', status: 'Active', revenue: 1200 },
      { id: '2', name: 'Alice', status: 'Pilot', revenue: 900 },
    ],
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'status', cellTemplate: this.statusTemplate() },
      { name: 'revenue', align: 'end' },
    ],
  };
}
```

#### Expandable-row templating

```ts
import { Component, TemplateRef, viewChild } from '@angular/core';
import { GridExpandableTemplateContext, UiGridComponent } from '@ornery/ui-grid';

@Component({
  selector: 'app-expandable-grid',
  imports: [UiGridComponent],
  template: `
    <ng-template #detailTemplate let-row>
      <div class="detail-card">
        <strong>{{ row.name }}</strong>
        <p>Status: {{ row.status }}</p>
      </div>
    </ng-template>

    <app-ui-grid [options]="gridOptions" />
  `,
})
export class ExpandableGridComponent {
  private readonly detailTemplate =
    viewChild.required<TemplateRef<GridExpandableTemplateContext>>('detailTemplate');

  readonly gridOptions = {
    id: 'expandable-customers',
    data: [
      { id: '1', name: 'Bob', status: 'Active', revenue: 1200 },
      { id: '2', name: 'Alice', status: 'Pilot', revenue: 900 },
    ],
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'status' },
      { name: 'revenue', align: 'end' },
    ],
    enableExpandable: true,
    expandableRowHeight: 120,
    expandableRowTemplate: this.detailTemplate(),
  };
}
```

#### Web component usage

```html
<ui-grid-element></ui-grid-element>
<script type="module" src="./dist/ui-grid-element/main.js"></script>
<script>
  const grid = document.querySelector('ui-grid-element');
  grid.options = {
    id: 'customers',
    data: [
      { id: '1', name: 'Bob', status: 'Active', revenue: 1200 },
      { id: '2', name: 'Alice', status: 'Pilot', revenue: 900 },
    ],
    columnDefs: [{ name: 'name' }, { name: 'status' }, { name: 'revenue' }],
  };
</script>
```
