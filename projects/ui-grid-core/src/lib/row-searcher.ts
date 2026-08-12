import { FILTER_CONDITIONS } from './grid.constants';
import {
  GridColumnDef,
  GridFilterDescriptor,
  GridFilterFlags,
  GridRecord
} from './grid.models';
import { getCellValue, isNullOrUndefined } from './grid.utils';

export interface ParsedFilter {
  term?: unknown;
  noTerm?: boolean;
  condition: GridFilterDescriptor['condition'];
  flags: GridFilterFlags;
  startswithRE?: RegExp;
  endswithRE?: RegExp;
  containsRE?: RegExp;
  exactRE?: RegExp;
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?*.]/g, '\\$&').replace(/-/g, '\\x2d');
}

const MAX_FILTER_PATTERN_LENGTH = 128;
const MAX_FILTER_WILDCARDS = 8;

function buildLiteralPattern(term: unknown): string {
  return escapeRegExp(String(term ?? ''));
}

function buildWildcardPattern(term: string): string | null {
  const wildcardCount = (term.match(/\*/g) ?? []).length;
  if (term.length > MAX_FILTER_PATTERN_LENGTH || wildcardCount > MAX_FILTER_WILDCARDS) {
    return null;
  }

  return escapeRegExp(term).replace(/\\\*/g, '.*?');
}

export function getTerm(filter: GridFilterDescriptor): unknown {
  if (typeof filter.term === 'undefined') {
    return filter.term;
  }

  return typeof filter.term === 'string' ? filter.term.trim() : filter.term;
}

function stripTerm(filter: GridFilterDescriptor): unknown {
  const term = getTerm(filter);
  if (typeof term === 'string') {
    return term.replace(/(^\*|\*$)/g, '');
  }

  return term;
}

function guessCondition(filter: GridFilterDescriptor): GridFilterDescriptor['condition'] {
  if (!filter.term) {
    return FILTER_CONDITIONS.contains;
  }

  const term = getTerm(filter);
  if (typeof term === 'string' && /\*/.test(term)) {
    const regexpFlags = !filter.flags?.caseSensitive ? 'i' : '';
    const escaped = buildWildcardPattern(term);
    if (!escaped) {
      return FILTER_CONDITIONS.contains;
    }

    return new RegExp(`^${escaped}$`, regexpFlags);
  }

  return FILTER_CONDITIONS.contains;
}

export function setupFilters(filters: readonly GridFilterDescriptor[]): ParsedFilter[] {
  const parsedFilters: ParsedFilter[] = [];

  for (const filter of filters) {
    if (!filter.noTerm && isNullOrUndefined(filter.term)) {
      continue;
    }

    const parsedFilter: ParsedFilter = {
      term: filter.rawTerm ? filter.term : stripTerm(filter),
      noTerm: filter.noTerm,
      condition: filter.condition ?? guessCondition(filter),
      flags: {
        caseSensitive: false,
        date: false,
        ...filter.flags
      }
    };

    const regexpFlags = !parsedFilter.flags.caseSensitive ? 'i' : '';

    switch (parsedFilter.condition) {
      case FILTER_CONDITIONS.startsWith:
        parsedFilter.startswithRE = new RegExp(`^${buildLiteralPattern(parsedFilter.term)}`, regexpFlags);
        break;
      case FILTER_CONDITIONS.endsWith:
        parsedFilter.endswithRE = new RegExp(`${buildLiteralPattern(parsedFilter.term)}$`, regexpFlags);
        break;
      case FILTER_CONDITIONS.exact:
        parsedFilter.exactRE = new RegExp(`^${buildLiteralPattern(parsedFilter.term)}$`, regexpFlags);
        break;
      case FILTER_CONDITIONS.contains:
        parsedFilter.containsRE = new RegExp(buildLiteralPattern(parsedFilter.term), regexpFlags);
        break;
      default:
        break;
    }

    parsedFilters.push(parsedFilter);
  }

  return parsedFilters;
}

export function runColumnFilter(
  row: GridRecord,
  column: GridColumnDef,
  filter: ParsedFilter
): boolean {
  let value = getCellValue(row, column);
  if (value === undefined || value === null) {
    value = '';
  }

  if (filter.condition instanceof RegExp) {
    return filter.condition.test(String(value));
  }

  if (typeof filter.condition === 'function') {
    return filter.condition(filter.term, value, row, column);
  }

  if (filter.startswithRE) {
    return filter.startswithRE.test(String(value));
  }

  if (filter.endswithRE) {
    return filter.endswithRE.test(String(value));
  }

  if (filter.containsRE) {
    return filter.containsRE.test(String(value));
  }

  if (filter.exactRE) {
    return filter.exactRE.test(String(value));
  }

  let term = filter.term;
  if (typeof value === 'number' && typeof term === 'string') {
    const numericTerm = parseFloat(term.replace(/\\\./g, '.').replace(/\\-/g, '-'));
    if (!Number.isNaN(numericTerm)) {
      term = numericTerm;
    }
  }

  if (filter.flags.date) {
    value = new Date(String(value));
    term = new Date(String(term).replace(/\\/g, ''));
  }

  switch (filter.condition) {
    case FILTER_CONDITIONS.notEqual:
      return String(value) !== String(term ?? '');
    case FILTER_CONDITIONS.greaterThan:
      return (value as number | Date) > (term as number | Date);
    case FILTER_CONDITIONS.greaterThanOrEqual:
      return (value as number | Date) >= (term as number | Date);
    case FILTER_CONDITIONS.lessThan:
      return (value as number | Date) < (term as number | Date);
    case FILTER_CONDITIONS.lessThanOrEqual:
      return (value as number | Date) <= (term as number | Date);
    default:
      return true;
  }
}
