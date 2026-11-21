/**
 * String template helpers for grid markup fragments.
 *
 * These are simple functions that return HTML strings for use in innerHTML
 * concatenation (the hot render path). They are NOT .html template imports —
 * .html templates should only be used where connect() is called against
 * a DOM target (shell, components with shadow DOM).
 *
 * This avoids the DOM→string→DOM round-trip that toHTML() would cause.
 */

export function iconMarkup(svgClass: string, viewBox: string, path: string): string {
  return `<svg class="${svgClass}" viewBox="${viewBox}" aria-hidden="true" focusable="false"><path d="${path}"></path></svg>`;
}

export function slotRegistryMarkup(cellSlots: string): string {
  return `<div hidden class="slot-registry">${cellSlots}<slot name="expandable-row"></slot></div>`;
}

/** `rowIndex` is the 1-based `aria-rowindex` for the filter row (2 when the
 * column-header row is row 1). */
export function filterRowMarkup(
  templateColumns: string,
  filterCells: string,
  rowIndex: number,
): string {
  return `<div class="filter-grid ui-grid-header" role="row" aria-rowindex="${rowIndex}" style="grid-template-columns:${templateColumns}">${filterCells}</div>`;
}

export function virtualSpacerStyle(totalVirtualHeight: number, rowSize: number): string {
  return `height:${totalVirtualHeight}px;--ui-grid-row-height:${rowSize}px`;
}

export function bodyVirtualMarkup(templateColumns: string, totalVirtualHeight: number, virtualOffset: number, bodyContent: string, rowSize: number): string {
  return `<div class="grid-virtual-spacer" style="${virtualSpacerStyle(totalVirtualHeight, rowSize)}"><div class="body-grid ui-grid-canvas grid-virtual-body" role="rowgroup" style="grid-template-columns:${templateColumns};--ui-grid-template-columns:${templateColumns};top:${virtualOffset}px">${bodyContent}</div></div>`;
}

export function bodyStaticMarkup(templateColumns: string, bodyContent: string): string {
  return `<div class="body-grid ui-grid-canvas" role="rowgroup" style="grid-template-columns:${templateColumns};--ui-grid-template-columns:${templateColumns}">${bodyContent}</div>`;
}

export function emptyDataMarkup(heading: string, description: string): string {
  return `<div part="empty-state" class="empty-state ui-grid-no-row-overlay"><strong>${heading}</strong><p>${description}</p></div>`;
}

/** An expandable detail row. Carries its own `aria-rowindex` because it is a
 * row in the grid's row sequence, and a single `gridcell` spanning every
 * column to hold the detail content. */
export function expandableRowMarkup(
  expandableContent: string,
  rowIndex: number,
  columnCount: number,
): string {
  const colspan = columnCount > 1 ? ` aria-colspan="${columnCount}"` : '';
  return `<div part="expandable-row" class="expandable-row ui-grid-row ui-grid-expandable-row" role="row" aria-rowindex="${rowIndex}" style="grid-column:1 / -1"><div role="gridcell" aria-colindex="1"${colspan}>${expandableContent}</div></div>`;
}

export function treeToggleMarkup(rowId: string, toggleLabel: string, iconViewBox: string, iconPath: string): string {
  return `<button type="button" class="row-toggle" data-action="toggle-tree" data-row="${rowId}" aria-label="${toggleLabel}">${iconMarkup('toggle-icon', iconViewBox, iconPath)}<span class="sr-only">${toggleLabel}</span></button>`;
}

export function expandToggleMarkup(rowId: string, toggleLabel: string, iconViewBox: string, iconPath: string): string {
  return `<button type="button" class="row-toggle row-toggle-expand" data-action="toggle-expand" data-row="${rowId}" aria-label="${toggleLabel}">${iconMarkup('toggle-icon', iconViewBox, iconPath)}<span class="sr-only">${toggleLabel}</span></button>`;
}

export function cellEditorMarkup(rowId: string, columnName: string, inputType: string, editingValue: string): string {
  return `<ui-grid-cell-editor data-row="${rowId}" data-column="${columnName}" data-type="${inputType}" data-value="${editingValue}"></ui-grid-cell-editor>`;
}

export function cellValueMarkup(displayValue: string): string {
  return `<span class="cell-value">${displayValue}</span>`;
}

export function defaultExpandableMarkup(label: string): string {
  return `<p>${label}</p>`;
}

export function resizerMarkup(columnName: string, headerValue: string): string {
  return `<button type="button" class="column-resizer" data-action="resize" data-column="${columnName}" aria-label="Resize ${headerValue} column" title="Drag to resize, double-click to auto fit"></button>`;
}
