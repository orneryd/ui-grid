# Custom Builds

Ship only the features you use. The build script generates compile-time boolean constants that let the bundler tree-shake unused code paths entirely.

## Feature Flags

| CLI Name | TypeScript Constant | What It Guards |
|----------|-------------------|----------------|
| `sorting` | `FEATURE_SORTING` | Column sort UI and pipeline sort step |
| `filtering` | `FEATURE_FILTERING` | Filter row and pipeline filter step |
| `grouping` | `FEATURE_GROUPING` | Group headers and grouping pipeline |
| `pagination` | `FEATURE_PAGINATION` | Pagination footer and page slicing |
| `cell-edit` | `FEATURE_CELL_EDIT` | Inline editing UI and keyboard handlers |
| `expandable` | `FEATURE_EXPANDABLE` | Expandable detail rows |
| `tree-view` | `FEATURE_TREE_VIEW` | Tree row rendering and tree pipeline |
| `infinite-scroll` | `FEATURE_INFINITE_SCROLL` | Infinite scroll state machine |
| `column-moving` | `FEATURE_COLUMN_MOVING` | drag-and-drop on headers |
| `csv-export` | `FEATURE_CSV_EXPORT` | CSV export and toolbar button |
| `save-state` | `FEATURE_SAVE_STATE` | Save/restore state serialization |
| `auto-resize` | `FEATURE_AUTO_RESIZE` | ResizeObserver integration |

## Usage

```bash
# Full build (default — all features enabled)
node scripts/build-grid.mjs

# Minimal build — only sorting and filtering
node scripts/build-grid.mjs --features sorting,filtering

# Custom locale baked in at build time
node scripts/build-grid.mjs --locale projects/ui-grid/src/lib/grid/i18n/fr-FR.json

# Both features and locale
node scripts/build-grid.mjs --features sorting,filtering,pagination --locale i18n/fr-FR.json

# See available flags
node scripts/build-grid.mjs --list

# Dry run — writes generated file but skips ng build
node scripts/build-grid.mjs --features sorting --dry-run
```

## How It Works

1. The script backs up `grid.features.ts`
2. Generates a new version with only selected flags set to `true`
3. Optionally swaps `i18n/en-US.json` with the provided locale file
4. Runs `ng build uiGridPackage --configuration production`
5. Restores the original files (even on build failure)

The bundler sees `if (false) { ... }` and tree-shakes the dead code path entirely. The grid API uses noop fallbacks for all optional feature namespaces, so runtime behavior is always safe.

## Build Presets

Higher-level presets are available via the preset build script:

```bash
# Build the full preset (default)
npm run build:library:preset -- --preset=full

# Build the minimal/headless preset
npm run build:library:preset -- --preset=minimal
```

| Preset | Includes | Status |
|--------|----------|--------|
| `full` | All features + Angular component | Supported |
| `minimal` | Headless core: API, sorting, filtering, pagination | Supported |
| `data-heavy` | Sorting, filtering, viewport, export | Planned |
| `interactive` | Sorting, filtering, grouping, editing, tree, expandable | Planned |
