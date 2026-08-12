import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-accessibility',
  imports: [UiGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Accessibility</h1>
      <p class="docs-lead">
        UI Grid implements the WAI-ARIA grid pattern with full keyboard navigation,
        focus management inside Shadow DOM, and localized screen reader announcements.
      </p>

      <h2>ARIA Roles</h2>
      <p>The grid maps its structure to the
        <a href="https://www.w3.org/WAI/ARIA/apd/pattern/grid/" target="_blank" rel="noreferrer">WAI-ARIA grid pattern</a>:
      </p>
      <table class="docs-table docs-table-compact">
        <thead><tr><th>Element</th><th>Role</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>Grid container</td><td><code>grid</code></td><td>aria-label from options.title</td></tr>
          <tr><td>Header row</td><td><code>row</code></td><td>Contains column headers</td></tr>
          <tr><td>Header cell</td><td><code>columnheader</code></td><td>aria-sort for sorted columns</td></tr>
          <tr><td>Body container</td><td><code>rowgroup</code></td><td>Groups all data rows</td></tr>
          <tr><td>Data row</td><td><code>row</code></td><td>One per visible record</td></tr>
          <tr><td>Data cell</td><td><code>gridcell</code></td><td>tabindex="0" for keyboard nav</td></tr>
          <tr><td>Group row</td><td><code>row</code></td><td>aria-expanded for collapse state</td></tr>
          <tr><td>Pagination</td><td><code>navigation</code></td><td>aria-label from i18n labels</td></tr>
        </tbody>
      </table>

      <h2>Keyboard Navigation</h2>
      <p>Every data cell is keyboard-reachable. Try navigating the grid below with your keyboard:</p>
      <table class="docs-table docs-table-compact">
        <thead><tr><th>Key</th><th>Action</th></tr></thead>
        <tbody>
          <tr><td><kbd>Arrow Left</kbd> / <kbd>Arrow Right</kbd></td><td>Move focus between cells (wraps rows)</td></tr>
          <tr><td><kbd>Arrow Up</kbd> / <kbd>Arrow Down</kbd></td><td>Move focus between rows</td></tr>
          <tr><td><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd></td><td>Next / previous cell</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>Move down (Shift = up)</td></tr>
          <tr><td><kbd>F2</kbd></td><td>Begin editing focused cell</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Cancel edit, restore value</td></tr>
          <tr><td><kbd>Backspace</kbd> / <kbd>Delete</kbd></td><td>Clear cell and enter edit mode</td></tr>
          <tr><td>Any printable character</td><td>Begin edit with that character</td></tr>
        </tbody>
      </table>

      <h2>Live Example</h2>
      <p>
        This grid has sorting and editing enabled. Use <kbd>Tab</kbd> to move between cells,
        <kbd>F2</kbd> to edit, and <kbd>Escape</kbd> to cancel:
      </p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>

      <h2>Screen Reader Support</h2>
      <p>
        Visually hidden text (<code>.sr-only</code>) provides labels for icon-only buttons,
        filter inputs, group disclosure rows, and pagination controls. All labels are sourced
        from the i18n <code>GridLabels</code> object and localize automatically.
      </p>
      <table class="docs-table docs-table-compact">
        <thead><tr><th>Element</th><th>Screen Reader Text</th></tr></thead>
        <tbody>
          <tr><td>Sort buttons</td><td>"Sort" / "Sort ascending" / "Sort descending"</td></tr>
          <tr><td>Group toggles</td><td>"Group by this column" / "Remove grouping"</td></tr>
          <tr><td>Filter cells</td><td>"Filter column name"</td></tr>
          <tr><td>Tree toggles</td><td>"Collapse" / "Expand"</td></tr>
          <tr><td>Detail expand</td><td>"Expand row" / "Collapse row"</td></tr>
          <tr><td>Pagination</td><td>"Previous" / "Next"</td></tr>
        </tbody>
      </table>

      <h2>Focus Management</h2>
      <p>
        Focus management operates inside the grid's Shadow DOM. After keyboard navigation
        or virtual scroll repositioning, the grid queries its shadow root for the target cell
        and calls <code>focus()</code>. A <code>requestAnimationFrame</code> retry handles
        cases where Angular hasn't rendered the target cell yet. When entering edit mode,
        the editor input is focused and its text selected.
      </p>

      <h2>Theming for Contrast</h2>
      <p>
        Override <code>--ui-grid-cell-color</code>, <code>--ui-grid-muted-color</code>,
        <code>--ui-grid-surface</code>, and <code>--ui-grid-accent</code> to meet WCAG contrast ratios.
        The demo app's four theme modes (studio dark/light, wireframe dark/light) demonstrate
        accessible color combinations.
      </p>

      <h2>Custom Cell Templates</h2>
      <p>When providing custom cell templates, ensure your content is accessible:</p>
      <ul>
        <li>Use semantic HTML elements where possible</li>
        <li>Add <code>aria-label</code> to interactive elements</li>
        <li>Ensure custom controls are keyboard-reachable</li>
        <li>Maintain sufficient color contrast</li>
      </ul>
    </section>
  `,
  styles: `@use '../docs-topic';`
})
export class DocsAccessibilityComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'a11y-demo',
    data: createSmallDemoData(5),
    rowHeight: 48,
    enableSorting: true,
    enableFiltering: true,
    enableCellEditOnFocus: true,
    columnDefs: [
      { name: 'name', displayName: 'Customer', enableCellEdit: true },
      { name: 'company', enableCellEdit: true },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end' }
    ]
  };
}
