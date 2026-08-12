import type { DisplayItem, GridRow, GroupItem } from '@ornery/ui-grid-core';

/** Narrow a DisplayItem to a GroupItem. The grid pipeline's DisplayItem
 * union already guarantees the `kind === 'group'` case; this helper keeps
 * the cast in one place. */
export function asGroupItem(item: DisplayItem): GroupItem {
  return item as GroupItem;
}

/** Type guard for row items with the `row: GridRow` payload attached. */
export function isRowItem(
  item: DisplayItem,
): item is DisplayItem & { kind: 'row'; row: GridRow } {
  return item.kind === 'row';
}
