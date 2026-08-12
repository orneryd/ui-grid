import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-docs-api-reference',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>API Reference</h1>
      <p class="docs-lead">
        Complete reference for <code>GridOptions</code>, <code>GridColumnDef</code>, and the
        <code>UiGridApi</code> runtime surface.
      </p>

      <h2>GridOptions</h2>
      <table class="docs-table docs-table-compact">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>id</code></td>
            <td><code>string</code></td>
            <td>required</td>
            <td>Unique grid identifier</td>
          </tr>
          <tr>
            <td><code>data</code></td>
            <td><code>GridRecord[]</code></td>
            <td>required</td>
            <td>Row data array</td>
          </tr>
          <tr>
            <td><code>columnDefs</code></td>
            <td><code>GridColumnDef[]</code></td>
            <td>required</td>
            <td>Column definitions</td>
          </tr>
          <tr>
            <td><code>title</code></td>
            <td><code>string</code></td>
            <td>—</td>
            <td>Grid heading text</td>
          </tr>
          <tr>
            <td><code>rowHeight</code></td>
            <td><code>number</code></td>
            <td>44</td>
            <td>Row height in pixels</td>
          </tr>
          <tr>
            <td><code>emptyMessage</code></td>
            <td><code>string</code></td>
            <td>—</td>
            <td>Message when no rows match</td>
          </tr>
          <tr>
            <td><code>enableSorting</code></td>
            <td><code>boolean</code></td>
            <td>true</td>
            <td>Enable column sorting</td>
          </tr>
          <tr>
            <td><code>enableFiltering</code></td>
            <td><code>boolean</code></td>
            <td>true</td>
            <td>Enable filter row</td>
          </tr>
          <tr>
            <td><code>enableGrouping</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>Enable row grouping</td>
          </tr>
          <tr>
            <td><code>enableColumnMoving</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>Enable drag-and-drop column reorder</td>
          </tr>
          <tr>
            <td><code>enableVirtualization</code></td>
            <td><code>boolean</code></td>
            <td>auto</td>
            <td>virtual scroll (auto at 40+ rows)</td>
          </tr>
          <tr>
            <td><code>virtualizationThreshold</code></td>
            <td><code>number</code></td>
            <td>40</td>
            <td>Row count that triggers virtualization</td>
          </tr>
          <tr>
            <td><code>enablePagination</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>Enable pagination</td>
          </tr>
          <tr>
            <td><code>paginationPageSize</code></td>
            <td><code>number</code></td>
            <td>—</td>
            <td>Rows per page</td>
          </tr>
          <tr>
            <td><code>paginationPageSizes</code></td>
            <td><code>number[]</code></td>
            <td>—</td>
            <td>Page size selector options</td>
          </tr>
          <tr>
            <td><code>enableExpandable</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>Enable expandable detail rows</td>
          </tr>
          <tr>
            <td><code>expandableRowHeight</code></td>
            <td><code>number</code></td>
            <td>150</td>
            <td>Detail row height</td>
          </tr>
          <tr>
            <td><code>expandableRowTemplate</code></td>
            <td><code>TemplateRef</code></td>
            <td>—</td>
            <td>Angular template for detail content</td>
          </tr>
          <tr>
            <td><code>enableTreeView</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>Enable hierarchical tree display</td>
          </tr>
          <tr>
            <td><code>treeChildrenField</code></td>
            <td><code>string</code></td>
            <td>'children'</td>
            <td>Property name for child rows</td>
          </tr>
          <tr>
            <td><code>treeIndent</code></td>
            <td><code>number</code></td>
            <td>10</td>
            <td>Pixels per tree indent level</td>
          </tr>
          <tr>
            <td><code>enableCellEdit</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>Enable inline cell editing</td>
          </tr>
          <tr>
            <td><code>enableCellEditOnFocus</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>Enter edit mode on cell focus</td>
          </tr>
          <tr>
            <td><code>enableAutoResize</code></td>
            <td><code>boolean</code></td>
            <td>false</td>
            <td>ResizeObserver-driven viewport height</td>
          </tr>
          <tr>
            <td><code>labels</code></td>
            <td><code>Partial&lt;GridLabels&gt;</code></td>
            <td>en-US</td>
            <td>i18n string overrides</td>
          </tr>
          <tr>
            <td><code>rowIdentity</code></td>
            <td><code>(row, i) => string</code></td>
            <td>—</td>
            <td>Custom row ID function</td>
          </tr>
          <tr>
            <td><code>onRegisterApi</code></td>
            <td><code>(api) => void</code></td>
            <td>—</td>
            <td>Callback to receive the UiGridApi instance</td>
          </tr>
        </tbody>
      </table>

      <h2>GridColumnDef</h2>
      <table class="docs-table docs-table-compact">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>name</code></td>
            <td><code>string</code></td>
            <td>Column identifier (also the default data key)</td>
          </tr>
          <tr>
            <td><code>displayName</code></td>
            <td><code>string</code></td>
            <td>Header label (auto-titleized from name if absent)</td>
          </tr>
          <tr>
            <td><code>field</code></td>
            <td><code>string</code></td>
            <td>Dot-path into data (e.g. <code>'address.city'</code>)</td>
          </tr>
          <tr>
            <td><code>type</code></td>
            <td><code>'string' | 'number' | 'boolean' | 'date' | 'object'</code></td>
            <td>Data type hint for sorting and editing</td>
          </tr>
          <tr>
            <td><code>width</code></td>
            <td><code>string</code></td>
            <td>
              CSS grid track value (e.g. <code>'200px'</code>, <code>'minmax(10rem, 1fr)'</code>)
            </td>
          </tr>
          <tr>
            <td><code>align</code></td>
            <td><code>'start' | 'center' | 'end'</code></td>
            <td>Cell text alignment</td>
          </tr>
          <tr>
            <td><code>visible</code></td>
            <td><code>boolean</code></td>
            <td>Hide column when false</td>
          </tr>
          <tr>
            <td><code>sortable</code></td>
            <td><code>boolean</code></td>
            <td>Column-level sort override</td>
          </tr>
          <tr>
            <td><code>filterable</code></td>
            <td><code>boolean</code></td>
            <td>Column-level filter override</td>
          </tr>
          <tr>
            <td><code>enableCellEdit</code></td>
            <td><code>boolean</code></td>
            <td>Column-level edit override</td>
          </tr>
          <tr>
            <td><code>enableGrouping</code></td>
            <td><code>boolean</code></td>
            <td>Allow grouping by this column</td>
          </tr>
          <tr>
            <td><code>formatter</code></td>
            <td><code>(value, row) => string</code></td>
            <td>Display value formatter</td>
          </tr>
          <tr>
            <td><code>valueGetter</code></td>
            <td><code>(row) => unknown</code></td>
            <td>Custom value extractor</td>
          </tr>
          <tr>
            <td><code>cellTemplate</code></td>
            <td><code>TemplateRef</code></td>
            <td>Angular template for cell content</td>
          </tr>
          <tr>
            <td><code>cellRenderer</code></td>
            <td><code>(ctx) => string</code></td>
            <td>HTML string cell renderer</td>
          </tr>
          <tr>
            <td><code>sortingAlgorithm</code></td>
            <td><code>(a, b) => number</code></td>
            <td>Custom sort comparator</td>
          </tr>
          <tr>
            <td><code>filter</code></td>
            <td><code>GridFilterDescriptor</code></td>
            <td>Default filter config (condition, term, flags)</td>
          </tr>
          <tr>
            <td><code>editModelField</code></td>
            <td><code>string</code></td>
            <td>Dot-path for writing edited values</td>
          </tr>
          <tr>
            <td><code>cellEditableCondition</code></td>
            <td><code>boolean | (ctx) => boolean</code></td>
            <td>Conditional edit guard</td>
          </tr>
        </tbody>
      </table>

      <h2>UiGridApi</h2>
      <p>Access the API via <code>onRegisterApi</code>. The API is organized into namespaces:</p>

      <h3>core</h3>
      <table class="docs-table docs-table-compact">
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>refresh()</code></td>
            <td>Force a full pipeline re-run</td>
          </tr>
          <tr>
            <td><code>getVisibleRows()</code></td>
            <td>Get currently visible GridRow objects</td>
          </tr>
          <tr>
            <td><code>sortColumn(name, dir?)</code></td>
            <td>Programmatic sort</td>
          </tr>
          <tr>
            <td><code>setFilter(name, value)</code></td>
            <td>Set a column filter</td>
          </tr>
          <tr>
            <td><code>clearAllFilters()</code></td>
            <td>Clear all active filters</td>
          </tr>
          <tr>
            <td><code>groupByColumn(name)</code></td>
            <td>Add a column to grouping</td>
          </tr>
          <tr>
            <td><code>clearGrouping()</code></td>
            <td>Remove all grouping</td>
          </tr>
          <tr>
            <td><code>moveColumn(from, to)</code></td>
            <td>Reorder columns by index</td>
          </tr>
          <tr>
            <td><code>exportCsv()</code></td>
            <td>Download visible rows as CSV</td>
          </tr>
          <tr>
            <td><code>benchmark(n?)</code></td>
            <td>Run render benchmark</td>
          </tr>
          <tr>
            <td><code>setRowInvisible(row, reason?)</code></td>
            <td>Hide a row programmatically</td>
          </tr>
          <tr>
            <td><code>clearRowInvisible(row, reason?)</code></td>
            <td>Un-hide a row</td>
          </tr>
        </tbody>
      </table>

      <h3>core.on (Events)</h3>
      <table class="docs-table docs-table-compact">
        <thead>
          <tr>
            <th>Event</th>
            <th>Callback Signature</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>renderingComplete</code></td>
            <td><code>(api) => void</code></td>
          </tr>
          <tr>
            <td><code>sortChanged</code></td>
            <td><code>(columnName, direction) => void</code></td>
          </tr>
          <tr>
            <td><code>filterChanged</code></td>
            <td><code>(filters) => void</code></td>
          </tr>
          <tr>
            <td><code>groupingChanged</code></td>
            <td><code>(groupBy) => void</code></td>
          </tr>
          <tr>
            <td><code>columnOrderChanged</code></td>
            <td><code>(order) => void</code></td>
          </tr>
          <tr>
            <td><code>rowsVisibleChanged</code></td>
            <td><code>(rows) => void</code></td>
          </tr>
          <tr>
            <td><code>scrollBegin / scrollEnd</code></td>
            <td><code>() => void</code></td>
          </tr>
        </tbody>
      </table>

      <h3>pagination</h3>
      <table class="docs-table docs-table-compact">
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>nextPage() / previousPage()</code></td>
            <td>Navigate pages</td>
          </tr>
          <tr>
            <td><code>seek(page)</code></td>
            <td>Jump to a specific page</td>
          </tr>
          <tr>
            <td><code>setPageSize(n)</code></td>
            <td>Change rows per page</td>
          </tr>
          <tr>
            <td><code>getPage() / getTotalPages()</code></td>
            <td>Current page info</td>
          </tr>
        </tbody>
      </table>

      <h3>expandable</h3>
      <table class="docs-table docs-table-compact">
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>toggleRowExpansion(row)</code></td>
            <td>Toggle a single row</td>
          </tr>
          <tr>
            <td><code>expandAllRows() / collapseAllRows()</code></td>
            <td>Bulk expand/collapse</td>
          </tr>
        </tbody>
      </table>

      <h3>treeBase</h3>
      <table class="docs-table docs-table-compact">
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>toggleRowTreeState(row)</code></td>
            <td>Toggle tree node expansion</td>
          </tr>
          <tr>
            <td><code>expandRow(row) / collapseRow(row)</code></td>
            <td>Explicit expand/collapse</td>
          </tr>
          <tr>
            <td><code>expandAllRows() / collapseAllRows()</code></td>
            <td>Bulk operations</td>
          </tr>
          <tr>
            <td><code>getRowChildren(row)</code></td>
            <td>Get child GridRow objects</td>
          </tr>
        </tbody>
      </table>

      <h3>edit</h3>
      <table class="docs-table docs-table-compact">
        <thead>
          <tr>
            <th>Method / Event</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>beginCellEdit(row, col, event?)</code></td>
            <td>Start editing a cell</td>
          </tr>
          <tr>
            <td><code>endCellEdit() / cancelCellEdit()</code></td>
            <td>Commit or cancel</td>
          </tr>
          <tr>
            <td><code>on.afterCellEdit</code></td>
            <td><code>(row, col, newVal, oldVal) => void</code></td>
          </tr>
        </tbody>
      </table>

      <h3>saveState</h3>
      <table class="docs-table docs-table-compact">
        <thead>
          <tr>
            <th>Method</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>save()</code></td>
            <td>Returns a serializable <code>GridSavedState</code></td>
          </tr>
          <tr>
            <td><code>restore(state)</code></td>
            <td>Applies a previously saved state</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: `
    @use '../docs-topic';
  `,
})
export class DocsApiReferenceComponent {}
