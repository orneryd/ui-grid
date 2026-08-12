import type { GridOptions, GridRecord, GridRow } from './grid.models';

/**
 * Selection state + pure-function helpers.
 *
 * Ported from the original `ui.grid.selection` module
 * (packages/selection/src/js/selection.js). Keeping the logic pure lets the
 * same helpers back the vanilla controller, future Angular/React wrappers,
 * and unit tests without pulling in a DOM.
 *
 * Non-mutating shape: callers own the `selectedRowIds: Set` and any
 * `lastSelectedRowId` anchor. Each helper returns what changed so the
 * caller can raise the right public-API events (single vs. batch).
 */

export interface GridSelectionState {
  readonly selectedRowIds: Set<string>;
  lastSelectedRowId: string | null;
  focusedRowId: string | null;
  selectAll: boolean;
}

export function createGridSelectionState(): GridSelectionState {
  return {
    selectedRowIds: new Set<string>(),
    lastSelectedRowId: null,
    focusedRowId: null,
    selectAll: false,
  };
}

/** Options normalised to their effective boolean defaults. Mirrors the
 * defaults in uiGridSelectionService.defaultGridOptions. */
export interface GridSelectionResolvedOptions {
  enableRowSelection: boolean;
  multiSelect: boolean;
  noUnselect: boolean;
  modifierKeysToMultiSelect: boolean;
  enableRowHeaderSelection: boolean;
  enableFullRowSelection: boolean;
  enableFocusRowOnRowHeaderClick: boolean;
  enableSelectRowOnFocus: boolean;
  enableSelectAll: boolean;
  enableSelectionBatchEvent: boolean;
  selectionRowHeaderWidth: number;
  enableFooterTotalSelected: boolean;
  isRowSelectable: ((row: GridRow) => boolean) | null;
}

export function resolveGridSelectionOptions(options: GridOptions): GridSelectionResolvedOptions {
  const enableRowHeaderSelection = options.enableRowHeaderSelection !== false;
  return {
    enableRowSelection: options.enableRowSelection === true,
    multiSelect: options.multiSelect !== false,
    noUnselect: options.noUnselect === true,
    modifierKeysToMultiSelect: options.modifierKeysToMultiSelect === true,
    enableRowHeaderSelection,
    // Defaults true when header-selection is off, false when it's on —
    // matches the old module so a checkbox column doesn't double-handle
    // clicks that would also fire via "click anywhere on the row".
    enableFullRowSelection:
      options.enableFullRowSelection ?? !enableRowHeaderSelection,
    enableFocusRowOnRowHeaderClick:
      options.enableFocusRowOnRowHeaderClick !== false || !enableRowHeaderSelection,
    enableSelectRowOnFocus: options.enableSelectRowOnFocus !== false,
    enableSelectAll: options.enableSelectAll !== false,
    enableSelectionBatchEvent: options.enableSelectionBatchEvent !== false,
    selectionRowHeaderWidth: options.selectionRowHeaderWidth ?? 30,
    enableFooterTotalSelected: options.enableFooterTotalSelected !== false,
    isRowSelectable: options.isRowSelectable ?? null,
  };
}

/** Result of a selection mutation. `changed` lists the rows whose selected
 * state flipped, so the caller can raise rowSelectionChanged or
 * rowSelectionChangedBatch. */
export interface SelectionChange {
  changed: GridRow[];
  selectAllAfter: boolean;
}

/** Toggle selection on a single row. Mirrors the old module's
 * `toggleRowSelection`, including single-select clear-others and noUnselect
 * semantics. Returns the set of rows whose state changed. */
export function toggleGridRowSelection(
  state: GridSelectionState,
  allRows: readonly GridRow[],
  row: GridRow,
  opts: {
    multiSelect: boolean;
    noUnselect: boolean;
    canBeInvisible?: boolean;
  },
): SelectionChange {
  const changed: GridRow[] = [];
  if (row.enableSelection === false) {
    return { changed, selectAllAfter: state.selectAll };
  }
  const canBeInvisible = opts.canBeInvisible ?? true;
  let selected = row.isSelected;

  if (!opts.multiSelect) {
    if (!selected) {
      for (const other of allRows) {
        if (other.isSelected && other.enableSelection !== false) {
          other.setSelected(false);
          state.selectedRowIds.delete(other.id);
          changed.push(other);
        }
      }
    } else if (state.selectedRowIds.size > 1) {
      // Single-select mode but we already have multiple selected — clear all
      // so the target can be re-selected cleanly.
      selected = false;
      for (const other of allRows) {
        if (other.isSelected && other.enableSelection !== false) {
          other.setSelected(false);
          state.selectedRowIds.delete(other.id);
          changed.push(other);
        }
      }
    }
  }

  if (!(selected && opts.noUnselect) && (canBeInvisible || row.visible)) {
    const next = !selected;
    row.setSelected(next);
    if (next) {
      state.selectedRowIds.add(row.id);
      state.lastSelectedRowId = row.id;
    } else {
      state.selectedRowIds.delete(row.id);
    }
    changed.push(row);
  }

  const selectAllAfter = allRows.length > 0 && state.selectedRowIds.size === allRows.length;
  state.selectAll = selectAllAfter;
  return { changed, selectAllAfter };
}

/** Range-select from lastSelectedRowId to `row`, using `visibleRowCache`
 * (the pipeline's filtered/sorted row order). Matches old shiftSelect
 * including wrap-when-lastSelected-is-unknown and reverse-direction. */
export function shiftGridRowSelection(
  state: GridSelectionState,
  visibleRowCache: readonly GridRow[],
  row: GridRow,
  opts: { multiSelect: boolean },
): SelectionChange {
  const changed: GridRow[] = [];
  if (!opts.multiSelect) return { changed, selectAllAfter: state.selectAll };

  const anchorId = state.lastSelectedRowId;
  const anchorIndex = anchorId
    ? visibleRowCache.findIndex((candidate) => candidate.id === anchorId)
    : 0;
  let fromRow = state.selectedRowIds.size > 0 && anchorIndex >= 0 ? anchorIndex : 0;
  let toRow = visibleRowCache.findIndex((candidate) => candidate.id === row.id);
  if (toRow < 0) return { changed, selectAllAfter: state.selectAll };

  if (fromRow > toRow) {
    const tmp = fromRow;
    fromRow = toRow;
    toRow = tmp;
  }

  for (let i = fromRow; i <= toRow; i++) {
    const rowToSelect = visibleRowCache[i];
    if (!rowToSelect) continue;
    if (!rowToSelect.isSelected && rowToSelect.enableSelection !== false) {
      rowToSelect.setSelected(true);
      state.selectedRowIds.add(rowToSelect.id);
      state.lastSelectedRowId = rowToSelect.id;
      changed.push(rowToSelect);
    }
  }

  const selectAllAfter =
    visibleRowCache.length > 0 && state.selectedRowIds.size === visibleRowCache.length;
  state.selectAll = selectAllAfter;
  return { changed, selectAllAfter };
}

/** Select every row in the grid that's eligible (enableSelection + isRowSelectable). */
export function selectAllGridRows(
  state: GridSelectionState,
  allRows: readonly GridRow[],
  opts: { multiSelect: boolean; isRowSelectable: ((row: GridRow) => boolean) | null },
): SelectionChange {
  const changed: GridRow[] = [];
  if (!opts.multiSelect) return { changed, selectAllAfter: state.selectAll };
  for (const row of allRows) {
    if (row.isSelected) continue;
    if (row.enableSelection === false) continue;
    if (opts.isRowSelectable && opts.isRowSelectable(row) === false) continue;
    row.setSelected(true);
    state.selectedRowIds.add(row.id);
    changed.push(row);
  }
  state.selectAll = true;
  return { changed, selectAllAfter: true };
}

/** Select visible rows, unselect the rest. Matches old selectAllVisibleRows. */
export function selectAllVisibleGridRows(
  state: GridSelectionState,
  allRows: readonly GridRow[],
  opts: { multiSelect: boolean; isRowSelectable: ((row: GridRow) => boolean) | null },
): SelectionChange {
  const changed: GridRow[] = [];
  if (!opts.multiSelect) return { changed, selectAllAfter: state.selectAll };
  for (const row of allRows) {
    if (row.visible) {
      if (row.isSelected) continue;
      if (row.enableSelection === false) continue;
      if (opts.isRowSelectable && opts.isRowSelectable(row) === false) continue;
      row.setSelected(true);
      state.selectedRowIds.add(row.id);
      changed.push(row);
    } else if (row.isSelected) {
      row.setSelected(false);
      state.selectedRowIds.delete(row.id);
      changed.push(row);
    }
  }
  state.selectAll = true;
  return { changed, selectAllAfter: true };
}

export function clearAllGridSelection(
  state: GridSelectionState,
  allRows: readonly GridRow[],
): SelectionChange {
  const changed: GridRow[] = [];
  for (const row of allRows) {
    if (row.isSelected && row.enableSelection !== false) {
      row.setSelected(false);
      state.selectedRowIds.delete(row.id);
      changed.push(row);
    }
  }
  state.selectAll = false;
  return { changed, selectAllAfter: false };
}

/** Find a row by arbitrary key — `isInEntity=true` checks row.entity[key],
 * false checks the row itself (e.g. `row.id`). Mirrors old findRowByKey. */
export function findGridRowByKey(
  rows: readonly GridRow[],
  isInEntity: boolean,
  key: string,
  comparator: unknown,
): GridRow | null {
  for (const row of rows) {
    const value = isInEntity
      ? (row.entity as Record<string, unknown>)[key]
      : (row as unknown as Record<string, unknown>)[key];
    if (value === comparator) return row;
  }
  return null;
}

/** Reconcile selectedRowIds against allRows, e.g. after a data refresh —
 * drops any id that no longer exists in allRows and pushes isSelected onto
 * row instances that did survive. */
export function reconcileGridSelection(
  state: GridSelectionState,
  allRows: readonly GridRow[],
  isRowSelectable: ((row: GridRow) => boolean) | null,
): void {
  const alive = new Set<string>();
  for (const row of allRows) {
    if (isRowSelectable) {
      row.enableSelection = isRowSelectable(row) !== false;
    }
    if (state.selectedRowIds.has(row.id)) {
      row.setSelected(true);
      alive.add(row.id);
    } else {
      row.setSelected(false);
    }
    row.setFocused(state.focusedRowId === row.id);
  }
  // Prune ids whose rows no longer exist.
  for (const id of [...state.selectedRowIds]) {
    if (!alive.has(id)) state.selectedRowIds.delete(id);
  }
  state.selectAll = allRows.length > 0 && state.selectedRowIds.size === allRows.length;
}

/** Extract entity objects from selected rows, matching the old
 * `mapAndFilterRowsByEntity` that filtered for `$$hashKey` — we don't have
 * the AngularJS marker so we just filter to rows whose entity is an object. */
export function mapSelectedRowsToEntities(rows: readonly GridRow[]): GridRecord[] {
  const out: GridRecord[] = [];
  for (const row of rows) {
    if (row.entity && typeof row.entity === 'object') out.push(row.entity);
  }
  return out;
}
