import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { UiGrid, type UiGridProps } from './UiGrid';

export function mountUiGrid(container: Element | DocumentFragment, props: UiGridProps): Root {
  const root = createRoot(container);
  root.render(React.createElement(UiGrid, props));
  return root;
}

/** Re-render an already-mounted UiGrid root with new props (for live data updates). */
export function updateUiGrid(root: Root, props: UiGridProps): void {
  root.render(React.createElement(UiGrid, props));
}

/** Create a styled <span> React node — usable from non-TSX contexts (e.g. Angular). */
export function styledCell(
  text: string,
  color: string,
  extraStyle?: React.CSSProperties,
): React.ReactNode {
  return React.createElement(
    'span',
    { style: { color, fontVariantNumeric: 'tabular-nums', ...extraStyle } },
    text,
  );
}

/** Create a date <input> React node — usable from non-TSX contexts. */
export function datePickerCell(
  value: string,
  onChange?: (newValue: string) => void,
  extraStyle?: React.CSSProperties,
): React.ReactNode {
  return React.createElement('input', {
    type: 'date',
    value: value || '',
    onChange: onChange
      ? (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)
      : undefined,
    style: {
      font: 'inherit',
      fontSize: '0.85rem',
      border: '1px solid color-mix(in srgb, currentColor 20%, transparent)',
      borderRadius: '6px',
      padding: '0.2rem 0.4rem',
      background: 'var(--ui-grid-surface, white)',
      color: 'inherit',
      cursor: 'pointer',
      ...extraStyle,
    },
  });
}