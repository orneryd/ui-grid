/**
 * `<ui-grid-cell-editor>` — Single-input cell editor element.
 *
 * Light-DOM custom element. Mounts ONE `<input class="cell-editor">` in
 * `connectedCallback` and reuses it across renders — every subsequent snapshot
 * patches `value`/`type`/`disabled` in place instead of recreating the input.
 * That keeps the keystroke path destructive-free: typing never rebuilds the
 * focused node, so focus and caret survive the parent grid's re-renders.
 *
 * The inner `<input>` carries `data-role="editor"` + `data-row` + `data-column`
 * so the parent grid's delegated `input` / `blur` handlers continue to find it
 * via `composedPath()`/event.target unchanged.
 *
 * Value updates coming in from the controller (`data-value`) are only pushed
 * into the input when the input is NOT the currently focused element — this
 * avoids clobbering the user's in-progress edit / caret position.
 */
export class UIGridCellEditor extends HTMLElement {
  static readonly TAG = 'ui-grid-cell-editor';

  private mounted = false;
  private inputEl: HTMLInputElement | null = null;

  static get observedAttributes(): string[] {
    return ['data-row', 'data-column', 'data-type', 'data-value', 'data-disabled'];
  }

  connectedCallback(): void {
    if (!this.mounted) {
      // Reuse a pre-existing <input> child if the element was parsed from
      // innerHTML with one already inside (not expected, but defensive);
      // otherwise create it fresh.
      let input = this.querySelector<HTMLInputElement>('input.cell-editor');
      if (!input) {
        input = document.createElement('input');
        input.className = 'cell-editor';
        this.appendChild(input);
      }
      input.dataset['role'] = 'editor';
      this.inputEl = input;
      this.mounted = true;
    }
    this.sync(true);
    // On first mount, place focus + select contents so the user can start
    // typing immediately — matches the behaviour of a fresh <input> being
    // inserted and clicked into.
    const input = this.inputEl;
    if (input && this.getAttribute('data-autofocus') !== 'false') {
      try {
        input.focus({ preventScroll: true });
      } catch {
        input.focus();
      }
      input.select();
    }
  }

  attributeChangedCallback(): void {
    if (this.mounted) {
      this.sync(false);
    }
  }

  private sync(initial: boolean): void {
    const input = this.inputEl;
    if (!input) return;

    const rowId = this.getAttribute('data-row') ?? '';
    const columnName = this.getAttribute('data-column') ?? '';
    const type = this.getAttribute('data-type') || 'text';
    const value = this.getAttribute('data-value') ?? '';
    const disabled = this.getAttribute('data-disabled') === 'true';

    if (input.dataset['row'] !== rowId) {
      input.dataset['row'] = rowId;
    }
    if (input.dataset['column'] !== columnName) {
      input.dataset['column'] = columnName;
    }
    if (input.type !== type) {
      input.type = type;
    }
    // Only push value in from the outside when:
    //   - initial mount (seed the input), OR
    //   - input is NOT currently focused (external programmatic update).
    // Skipping this during typing preserves the caret.
    const rootNode = input.getRootNode() as Document | ShadowRoot;
    const isFocused = (rootNode as Document | ShadowRoot).activeElement === input;
    if (initial || !isFocused) {
      if (input.value !== value) {
        input.value = value;
      }
    }
    if (input.disabled !== disabled) {
      input.disabled = disabled;
    }
  }

  static define(tagName = UIGridCellEditor.TAG): void {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, UIGridCellEditor);
    }
  }
}
