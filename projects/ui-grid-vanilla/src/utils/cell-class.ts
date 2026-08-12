/**
 * Class-name builders for header / body cells. Shared between the initial
 * markup builder and the patch path so both code paths produce identical
 * output.
 */

export function bodyCellClass(
  isOdd: boolean,
  align: string,
  isPinned: boolean,
  isPinnedLeftLast: boolean,
  isPinnedRightFirst: boolean,
  isFocused: boolean,
  isEditing: boolean,
  isRowSelected: boolean,
  isRowFocused: boolean,
  isRowDirty: boolean,
  isRowSaving: boolean,
  isRowError: boolean,
  isCellInvalid: boolean,
): string {
  let cls = 'body-cell ui-grid-cell';
  if (isOdd) cls += ' body-cell-odd';
  if (align === 'center') cls += ' align-center';
  else if (align === 'end') cls += ' align-end';
  if (isPinned) cls += ' is-pinned';
  if (isPinnedLeftLast) cls += ' is-pinned-left-last';
  if (isPinnedRightFirst) cls += ' is-pinned-right-first';
  if (isFocused) cls += ' cell-focused';
  if (isEditing) cls += ' cell-editing';
  // Matches the old ui.grid.selection directive's ng-class output. Row-level
  // state shows on every cell so selection stripes work across the whole row.
  if (isRowSelected) cls += ' ui-grid-row-selected';
  if (isRowFocused) cls += ' ui-grid-row-focused';
  // Row-edit — matches the old `ui.grid.rowEdit` uiGridViewport directive's
  // ng-class output. Repeated per-cell so the full-row stripe works.
  if (isRowDirty) cls += ' ui-grid-row-dirty';
  if (isRowSaving) cls += ' ui-grid-row-saving';
  if (isRowError) cls += ' ui-grid-row-error';
  // Validate — paints the invalid-cell badge + background when a validator
  // has flagged this cell. Ports the `.invalid` class from ui.grid.validate.
  if (isCellInvalid) cls += ' ui-grid-cell-invalid';
  return cls;
}

export function headerCellClass(
  isSortActive: boolean,
  isPinned: boolean,
  isPinnedLeftLast: boolean,
  isPinnedRightFirst: boolean,
  isPinMenuOpen: boolean,
  isDragTarget: boolean,
  isDragging: boolean,
): string {
  let cls = 'header-cell';
  if (isSortActive) cls += ' is-active';
  if (isPinned) cls += ' is-pinned';
  if (isPinnedLeftLast) cls += ' is-pinned-left-last';
  if (isPinnedRightFirst) cls += ' is-pinned-right-first';
  if (isPinMenuOpen) cls += ' is-pin-menu-open';
  if (isDragTarget) cls += ' is-drag-target';
  if (isDragging) cls += ' is-dragging';
  return cls;
}

export function cssEscape(value: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value.replace(/([\\".#:[\](){}+~> ])/g, '\\$1');
}
