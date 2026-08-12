import { describe, expect, it } from 'vitest';
import {
  createGridRowEditState,
  collectGridRowEntities,
  isGridRowEditTimerEnabled,
  markGridRowClean,
  markGridRowDirty,
  markGridRowError,
  markGridRowSaving,
  resolveGridRowEditWaitInterval,
} from './grid.core.row-edit';
import { GridRow } from './grid.models';

function makeRow(id: string): GridRow {
  return new GridRow(id, { id }, Number(id.replace(/\D/g, '')) || 0, 44);
}

describe('grid.core.row-edit', () => {
  describe('markGridRowDirty', () => {
    it('flips isDirty + adds id to the dirty set', () => {
      const state = createGridRowEditState();
      const row = makeRow('r1');
      expect(markGridRowDirty(state, row)).toBe(true);
      expect(row.isDirty).toBe(true);
      expect(state.dirtyRowIds.has('r1')).toBe(true);
    });

    it('is a no-op when the row is already dirty', () => {
      const state = createGridRowEditState();
      const row = makeRow('r1');
      markGridRowDirty(state, row);
      expect(markGridRowDirty(state, row)).toBe(false);
    });

    it('clears a pending error on the row', () => {
      const state = createGridRowEditState();
      const row = makeRow('r1');
      markGridRowDirty(state, row);
      markGridRowError(state, row);
      // Editing again after an error — dirty call clears the error flag so
      // the user can retry. Matches the old module's processErrorPromise
      // → setRowsDirty path.
      markGridRowClean(state, row);
      expect(row.isError).toBe(false);
    });
  });

  describe('markGridRowClean', () => {
    it('clears isDirty / isError / isSaving and removes id from all sets', () => {
      const state = createGridRowEditState();
      const row = makeRow('r1');
      markGridRowDirty(state, row);
      markGridRowSaving(state, row);
      markGridRowClean(state, row);
      expect(row.isDirty).toBe(false);
      expect(row.isSaving).toBe(false);
      expect(row.isError).toBe(false);
      expect(state.dirtyRowIds.size).toBe(0);
      expect(state.savingRowIds.size).toBe(0);
    });
  });

  describe('markGridRowSaving', () => {
    it('flips isSaving + adds id to the saving set', () => {
      const state = createGridRowEditState();
      const row = makeRow('r1');
      markGridRowSaving(state, row);
      expect(row.isSaving).toBe(true);
      expect(state.savingRowIds.has('r1')).toBe(true);
    });
  });

  describe('markGridRowError', () => {
    it('flips saving→error and keeps isDirty true so the user can retry', () => {
      const state = createGridRowEditState();
      const row = makeRow('r1');
      markGridRowDirty(state, row);
      markGridRowSaving(state, row);
      markGridRowError(state, row);
      expect(row.isError).toBe(true);
      expect(row.isDirty).toBe(true);
      expect(row.isSaving).toBe(false);
      expect(state.errorRowIds.has('r1')).toBe(true);
      expect(state.savingRowIds.has('r1')).toBe(false);
    });
  });

  describe('isGridRowEditTimerEnabled', () => {
    it('returns false when the interval is -1 (manual-flush mode)', () => {
      expect(isGridRowEditTimerEnabled(-1)).toBe(false);
    });

    it('returns true for undefined (use the default interval)', () => {
      expect(isGridRowEditTimerEnabled(undefined)).toBe(true);
    });

    it('returns true for positive intervals', () => {
      expect(isGridRowEditTimerEnabled(2000)).toBe(true);
    });
  });

  describe('resolveGridRowEditWaitInterval', () => {
    it('falls back to 2000 ms when the caller did not configure the interval', () => {
      expect(resolveGridRowEditWaitInterval(undefined)).toBe(2000);
    });

    it('respects a user-provided interval when positive', () => {
      expect(resolveGridRowEditWaitInterval(4000)).toBe(4000);
    });

    it('ignores -1 and returns the default (the caller checks the flag first)', () => {
      expect(resolveGridRowEditWaitInterval(-1)).toBe(2000);
    });
  });

  describe('collectGridRowEntities', () => {
    it('preserves the order the rows appear in the pipeline', () => {
      const r1 = makeRow('r1');
      const r2 = makeRow('r2');
      const r3 = makeRow('r3');
      const ids = new Set(['r3', 'r1']);
      const entities = collectGridRowEntities([r1, r2, r3], ids);
      expect(entities).toEqual([{ id: 'r1' }, { id: 'r3' }]);
    });
  });
});
