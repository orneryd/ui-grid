/**
 * Importer menu — contributes a single "Import" entry to the grid menu.
 * The old `ui.grid.importer` module wired a more elaborate menu-item
 * template (with an embedded file input), but for our menu shape we
 * emit a plain action entry — the controller's file-picker handler is
 * what actually opens the `<input type="file">`.
 */

import { GridLabels, GridOptions } from './grid.models';
import { GridMenuItem } from './grid.core.menu';

export interface GridImporterMenuActions {
  importAFile: () => void;
}

export type GridImporterMenuLabels = Partial<Pick<GridLabels, 'importerTitle'>>;

/** Build the importer menu items. Respects the `enableImporter` +
 * `importerShowMenu` gridOption flags. Returns an empty list when the
 * importer is disabled so consumers can always call this and concat
 * the result with other menus without null-checking. */
export function buildGridImporterMenuItems(
  options: GridOptions,
  labels: GridImporterMenuLabels,
  actions: GridImporterMenuActions,
): GridMenuItem[] {
  // Default (old module): `importerShowMenu` defaults to true, but only
  // when `enableImporter` is true. Without `enableImporter` the feature
  // is off entirely.
  if (options.enableImporter !== true) return [];
  if (options.importerShowMenu === false) return [];
  const order = options.importerMenuItemOrder ?? 400;
  return [
    {
      title: labels.importerTitle ?? '',
      action: () => actions.importAFile(),
      shown: () => true,
      order,
    },
  ];
}
