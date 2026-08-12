/**
 * Grid menu — the shared menu-item shape used by every feature that
 * contributes entries to the grid menu (exporter, importer, rowEdit, etc.).
 *
 * Matches the old `addToGridMenu` payload so consumers can wire the items
 * into whatever menu system they have (native popover, Angular dropdown,
 * React headless-UI menu, …). Items sort by `order`; each item knows how
 * to run itself (`action`) and whether it's currently visible (`shown`).
 */

export interface GridMenuItem {
  title: string;
  order: number;
  action: () => void;
  /** Runtime guard — when it returns false the item should be hidden. */
  shown: () => boolean;
}
