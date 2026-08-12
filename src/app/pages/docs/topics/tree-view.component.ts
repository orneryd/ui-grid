import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createTreeDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-tree-view',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Tree View</h1>
      <p class="docs-lead">
        Display hierarchical data with collapsible parent/child rows. Tree view supports arbitrary
        nesting depth, per-node expand/collapse, and filtering that preserves parent visibility.
      </p>

      <h2>Data Shape</h2>
      <p>
        Nest child rows under a configurable property (default: <code>children</code>). The grid
        recursively walks the tree and assigns indent levels automatically.
      </p>
      <app-code-block lang="typescript" [code]="dataSnippet" />

      <h2>Options</h2>
      <table class="docs-table">
        <thead>
          <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>enableTreeView</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>Enable tree mode</td>
          </tr>
          <tr>
            <td><code>treeChildrenField</code></td>
            <td><code>string</code></td>
            <td>'children'</td>
            <td>Property name for child array</td>
          </tr>
          <tr>
            <td><code>treeIndent</code></td>
            <td><code>number</code></td>
            <td>10</td>
            <td>Pixels per indent level</td>
          </tr>
          <tr>
            <td><code>showTreeExpandNoChildren</code></td>
            <td><code>boolean</code></td>
            <td>true</td>
            <td>Show toggle for childless rows</td>
          </tr>
          <tr>
            <td><code>treeRowHeaderAlwaysVisible</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>Always show expand column</td>
          </tr>
        </tbody>
      </table>

      <h2>Tree View vs Grouping</h2>
      <p>
        <strong>Tree View</strong> displays pre-structured hierarchical data (your data has a
        <code>children</code> array). <strong>Grouping</strong> creates groups dynamically from flat
        data based on column values. They are mutually exclusive — enabling tree view disables
        grouping.
      </p>

      <h2>API</h2>
      <table class="docs-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>gridApi.treeBase.toggleRowTreeState(row)</code></td>
            <td>Toggle node expansion</td>
          </tr>
          <tr>
            <td><code>gridApi.treeBase.expandRow(row)</code></td>
            <td>Expand a node</td>
          </tr>
          <tr>
            <td><code>gridApi.treeBase.collapseRow(row)</code></td>
            <td>Collapse a node</td>
          </tr>
          <tr>
            <td><code>gridApi.treeBase.expandAllRows()</code></td>
            <td>Expand all nodes</td>
          </tr>
          <tr>
            <td><code>gridApi.treeBase.collapseAllRows()</code></td>
            <td>Collapse all nodes</td>
          </tr>
          <tr>
            <td><code>gridApi.treeBase.getRowChildren(row)</code></td>
            <td>Get child GridRow objects</td>
          </tr>
        </tbody>
      </table>

      <h2>Live Example</h2>
      <p>6 parent rows, each with 2 children. Click the arrow to expand:</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
    </section>
  `,
  styles: `
    @use '../docs-topic';
  `,
})
export class DocsTreeViewComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'tree-view-demo',
    data: createTreeDemoData(),
    rowHeight: 46,
    enableSorting: true,
    enableFiltering: true,
    enableTreeView: true,
    treeChildrenField: 'children',
    treeIndent: 16,
    showTreeExpandNoChildren: false,
    columnDefs: [
      { name: 'name', displayName: 'Name', width: 'minmax(14rem, 1.2fr)' },
      { name: 'status' },
      {
        name: 'revenue',
        type: 'number',
        align: 'end',
        formatter: (v) => `$${Number(v).toLocaleString()}`,
      },
    ],
  };

  protected readonly dataSnippet = `const treeData = [
  {
    name: 'Engineering',
    headcount: 42,
    children: [
      { name: 'Frontend', headcount: 18 },
      { name: 'Backend', headcount: 24 },
    ],
  },
  {
    name: 'Design',
    headcount: 12,
    children: [
      { name: 'Product Design', headcount: 8 },
      { name: 'Brand', headcount: 4 },
    ],
  },
];

const gridOptions: GridOptions = {
  id: 'org-tree',
  data: treeData,
  enableTreeView: true,
  treeChildrenField: 'children',
  treeIndent: 20,
  columnDefs: [
    { name: 'name' },
    { name: 'headcount', type: 'number' },
  ],
};`;
}
