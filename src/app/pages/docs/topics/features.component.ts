import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-features',
  imports: [UiGridComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Features</h1>
      <p class="docs-lead">
        Every feature is included free and open source. No enterprise tier, no license keys.
        Features can be individually tree-shaken at build time via compile-time feature flags.
      </p>

      <h2>Feature Overview</h2>
      <table class="docs-table">
        <thead><tr><th>Feature</th><th>Option Flag</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>Sorting</td><td><code>enableSorting</code></td><td>true</td><td>Click column headers to cycle asc / desc / none</td></tr>
          <tr><td>Filtering</td><td><code>enableFiltering</code></td><td>true</td><td>Per-column filter inputs with configurable conditions (contains, exact, greaterThan, regex, custom)</td></tr>
          <tr><td>Row Grouping</td><td><code>enableGrouping</code></td><td>false</td><td>Nested multi-column grouping with collapsible group headers</td></tr>
          <tr><td>Tree View</td><td><code>enableTreeView</code></td><td>false</td><td>Hierarchical data with expand/collapse per node</td></tr>
          <tr><td>Expandable Rows</td><td><code>enableExpandable</code></td><td>false</td><td>Master/detail pattern with custom templates (Angular ng-template, React render prop, vanilla slot)</td></tr>
          <tr><td>Cell Editing</td><td><code>enableCellEdit</code></td><td>false</td><td>Inline spreadsheet-style editing with keyboard navigation</td></tr>
          <tr><td>Row Selection</td><td><code>enableRowSelection</code></td><td>false</td><td>Single / multi selection with click, shift+click, ctrl+click, drag-paint, row-header checkbox column, Space / Ctrl+A keyboard shortcuts. <a routerLink="/docs/selection">docs</a></td></tr>
          <tr><td>Row Edit (dirty tracking)</td><td><code>rowEditWaitInterval</code></td><td>—</td><td>Per-row <code>isDirty</code>/<code>isSaving</code>/<code>isError</code> flags, debounced <code>saveRow</code> event, <code>flushDirtyRows()</code>, <code>setRowsDirty()</code>/<code>setRowsClean()</code>. <a routerLink="/docs/row-edit">docs</a></td></tr>
          <tr><td>Cell Validation</td><td><code>colDef.validators</code></td><td>—</td><td>Built-in <code>required</code>/<code>minLength</code>/<code>maxLength</code>, register custom validators, async validators supported, invalid-cell marker + tooltip. <a routerLink="/docs/validate">docs</a></td></tr>
          <tr><td>Pagination</td><td><code>enablePagination</code></td><td>false</td><td>Client-side or external pagination with configurable page sizes</td></tr>
          <tr><td>Infinite Scroll</td><td><code>enableInfiniteScroll</code></td><td>false</td><td>Bi-directional infinite scroll with <code>needLoadMoreData</code> / <code>needLoadMoreDataTop</code> events, <code>dataLoaded()</code> / <code>resetScroll()</code> API</td></tr>
          <tr><td>Column Moving</td><td><code>enableColumnMoving</code></td><td>false</td><td>Drag-and-drop column reordering with drop-zone highlighting across all three wrappers</td></tr>
          <tr><td>Column Pinning</td><td><code>enablePinning</code></td><td>false</td><td>Freeze columns left/right with pin menu, sticky header/body sync across pinned columns</td></tr>
          <tr><td>Column Resizing</td><td><code>enableColumnResizing</code></td><td>false</td><td>Drag handle + double-click auto-fit</td></tr>
          <tr><td>CSV Export</td><td><code>gridApi.exporter.csvExport()</code></td><td>—</td><td>Full CSV option matrix (separator, filename, field callback, suppress columns, BOM, …) with formula-injection protection. <a routerLink="/docs/exporter">docs</a></td></tr>
          <tr><td>PDF Export</td><td><code>gridApi.exporter.pdfExport()</code></td><td>—</td><td>pdfMake-ready doc definition; auto-invokes <code>window.pdfMake</code> when present</td></tr>
          <tr><td>Excel Export</td><td><code>gridApi.exporter.excelExport()</code></td><td>—</td><td>ExcelBuilder-compatible sheet data; native numeric / boolean types preserved</td></tr>
          <tr><td>Importer</td><td><code>enableImporter</code></td><td>false</td><td>File picker + CSV / JSON parsers, column header matching, integration with Row Edit. <a routerLink="/docs/importer">docs</a></td></tr>
          <tr><td>Virtual Scrolling</td><td><code>enableVirtualization</code></td><td>auto</td><td>virtual scroll viewport, auto-enabled at 40+ rows</td></tr>
          <tr><td>Save / Restore State</td><td><code>gridApi.saveState</code></td><td>—</td><td>Serialize and restore sort, filter, grouping, pagination, expansion, selection, focus, scroll (per-field opt-in)</td></tr>
          <tr><td>Cell Navigation</td><td><code>gridApi.cellNav</code></td><td>auto</td><td>Arrow / Tab / Home / End navigation, <code>keyDownOverrides</code>, <code>scrollToFocus()</code></td></tr>
          <tr><td>Auto Resize</td><td><code>enableAutoResize</code></td><td>false</td><td>ResizeObserver-driven viewport height recalculation</td></tr>
          <tr><td>Custom Templates</td><td><code>cellTemplate</code></td><td>—</td><td>Angular ng-template, React render prop, or web-component <code>&lt;template&gt;</code> slot for fully custom cell rendering</td></tr>
          <tr><td>Shadow DOM</td><td>always</td><td>—</td><td>Encapsulated styles with CSS custom property and <code>::part()</code> hooks</td></tr>
          <tr><td>Web Component</td><td><code>&#64;ornery/ui-grid-vanilla</code></td><td>—</td><td>Framework-free <code>&lt;ui-grid-element&gt;</code> custom element — Angular and React wrappers mount this internally</td></tr>
          <tr><td>SSR Support</td><td>automatic</td><td>—</td><td>Server-side rendering with platform-safe guards</td></tr>
          <tr><td>i18n</td><td><code>gridApi.i18n</code></td><td>en-US</td><td>Bundled locales (en, es, fr, de, ja, zh-CN), <code>setCurrentLang()</code>, register custom locales, <code>languageChanged</code> event</td></tr>
        </tbody>
      </table>

      <h2>Live Example</h2>
      <p>This grid has sorting, filtering, and grouping enabled simultaneously:</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>

      <h2>Compile-Time Feature Flags</h2>
      <p>
        When you build a custom bundle with <code>node scripts/build-grid.mjs --features sorting,filtering</code>,
        disabled features are set to <code>false</code> constants. The bundler tree-shakes all guarded code paths,
        producing a smaller output. See <a href="#/docs/custom-builds">Custom Builds</a> for details.
      </p>
    </section>
  `,
  styles: `@use '../docs-topic';`
})
export class DocsFeaturesComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'features-demo',
    data: createSmallDemoData(8),
    rowHeight: 48,
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: true,
    grouping: { groupBy: ['status'] },
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'company' },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end', formatter: (v) => `$${Number(v).toLocaleString()}` }
    ]
  };
}

