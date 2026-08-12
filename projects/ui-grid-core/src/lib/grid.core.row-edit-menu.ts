/**
 * Row-edit menu — contributes "Save changes" and "Retry errored rows"
 * actions to the grid menu. Separate from `grid.core.row-edit.ts` for the
 * same reason the exporter menu lives on its own: menu shape + gating is a
 * concern distinct from the save/dirty logic, and different framework
 * wrappers may render menus totally differently.
 */

import { GridLabels, GridOptions } from './grid.models';
import { GridMenuItem } from './grid.core.menu';

export interface GridRowEditMenuActions {
  flushDirtyRows: () => void | Promise<void>;
  /** Re-fires `saveRow` for every row currently in the error state. */
  retryErroredRows: () => void | Promise<void>;
}

/** The subset of `GridLabels` the menu needs. Accepting `Partial<GridLabels>`
 * lets callers pass the full resolved label bundle directly. */
export type GridRowEditMenuLabels = Partial<
  Pick<GridLabels, 'rowEditFlushAll' | 'rowEditRetryErrors'>
>;

/** Build the row-edit menu items. Each entry is gated on both the
 * corresponding gridOption flag (opt-out) and a runtime predicate
 * (`hasDirtyRows` / `hasErrorRows`) so the menu only surfaces actions
 * that have something to do. */
export function buildGridRowEditMenuItems(
  options: GridOptions,
  labels: GridRowEditMenuLabels,
  actions: GridRowEditMenuActions,
  predicates: { hasDirtyRows: () => boolean; hasErrorRows: () => boolean },
): GridMenuItem[] {
  const baseOrder = options.rowEditMenuItemOrder ?? 300;
  const menuFlush = options.rowEditMenuFlushDirtyRows !== false;
  const menuCancel = options.rowEditMenuCancelDirtyRows !== false;

  const items: GridMenuItem[] = [];
  if (menuFlush) {
    items.push({
      title: labels.rowEditFlushAll ?? '',
      action: () => {
        void actions.flushDirtyRows();
      },
      shown: () => predicates.hasDirtyRows(),
      order: baseOrder,
    });
  }
  if (menuCancel) {
    items.push({
      title: labels.rowEditRetryErrors ?? '',
      action: () => {
        void actions.retryErroredRows();
      },
      shown: () => predicates.hasErrorRows(),
      order: baseOrder + 1,
    });
  }
  return items;
}
