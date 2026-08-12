# Feature Parity Release Plan — Rust core + Egui adapter

Single release. Five batches. Each batch is review-sized (1–3 days of work) and lands as its own commit so the reviewer can scope feedback. The whole release moves the **Rust core** to functional parity with the canonical TS engine, and the **egui adapter** to functional parity with the vanilla web component.

**Scope is intentionally limited to Rust + egui.** The TS / Angular / React / vanilla surface is the source of truth and is not modified by this release. Wasm-parity tests are added so any future Rust-side bug is caught against TS.

Branch target: `main`. Each batch is one commit. The release is "done" when every step under "Checklist" below is checked off and the full test suite (incl. wasm-parity) is green.

---

## Cross-cutting decisions made up-front

- **TS is canonical, do not touch.** Every Rust-side change must keep TS-Rust wasm-parity tests green. The plan adds tests that lock this in.
- **Identity divergence**: Rust currently uses a `row_id_field` lookup; TS uses a `rowIdentity` callback. Fix Rust to take a JS callback through wasm so the bridge can stop bypassing it. TS stays as-is.
- **Saved-state shape drift**: Rust must emit `None` for default sort / pagination, not always-`Some`, so JSON round-trips don't drift between implementations. Fix in Rust only.
- **Generic export hook lives in Rust only.** TS / vanilla keeps its existing pdfMake / xlsx code paths untouched. Rust gets a vendor-agnostic `register` + `export` API because there's no pdfMake-in-Rust equivalent — the egui demo registers a placeholder PDF exporter to exercise the registration shape; production Rust hosts wire their own document-generation crate.
- **Egui adapter**: feature-parity work uses APIs that already exist in TS core (most gaps are *core-already-supports* on the TS side; some need a Rust port to surface in the engine). Where the gap needs a Rust port of an existing TS API, that work goes in Batch 5.
- **Audit correction**: every Batch 5 item exists today in TypeScript (`runGridCellValidators` returns Promise; `columnWidthOverrides` already in `GridSavedState` gated by `saveWidths`; `measureAutoColumnWidth` in vanilla focus.ts; `gridApi.core.benchmark` + `benchmarkComplete`; `keyDownOverrides: GridKeyEventOverride[]` on options). Batch 5 is therefore *Rust port of existing TS surface*, not net-new core. The egui-side work is wiring those Rust APIs into rendering.

---

## Batch 1 — Rust core correctness + wasm parity tests

Fix the five TS-Rust divergences and add the missing wasm-parity specs. No new features.

### Divergences to fix in Rust

1. **`filtering`: split into prepared-filter fast path.** Add `prepare_grid_column_filters` (per-column, once) and `matches_grid_row_prepared_filters` (per-row, no allocation) to mirror the TS API. Update Rust `pipeline.rs` to call the prepared variant. Add `prepare_grid_column_filters_js` + `matches_grid_row_prepared_filters_js` shims so wasm callers can opt in to the fast path.
2. **`pipeline`: identity-cache `buildGridRows`.** Mirror the TS `rowsCache` keyed on `(data, options, hidden, expanded, rowSize)` reference identity. Expose `get_cached_grid_pipeline_rows` + `clear_grid_pipeline_rows_cache`. Add the missing `reset_filter_reasons` private helper that strips stale `filter:*` reasons between passes when filtering is disabled.
3. **`identity`: support `rowIdentity` callback.** Drop the `row_id_field` field-name lookup. Take a `JsValue` callback at the wasm boundary and call it via `Function::call2`. Drop the bypass in `grid.core.wasm-bridge.ts` so the bridge actually calls Rust.
4. **`state`: omit defaults instead of always-`Some`.** Rust's `build_grid_saved_state` currently wraps sort + pagination in `Some(...)` unconditionally. Detect default sort (no column / no direction) and default pagination and emit `None` (which serializes as omitted key) to match TS shape.
5. **`row-sorter`: honor `column.sortingAlgorithm`.** Since the JS callback can't cross wasm, return a `SortKind::DeferToHost` variant from `guess_sort_kind` when a custom algorithm is set; the wasm bridge falls back to TS sort for those columns only.

### Feature-gap fills in Rust (small)

6. **`export.resolveExporterFilename`** — port from TS so Rust callers (egui) can compute the same filename TS would.
7. **`export.buildGridHeaderContext` + `formatGridHeaderDisplayValue`** — port from TS so templated headers render through wasm and from egui.
8. **`validate.GridValidatorRegistry.setValidator/getValidator`** — bridge the registry's mutation methods so consumer-registered validators are reachable from wasm. Document that closures stay JS-side; the bridge calls back into JS for non-built-in validators.

### New `*.wasm-parity.spec.ts` coverage (14 modules)

Add a `*.wasm-parity.spec.ts` + matching `*.wasm-runner.mjs` for each of:

- tree
- grouping
- pagination
- pinning
- filtering (covers new prepared-filter API too)
- sorting
- viewmodel
- identity (covers new callback bridge)
- row-state
- edit
- pipeline (integration surface — biggest test)
- state (covers Option-omit fix)
- infinite-scroll
- display

Each spec follows the existing pattern: a TS-side fixture is fed to both the TS implementation and the wasm-bound Rust implementation, with `expect(rust).toEqual(ts)` assertions for every public function. Parity tests live in `projects/ui-grid-core/src/lib/` next to their TS counterparts.

---

## Batch 2 — Egui adapter: selection, validate, row-edit

Highest-visible-feature batch. All gaps here are *core-already-supports* on both the TS and Rust sides — Rust core has the logic, egui isn't calling it. No core API changes; pure adapter work.

### Selection

1. Inject `selectionRowHeaderCol` when `enable_row_selection` + `enable_row_header_selection` are on. Render a row-checkbox in column 0.
2. Render the select-all checkbox in the corresponding header cell. `aria_checked` mirrors `selectAll`.
3. Wire Ctrl/Cmd-click → `toggle_grid_row_selection` (additive); plain click stays single-select (today's behaviour).
4. Wire pointer drag-paint multi-row selection (mirror of vanilla `mousedown #1`).
5. Wire `Ctrl+A` to `select_all_grid_rows`.
6. Wire `Space` to toggle the focused row's selection.
7. Honor `enableFullRowSelection`, `noUnselect`, `modifierKeysToMultiSelect`.
8. Emit single-vs-batch selection events per `enableSelectionBatchEvent`.

### Validation chrome

9. Read `is_grid_cell_invalid(row.entity, column)` during cell paint. Apply red border (theme: `cell_invalid_border`) + invalid-cell badge.
10. On hover, show tooltip with `get_grid_cell_error_messages` joined.

### Row-edit decoration

11. Read `row.is_dirty` / `row.is_saving` / `row.is_error` during cell paint. Apply tints (theme: `row_dirty_bg`, `row_saving_bg`, `row_error_bg`).

### Demo

12. Add a "Validate" demo column that flips invalidity on a length rule.
13. Add Save / Discard buttons that exercise `mark_grid_row_dirty` + `mark_grid_row_saving` + `mark_grid_row_clean`.
14. Add a checkbox-column toggle to the demo toolbar.

---

## Batch 3 — Egui adapter: keybindings, filters, pagination, renderer hooks

Finishes the vanilla-parity feature surface. No core API changes; pure adapter work.

### Keybindings

1. `F2` to begin cell edit (alongside today's Enter).
2. `Home` / `End` → row start / row end.
3. `Ctrl+Home` / `Ctrl+End` → first / last row.
4. First-character keypress on focused cell → begin edit with that character pre-seeded.

### Filters

5. Active-filter "clear" button (✕) inside the filter input when value is non-empty.
6. Filter renderer hook: `EguiAdapter::with_filter_renderer(name, fn)` so consumers can replace a filter input (e.g. with a dropdown).

### Pagination

7. Range label `firstRowIndex+1 - lastRowIndex+1 of totalItems` to match vanilla.
8. Page-size combo reads `paginationPageSizes` from options instead of hardcoded `[5,10,25,50,100]`.
9. Visually disable prev/next buttons at edges (today they only guard the click; the buttons should grey out).

### Renderer hooks (grid-level callbacks)

10. `with_group_row_renderer(fn)` — caller paints the group row.
11. `with_expandable_row_renderer(fn)` — caller paints the detail row (replaces today's hardcoded `Detail View` label).
12. `with_empty_state_renderer(fn)` — caller paints the empty state.
13. `with_filter_renderer(name, fn)` — see #6.

### Editor input-type switching

14. Read `editor_input_type(column)` from core. Map `'number'` to a numeric `TextEdit` filter, `'date'` to `egui_extras::DatePickerButton`, `'boolean'` to a checkbox. Today only column-ext callbacks cover this; the default editor stays text.

### Demo

15. Demo registers an `expandable_row_renderer` that shows row details properly (not just a label).
16. Demo registers a `group_row_renderer` to show the customizable label format.
17. Demo wires `enableInfiniteScroll` and registers a `needLoadMoreData` handler that appends rows.

---

## Batch 4 — Generic export hook (Rust-only)

Vendor-agnostic registerable exporter API on the Rust side. **TS / vanilla / Angular / React keep their existing pdfMake / xlsx code paths untouched.** The hook exists in Rust because there's no Rust equivalent of pdfMake — production Rust hosts (and the egui adapter) need a way to plug their own document-generation crate in.

### Public Rust contract

```rust
pub enum GridExportScope {
    Visible, // default — post-filter, post-sort, post-paginate
    All,
    Selected,
}

pub struct GridExportContext<'a> {
    pub columns: &'a [GridColumnDef],
    pub rows: &'a [GridRecord],
    pub formatted_cells: Vec<Vec<String>>,
    pub options: &'a GridOptions,
    pub scope: GridExportScope,
    pub format: &'a str, // 'csv' | 'pdf' | 'xlsx' | consumer-defined
}

pub struct GridExportResult {
    pub filename: String,
    pub content: Vec<u8>,
    pub mime_type: String,
}

pub trait GridExporter: Send + Sync {
    fn export(&self, ctx: &GridExportContext<'_>) -> GridExportResult;
}
```

### Wiring

1. New module `crates/ui-grid-core/src/exporter_registry.rs` with `register_grid_exporter` / `unregister_grid_exporter` / `export_grid` free functions, plus thread-safe storage (`OnceLock<RwLock<HashMap<String, Arc<dyn GridExporter>>>>`).
2. Built-in CSV exporter registered at first-use via `init_default_grid_exporters` so `export_grid("csv", ctx)` works without setup. Implementation reuses the existing `export_csv_rows_with` / `build_csv_export_payload` Rust code paths — no behavior change to CSV.
3. Egui adapter exposes `EguiGrid::register_exporter(format, exporter)` and `EguiGrid::export(format)`. The adapter builds the `GridExportContext` from the current pipeline result honoring the `scope` enum (defaults to Visible).
4. Egui demo registers a placeholder `'pdf'` exporter that returns a plain-text payload so the registration shape is exercised. Production hosts swap that for their pdfMake-equivalent crate.
5. `GridExportScope::Visible` reads from `pipeline.visible_rows` (post-filter / sort / paginate). `All` reads from `options.data`. `Selected` reads selected ids and resolves through `pipeline.visible_rows`.

### What is NOT touched

- TS `gridApi.core.exportPdf` — stays.
- TS pdfMake calls in `grid.core.export.ts` — stay.
- Vanilla `<ui-grid-element>` exporter menu and CSV download — stay.
- Angular wrapper exporter wiring — stays.
- React wrapper — stays.

This batch is a Rust-and-egui-only public API addition.

### Test coverage

- Unit test: register / unregister / missing-format error path on `exporter_registry`.
- Snapshot test: `GridExportContext` shape per scope (visible vs. all vs. selected) at the egui adapter boundary.
- Demo smoke: registered placeholder PDF exporter receives the right context.

---

## Batch 5 — Rust ports of existing TS APIs

Each item below already exists in TypeScript. The work is **porting the existing TS surface to Rust** so the egui adapter (and any future Rust host) has parity. TS code is unchanged.

1. **Async validators in Rust**. TS `runGridCellValidators` already returns `Promise<string[]>` (see `grid.core.validate.ts`); the Rust port currently returns sync `Vec<String>`. Update Rust to expose a `run_grid_cell_validators_async` variant returning a future / completion callback (FFI-friendly). Egui adapter awaits results and updates invalid badges on completion.
2. **Column-width persistence in Rust `GridSavedState`**. TS already serializes `columnWidthOverrides: Record<string, string>` gated by `saveWidths` (see `grid-controller.ts:1719`, `grid.models.ts:355`). Add the same field to Rust `GridSavedState` + `BuildGridSavedStateContext`. Egui save/restore round-trips column widths.
3. **Auto-fit column width measure for egui**. TS `measureAutoColumnWidth` (in `vanilla/src/focus.ts`) clones the cell DOM and reads `scrollWidth`. Egui has no DOM — replicate the *feature* by measuring text width via `egui::Galley::size` for each visible cell + header in the column on dblclick of the resize gripper. Same UX as vanilla, different primitive.
4. **Benchmark probe Rust analog**. TS `gridApi.core.benchmark(iterations) => Promise<GridBenchmarkResult>` + `benchmarkComplete` event already exist (see `grid.api.ts:47`). Add a host-agnostic `run_grid_benchmark` core API in Rust that runs the engine N times and reports averages. Egui demo wires it to a Benchmark button.
5. **`KeyOverrideSpec` Rust struct**. TS `keyDownOverrides: GridKeyEventOverride[]` on options (see `grid.models.ts:425`) lets consumers opt out of built-in keydown handling. Add a Rust analog (`KeyOverrideSpec`) read from the same options field. Egui consults the spec when handling keydown so consumers can opt out.

### Demo

- Demo exercises each new Rust API behind a feature toggle.

---

## Checklist

### Batch 1 — Rust core correctness + parity tests

- [x] `filtering`: add `prepare_grid_column_filters` + `matches_grid_row_prepared_filters` + wasm shims; pipeline switched to prepared variant
- [x] `pipeline`: implement identity-keyed `rowsCache` (`get_cached_grid_pipeline_rows`, `clear_grid_pipeline_rows_cache`) + `reset_filter_reasons` helper + wasm shims
- [x] `identity`: replace `row_id_field` with `rowIdentity` JS callback bridge; remove the bypass in `grid.core.wasm-bridge.ts`
- [x] `state`: skip-serialize empty Vec/BTreeMap/Option fields in `GridSavedState` so empty-input round-trips produce `{}` (not `{sort:null, pagination:null, ...}`)
- [x] `row-sorter`: emit `SortKind::DeferToHost` for columns with `sortingAlgorithm`; wasm bridge falls back to TS sort for those
- [x] `export.resolveExporterFilename` ported to Rust
- [x] `export.buildGridHeaderContext` + `formatGridHeaderDisplayValue` ported to Rust
- [x] `validate.GridValidatorRegistry.setValidator/getValidator` bridged through wasm callback
- [x] `row-state`: align Rust return-shape with TS `{expanded, nextExpandedRows / nextExpandedTreeRows}` (was Rust tuple)
- [x] `edit`: align Rust return-shape with TS `{editingCell, editingValue}` (was tuple); `findNextGridCell` returns `{row, column}` (was `GridCellPosition`); `enableCellEditOnFocus` is now tri-state `Option<bool>` so column override of false correctly opts out when options enable focus-edit
- [x] `row_searcher`: `guess_condition` now emits a literal-substring regex for default contains (was emitting `Comparator(Contains)` which silently matched everything in `run_column_filter`'s comparator branch — TS-parity bug)
- [x] `tree`: `build_grid_rows_js` and `build_pipeline_js` invoke `options.rowIdentity` callback through `Function::call2` to pre-resolve identities into `row_identity_overrides` (closures can't cross wasm via serde — see crates/ui-grid-wasm `collect_row_identity_overrides`)
- [x] Wasm-parity spec: tree (incl. in-process rowIdentity callback bridge)
- [x] Wasm-parity spec: grouping
- [x] Wasm-parity spec: pagination
- [x] Wasm-parity spec: pinning
- [x] Wasm-parity spec: filtering
- [x] Wasm-parity spec: sorting
- [x] Wasm-parity spec: viewmodel
- [x] Wasm-parity spec: identity (callback bridge)
- [x] Wasm-parity spec: row-state
- [x] Wasm-parity spec: edit
- [x] Wasm-parity spec: pipeline (integration)
- [x] Wasm-parity spec: state (Option-omit fix)
- [x] Wasm-parity spec: infinite-scroll
- [x] Wasm-parity spec: display

### Batch 2 — Egui adapter: selection, validate, row-edit

- [x] Checkbox-column injection when row selection + header selection are on
- [x] Select-all header checkbox
- [x] Ctrl/Cmd-click toggle (additive) selection
- [x] Drag-paint multi-row selection
- [x] Ctrl+A select-all binding
- [x] Space binding toggles focused row
- [x] `enableFullRowSelection` / `noUnselect` / `modifierKeysToMultiSelect` honored
- [x] Single-vs-batch selection events per `enableSelectionBatchEvent`
- [x] Validation: red border on invalid cells
- [x] Validation: error tooltip on hover
- [x] Row-edit: dirty/saving/error tints applied during cell paint
- [x] Demo: validate column with length rule
- [x] Demo: Save / Discard buttons exercising row-edit lifecycle
- [x] Demo: checkbox-column toggle

### Batch 3 — Egui adapter: keys, filters, pagination, renderer hooks

- [x] F2 begins cell edit
- [x] Home / End → row start / row end
- [x] Ctrl+Home / Ctrl+End → first / last row
- [x] First-character keypress begins edit pre-seeded with the char
- [x] Filter input "clear" (✕) button when non-empty
- [x] `with_filter_renderer(name, fn)` hook
- [x] Pagination range label `M – N of total`
- [x] Pagination page-size list reads `paginationPageSizes` from options
- [x] Pagination prev/next visually disabled at edges
- [x] `with_group_row_renderer(fn)` hook
- [x] `with_expandable_row_renderer(fn)` hook
- [x] `with_empty_state_renderer(fn)` hook
- [x] Editor input-type switching (text / number / date / boolean) using `editor_input_type`
- [x] Demo: expandable row renderer paints row detail properly
- [x] Demo: group row renderer custom label format
- [x] Demo: infinite-scroll handler appends rows on `needLoadMoreData`

### Batch 4 — Generic export hook (Rust-only)

- [x] `crates/ui-grid-core/src/exporter_registry.rs` with `register_grid_exporter` / `unregister_grid_exporter` / `export_grid`
- [x] Built-in CSV exporter auto-registered via `init_default_grid_exporters`
- [x] `GridExportScope::{Visible, All, Selected}` enum + scope plumbing into `GridExportContext`
- [x] Egui `EguiGrid::register_exporter(format, exporter)` API
- [x] Egui `EguiGrid::export(format)` builds `GridExportContext` (default scope = visible) and invokes registered exporter
- [x] Existing `Export CSV` demo button keeps working via the new hook (no behavior change)
- [x] Egui demo registers placeholder `'pdf'` exporter returning plain-text payload
- [x] Test: registry register/unregister/missing-format
- [x] Test: `GridExportContext` shape snapshot per scope
- [x] Test: demo `'pdf'` exporter receives expected context
- [x] Verify: TS / vanilla / Angular / React export code paths unchanged (smoke: `npm test`)

### Batch 5 — Rust ports of existing TS APIs

- [x] Async validators in Rust (`run_grid_cell_validators_async` future-returning variant); egui awaits and re-paints invalid badges
- [x] Column-width persistence: `column_widths` field added to Rust `GridSavedState` + `BuildGridSavedStateContext` to mirror TS `columnWidthOverrides`; egui save/restore round-trips widths
- [x] Egui auto-fit column width on double-click (Galley measure path) — same UX as TS `measureAutoColumnWidth`
- [x] Core `run_grid_benchmark` Rust API mirroring TS `gridApi.core.benchmark`; egui demo wires a Benchmark button
- [x] `KeyOverrideSpec` Rust struct mirroring TS `GridKeyEventOverride`; egui honors it during keydown
- [x] Demo exercises each ported API behind a toggle

---

## Test gates (per batch)

Every batch must leave **all of these green** before merging:

- `npm test` (Angular + Core TS + React + Vanilla — including wasm-parity specs)
- `cargo test --workspace`
- `cargo clippy --workspace --all-targets -- -D warnings`
- `npx tsc --noEmit -p projects/ui-grid-core/tsconfig.json`
- `npx tsc --noEmit -p projects/ui-grid-vanilla/tsconfig.json`
- `npx tsc --noEmit -p projects/ui-grid-react/tsconfig.json`
- `npx tsc --noEmit -p projects/ui-grid/tsconfig.lib.json`
- `npx tsc --noEmit -p tsconfig.app.json`

For batches 2 / 3 / 4 / 5 the egui demo must also still build:

- `cargo run -p ui-grid-egui --example demo` (manual smoke)

For batch 4 specifically, also verify TS / vanilla untouched: no diffs under `projects/ui-grid-core/src/lib/grid.core.export.ts`, `projects/ui-grid-vanilla/src/`, Angular wrapper, React wrapper.

---

## When the release is "done"

Every checkbox above is checked, every test gate is green for every batch, and the egui demo exercises every new feature behind a toggle so the user can flip between configurations and see parity at runtime. After the release lands, the **Rust core** is no longer behind the TS canonical (every TS module has a Rust counterpart with a wasm-parity spec locking it in), and the **egui adapter** has the same feature surface as the vanilla web component. TS / Angular / React / vanilla code is untouched throughout.
