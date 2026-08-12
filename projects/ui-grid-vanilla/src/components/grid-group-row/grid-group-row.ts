import { renderGroupRow } from './grid-group-row.template';

/**
 * `<ui-grid-group-row>` — Group disclosure row element.
 *
 * An autonomous custom element that renders a group header row with a disclosure
 * toggle icon, group field/label, and row count. Uses shadow DOM with scoped styles
 * via `adoptedStyleSheets`.
 *
 * **Rendering pattern:** instance properties are populated from data attributes,
 * then `renderGroupRow(this, shadowRoot)` writes the markup into the shadow root.
 *
 * **CSS architecture:** Styles are scoped to the shadow DOM via `grid-group-row.scss`.
 * CSS custom properties (`--ui-grid-*`) inherit from the parent grid's shadow tree.
 *
 * **Event delegation:** The host element carries `data-action="toggle-group"` and
 * `data-group` attributes so the parent grid's click handler can identify it without
 * piercing the shadow boundary.
 *
 * @example
 * ```html
 * <ui-grid-group-row
 *   data-action="toggle-group"
 *   data-group="category:Fruit"
 *   data-collapsed="false"
 *   data-field="category"
 *   data-label="Fruit"
 *   data-count="5"
 *   data-depth="0"
 *   data-icon-path="M7 10l5 5 5-5z">
 * </ui-grid-group-row>
 * ```
 */
export class UIGridGroupRow extends HTMLElement {
  static readonly TAG = 'ui-grid-group-row';

  /** The grouping field name (e.g. "category"). */
  field = '';
  /** The group value label (e.g. "Fruit"). */
  label = '';
  /** Number of rows in this group. */
  count = '0';
  /** Accessibility label for the disclosure toggle. */
  disclosureLabel = '';
  /** SVG path data for the disclosure icon. */
  iconPath = '';
  /** SVG viewBox for the disclosure icon. */
  iconViewBox = '0 0 24 24';
  /** Suffix text after the count (e.g. "items"). */
  rowsSuffix = '';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return ['data-group', 'data-collapsed', 'data-field', 'data-label',
            'data-count', 'data-depth', 'data-disclosure-label',
            'data-icon-path', 'data-icon-view-box', 'data-rows-suffix'];
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private render(): void {
    const depth = parseInt(this.getAttribute('data-depth') ?? '0', 10);
    this.field = this.getAttribute('data-field') ?? '';
    this.label = this.getAttribute('data-label') ?? '';
    this.count = this.getAttribute('data-count') ?? '0';
    this.disclosureLabel = this.getAttribute('data-disclosure-label') ?? '';
    this.iconPath = this.getAttribute('data-icon-path') ?? '';
    this.iconViewBox = this.getAttribute('data-icon-view-box') ?? '0 0 24 24';
    this.rowsSuffix = this.getAttribute('data-rows-suffix') ?? '';

    this.className = 'group-row ui-grid-row ui-grid-group-row';
    this.setAttribute('style', `grid-column: 1 / -1; padding-inline-start:${depth * 20 + 10}px`);

    renderGroupRow(this, this.shadowRoot!);
  }

  static define(tagName = UIGridGroupRow.TAG): void {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, UIGridGroupRow);
    }
  }
}
