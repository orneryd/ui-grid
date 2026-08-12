/**
 * Grid validate — pure logic ported from `ui.grid.validate`.
 *
 * The old module exposed a global `uiGridValidateService` with a registry
 * of validator factories (builtins: required / minLength / maxLength) plus
 * `isInvalid` / `setInvalid` / `setValid` / `setError` / `clearError` /
 * `runValidators` / `getErrorMessages` helpers. Validation results were
 * stored on the row entity as `$$invalid<col>` / `$$errors<col>`. The new
 * core module keeps the same data shape + algorithms, so cellTemplates can
 * inspect the row entity identically.
 *
 * Async validators are supported: `runValidators` always returns a promise
 * so a failing async validator still flips the cell invalid after the
 * await resolves. The result resolves to the set of validator names that
 * failed, mirroring the old `$q.all` return shape.
 */

import { GridColumnDef, GridLabels, GridRecord } from './grid.models';

/** A validator function. May return a boolean or a promise of boolean.
 * `true` means valid, `false` means invalid. */
export type GridValidatorFn = (
  oldValue: unknown,
  newValue: unknown,
  rowEntity?: GridRecord,
  colDef?: GridColumnDef,
) => boolean | Promise<boolean>;

/** Factory that builds a `GridValidatorFn` for the given argument. Old
 * module shape: `required(true)` returns a function that rejects falsy
 * values; `minLength(5)` returns one that rejects strings shorter than 5. */
export type GridValidatorFactory = (argument: unknown) => GridValidatorFn;

/** i18n message builder for a validator. Receives the argument passed to
 * the factory so threshold values can be interpolated. */
export type GridValidatorMessageFn = (argument: unknown) => string;

export interface GridValidatorRegistration {
  validatorFactory: GridValidatorFactory;
  messageFunction: GridValidatorMessageFn;
}

/** Registry of validator factories. Consumers create one via
 * `createGridValidatorRegistry()`, then pass it alongside each
 * `runValidators` call. Defaults are preloaded to match the old module's
 * built-in set (required / minLength / maxLength). */
export class GridValidatorRegistry {
  private readonly entries = new Map<string, GridValidatorRegistration>();

  setValidator(
    name: string,
    validatorFactory: GridValidatorFactory,
    messageFunction: GridValidatorMessageFn,
  ): void {
    this.entries.set(name, { validatorFactory, messageFunction });
  }

  getValidator(name: string, argument: unknown): GridValidatorFn {
    const entry = this.entries.get(name);
    if (!entry) throw new Error(`Invalid validator name: ${name}`);
    return entry.validatorFactory(argument);
  }

  getMessage(name: string, argument: unknown): string {
    const entry = this.entries.get(name);
    if (!entry) return '';
    return entry.messageFunction(argument);
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }
}

/** Produce a new registry preloaded with the built-in validators. The
 * labels bundle is used so error messages come out localized — pass the
 * resolved `GridLabels` from the grid. */
export function createGridValidatorRegistry(labels: GridLabels): GridValidatorRegistry {
  const registry = new GridValidatorRegistry();

  registry.setValidator(
    'required',
    (argument) => {
      return (_oldValue, newValue) => {
        if (!argument) return true;
        return !(newValue === undefined || newValue === null || newValue === '');
      };
    },
    () => labels.validateRequired,
  );

  registry.setValidator(
    'minLength',
    (argument) => {
      const threshold = Number(argument);
      return (_oldValue, newValue) => {
        if (newValue === undefined || newValue === null || newValue === '') return true;
        return String(newValue).length >= threshold;
      };
    },
    (argument) => labels.validateMinLength.replace('THRESHOLD', String(argument)),
  );

  registry.setValidator(
    'maxLength',
    (argument) => {
      const threshold = Number(argument);
      return (_oldValue, newValue) => {
        if (newValue === undefined || newValue === null || newValue === '') return true;
        return String(newValue).length <= threshold;
      };
    },
    (argument) => labels.validateMaxLength.replace('THRESHOLD', String(argument)),
  );

  return registry;
}

/** Generate the `$$invalid<col>` key the old module used to mark cells
 * invalid on the row entity. Keeping the same key shape lets legacy
 * cellTemplates keep working. */
export function invalidFieldFor(colDef: GridColumnDef): string {
  return `$$invalid${colDef.name}`;
}

export function errorsFieldFor(colDef: GridColumnDef): string {
  return `$$errors${colDef.name}`;
}

export function isGridCellInvalid(rowEntity: GridRecord, colDef: GridColumnDef): boolean {
  return Boolean(rowEntity[invalidFieldFor(colDef)]);
}

export function setGridCellInvalid(rowEntity: GridRecord, colDef: GridColumnDef): void {
  rowEntity[invalidFieldFor(colDef)] = true;
}

export function setGridCellValid(rowEntity: GridRecord, colDef: GridColumnDef): void {
  delete rowEntity[invalidFieldFor(colDef)];
}

export function setGridCellError(
  rowEntity: GridRecord,
  colDef: GridColumnDef,
  validatorName: string,
): void {
  const key = errorsFieldFor(colDef);
  if (!rowEntity[key] || typeof rowEntity[key] !== 'object') {
    rowEntity[key] = {};
  }
  (rowEntity[key] as Record<string, boolean>)[validatorName] = true;
}

export function clearGridCellError(
  rowEntity: GridRecord,
  colDef: GridColumnDef,
  validatorName: string,
): void {
  const bag = rowEntity[errorsFieldFor(colDef)];
  if (!bag || typeof bag !== 'object') return;
  delete (bag as Record<string, boolean>)[validatorName];
}

/** Return the list of failing validator names for the cell. Mirrors
 * `getErrorMessages` but returns the raw names; the caller composes the
 * localized message via `registry.getMessage`. */
export function getGridCellErrorNames(
  rowEntity: GridRecord,
  colDef: GridColumnDef,
): string[] {
  const bag = rowEntity[errorsFieldFor(colDef)];
  if (!bag || typeof bag !== 'object') return [];
  return Object.keys(bag as Record<string, boolean>)
    .filter((name) => (bag as Record<string, boolean>)[name])
    .sort();
}

/** Localized error messages for the cell. Combines `getGridCellErrorNames`
 * + `registry.getMessage` the way the old module's `getErrorMessages` did. */
export function getGridCellErrorMessages(
  rowEntity: GridRecord,
  colDef: GridColumnDef,
  registry: GridValidatorRegistry,
): string[] {
  const names = getGridCellErrorNames(rowEntity, colDef);
  if (!colDef.validators) return [];
  return names.map((name) => registry.getMessage(name, colDef.validators![name]));
}

/** Run every validator declared on `colDef.validators` against the value.
 * Synchronous validators flip the flags immediately; async ones flip
 * the flags once the promise resolves. The returned promise resolves to
 * the set of validator names that failed. */
export async function runGridCellValidators(
  rowEntity: GridRecord,
  colDef: GridColumnDef,
  newValue: unknown,
  oldValue: unknown,
  registry: GridValidatorRegistry,
  onValidationFailed?: (
    rowEntity: GridRecord,
    colDef: GridColumnDef,
    newValue: unknown,
    oldValue: unknown,
    validatorName: string,
  ) => void,
): Promise<string[]> {
  if (newValue === oldValue) {
    // Parity: the old module skipped validation when the value didn't
    // change. We match so existing consumers see the same call pattern.
    return [];
  }
  if (!colDef.name) {
    throw new Error('colDef.name is required to perform validation');
  }

  // Start from a clean slate so stale errors don't linger.
  setGridCellValid(rowEntity, colDef);
  const failures: string[] = [];
  const validators = colDef.validators ?? {};

  const promises = Object.keys(validators).map(async (validatorName) => {
    clearGridCellError(rowEntity, colDef, validatorName);
    let result: boolean;
    try {
      const fn = registry.getValidator(validatorName, validators[validatorName]);
      result = await Promise.resolve(fn(oldValue, newValue, rowEntity, colDef));
    } catch {
      // Treat thrown validators as failing so the UI can surface the error.
      result = false;
    }
    if (!result) {
      setGridCellInvalid(rowEntity, colDef);
      setGridCellError(rowEntity, colDef, validatorName);
      failures.push(validatorName);
      onValidationFailed?.(rowEntity, colDef, newValue, oldValue, validatorName);
    }
  });

  await Promise.all(promises);
  return failures.sort();
}

/** Walk every row + every column's declared validators. Useful for
 * `gridApi.validate.getInvalidRows()` which ran a full-grid sweep. Uses
 * the same raw-value path as `runValidators` (no `newValue`/`oldValue`
 * distinction when called as a bulk check — passes `undefined` for
 * oldValue). */
export async function validateAllGridRows(
  rowEntities: readonly GridRecord[],
  columnDefs: readonly GridColumnDef[],
  registry: GridValidatorRegistry,
): Promise<GridRecord[]> {
  const invalidRows = new Set<GridRecord>();
  for (const row of rowEntities) {
    for (const colDef of columnDefs) {
      if (!colDef.validators) continue;
      // Use the entity value as-is; pass undefined for oldValue so the
      // short-circuit at the top of `runGridCellValidators` doesn't skip
      // when the value hasn't changed (a bulk check is essentially
      // "assume oldValue was different").
      const value = (colDef.field ?? colDef.name) ? row[colDef.field ?? colDef.name] : undefined;
      const failures = await runGridCellValidators(
        row,
        colDef,
        value,
        ' _initial_' + Math.random(),
        registry,
      );
      if (failures.length > 0) invalidRows.add(row);
    }
  }
  return [...invalidRows];
}
