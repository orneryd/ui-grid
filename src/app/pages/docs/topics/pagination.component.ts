import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GridOptions, UiGridApi, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-pagination',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Pagination</h1>
      <p class="docs-lead">
        Client-side or external pagination with configurable page sizes. The grid fires
        <code>paginationChanged</code> whenever the current page or page size changes — use it to
        drive server-side fetches or sync to a URL.
      </p>

      <h2>Live Example</h2>
      <p>Use the pager to navigate. Change the page size dropdown to adjust the window.</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
      <p>
        Page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages() }}</strong> ·
        <button type="button" (click)="jumpTo(1)">First</button>
        <button type="button" (click)="jumpTo(totalPages())">Last</button>
      </p>

      <h2>Options</h2>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>enablePagination</code></td><td>false</td><td>Master toggle. When false the grid renders every visible row.</td></tr>
          <tr><td><code>enablePaginationControls</code></td><td>true</td><td>Render the pager footer. Set false when you're rendering your own controls via <code>gridApi.pagination</code>.</td></tr>
          <tr><td><code>paginationCurrentPage</code></td><td>1</td><td>Starting page (1-indexed)</td></tr>
          <tr><td><code>paginationPageSize</code></td><td>first entry of <code>paginationPageSizes</code></td><td>Initial page size</td></tr>
          <tr><td><code>paginationPageSizes</code></td><td><code>[25, 50, 100, 250]</code> (when pagination enabled)</td><td>Page-size dropdown options. An empty array hides the selector.</td></tr>
          <tr><td><code>useExternalPagination</code></td><td>false</td><td>Skip the built-in slice — the grid renders <code>data</code> as-is and leaves page bounds to the consumer</td></tr>
          <tr><td><code>totalItems</code></td><td><code>data.length</code></td><td>External pagination override — drives page-count math when <code>useExternalPagination</code> is true</td></tr>
        </tbody>
      </table>

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method / Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>pagination.getPage()</code></td><td>Current page (1-indexed)</td></tr>
          <tr><td><code>pagination.getTotalPages()</code></td><td>Ceiling of <code>totalItems / pageSize</code></td></tr>
          <tr><td><code>pagination.getFirstRowIndex()</code> / <code>getLastRowIndex()</code></td><td>0-based indices for the current page window</td></tr>
          <tr><td><code>pagination.nextPage()</code> / <code>previousPage()</code></td><td>Increment / decrement by 1 (clamped)</td></tr>
          <tr><td><code>pagination.seek(page)</code></td><td>Jump to <code>page</code> (1-indexed, clamped)</td></tr>
          <tr><td><code>pagination.setPageSize(pageSize)</code></td><td>Change the window size. Current page is clamped.</td></tr>
          <tr><td><code>pagination.on.paginationChanged(fn)</code></td><td>Fires with <code>(currentPage, pageSize)</code> on any change</td></tr>
        </tbody>
      </table>

      <h2>External (Server-Side) Pagination</h2>
      <p>
        Set <code>useExternalPagination: true</code> and supply <code>totalItems</code>. The grid
        skips its built-in slice and trusts <code>data</code> to contain the current page already;
        subscribe to <code>paginationChanged</code> to drive fetches.
      </p>
      <app-code-block lang="typescript" [code]="externalSnippet" />

      <h2>Client-Side Pagination</h2>
      <app-code-block lang="typescript" [code]="clientSnippet" />
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsPaginationComponent {
  private gridApi: UiGridApi | null = null;
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);

  protected readonly demoOptions: GridOptions = {
    id: 'docs-pagination-demo',
    data: createSmallDemoData(24),
    rowHeight: 44,
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    paginationPageSize: 5,
    paginationPageSizes: [5, 10, 25],
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'company' },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end' },
    ],
    onRegisterApi: (api) => {
      this.gridApi = api as UiGridApi;
      this.syncPageState();
      this.gridApi.pagination.on.paginationChanged(() => this.syncPageState());
    },
  };

  private syncPageState(): void {
    if (!this.gridApi) return;
    this.currentPage.set(this.gridApi.pagination.getPage());
    this.totalPages.set(this.gridApi.pagination.getTotalPages());
  }

  protected jumpTo(page: number): void {
    this.gridApi?.pagination.seek(page);
  }

  protected readonly clientSnippet = `const options: GridOptions = {
  data: allCustomers,                       // every row lives in memory
  enablePagination: true,
  paginationPageSize: 25,
  paginationPageSizes: [25, 50, 100, 250],
};`;

  protected readonly externalSnippet = `const options: GridOptions = {
  useExternalPagination: true,
  totalItems: 12_345,                       // server-reported total
  paginationPageSize: 50,
  paginationPageSizes: [50, 100, 250],
  data: [],                                 // will be replaced per page
  onRegisterApi: (api) => {
    api.pagination.on.paginationChanged(async (page, size) => {
      const response = await fetch(\`/api/customers?page=\${page}&size=\${size}\`);
      const payload = await response.json();
      options.data = payload.rows;
      options.totalItems = payload.totalCount;
      api.core.refresh();
    });
  },
};`;
}
