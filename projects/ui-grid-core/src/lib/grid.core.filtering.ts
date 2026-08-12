import { FILTER_CONDITIONS } from './grid.constants';
import { GridColumnDef, GridOptions, GridRow } from './grid.models';
import { ParsedFilter, runColumnFilter, setupFilters } from './row-searcher';

function isFilteringEnabled(options: GridOptions): boolean {
  return options.enableFiltering !== false;
}

export function clearGridFilterReasons(row: GridRow): void {
  for (const reason of [...row.invisibleReasons]) {
    if (reason.startsWith('filter:')) {
      row.clearThisRowInvisible(reason);
    }
  }
}

/** Prepared filter spec for a single column — regex + term built once per
 * column so the inner row loop doesn't re-parse on every row. */
interface PreparedColumnFilter {
  column: GridColumnDef;
  reasonKey: string;
  filters: ParsedFilter[];
}

/** Pre-compute filters once per column; reused across every row. */
export function prepareGridColumnFilters(
  columns: readonly GridColumnDef[],
  activeFilters: Readonly<Record<string, string>>,
): readonly PreparedColumnFilter[] {
  const prepared: PreparedColumnFilter[] = [];
  for (const column of columns) {
    if (column.filterable === false || column.enableFiltering === false) continue;
    const term = activeFilters[column.name]?.trim();
    if (!term) continue;
    const filters = setupFilters([
      {
        ...(column.filter ?? { condition: FILTER_CONDITIONS.contains }),
        term,
      },
    ]);
    if (filters.length === 0) continue;
    prepared.push({ column, reasonKey: `filter:${column.name}`, filters });
  }
  return prepared;
}

/**
 * Fast-path filter matcher for the pipeline. Pre-prepared filter specs are
 * passed in, so this function does no RegExp compilation per row. When the
 * caller already knows `prepared.length === 0`, it can bypass this entirely
 * and just return `row.visible`.
 */
export function matchesGridRowPreparedFilters(
  row: GridRow,
  prepared: readonly PreparedColumnFilter[],
): boolean {
  for (const entry of prepared) {
    const filters = entry.filters;
    let matchesAll = true;
    for (const filter of filters) {
      if (!runColumnFilter(row.entity, entry.column, filter)) {
        matchesAll = false;
        break;
      }
    }
    if (!matchesAll) {
      row.setThisRowInvisible(entry.reasonKey);
      return false;
    }
    // Only touch the Set when an earlier pass left a stale reason behind.
    if (row.invisibleReasons.has(entry.reasonKey)) {
      row.clearThisRowInvisible(entry.reasonKey);
    }
  }
  return row.visible;
}

export function matchesGridRowFilters(
  row: GridRow,
  columns: readonly GridColumnDef[],
  options: GridOptions,
  activeFilters: Readonly<Record<string, string>>
): boolean {
  if (!isFilteringEnabled(options)) {
    return row.visible;
  }

  const prepared = prepareGridColumnFilters(columns, activeFilters);
  // Ensure stale reasons for columns that no longer have active filters are
  // cleared — the prepared-only fast path skips inactive columns entirely,
  // so clear them up front.
  if (row.invisibleReasons.size > 0) {
    for (const column of columns) {
      const key = `filter:${column.name}`;
      const active = activeFilters[column.name]?.trim();
      if (!active && row.invisibleReasons.has(key)) {
        row.clearThisRowInvisible(key);
      }
    }
  }
  return matchesGridRowPreparedFilters(row, prepared);
}