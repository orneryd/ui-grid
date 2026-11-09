/** Pager range label ("1-10 of 42"). Shared by the initial render and the
 * patch path so both show the same text for empty results ("0 of 0"). */
export function formatPaginationRangeLabel(range: {
  firstRowIndex: number;
  lastRowIndex: number;
  totalItems: number;
}): string {
  if (range.totalItems === 0) return '0 of 0';
  return `${range.firstRowIndex + 1}-${range.lastRowIndex + 1} of ${range.totalItems}`;
}
