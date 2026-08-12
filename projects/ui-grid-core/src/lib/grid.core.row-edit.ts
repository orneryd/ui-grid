import { GridRecord, GridRow } from './grid.models';

/** Pure state for ui.grid.rowEdit. The old module stored `dirtyRows` and
 * `errorRows` arrays on `grid.rowEdit` — we keep an equivalent set-of-ids
 * representation so consumers can ask "is this row dirty?" in O(1) and
 * enumerate dirty rows when `flushDirtyRows()` is called. */
export interface GridRowEditState {
  dirtyRowIds: Set<string>;
  errorRowIds: Set<string>;
  savingRowIds: Set<string>;
  /** Maps rowId → pending save promise (resolved to void on success, rejected
   * on error). Used by `flushDirtyRows()` to `Promise.all` the batch. */
  savePromises: Map<string, Promise<void>>;
}

export function createGridRowEditState(): GridRowEditState {
  return {
    dirtyRowIds: new Set(),
    errorRowIds: new Set(),
    savingRowIds: new Set(),
    savePromises: new Map(),
  };
}

/** Mark a row dirty + sync the flags on the live GridRow instance. Ports
 * `endEditCell` + `setRowsDirty` — both call here. Returns true when the
 * row transitioned to dirty (so the caller knows to emit a saveRow timer). */
export function markGridRowDirty(state: GridRowEditState, row: GridRow): boolean {
  if (row.isDirty) return false;
  row.isDirty = true;
  row.isError = false;
  state.dirtyRowIds.add(row.id);
  state.errorRowIds.delete(row.id);
  return true;
}

/** Clear the dirty + error flags on a row. Ports `setRowsClean` and the
 * success branch of `processSuccessPromise`. */
export function markGridRowClean(state: GridRowEditState, row: GridRow): void {
  row.isDirty = false;
  row.isError = false;
  row.isSaving = false;
  state.dirtyRowIds.delete(row.id);
  state.errorRowIds.delete(row.id);
  state.savingRowIds.delete(row.id);
  state.savePromises.delete(row.id);
}

/** Flip the row into the "saving" state — the UI can grey it out while
 * a save promise is in flight. Ports `saveRow`'s "isSaving = true" step. */
export function markGridRowSaving(state: GridRowEditState, row: GridRow): void {
  row.isSaving = true;
  state.savingRowIds.add(row.id);
}

/** Move a row from saving → error. The old module called this via
 * `processErrorPromise`. */
export function markGridRowError(state: GridRowEditState, row: GridRow): void {
  row.isSaving = false;
  row.isError = true;
  // isDirty stays true so the user can retry by editing again.
  row.isDirty = true;
  state.savingRowIds.delete(row.id);
  state.errorRowIds.add(row.id);
  state.dirtyRowIds.add(row.id);
  state.savePromises.delete(row.id);
}

/** Returns true when the configured wait interval is finite — i.e. saves
 * are timer-driven. Matches the old module's check against
 * `gridOptions.rowEditWaitInterval !== -1`. */
export function isGridRowEditTimerEnabled(waitInterval: number | undefined): boolean {
  return waitInterval !== -1;
}

/** Resolves the effective wait interval, falling back to the old module's
 * default of 2000 ms. */
export function resolveGridRowEditWaitInterval(waitInterval: number | undefined): number {
  return waitInterval && waitInterval > 0 ? waitInterval : 2000;
}

/** Extract the underlying entities for the rows referenced by the given
 * ids, preserving pipeline order where possible. Mirrors the shape of
 * `gridApi.rowEdit.getDirtyRows().map(r => r.entity)`. */
export function collectGridRowEntities(
  rows: readonly GridRow[],
  ids: ReadonlySet<string>,
): GridRecord[] {
  const result: GridRecord[] = [];
  for (const row of rows) {
    if (ids.has(row.id)) result.push(row.entity);
  }
  return result;
}
