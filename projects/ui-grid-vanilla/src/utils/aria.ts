/**
 * ARIA row / column index math for the grid.
 *
 * `role="grid"` addresses cells by *position in the whole grid*, not by
 * position in the DOM: `aria-rowindex` / `aria-colindex` are 1-based and
 * count from the first row / column of the grid, header rows included.
 * Virtualization only mounts a window of the display items, so a row's
 * index has to be derived from its absolute display position rather than
 * from its DOM order — otherwise every scrolled window announces itself
 * as rows 1..N to assistive technology.
 *
 * `utils/*` modules may only depend on package-level imports — keep this
 * file free of any `src/` imports so it can be used by render *and* patch.
 */

/** The column-header row is always the first row of the grid. */
export const COLUMN_HEADER_ROW_INDEX = 1;

/** The filter row sits directly beneath the column-header row. */
export const FILTER_ROW_INDEX = 2;

/** Header rows that precede the body rows: the column-header row plus,
 * when the filter row is rendered, that row directly beneath it. */
export function ariaHeaderRowCount(filteringEnabled: boolean): number {
  return filteringEnabled ? FILTER_ROW_INDEX : COLUMN_HEADER_ROW_INDEX;
}

/** 1-based `aria-rowindex` for the display item at absolute position
 * `displayPosition` — i.e. `startIndex + offsetInWindow` for a virtualized
 * body, `pipeline.displayItems` index otherwise. */
export function ariaBodyRowIndex(headerRowCount: number, displayPosition: number): number {
  return headerRowCount + displayPosition + 1;
}

/** Total rows the grid announces: header rows plus the display items that
 * are part of the grid. With pagination that is the current page, which is
 * what the page-relative row indexes on the rows themselves describe. */
export function ariaGridRowCount(headerRowCount: number, displayItemCount: number): number {
  return headerRowCount + Math.max(0, displayItemCount);
}

/** 1-based `aria-colindex` for a visible-column position. */
export function ariaColIndex(columnPosition: number): number {
  return columnPosition + 1;
}
