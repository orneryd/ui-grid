import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { GridOptions, UiGridApi, UiGridComponent } from '@ornery/ui-grid';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-selection',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Row Selection</h1>
      <p class="docs-lead">
        Full parity with <code>ui.grid.selection</code>: 13 options, 18 API methods, 3 events,
        mouse (click / shift-click / ctrl-click / drag-paint), keyboard (Space, Ctrl+A), row-header
        checkbox column, select-all header button, <code>isRowSelectable</code> hook, and
        reconciliation across pipeline rebuilds.
      </p>

      <h2>Live Example</h2>
      <p>Click to toggle rows, shift-click to range-select, ctrl/cmd-click to add, drag to paint.</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
      <p>
        Selected:
        <strong>{{ selectedCount() }}</strong> of
        <strong>{{ demoOptions.data.length }}</strong>
        ·
        <button type="button" (click)="selectAll()">Select all</button>
        <button type="button" (click)="clearSelection()">Clear</button>
      </p>

      <h2>Options</h2>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>enableRowSelection</code></td><td>false</td><td>Master toggle. Opt-in so consumers never get unexpected selection chrome.</td></tr>
          <tr><td><code>multiSelect</code></td><td>true</td><td>Allow selecting more than one row at a time</td></tr>
          <tr><td><code>noUnselect</code></td><td>false</td><td>Prevent the last selected row from being deselected</td></tr>
          <tr><td><code>modifierKeysToMultiSelect</code></td><td>false</td><td>Require Ctrl / Shift to add to selection (single-select by default click)</td></tr>
          <tr><td><code>enableRowHeaderSelection</code></td><td>true</td><td>Add the checkbox column on the far left</td></tr>
          <tr><td><code>enableFullRowSelection</code></td><td>auto</td><td>Click any cell to toggle. Defaults to the inverse of <code>enableRowHeaderSelection</code> so the two don't double-handle clicks.</td></tr>
          <tr><td><code>enableSelectAll</code></td><td>true</td><td>Show the select-all checkbox in the row-header column's header</td></tr>
          <tr><td><code>selectionRowHeaderWidth</code></td><td>30</td><td>Width (px) of the row-header checkbox column</td></tr>
          <tr><td><code>isRowSelectable</code></td><td>—</td><td>Hook: <code>(row) =&gt; boolean</code> to disable selection on specific rows</td></tr>
        </tbody>
      </table>

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method / Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>selection.toggleRowSelection(entity)</code></td><td>Toggle a row's selected state</td></tr>
          <tr><td><code>selection.selectRow(entity)</code></td><td>Select a row</td></tr>
          <tr><td><code>selection.unSelectRow(entity)</code></td><td>Deselect a row</td></tr>
          <tr><td><code>selection.shiftSelectRow(entity)</code></td><td>Range-select from the last anchor to <code>entity</code></td></tr>
          <tr><td><code>selection.selectAllRows() / selectAllVisibleRows() / clearSelectedRows()</code></td><td>Bulk operations</td></tr>
          <tr><td><code>selection.getSelectedRows() / getSelectedGridRows()</code></td><td>Entities / GridRow instances for the selection</td></tr>
          <tr><td><code>selection.getSelectedCount()</code></td><td>Size of the current selection</td></tr>
          <tr><td><code>selection.on.rowSelectionChanged(fn)</code></td><td>Per-row change event</td></tr>
          <tr><td><code>selection.on.rowSelectionChangedBatch(fn)</code></td><td>Fires once per drag-paint / range-select / selectAll</td></tr>
          <tr><td><code>selection.on.rowFocusChanged(fn)</code></td><td>Row-level focus change (independent of cell focus)</td></tr>
        </tbody>
      </table>

      <h2>Usage</h2>
      <app-code-block lang="typescript" [code]="usageSnippet" />
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsSelectionComponent {
  private gridApi: UiGridApi | null = null;
  protected readonly selectedCount = signal(0);

  protected readonly demoOptions: GridOptions = {
    id: 'docs-selection-demo',
    data: createSmallDemoData(8),
    rowHeight: 44,
    enableRowSelection: true,
    enableRowHeaderSelection: true,
    enableFullRowSelection: true,
    enableSelectAll: true,
    rowIdentity: (row) => String((row as { id: string }).id),
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'company' },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end' },
    ],
    onRegisterApi: (api) => {
      this.gridApi = api as UiGridApi;
      this.selectedCount.set(this.gridApi.selection.getSelectedCount());
      this.gridApi.selection.on.rowSelectionChanged(() => {
        this.selectedCount.set(this.gridApi!.selection.getSelectedCount());
      });
      this.gridApi.selection.on.rowSelectionChangedBatch(() => {
        this.selectedCount.set(this.gridApi!.selection.getSelectedCount());
      });
    },
  };

  protected selectAll(): void {
    this.gridApi?.selection.selectAllRows();
  }

  protected clearSelection(): void {
    this.gridApi?.selection.clearSelectedRows();
  }

  protected readonly usageSnippet = `const options: GridOptions = {
  enableRowSelection: true,
  enableRowHeaderSelection: true,       // checkbox column on the left
  enableFullRowSelection: false,        // click-to-select only via the checkbox
  multiSelect: true,
  isRowSelectable: (row) => row.entity.status !== 'Archived',
};

// Subscribe to changes:
gridApi.selection.on.rowSelectionChanged((gridRow) => {
  console.log('toggled', gridRow.entity, 'selected?', gridRow.isSelected);
});
gridApi.selection.on.rowSelectionChangedBatch((gridRows) => {
  // Fires once per drag-paint / range-select / selectAllRows call.
  console.log(\`batch toggled \${gridRows.length} rows\`);
});

// Programmatic selection:
gridApi.selection.selectAllVisibleRows();
gridApi.selection.clearSelectedRows();
const selected = gridApi.selection.getSelectedRows();
`;
}
