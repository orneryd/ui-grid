import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-column-moving',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Column Moving &amp; Resizing</h1>
      <p class="docs-lead">
        Drag-and-drop column reordering plus resizing handles on every header. Pinned columns stay
        pinned across reorders, and the resize handle doubles as a double-click auto-fit target.
      </p>

      <h2>Live Example</h2>
      <p>
        Drag a header to reorder. Use the resize handle on the right edge of any header to change
        its width; double-click the handle to auto-fit.
      </p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>

      <h2>Options</h2>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>enableColumnMoving</code></td><td>false</td><td>Master toggle for drag-and-drop reorder</td></tr>
          <tr><td><code>enableColumnResizing</code></td><td>true</td><td>Render resize handles on every header</td></tr>
          <tr><td><code>width</code> (colDef)</td><td><code>minmax(11rem, 1fr)</code></td><td>Track definition. Accepts any valid grid-template-columns value — pixels, fr, minmax, percent. Use <code>minmax(...)</code> to clamp during resize.</td></tr>
        </tbody>
      </table>

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method / Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>core.moveColumn(fromIndex, toIndex)</code></td><td>Programmatically reorder a column by its visible index</td></tr>
          <tr><td>Column order state</td><td>Capture via <code>gridApi.saveState.save()</code> — the returned payload's <code>columnOrder</code> reflects the current arrangement</td></tr>
        </tbody>
      </table>

      <h2>Behavior Notes</h2>
      <ul>
        <li><strong>Pinning preserves intent.</strong> A left-pinned column can only be reordered within the left-pinned group; the center band and the right-pinned group are separate drop zones.</li>
        <li><strong>Resize is imperative.</strong> While dragging the handle, widths are written directly to the three sub-grids' <code>grid-template-columns</code> — zero signal churn, no per-frame layout thrash. On mouse-up a single signal update commits the final value.</li>
        <li><strong>Auto-fit on double-click.</strong> The grid measures the widest rendered cell + header in the column and sets that as the new width. Virtualized rows outside the viewport are not measured.</li>
      </ul>

      <h2>Usage</h2>
      <app-code-block lang="typescript" [code]="usageSnippet" />
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsColumnMovingComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'docs-column-moving-demo',
    data: createSmallDemoData(6),
    rowHeight: 44,
    enableSorting: true,
    enableColumnMoving: true,
    enableColumnResizing: true,
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'company' },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end' },
    ],
  };

  protected readonly usageSnippet = `const options: GridOptions = {
  enableColumnMoving: true,
  enableColumnResizing: true,
  columnDefs: [
    { name: 'id', width: '4rem' },
    { name: 'name', width: 'minmax(12rem, 1.5fr)' },
    { name: 'company', width: 'minmax(8rem, 24rem)' },
    { name: 'revenue', align: 'end', width: '10rem' },
  ],
  onRegisterApi: (api) => {
    // Persist the current column order to localStorage:
    const state = api.saveState.save();
    localStorage.setItem('col-order', JSON.stringify(state.columnOrder));

    // Programmatically reorder:
    api.core.moveColumn(0, 2);  // move the leftmost column to index 2
  },
};`;
}
