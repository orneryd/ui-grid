import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-cell-editing',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Cell Editing</h1>
      <p class="docs-lead">
        Inline spreadsheet-style editing with full keyboard navigation. Edit on focus, double-click, or
        programmatically via the API.
      </p>

      <h2>Enable Editing</h2>
      <p>Set <code>enableCellEdit</code> or <code>enableCellEditOnFocus</code> at the grid or column level:</p>
      <app-code-block lang="typescript" [code]="enableSnippet" />

      <h2>Keyboard Navigation</h2>
      <table class="docs-table">
        <thead><tr><th>Key</th><th>Action</th></tr></thead>
        <tbody>
          <tr><td><kbd>F2</kbd> or <kbd>Enter</kbd></td><td>Begin editing focused cell</td></tr>
          <tr><td>Any printable key</td><td>Begin editing and replace value</td></tr>
          <tr><td><kbd>Backspace</kbd> / <kbd>Delete</kbd></td><td>Clear value and begin editing</td></tr>
          <tr><td><kbd>Tab</kbd></td><td>Commit and move to next editable cell</td></tr>
          <tr><td><kbd>Shift + Tab</kbd></td><td>Commit and move to previous editable cell</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>Commit and move down</td></tr>
          <tr><td><kbd>Shift + Enter</kbd></td><td>Commit and move up</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Cancel edit, restore original value</td></tr>
        </tbody>
      </table>

      <h2>Conditional Editing</h2>
      <p>Use <code>cellEditableCondition</code> to allow/deny editing per row:</p>
      <app-code-block lang="typescript" [code]="conditionalSnippet" />

      <h2>Edit Model Field</h2>
      <p>
        When the column name differs from the data property you want to write to, set <code>editModelField</code>
        to a dot-path (e.g. <code>'account.owner'</code>). The grid writes edited values to this path using
        <code>setPathValue</code>.
      </p>

      <h2>API</h2>
      <table class="docs-table">
        <thead><tr><th>Method / Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>gridApi.edit.beginCellEdit(row, colName)</code></td><td>Start editing programmatically</td></tr>
          <tr><td><code>gridApi.edit.endCellEdit()</code></td><td>Commit the current edit</td></tr>
          <tr><td><code>gridApi.edit.cancelCellEdit()</code></td><td>Cancel without committing</td></tr>
          <tr><td><code>gridApi.edit.getEditingCell()</code></td><td>Returns the current editing position or null</td></tr>
          <tr><td><code>gridApi.edit.on.beginCellEdit</code></td><td><code>(row, col, event) => void</code></td></tr>
          <tr><td><code>gridApi.edit.on.afterCellEdit</code></td><td><code>(row, col, newVal, oldVal) => void</code></td></tr>
          <tr><td><code>gridApi.edit.on.cancelCellEdit</code></td><td><code>(row, col) => void</code></td></tr>
        </tbody>
      </table>

      <h2>Live Example</h2>
      <p>Click any cell to start editing. Use Tab/Enter/Escape to navigate:</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
    </section>
  `,
  styles: `@use '../docs-topic';`
})
export class DocsCellEditingComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'cell-editing-demo',
    data: createSmallDemoData(5),
    rowHeight: 48,
    enableSorting: true,
    enableFiltering: false,
    enableCellEditOnFocus: true,
    columnDefs: [
      { name: 'name', displayName: 'Customer', enableCellEdit: true },
      { name: 'company', enableCellEdit: true },
      { name: 'status', enableCellEdit: true },
      {
        name: 'revenue',
        type: 'number',
        align: 'end',
        enableCellEdit: true,
        formatter: (v) => `$${Number(v).toLocaleString()}`
      }
    ]
  };

  protected readonly enableSnippet = `const gridOptions: GridOptions = {
  // Grid-level: edit on focus for all editable columns
  enableCellEditOnFocus: true,
  columnDefs: [
    // Column-level: only this column is editable
    { name: 'name', enableCellEdit: true },
    // This column is read-only
    { name: 'revenue', enableCellEdit: false },
  ],
};`;

  protected readonly conditionalSnippet = `{
  name: 'status',
  enableCellEdit: true,
  // Only allow editing rows where status is not 'Enterprise'
  cellEditableCondition: (ctx) => ctx.row['status'] !== 'Enterprise',
}`;
}
