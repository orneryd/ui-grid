import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block.component';

@Component({
  selector: 'app-docs-custom-components',
  imports: [CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Custom Sub-Components</h1>
      <p class="docs-lead">
        The vanilla web component (<code>&#64;ornery/ui-grid-vanilla</code>) is assembled from
        seven autonomous custom elements. You can replace any of them with your own implementation
        by registering a custom element with the same tag name <strong>before</strong> calling
        <code>defineStandaloneUiGridElement()</code>.
      </p>

      <h2>How It Works</h2>
      <p>
        Each sub-component's <code>define()</code> method guards against double-registration:
      </p>
      <app-code-block lang="typescript" [code]="guardSnippet" />
      <p>
        If you call <code>customElements.define('ui-grid-body-cell', MyBodyCell)</code>
        before <code>defineStandaloneUiGridElement()</code>, the grid's internal
        <code>UIGridBodyCell.define()</code> sees the tag is already taken and skips its own
        registration. The grid then creates <code>&lt;ui-grid-body-cell&gt;</code> elements
        as usual — but the browser instantiates <em>your</em> class instead.
      </p>

      <h2>Override Pattern</h2>
      <app-code-block lang="javascript" [code]="overridePatternSnippet" />

      <h2>Overridable Components</h2>
      <p>
        The table below lists every sub-component, its tag name, and the <code>data-*</code>
        attributes the grid sets on each instance. Your custom element must handle these
        attributes to render correctly.
      </p>

      <h3><code>&lt;ui-grid-body-cell&gt;</code></h3>
      <p>
        Data cell in the grid body. An empty custom element by default — all visual state
        (class, style, tabindex) is pre-computed into the emitted HTML string for maximum
        parse-time performance. Contains a <code>.cell-shell &gt; .cell-content</code>
        inner structure with optional tree/expand toggles.
      </p>
      <table class="docs-table">
        <thead><tr><th>Attribute</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data-row</code></td><td>string</td><td>Row entity ID</td></tr>
          <tr><td><code>data-column</code></td><td>string</td><td>Column name</td></tr>
          <tr><td><code>data-odd</code></td><td>"true" | "false"</td><td>Whether the display row index is odd (for zebra striping)</td></tr>
          <tr><td><code>data-align</code></td><td>string</td><td>Text alignment (<code>""</code>, <code>"right"</code>, <code>"center"</code>)</td></tr>
          <tr><td><code>data-pinned</code></td><td>"true" | "false"</td><td>Whether the column is pinned</td></tr>
          <tr><td><code>data-pinned-left-last</code></td><td>"true" | "false"</td><td>Last left-pinned column (draws the shadow border)</td></tr>
          <tr><td><code>data-pinned-right-first</code></td><td>"true" | "false"</td><td>First right-pinned column</td></tr>
          <tr><td><code>data-focused</code></td><td>"true" | "false"</td><td>Whether this cell has keyboard focus</td></tr>
          <tr><td><code>data-editing</code></td><td>"true" | "false"</td><td>Whether the cell is in edit mode</td></tr>
          <tr><td><code>data-sticky-style</code></td><td>string</td><td>Inline CSS for <code>position: sticky</code> offset</td></tr>
        </tbody>
      </table>

      <h3><code>&lt;ui-grid-header-cell&gt;</code></h3>
      <p>
        Column header cell. Also an empty custom element — class, style, and draggable
        are pre-computed. Contains <code>.header-label</code> and <code>.header-actions</code>
        (sort, group, pin buttons).
      </p>
      <table class="docs-table">
        <thead><tr><th>Attribute</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data-column</code></td><td>string</td><td>Column name</td></tr>
          <tr><td><code>data-sort-active</code></td><td>"true" | "false"</td><td>Whether an active sort is applied to this column</td></tr>
          <tr><td><code>data-pinned</code></td><td>"true" | "false"</td><td>Whether the column is pinned</td></tr>
          <tr><td><code>data-pinned-left-last</code></td><td>"true" | "false"</td><td>Last left-pinned column</td></tr>
          <tr><td><code>data-pinned-right-first</code></td><td>"true" | "false"</td><td>First right-pinned column</td></tr>
          <tr><td><code>data-pin-menu-open</code></td><td>"true" | "false"</td><td>Whether the pin direction menu is visible</td></tr>
          <tr><td><code>data-drag-target</code></td><td>"true" | "false"</td><td>Drop target highlight during column drag</td></tr>
          <tr><td><code>data-dragging</code></td><td>"true" | "false"</td><td>Currently being dragged</td></tr>
          <tr><td><code>data-draggable</code></td><td>"true" | "false"</td><td>Whether column moving is enabled</td></tr>
          <tr><td><code>data-sticky-style</code></td><td>string</td><td>Inline CSS for sticky offset</td></tr>
        </tbody>
      </table>

      <h3><code>&lt;ui-grid-filter-cell&gt;</code></h3>
      <p>
        Column filter input. Uses shadow DOM with an internal <code>&lt;input&gt;</code>.
        Patches the input in place on attribute changes to preserve focus and caret position.
      </p>
      <table class="docs-table">
        <thead><tr><th>Attribute</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data-column</code></td><td>string</td><td>Column name</td></tr>
          <tr><td><code>data-value</code></td><td>string</td><td>Current filter value</td></tr>
          <tr><td><code>data-placeholder</code></td><td>string</td><td>Input placeholder text</td></tr>
          <tr><td><code>data-disabled</code></td><td>"true" | "false"</td><td>Whether filtering is disabled for this column</td></tr>
          <tr><td><code>data-pinned</code></td><td>"true" | "false"</td><td>Whether the column is pinned</td></tr>
          <tr><td><code>data-pinned-left-last</code></td><td>"true" | "false"</td><td>Last left-pinned column</td></tr>
          <tr><td><code>data-pinned-right-first</code></td><td>"true" | "false"</td><td>First right-pinned column</td></tr>
          <tr><td><code>data-sticky-style</code></td><td>string</td><td>Inline CSS for sticky offset</td></tr>
        </tbody>
      </table>

      <h3><code>&lt;ui-grid-cell-editor&gt;</code></h3>
      <p>
        Inline cell editor. Light DOM element that mounts a single
        <code>&lt;input class="cell-editor"&gt;</code> and preserves focus across re-renders.
        The inner input carries <code>data-role="editor"</code>, <code>data-row</code>, and
        <code>data-column</code> for the grid's delegated event handlers.
      </p>
      <table class="docs-table">
        <thead><tr><th>Attribute</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data-row</code></td><td>string</td><td>Row entity ID being edited</td></tr>
          <tr><td><code>data-column</code></td><td>string</td><td>Column name being edited</td></tr>
          <tr><td><code>data-type</code></td><td>string</td><td>Input type (<code>"text"</code>, <code>"number"</code>, etc.)</td></tr>
          <tr><td><code>data-value</code></td><td>string</td><td>Current cell value (only pushed when input is not focused)</td></tr>
          <tr><td><code>data-disabled</code></td><td>"true" | "false"</td><td>Whether editing is disabled</td></tr>
        </tbody>
      </table>

      <h3><code>&lt;ui-grid-group-row&gt;</code></h3>
      <p>
        Group disclosure row. Shadow DOM element that renders a toggle icon, group label,
        and row count. The host carries <code>data-action="toggle-group"</code> for click
        delegation.
      </p>
      <table class="docs-table">
        <thead><tr><th>Attribute</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data-group</code></td><td>string</td><td>Group key (e.g. <code>"category:Fruit"</code>)</td></tr>
          <tr><td><code>data-collapsed</code></td><td>"true" | "false"</td><td>Whether the group is collapsed</td></tr>
          <tr><td><code>data-field</code></td><td>string</td><td>The grouping field name</td></tr>
          <tr><td><code>data-label</code></td><td>string</td><td>The group value label</td></tr>
          <tr><td><code>data-count</code></td><td>string</td><td>Number of rows in the group</td></tr>
          <tr><td><code>data-depth</code></td><td>string</td><td>Nesting depth (drives indentation)</td></tr>
          <tr><td><code>data-disclosure-label</code></td><td>string</td><td>Accessibility label for the toggle</td></tr>
          <tr><td><code>data-icon-path</code></td><td>string</td><td>SVG path <code>d</code> for the disclosure icon</td></tr>
          <tr><td><code>data-icon-view-box</code></td><td>string</td><td>SVG viewBox (default <code>"0 0 24 24"</code>)</td></tr>
          <tr><td><code>data-rows-suffix</code></td><td>string</td><td>Suffix text after the count (e.g. "items")</td></tr>
        </tbody>
      </table>

      <h3><code>&lt;ui-grid-pagination&gt;</code></h3>
      <p>
        Pagination controls bar. Shadow DOM element with prev/next buttons and a page-size
        select. Emits a <code>grid-page-size</code> custom event (bubbles, composed) when
        the user changes the page size.
      </p>
      <table class="docs-table">
        <thead><tr><th>Attribute</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data-range-label</code></td><td>string</td><td>e.g. "1 – 25 of 100"</td></tr>
          <tr><td><code>data-current-page</code></td><td>string</td><td>Current page number</td></tr>
          <tr><td><code>data-total-pages</code></td><td>string</td><td>Total page count</td></tr>
          <tr><td><code>data-page-label</code></td><td>string</td><td>i18n label for "Page"</td></tr>
          <tr><td><code>data-of-label</code></td><td>string</td><td>i18n label for "of"</td></tr>
          <tr><td><code>data-prev-label</code></td><td>string</td><td>Accessible label for previous button</td></tr>
          <tr><td><code>data-next-label</code></td><td>string</td><td>Accessible label for next button</td></tr>
          <tr><td><code>data-rows-label</code></td><td>string</td><td>Accessible label for page size select</td></tr>
          <tr><td><code>data-page-sizes</code></td><td>string</td><td>JSON array of page sizes (e.g. <code>[10,25,50]</code>)</td></tr>
          <tr><td><code>data-page-size</code></td><td>string</td><td>Currently selected page size</td></tr>
          <tr><td><code>data-prev-disabled</code></td><td>"true" | "false"</td><td>Disable previous button</td></tr>
          <tr><td><code>data-next-disabled</code></td><td>"true" | "false"</td><td>Disable next button</td></tr>
          <tr><td><code>data-prev-icon-path</code></td><td>string</td><td>SVG path for prev icon</td></tr>
          <tr><td><code>data-prev-icon-view-box</code></td><td>string</td><td>SVG viewBox for prev icon</td></tr>
          <tr><td><code>data-next-icon-path</code></td><td>string</td><td>SVG path for next icon</td></tr>
          <tr><td><code>data-next-icon-view-box</code></td><td>string</td><td>SVG viewBox for next icon</td></tr>
        </tbody>
      </table>

      <h3><code>&lt;ui-grid-template&gt;</code></h3>
      <p>
        Declarative template element (extends <code>HTMLTemplateElement</code> via
        <code>is="ui-grid-template"</code>). Used to define reusable sub-components
        from markup alone, without writing JavaScript. Supports both
        <code>&#36;&#123;this.prop&#125;</code> and <code>{{ '{{prop}}' }}</code> binding syntax.
      </p>
      <p>
        Unlike the other six elements, <code>ui-grid-template</code> is registered as a
        customized built-in element (<code>extends: 'template'</code>). Overriding it
        requires your replacement to also extend <code>HTMLTemplateElement</code>.
      </p>

      <h2>Example: Custom Body Cell</h2>
      <p>
        This example replaces the default no-op body cell with one that applies a
        data-driven background color and logs attribute changes.
      </p>
      <app-code-block lang="javascript" [code]="customBodyCellSnippet" />

      <h2>Example: Custom Filter Cell</h2>
      <p>
        Replace the default filter input with a dropdown select for specific columns.
        Your element must handle the same <code>data-*</code> attributes and dispatch
        <code>input</code> events so the grid's delegated handlers still work.
      </p>
      <app-code-block lang="javascript" [code]="customFilterCellSnippet" />

      <h2>Important Constraints</h2>
      <ul>
        <li>
          <strong>Register before <code>defineStandaloneUiGridElement()</code>.</strong>
          Once the default class is registered with the browser, the tag name is permanently
          claimed — <code>customElements.define()</code> throws on duplicates.
        </li>
        <li>
          <strong>Honour the <code>data-*</code> contract.</strong>
          The grid sets attributes listed above on every render cycle. Your element must
          read them (via <code>observedAttributes</code> / <code>attributeChangedCallback</code>
          or by polling in <code>connectedCallback</code>) to stay in sync.
        </li>
        <li>
          <strong>Event delegation.</strong>
          The grid uses delegated event listeners on the shadow root. Actions like
          <code>data-action="sort"</code>, <code>data-action="toggle-group"</code>, and
          <code>data-role="editor"</code> must remain on the correct inner elements for
          click/input/blur handlers to fire.
        </li>
        <li>
          <strong>Performance.</strong>
          <code>ui-grid-body-cell</code> and <code>ui-grid-header-cell</code> are intentionally
          empty classes — they do zero work on upgrade because the grid pre-computes all visual
          state into the HTML string. If your override adds <code>attributeChangedCallback</code>
          work, expect a cost at 1000+ cells.
        </li>
        <li>
          <strong><code>ui-grid-template</code> is a customized built-in.</strong>
          It uses <code>&#123; extends: 'template' &#125;</code>, which Safari does not support
          natively. If you override it, be aware of the same limitation.
        </li>
      </ul>
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsCustomComponentsComponent {
  protected readonly guardSnippet =
`// Inside each sub-component's define() method:
static define(tagName = UIGridBodyCell.TAG): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, UIGridBodyCell);
  }
}

// defineStandaloneUiGridElement() calls all of them:
export async function defineStandaloneUiGridElement(tagName = 'ui-grid-element') {
  UIGridFilterCell.define();
  UIGridGroupRow.define();
  UIGridPagination.define();
  UIGridBodyCell.define();     // ← skipped if you registered first
  UIGridHeaderCell.define();
  UIGridTemplate.define();
  UIGridCellEditor.define();
  // ...
}`;

  protected readonly overridePatternSnippet =
`import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

// 1. Define your custom element FIRST
class MyBodyCell extends HTMLElement {
  static get observedAttributes() {
    return ['data-row', 'data-column', 'data-pinned', 'data-editing'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    // React to attribute changes from the grid
  }

  connectedCallback() {
    // Initial render — read data-* attributes for state
  }
}
customElements.define('ui-grid-body-cell', MyBodyCell);

// 2. THEN define the grid — your element is already registered,
//    so UIGridBodyCell.define() becomes a no-op
await defineStandaloneUiGridElement();`;

  protected readonly customBodyCellSnippet =
`class ColorCodedBodyCell extends HTMLElement {
  static get observedAttributes() {
    return ['data-row', 'data-column', 'data-align', 'data-pinned',
            'data-focused', 'data-editing', 'data-sticky-style'];
  }

  connectedCallback() {
    // The grid writes className and style directly on the host element,
    // so basic styling (sticky offsets, pinning classes) works automatically.
    // You can add extra behaviour here.
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'data-focused' && newVal === 'true') {
      this.style.outline = '2px solid var(--ui-grid-accent, #00d4aa)';
    } else if (name === 'data-focused' && newVal === 'false') {
      this.style.outline = '';
    }
  }
}

customElements.define('ui-grid-body-cell', ColorCodedBodyCell);
await defineStandaloneUiGridElement();`;

  protected readonly customFilterCellSnippet =
`class DropdownFilterCell extends HTMLElement {
  static get observedAttributes() {
    return ['data-column', 'data-value', 'data-placeholder',
            'data-disabled', 'data-sticky-style'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const column = this.getAttribute('data-column') ?? '';
    const value = this.getAttribute('data-value') ?? '';

    this.shadowRoot.innerHTML = \`
      <select data-column="\${column}">
        <option value="">All</option>
        <option value="Active" \${value === 'Active' ? 'selected' : ''}>Active</option>
        <option value="Inactive" \${value === 'Inactive' ? 'selected' : ''}>Inactive</option>
      </select>
    \`;

    // The grid listens for 'input' events via delegation
    this.shadowRoot.querySelector('select').addEventListener('change', (e) => {
      this.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        composed: true,  // cross shadow boundary
        data: e.target.value,
      }));
    });
  }

  attributeChangedCallback() {
    if (this.isConnected) this.connectedCallback();
  }
}

customElements.define('ui-grid-filter-cell', DropdownFilterCell);
await defineStandaloneUiGridElement();`;
}
