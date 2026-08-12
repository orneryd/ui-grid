import { GridColumnDef, GridRecord } from './grid.models';
import {
  getCellValue,
  getPathValue,
  isNullOrUndefined,
  nextUid,
  setPathValue,
  stringifyCellValue,
  titleize,
  toCsvValue
} from './grid.utils';

describe('grid.utils', () => {
  it('generates incrementing ids with the requested prefix', () => {
    const first = nextUid('case');
    const second = nextUid('case');

    expect(first).toMatch(/^case-\d+$/);
    expect(second).toMatch(/^case-\d+$/);
    expect(Number(second.split('-')[1])).toBe(Number(first.split('-')[1]) + 1);
  });

  it('detects nullish values only', () => {
    expect(isNullOrUndefined(null)).toBe(true);
    expect(isNullOrUndefined(undefined)).toBe(true);
    expect(isNullOrUndefined(false)).toBe(false);
    expect(isNullOrUndefined(0)).toBe(false);
    expect(isNullOrUndefined('')).toBe(false);
  });

  it('reads nested property paths safely', () => {
    const row: GridRecord = {
      account: {
        owner: {
          name: 'Jordan Silva'
        }
      }
    };

    expect(getPathValue(row, 'account.owner.name')).toBe('Jordan Silva');
    expect(getPathValue(row, 'account.owner.email')).toBeUndefined();
    expect(getPathValue(row, 'account.owner.name.first')).toBeUndefined();
    expect(getPathValue(row, '__proto__.polluted')).toBeUndefined();
  });

  it('writes nested property paths without allowing prototype pollution', () => {
    const row: GridRecord = {};

    setPathValue(row, 'account.owner.name', 'Jordan Silva');
    setPathValue(row, '__proto__.polluted', 'yes');

    expect(row).toEqual({
      account: {
        owner: {
          name: 'Jordan Silva'
        }
      }
    });
    expect(({} as GridRecord)['polluted']).toBeUndefined();
  });

  it('titleizes camelCase, snake_case, kebab-case, and dotted values', () => {
    expect(titleize('accountOwner')).toBe('Account Owner');
    expect(titleize('account_owner')).toBe('Account owner');
    expect(titleize('account-owner')).toBe('Account owner');
    expect(titleize('account.owner')).toBe('Account owner');
  });

  it('reads values using valueGetter, field, and fallback name access', () => {
    const row: GridRecord = {
      name: 'Customer 1',
      account: {
        owner: 'Mina Patel'
      },
      score: 42
    };
    const valueGetterColumn: GridColumnDef = {
      name: 'computed',
      valueGetter: (record) => `${record['name']}:${record['score']}`
    };

    expect(getCellValue(row, valueGetterColumn)).toBe('Customer 1:42');
    expect(getCellValue(row, { name: 'owner', field: 'account.owner' })).toBe('Mina Patel');
    expect(getCellValue(row, { name: 'name' })).toBe('Customer 1');
  });

  it('stringifies dates, arrays, objects, primitives, and nullish values', () => {
    expect(stringifyCellValue(new Date('2026-04-01T00:00:00.000Z'))).toBe('2026-04-01T00:00:00.000Z');
    expect(stringifyCellValue(['a', 'b', 'c'])).toBe('a, b, c');
    expect(stringifyCellValue({ status: 'Active' })).toBe('{"status":"Active"}');
    expect(stringifyCellValue(10)).toBe('10');
    expect(stringifyCellValue(null)).toBe('');
    expect(stringifyCellValue(undefined)).toBe('');
  });

  it('quotes csv values only when needed', () => {
    expect(toCsvValue('plain')).toBe('plain');
    expect(toCsvValue('with,comma')).toBe('"with,comma"');
    expect(toCsvValue('with"quote')).toBe('"with""quote"');
    expect(toCsvValue('line\nbreak')).toBe('"line\nbreak"');
    expect(toCsvValue('=HYPERLINK("https://example.com")')).toBe('"\'=HYPERLINK(""https://example.com"")"');
  });
});