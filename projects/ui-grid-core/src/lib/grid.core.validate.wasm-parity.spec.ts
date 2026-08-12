/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
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
import { DEFAULT_GRID_LABELS } from './grid.models';

const wasmRunnerPath = fileURLToPath(new URL('./grid.core.validate.wasm-runner.mjs', import.meta.url));

function runWasm<T>(command: string, input: unknown): T {
  const output = execFileSync(process.execPath, ['--experimental-wasm-modules', wasmRunnerPath, JSON.stringify({ command, input })], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output) as T;
}

function col(name: string, validators?: Record<string, unknown>) {
  return { name, validators };
}

describe('grid.core.validate wasm parity', () => {
  it('matches built-in registry labels and messages', () => {
    const registry = createGridValidatorRegistry(DEFAULT_GRID_LABELS);
    const wasmRegistry = runWasm<any>('createGridValidatorRegistry', DEFAULT_GRID_LABELS);

    expect(runWasm('gridValidatorHas', { registry: wasmRegistry, name: 'required', argument: true })).toBe(true);
    expect(runWasm('gridValidatorMessage', { registry: wasmRegistry, name: 'required', argument: true })).toBe(
      registry.getMessage('required', true),
    );
    expect(runWasm('gridValidatorMessage', { registry: wasmRegistry, name: 'minLength', argument: 5 })).toBe(
      registry.getMessage('minLength', 5),
    );
  });

  it('matches invalid/error helper mutations', () => {
    const column = col('name');
    const row: Record<string, unknown> = {};

    expect(runWasm('invalidFieldFor', column)).toBe(invalidFieldFor(column));
    expect(runWasm('errorsFieldFor', column)).toBe(errorsFieldFor(column));

    const invalidRow = runWasm<any>('setGridCellInvalid', { rowEntity: {}, colDef: column });
    setGridCellInvalid(row, column);
    expect(invalidRow).toEqual(row);
    expect(runWasm('isGridCellInvalid', { rowEntity: invalidRow, colDef: column })).toBe(isGridCellInvalid(row, column));

    const erroredRow = runWasm<any>('setGridCellError', { rowEntity: invalidRow, colDef: column, validatorName: 'required' });
    setGridCellError(row, column, 'required');
    expect(erroredRow).toEqual(row);
    expect(runWasm('getGridCellErrorNames', { rowEntity: erroredRow, colDef: column })).toEqual(
      getGridCellErrorNames(row, column),
    );

    const clearedRow = runWasm<any>('clearGridCellError', { rowEntity: erroredRow, colDef: column, validatorName: 'required' });
    clearGridCellError(row, column, 'required');
    setGridCellValid(row, column);
    const validRow = runWasm<any>('setGridCellValid', { rowEntity: clearedRow, colDef: column });
    expect(validRow).toEqual(row);
  });

  it('matches cell validation failures and localized messages', async () => {
    const registry = createGridValidatorRegistry(DEFAULT_GRID_LABELS);
    const column = col('name', { required: true, minLength: 5 });
    const tsRow: Record<string, unknown> = {};
    const tsFailures = await runGridCellValidators(tsRow, column, '', 'prev', registry);
    const wasmRegistry = runWasm<any>('createGridValidatorRegistry', DEFAULT_GRID_LABELS);
    const wasmResult = runWasm<any>('runGridCellValidators', {
      rowEntity: {},
      colDef: column,
      newValue: '',
      oldValue: 'prev',
      registry: wasmRegistry,
    });

    expect(wasmResult.failures).toEqual(tsFailures);
    expect(wasmResult.rowEntity).toEqual(tsRow);
    expect(
      runWasm('getGridCellErrorMessages', {
        rowEntity: wasmResult.rowEntity,
        colDef: column,
        registry: wasmRegistry,
      }),
    ).toEqual(getGridCellErrorMessages(tsRow, column, registry));
  });

  it('matches whole-grid invalid row collection', async () => {
    const registry = createGridValidatorRegistry(DEFAULT_GRID_LABELS);
    const rows = [{ name: 'Alpha' }, { name: '' }, { name: null }];
    const columnDefs = [col('name', { required: true })];
    const tsInvalid = await validateAllGridRows(rows.map((row) => ({ ...row })), columnDefs, registry);
    const wasmRegistry = runWasm<any>('createGridValidatorRegistry', DEFAULT_GRID_LABELS);
    const wasmResult = runWasm<any>('validateAllGridRows', {
      rowEntities: rows,
      columnDefs,
      registry: wasmRegistry,
    });

    expect(wasmResult.invalidRows).toEqual(tsInvalid);
  });
});
