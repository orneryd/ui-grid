/**
 * Build-time feature flags for ui-grid.
 *
 * Default build: all features enabled.
 * Use `node scripts/build-grid.mjs --features sorting,filtering` to generate
 * a custom build with only selected features. The bundler tree-shakes code
 * guarded by `false` flags.
 */
export const FEATURE_SORTING = true;
export const FEATURE_FILTERING = true;
export const FEATURE_GROUPING = true;
export const FEATURE_PAGINATION = true;
export const FEATURE_CELL_EDIT = true;
export const FEATURE_EXPANDABLE = true;
export const FEATURE_TREE_VIEW = true;
export const FEATURE_INFINITE_SCROLL = true;
export const FEATURE_COLUMN_MOVING = true;
export const FEATURE_CSV_EXPORT = true;
export const FEATURE_SAVE_STATE = true;
export const FEATURE_AUTO_RESIZE = true;
export const FEATURE_PINNING = true;
