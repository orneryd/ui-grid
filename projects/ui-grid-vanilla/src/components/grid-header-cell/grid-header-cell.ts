/**
 * `<ui-grid-header-cell>` — Column header cell element.
 *
 * An empty custom element. Same performance rationale as `<ui-grid-body-cell>`:
 * the grid shell pre-computes `class`, `style`, `draggable`, and all `data-*`
 * attributes into the emitted HTML string. No per-element lifecycle callback
 * runs during parse — the parent is the single writer.
 */
export class UIGridHeaderCell extends HTMLElement {
  static readonly TAG = 'ui-grid-header-cell';

  static define(tagName = UIGridHeaderCell.TAG): void {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, UIGridHeaderCell);
    }
  }
}
