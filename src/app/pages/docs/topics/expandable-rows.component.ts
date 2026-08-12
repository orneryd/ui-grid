import { ChangeDetectionStrategy, Component, TemplateRef, viewChild } from '@angular/core';
import { GridExpandableTemplateContext, GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-expandable-rows',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #detailTemplate let-row>
      <div class="detail-content">
        <strong>{{ row.name }}</strong> — {{ row.company }}
        <br />Revenue: {{ '$' + row.revenue.toLocaleString() }}
      </div>
    </ng-template>

    <section class="docs-topic">
      <h1>Expandable Rows</h1>
      <p class="docs-lead">
        Master/detail pattern — expand any row to reveal a custom Angular template below it.
        Use this for row-level drilldown, forms, or nested content.
      </p>

      <h2>Setup</h2>
      <app-code-block lang="typescript" [code]="setupSnippet" />

      <h2>Options</h2>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>enableExpandable</code></td><td><code>boolean</code></td><td>false</td><td>Enable expandable rows</td></tr>
          <tr><td><code>expandableRowHeight</code></td><td><code>number</code></td><td>150</td><td>Min height of the detail row (px)</td></tr>
          <tr><td><code>expandableRowTemplate</code></td><td><code>TemplateRef</code></td><td>—</td><td>Angular template for the detail content</td></tr>
          <tr><td><code>expandableRowScope</code></td><td><code>Record&lt;string, unknown&gt;</code></td><td>—</td><td>Extra variables injected into template context</td></tr>
        </tbody>
      </table>

      <h2>Template Context</h2>
      <p>The template receives a <code>GridExpandableTemplateContext</code>:</p>
      <table class="docs-table">
        <thead><tr><th>Property</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>$implicit</code></td><td><code>GridRecord</code></td><td>The row data (use with <code>let-row</code>)</td></tr>
          <tr><td><code>row</code></td><td><code>GridRecord</code></td><td>Same as $implicit</td></tr>
          <tr><td><code>rowIndex</code></td><td><code>number</code></td><td>Index of the row in the current view</td></tr>
          <tr><td><code>expanded</code></td><td><code>boolean</code></td><td>Always true when the template renders</td></tr>
        </tbody>
      </table>

      <h2>API</h2>
      <table class="docs-table">
        <thead><tr><th>Method</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>gridApi.expandable.toggleRowExpansion(row)</code></td><td>Toggle a single row</td></tr>
          <tr><td><code>gridApi.expandable.expandAllRows()</code></td><td>Expand all rows</td></tr>
          <tr><td><code>gridApi.expandable.collapseAllRows()</code></td><td>Collapse all rows</td></tr>
          <tr><td><code>gridApi.expandable.toggleAllRows()</code></td><td>Toggle all rows</td></tr>
        </tbody>
      </table>

      <h2>Expandable vs Tree View</h2>
      <p>
        <strong>Expandable rows</strong> show custom template content below a data row (master/detail).
        <strong>Tree view</strong> shows child data rows that share the same column structure as parents.
        You can use both simultaneously.
      </p>

      <h2>Live Example</h2>
      <p>Click the expand toggle on any row:</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
    </section>
  `,
  styles: `
    @use '../docs-topic';
    .detail-content {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: color-mix(in srgb, var(--teal-strong, #5eead4) 8%, var(--panel-surface-strong, #1a1a2e));
      color: var(--ink-strong, #e0e0e0);
      font-weight: 600;
      line-height: 1.6;
    }
  `
})
export class DocsExpandableRowsComponent {
  private readonly detailTemplate = viewChild<TemplateRef<GridExpandableTemplateContext>>('detailTemplate');

  protected get demoOptions(): GridOptions {
    return {
      id: 'expandable-demo',
      data: createSmallDemoData(8),
      rowHeight: 46,
      enableSorting: true,
      enableFiltering: false,
      enableExpandable: true,
      expandableRowHeight: 80,
      expandableRowTemplate: this.detailTemplate() ?? undefined,
      columnDefs: [
        { name: 'name', displayName: 'Customer' },
        { name: 'company' },
        { name: 'status' },
        { name: 'revenue', type: 'number', align: 'end', formatter: (v) => `$${Number(v).toLocaleString()}` }
      ]
    };
  }

  protected readonly setupSnippet = `@Component({
  template: \`
    <ng-template #detail let-row>
      <div class="detail-panel">
        <h3>{{ row.name }}</h3>
        <p>Revenue: {{ row.revenue | currency }}</p>
      </div>
    </ng-template>

    <app-ui-grid [options]="gridOptions" />
  \`
})
export class MyComponent {
  @ViewChild('detail') detailTemplate!: TemplateRef<any>;

  gridOptions: GridOptions = {
    id: 'master-detail',
    data: this.data,
    enableExpandable: true,
    expandableRowHeight: 120,
    expandableRowTemplate: this.detailTemplate,
    columnDefs: [
      { name: 'name' },
      { name: 'revenue', type: 'number' },
    ],
  };
}`;
}
