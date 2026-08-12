import { describe, expect, it, vi } from 'vitest';
import {
  GridValidatorRegistry,
  clearGridCellError,
  createGridValidatorRegistry,
  errorsFieldFor,
  getGridCellErrorMessages,
  getGridCellErrorNames,
  invalidFieldFor,
  isGridCellInvalid,
  runGridCellValidators,
  setGridCellError,
  setGridCellInvalid,
  setGridCellValid,
  validateAllGridRows,
} from './grid.core.validate';
import { DEFAULT_GRID_LABELS, GridColumnDef, GridRecord } from './grid.models';

const col = (name: string, validators?: Record<string, unknown>): GridColumnDef => ({
  name,
  validators,
});

describe('validator registry defaults', () => {
  const registry = createGridValidatorRegistry(DEFAULT_GRID_LABELS);

  it('built-in `required` rejects empty / null / undefined when arg is truthy', () => {
    const fn = registry.getValidator('required', true);
    expect(fn(undefined, '')).toBe(false);
    expect(fn(undefined, null)).toBe(false);
    expect(fn(undefined, undefined)).toBe(false);
    expect(fn(undefined, 'value')).toBe(true);
    expect(fn(undefined, 0)).toBe(true);
  });

  it('built-in `minLength` enforces string length', () => {
    const fn = registry.getValidator('minLength', 3);
    expect(fn(undefined, 'ab')).toBe(false);
    expect(fn(undefined, 'abc')).toBe(true);
    expect(fn(undefined, 'abcd')).toBe(true);
    // Empty / null passes so the `required` validator is the one that
    // rejects blanks — matches the old module's layered contract.
    expect(fn(undefined, '')).toBe(true);
    expect(fn(undefined, null)).toBe(true);
  });

  it('built-in `maxLength` enforces string length', () => {
    const fn = registry.getValidator('maxLength', 3);
    expect(fn(undefined, 'ab')).toBe(true);
    expect(fn(undefined, 'abc')).toBe(true);
    expect(fn(undefined, 'abcd')).toBe(false);
  });

  it('renders interpolated error messages from labels', () => {
    expect(registry.getMessage('required', true)).toBe(DEFAULT_GRID_LABELS.validateRequired);
    expect(registry.getMessage('minLength', 5)).toContain('5');
    expect(registry.getMessage('maxLength', 42)).toContain('42');
  });

  it('throws when fetching an unregistered validator', () => {
    const fresh = new GridValidatorRegistry();
    expect(() => fresh.getValidator('nope', undefined)).toThrow(/Invalid validator name/);
  });
});

describe('cell invalid flag helpers', () => {
  it('setInvalid / isInvalid / setValid toggle the entity marker', () => {
    const row: GridRecord = {};
    const column = col('name');
    expect(isGridCellInvalid(row, column)).toBe(false);
    setGridCellInvalid(row, column);
    expect(row[invalidFieldFor(column)]).toBe(true);
    expect(isGridCellInvalid(row, column)).toBe(true);
    setGridCellValid(row, column);
    expect(isGridCellInvalid(row, column)).toBe(false);
    expect(invalidFieldFor(column) in row).toBe(false);
  });

  it('setError / clearError maintain a per-validator bag', () => {
    const row: GridRecord = {};
    const column = col('name');
    setGridCellError(row, column, 'required');
    setGridCellError(row, column, 'minLength');
    const bag = row[errorsFieldFor(column)] as Record<string, boolean>;
    expect(bag).toEqual({ required: true, minLength: true });
    clearGridCellError(row, column, 'required');
    expect(bag).toEqual({ minLength: true });
  });
});

describe('getGridCellErrorMessages', () => {
  it('returns the message produced by each failing validator', () => {
    const registry = createGridValidatorRegistry(DEFAULT_GRID_LABELS);
    const column = col('name', { required: true, minLength: 5 });
    const row: GridRecord = {};
    setGridCellError(row, column, 'required');
    setGridCellError(row, column, 'minLength');
    expect(getGridCellErrorMessages(row, column, registry).sort()).toEqual(
      [
        DEFAULT_GRID_LABELS.validateMinLength.replace('THRESHOLD', '5'),
        DEFAULT_GRID_LABELS.validateRequired,
      ].sort(),
    );
  });
});

describe('runGridCellValidators', () => {
  const registry = createGridValidatorRegistry(DEFAULT_GRID_LABELS);

  it('skips validation when newValue === oldValue (parity with old module)', async () => {
    const row: GridRecord = {};
    const column = col('name', { required: true });
    const failures = await runGridCellValidators(row, column, '', '', registry);
    expect(failures).toEqual([]);
    expect(isGridCellInvalid(row, column)).toBe(false);
  });

  it('flips the cell invalid + accumulates failing names', async () => {
    const row: GridRecord = {};
    const column = col('name', { required: true, minLength: 5 });
    const failures = await runGridCellValidators(row, column, '', 'prev', registry);
    expect(failures).toEqual(['required']);
    expect(isGridCellInvalid(row, column)).toBe(true);
    expect(getGridCellErrorNames(row, column)).toEqual(['required']);
  });

  it('raises the onValidationFailed callback once per failing validator', async () => {
    const row: GridRecord = {};
    const column = col('name', { required: true, minLength: 5 });
    const onValidationFailed = vi.fn();
    await runGridCellValidators(row, column, '', 'prev', registry, onValidationFailed);
    expect(onValidationFailed).toHaveBeenCalledTimes(1);
    expect(onValidationFailed).toHaveBeenCalledWith(row, column, '', 'prev', 'required');
  });

  it('supports async validators', async () => {
    const registryWithAsync = new GridValidatorRegistry();
    registryWithAsync.setValidator(
      'asyncOk',
      () => () => Promise.resolve(true),
      () => 'always ok',
    );
    registryWithAsync.setValidator(
      'asyncFail',
      () => () => Promise.resolve(false),
      () => 'always fail',
    );
    const row: GridRecord = {};
    const column = col('name', { asyncOk: undefined, asyncFail: undefined });
    const failures = await runGridCellValidators(row, column, 'new', 'old', registryWithAsync);
    expect(failures).toEqual(['asyncFail']);
  });

  it('throws when colDef.name is missing', async () => {
    const registryInstance = createGridValidatorRegistry(DEFAULT_GRID_LABELS);
    const column = { validators: { required: true } } as unknown as GridColumnDef;
    await expect(
      runGridCellValidators({}, column, 'a', 'b', registryInstance),
    ).rejects.toThrow(/colDef\.name is required/);
  });
});

describe('validateAllGridRows', () => {
  it('returns every row that has at least one invalid cell', async () => {
    const registry = createGridValidatorRegistry(DEFAULT_GRID_LABELS);
    const columnDefs: GridColumnDef[] = [col('name', { required: true })];
    const rows: GridRecord[] = [
      { name: 'Alpha' },
      { name: '' },
      { name: 'Beta' },
      { name: null },
    ];
    const invalidRows = await validateAllGridRows(rows, columnDefs, registry);
    expect(invalidRows).toHaveLength(2);
    expect(invalidRows).toContain(rows[1]);
    expect(invalidRows).toContain(rows[3]);
  });
});
