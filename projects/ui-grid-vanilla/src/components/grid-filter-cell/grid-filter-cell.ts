import { renderFilterCell } from './grid-filter-cell.template';

/**
 * `<ui-grid-filter-cell>` — Column filter input element.
 *
 * An autonomous custom element that renders a filter input for a single grid column.
 * Uses shadow DOM with scoped styles via `adoptedStyleSheets`.
 *
 * **Rendering pattern:** the template is mounted once in `connectedCallback` via
 * `renderFilterCell()`. Attribute updates patch the existing input in place
 * (value, placeholder, disabled) so the filter input never loses focus on re-renders.
 *
 * **CSS architecture:** Styles are scoped to the shadow DOM via `grid-filter-cell.scss`.
 * CSS custom properties (`--ui-grid-*`) inherit from the parent grid's shadow tree.
 *
 * **Pinning:** The host element receives pinning classes (`is-pinned`, `is-pinned-left-last`,
 * `is-pinned-right-first`) which are styled by the parent grid's CSS since the host element
 * itself lives in the grid's shadow tree.
 */
export class UIGridFilterCell extends HTMLElement {
  static readonly TAG = 'ui-grid-filter-cell';

  columnName = '';
  value = '';
  placeholder = '';

  private mounted = false;
  private inputEl: HTMLInputElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return ['data-column', 'data-value', 'data-placeholder', 'data-disabled',
            'data-pinned', 'data-pinned-left-last', 'data-pinned-right-first',
            'data-sticky-style'];
  }

  connectedCallback(): void {
    if (!this.mounted) {
      this.columnName = this.getAttribute('data-column') ?? '';
      this.value = this.getAttribute('data-value') ?? '';
      this.placeholder = this.getAttribute('data-placeholder') ?? '';
      renderFilterCell(this, this.shadowRoot!);
      this.inputEl = this.shadowRoot!.querySelector('input');
      this.mounted = true;
    }
    this.sync();
  }

  attributeChangedCallback(): void {
    if (this.mounted) {
      this.sync();
    }
  }

  private sync(): void {
    const columnName = this.getAttribute('data-column') ?? '';
    const value = this.getAttribute('data-value') ?? '';
    const placeholder = this.getAttribute('data-placeholder') ?? '';
    const disabled = this.getAttribute('data-disabled') === 'true';
    const isPinned = this.getAttribute('data-pinned') === 'true';
    const isPinnedLeftLast = this.getAttribute('data-pinned-left-last') === 'true';
    const isPinnedRightFirst = this.getAttribute('data-pinned-right-first') === 'true';
    const stickyStyle = this.getAttribute('data-sticky-style') ?? '';

    this.columnName = columnName;
    this.value = value;
    this.placeholder = placeholder;

    const nextClass = [
      'filter-cell',
      isPinned ? 'is-pinned' : '',
      isPinnedLeftLast ? 'is-pinned-left-last' : '',
      isPinnedRightFirst ? 'is-pinned-right-first' : '',
    ].filter(Boolean).join(' ');
    if (this.className !== nextClass) {
      this.className = nextClass;
    }

    if (stickyStyle) {
      if (this.getAttribute('style') !== stickyStyle) {
        this.setAttribute('style', stickyStyle);
      }
    } else if (this.hasAttribute('style')) {
      this.removeAttribute('style');
    }

    const input = this.inputEl;
    if (input) {
      if (input.dataset['column'] !== columnName) {
        input.dataset['column'] = columnName;
      }
      if (input.placeholder !== placeholder) {
        input.placeholder = placeholder;
      }
      // Only overwrite value when the input is not focused and the parent carries
      // a different value — skipping this during typing preserves caret position.
      const inputFocused = this.shadowRoot?.activeElement === input;
      if (!inputFocused && input.value !== value) {
        input.value = value;
      }
      if (input.disabled !== disabled) {
        input.disabled = disabled;
      }
      // Non-filterable columns hide the input entirely — matching the old
      // grid's empty ui-grid-filter-container behaviour. `display: none` is
      // CSS-only (no DOM detach) so focus / value preservation still work
      // when a column flips filterable on.
      input.style.display = disabled ? 'none' : '';
    }
  }

  static define(tagName = UIGridFilterCell.TAG): void {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, UIGridFilterCell);
    }
  }
}
