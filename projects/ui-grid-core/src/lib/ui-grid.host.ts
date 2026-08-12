import { GridCellPosition } from './grid.models';

export interface GridHostDimensions {
  height: number;
  width: number;
}

export function observeGridHostSize(
  hostElement: HTMLElement,
  onSizeChange: (size: GridHostDimensions) => void
): ResizeObserver | null {
  if (typeof ResizeObserver === 'undefined') {
    return null;
  }

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) {
      return;
    }

    onSizeChange({
      height: Math.round(entry.contentRect.height),
      width: Math.round(entry.contentRect.width)
    });
  });

  observer.observe(hostElement);
  return observer;
}

export function focusGridRenderedCell(
  hostElement: HTMLElement,
  position: GridCellPosition,
  isCurrent: () => boolean
): void {
  const selector = `.body-cell[data-row-id="${position.rowId}"][data-col-name="${position.columnName}"]`;

  const focusElement = (element: HTMLElement): void => {
    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  };

  const focusCell = (retry = true): void => {
    if (!isCurrent()) {
      return;
    }

    const shadowRoot = hostElement.shadowRoot;
    const target = shadowRoot?.querySelector(selector) as HTMLElement | null;
    if (!target) {
      if (retry) {
        requestAnimationFrame(() => focusCell(false));
      }
      return;
    }

    focusElement(target);
    if (retry && shadowRoot?.activeElement !== target) {
      requestAnimationFrame(() => focusCell(false));
    }
  };

  focusCell(true);
  queueMicrotask(() => focusCell(true));
}

export function focusGridEditor(
  hostElement: HTMLElement,
  position: GridCellPosition,
  isCurrent: () => boolean
): void {
  const selector = `.cell-editor[data-row-id="${position.rowId}"][data-col-name="${position.columnName}"]`;

  const focusInputElement = (input: HTMLInputElement): void => {
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    input.select();
  };

  const focusInput = (retry = true): void => {
    if (!isCurrent()) {
      return;
    }

    const shadowRoot = hostElement.shadowRoot;
    const input = shadowRoot?.querySelector(selector) as HTMLInputElement | null;
    if (!input) {
      if (retry) {
        requestAnimationFrame(() => focusInput(false));
      }
      return;
    }

    focusInputElement(input);
    if (retry && shadowRoot?.activeElement !== input) {
      requestAnimationFrame(() => focusInput(false));
    }
  };

  focusInput(true);
}

export function downloadGridCsvFile(csv: string, filename: string): void {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}