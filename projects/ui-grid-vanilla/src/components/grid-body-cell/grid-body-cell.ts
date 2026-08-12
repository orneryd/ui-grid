/**
 * `<ui-grid-body-cell>` — Data cell element.
 *
 * An empty custom element. The grid shell pre-computes `class`, `style`,
 * `tabindex`, and all `data-*` attributes directly into the emitted HTML
 * string, so the browser parser finishes the element's visual state in one
 * pass. No `attributeChangedCallback` work is required at upgrade time — at
 * 1000+ cells per render, the callback storm was the single largest cost on
 * the hot path.
 *
 * The class remains so the tag name resolves (`closest('ui-grid-body-cell')`
 * still works) and so the element-specific CSS selectors target correctly.
 * The parent is the single writer; cells are never mutated from outside.
 */
export class UIGridBodyCell extends HTMLElement {
  static readonly TAG = 'ui-grid-body-cell';

  static define(tagName = UIGridBodyCell.TAG): void {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, UIGridBodyCell);
    }
  }
}
