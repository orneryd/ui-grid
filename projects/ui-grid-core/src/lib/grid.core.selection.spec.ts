import {
  clearAllGridSelection,
  createGridSelectionState,
  findGridRowByKey,
  mapSelectedRowsToEntities,
  reconcileGridSelection,
  resolveGridSelectionOptions,
  selectAllGridRows,
  selectAllVisibleGridRows,
  shiftGridRowSelection,
  toggleGridRowSelection,
} from './grid.core.selection';
import { GridOptions, GridRow } from './grid.models';

function makeRow(id: string, extra: Partial<GridRow> = {}): GridRow {
  const row = new GridRow(id, { id }, Number(id.replace(/\D/g, '')) || 0, 44);
  if (extra.visible === false) row.visible = false;
  if (extra.enableSelection === false) row.enableSelection = false;
  return row;
}

function baseOptions(overrides: Partial<GridOptions> = {}): GridOptions {
  return {
    id: 'g',
    data: [],
    columnDefs: [],
    ...overrides,
  };
}

describe('grid.core.selection', () => {
  describe('resolveGridSelectionOptions', () => {
    it('applies the documented defaults', () => {
      expect(resolveGridSelectionOptions(baseOptions())).toEqual({
        enableRowSelection: false,
        multiSelect: true,
        noUnselect: false,
        modifierKeysToMultiSelect: false,
        enableRowHeaderSelection: true,
        enableFullRowSelection: false,
        enableFocusRowOnRowHeaderClick: true,
        enableSelectRowOnFocus: true,
        enableSelectAll: true,
        enableSelectionBatchEvent: true,
        selectionRowHeaderWidth: 30,
        enableFooterTotalSelected: true,
        isRowSelectable: null,
      });
    });

    it('flips enableFullRowSelection default to true when row-header selection is disabled', () => {
      expect(
        resolveGridSelectionOptions(baseOptions({ enableRowHeaderSelection: false })),
      ).toMatchObject({
        enableRowHeaderSelection: false,
        enableFullRowSelection: true,
      });
    });
  });

  describe('toggleGridRowSelection', () => {
    it('selects an unselected row and tracks it in state', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1'), makeRow('r2')];
      const { changed } = toggleGridRowSelection(state, rows, rows[0]!, {
        multiSelect: true,
        noUnselect: false,
      });
      expect(changed).toEqual([rows[0]]);
      expect(rows[0]!.isSelected).toBe(true);
      expect(state.selectedRowIds.has('r1')).toBe(true);
      expect(state.lastSelectedRowId).toBe('r1');
    });

    it('deselects an already-selected row when noUnselect is false', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1')];
      toggleGridRowSelection(state, rows, rows[0]!, { multiSelect: true, noUnselect: false });
      const { changed } = toggleGridRowSelection(state, rows, rows[0]!, {
        multiSelect: true,
        noUnselect: false,
      });
      expect(rows[0]!.isSelected).toBe(false);
      expect(changed).toEqual([rows[0]]);
      expect(state.selectedRowIds.size).toBe(0);
    });

    it('noUnselect keeps the row selected', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1')];
      toggleGridRowSelection(state, rows, rows[0]!, { multiSelect: true, noUnselect: true });
      const { changed } = toggleGridRowSelection(state, rows, rows[0]!, {
        multiSelect: true,
        noUnselect: true,
      });
      expect(rows[0]!.isSelected).toBe(true);
      expect(changed).toEqual([]);
    });

    it('single-select clears other selections', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1'), makeRow('r2'), makeRow('r3')];
      toggleGridRowSelection(state, rows, rows[0]!, { multiSelect: true, noUnselect: false });
      toggleGridRowSelection(state, rows, rows[1]!, { multiSelect: false, noUnselect: false });
      expect(rows[0]!.isSelected).toBe(false);
      expect(rows[1]!.isSelected).toBe(true);
      expect(state.selectedRowIds.size).toBe(1);
    });

    it('respects enableSelection=false', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1', { enableSelection: false })];
      const { changed } = toggleGridRowSelection(state, rows, rows[0]!, {
        multiSelect: true,
        noUnselect: false,
      });
      expect(changed).toEqual([]);
      expect(rows[0]!.isSelected).toBe(false);
    });

    it('canBeInvisible=false prevents selecting an invisible row', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1', { visible: false })];
      const { changed } = toggleGridRowSelection(state, rows, rows[0]!, {
        multiSelect: true,
        noUnselect: false,
        canBeInvisible: false,
      });
      expect(changed).toEqual([]);
    });

    it('updates selectAllAfter when every row is selected', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1'), makeRow('r2')];
      toggleGridRowSelection(state, rows, rows[0]!, { multiSelect: true, noUnselect: false });
      const r2 = toggleGridRowSelection(state, rows, rows[1]!, {
        multiSelect: true,
        noUnselect: false,
      });
      expect(r2.selectAllAfter).toBe(true);
      expect(state.selectAll).toBe(true);
    });
  });

  describe('shiftGridRowSelection', () => {
    it('selects the range from the anchor to the clicked row', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1'), makeRow('r2'), makeRow('r3'), makeRow('r4')];
      toggleGridRowSelection(state, rows, rows[1]!, { multiSelect: true, noUnselect: false });
      const { changed } = shiftGridRowSelection(state, rows, rows[3]!, { multiSelect: true });
      expect(changed.map((r) => r.id)).toEqual(['r3', 'r4']);
      expect(rows.every((r, i) => (i === 0 ? !r.isSelected : r.isSelected))).toBe(true);
    });

    it('reverses direction correctly', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1'), makeRow('r2'), makeRow('r3'), makeRow('r4')];
      toggleGridRowSelection(state, rows, rows[3]!, { multiSelect: true, noUnselect: false });
      const { changed } = shiftGridRowSelection(state, rows, rows[1]!, { multiSelect: true });
      expect(changed.map((r) => r.id).sort()).toEqual(['r2', 'r3']);
    });

    it('is a no-op when multiSelect is false', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1'), makeRow('r2')];
      const { changed } = shiftGridRowSelection(state, rows, rows[1]!, { multiSelect: false });
      expect(changed).toEqual([]);
    });
  });

  describe('selectAllGridRows / selectAllVisibleGridRows / clearAllGridSelection', () => {
    it('selectAll selects every eligible row', () => {
      const state = createGridSelectionState();
      const rows = [
        makeRow('r1'),
        makeRow('r2', { enableSelection: false }),
        makeRow('r3'),
      ];
      const { changed } = selectAllGridRows(state, rows, {
        multiSelect: true,
        isRowSelectable: null,
      });
      expect(changed.map((r) => r.id)).toEqual(['r1', 'r3']);
      expect(state.selectAll).toBe(true);
    });

    it('selectAll respects isRowSelectable', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1'), makeRow('r2')];
      const { changed } = selectAllGridRows(state, rows, {
        multiSelect: true,
        isRowSelectable: (row) => row.id !== 'r2',
      });
      expect(changed.map((r) => r.id)).toEqual(['r1']);
    });

    it('selectAllVisible unselects invisible rows and selects visible ones', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1', { visible: false }), makeRow('r2'), makeRow('r3')];
      rows[0]!.setSelected(true);
      state.selectedRowIds.add('r1');
      const { changed } = selectAllVisibleGridRows(state, rows, {
        multiSelect: true,
        isRowSelectable: null,
      });
      const byId = Object.fromEntries(changed.map((r) => [r.id, r.isSelected]));
      expect(byId).toEqual({ r1: false, r2: true, r3: true });
    });

    it('clearAll deselects everything and resets selectAll', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1'), makeRow('r2')];
      selectAllGridRows(state, rows, { multiSelect: true, isRowSelectable: null });
      const { changed } = clearAllGridSelection(state, rows);
      expect(changed).toHaveLength(2);
      expect(state.selectAll).toBe(false);
      expect(rows.every((r) => !r.isSelected)).toBe(true);
    });
  });

  describe('findGridRowByKey', () => {
    it('matches rows by entity key', () => {
      const rows = [makeRow('r1'), makeRow('r2')];
      (rows[0]!.entity as Record<string, unknown>)['status'] = 'Active';
      const match = findGridRowByKey(rows, true, 'status', 'Active');
      expect(match?.id).toBe('r1');
    });

    it('matches rows by their own key', () => {
      const rows = [makeRow('r1'), makeRow('r2')];
      expect(findGridRowByKey(rows, false, 'id', 'r2')?.id).toBe('r2');
    });

    it('returns null when nothing matches', () => {
      expect(findGridRowByKey([makeRow('r1')], false, 'id', 'missing')).toBeNull();
    });
  });

  describe('reconcileGridSelection', () => {
    it('re-applies isSelected on fresh row instances and prunes stale ids', () => {
      const state = createGridSelectionState();
      state.selectedRowIds.add('r1');
      state.selectedRowIds.add('gone');
      state.focusedRowId = 'r1';
      const rows = [makeRow('r1'), makeRow('r2')];
      reconcileGridSelection(state, rows, null);
      expect(rows[0]!.isSelected).toBe(true);
      expect(rows[0]!.isFocused).toBe(true);
      expect(rows[1]!.isSelected).toBe(false);
      expect(state.selectedRowIds.has('gone')).toBe(false);
    });

    it('evaluates isRowSelectable per row', () => {
      const state = createGridSelectionState();
      const rows = [makeRow('r1'), makeRow('r2')];
      reconcileGridSelection(state, rows, (row) => row.id === 'r1');
      expect(rows[0]!.enableSelection).toBe(true);
      expect(rows[1]!.enableSelection).toBe(false);
    });
  });

  describe('mapSelectedRowsToEntities', () => {
    it('extracts entity objects', () => {
      const rows = [makeRow('r1'), makeRow('r2')];
      rows[0]!.setSelected(true);
      expect(mapSelectedRowsToEntities([rows[0]!])).toEqual([rows[0]!.entity]);
    });
  });
});
