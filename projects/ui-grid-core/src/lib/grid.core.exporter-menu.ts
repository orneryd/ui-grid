/**
 * Grid exporter menu — produces the "Export all / visible / selected
 * as CSV / PDF / Excel" menu item list that ui.grid.exporter's `addToMenu`
 * populated. Kept in its own module because the menu is a distinct
 * concern from the export rendering itself: different frameworks may
 * render menu items totally differently, but the shape + gating logic is
 * shared.
 */

import { GridLabels, GridOptions } from './grid.models';
import { GridExporterColumnType, GridExporterRowType } from './grid.core.export';

/** Menu item descriptor. Shape mirrors the old module's `addToGridMenu`
 * payload so consumers can wire this into whatever menu system they have. */
export interface GridExporterMenuItem {
  title: string;
  order: number;
  action: () => void;
  /** Runtime guard — when it returns false the item should be hidden. */
  shown: () => boolean;
}

/** The set of exporter actions the menu can invoke. `pdfExport` /
 * `excelExport` are optional — when omitted, the corresponding menu rows
 * are simply not emitted. */
export interface GridExporterMenuActions {
  csvExport: (rowType: GridExporterRowType, colType: GridExporterColumnType) => void;
  pdfExport?: (rowType: GridExporterRowType, colType: GridExporterColumnType) => void;
  excelExport?: (rowType: GridExporterRowType, colType: GridExporterColumnType) => void;
}

/** The subset of `GridLabels` the menu needs. Accepting `Partial<GridLabels>`
 * lets callers pass the full resolved label bundle directly. */
export type GridExporterMenuLabels = Partial<
  Pick<
    GridLabels,
    | 'exporterAllAsCsv'
    | 'exporterVisibleAsCsv'
    | 'exporterSelectedAsCsv'
    | 'exporterAllAsPdf'
    | 'exporterVisibleAsPdf'
    | 'exporterSelectedAsPdf'
    | 'exporterAllAsExcel'
    | 'exporterVisibleAsExcel'
    | 'exporterSelectedAsExcel'
  >
>;

/** Build the exporter menu items. Respects `exporterMenuCsv / Pdf / Excel`,
 * `exporterMenuAllData / VisibleData / SelectedData`, and the selection
 * count (the "selected" rows are hidden when nothing is selected). */
export function buildGridExporterMenuItems(
  options: GridOptions,
  labels: GridExporterMenuLabels,
  actions: GridExporterMenuActions,
  hasSelection: () => boolean = () => false,
): GridExporterMenuItem[] {
  const baseOrder = options.exporterMenuItemOrder ?? 200;
  const menuCsv = options.exporterMenuCsv !== false;
  const menuPdf = options.exporterMenuPdf !== false;
  const menuExcel = options.exporterMenuExcel !== false;
  const menuAllData = options.exporterMenuAllData !== false;
  const menuVisible = options.exporterMenuVisibleData !== false;
  const menuSelected = options.exporterMenuSelectedData !== false;

  const items: GridExporterMenuItem[] = [
    {
      title: labels.exporterAllAsCsv ?? '',
      action: () => actions.csvExport('all', 'all'),
      shown: () => menuCsv && menuAllData,
      order: baseOrder,
    },
    {
      title: labels.exporterVisibleAsCsv ?? '',
      action: () => actions.csvExport('visible', 'visible'),
      shown: () => menuCsv && menuVisible,
      order: baseOrder + 1,
    },
    {
      title: labels.exporterSelectedAsCsv ?? '',
      action: () => actions.csvExport('selected', 'visible'),
      shown: () => menuCsv && menuSelected && hasSelection(),
      order: baseOrder + 2,
    },
  ];

  if (actions.pdfExport) {
    items.push(
      {
        title: labels.exporterAllAsPdf ?? '',
        action: () => actions.pdfExport!('all', 'all'),
        shown: () => menuPdf && menuAllData,
        order: baseOrder + 3,
      },
      {
        title: labels.exporterVisibleAsPdf ?? '',
        action: () => actions.pdfExport!('visible', 'visible'),
        shown: () => menuPdf && menuVisible,
        order: baseOrder + 4,
      },
      {
        title: labels.exporterSelectedAsPdf ?? '',
        action: () => actions.pdfExport!('selected', 'visible'),
        shown: () => menuPdf && menuSelected && hasSelection(),
        order: baseOrder + 5,
      },
    );
  }

  if (actions.excelExport) {
    items.push(
      {
        title: labels.exporterAllAsExcel ?? '',
        action: () => actions.excelExport!('all', 'all'),
        shown: () => menuExcel && menuAllData,
        order: baseOrder + 6,
      },
      {
        title: labels.exporterVisibleAsExcel ?? '',
        action: () => actions.excelExport!('visible', 'visible'),
        shown: () => menuExcel && menuVisible,
        order: baseOrder + 7,
      },
      {
        title: labels.exporterSelectedAsExcel ?? '',
        action: () => actions.excelExport!('selected', 'visible'),
        shown: () => menuExcel && menuSelected && hasSelection(),
        order: baseOrder + 8,
      },
    );
  }

  return items;
}
