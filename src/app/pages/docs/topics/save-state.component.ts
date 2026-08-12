import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GridOptions, UiGridApi, UiGridComponent, GridSavedState } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-save-state',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Save &amp; Restore State</h1>
      <p class="docs-lead">
        Serialize the current grid state to a plain JSON object and restore it later — sort,
        filters, grouping + collapsed groups, pinning, column order, pagination, selection, focused
        cell, tree / expandable expansion, and scroll position are all covered. Every field is
        opt-in via a <code>save*</code> flag so you can ship a minimal payload.
      </p>

      <h2>Live Example</h2>
      <p>
        Sort a column, filter, and pin something — then click <strong>Save</strong>. Change a few
        things and click <strong>Restore</strong> to reset to the snapshot.
      </p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
      <p>
        <button type="button" (click)="save()">Save</button>
        <button type="button" (click)="restore()" [disabled]="!saved()">Restore</button>
        <button type="button" (click)="clear()">Clear snapshot</button>
        &nbsp; Snapshot: <strong>{{ saved() ? 'captured' : 'none' }}</strong>
      </p>

      <h2>Options (per-field opt-in)</h2>
      <p>Each <code>save*</code> flag controls whether its field is included in the saved payload.</p>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Default</th><th>Field</th></tr></thead>
        <tbody>
          <tr><td><code>saveWidths</code></td><td>true</td><td>(future — currently always included via <code>columnOrder</code>)</td></tr>
          <tr><td><code>saveOrder</code></td><td>true</td><td><code>columnOrder: string[]</code></td></tr>
          <tr><td><code>saveSort</code></td><td>true</td><td><code>sort: SortState</code></td></tr>
          <tr><td><code>saveFilter</code></td><td>true</td><td><code>filters: Record&lt;string, string&gt;</code></td></tr>
          <tr><td><code>saveGrouping</code></td><td>true</td><td><code>grouping: string[]</code></td></tr>
          <tr><td><code>saveGroupingExpandedStates</code></td><td>false</td><td>Collapsed-group map included in <code>grouping</code></td></tr>
          <tr><td><code>savePinning</code></td><td>true</td><td><code>pinning: Record&lt;string, 'left' | 'right'&gt;</code></td></tr>
          <tr><td><code>saveSelection</code></td><td>true</td><td>Selected row IDs</td></tr>
          <tr><td><code>saveTreeView</code></td><td>true</td><td><code>treeView: Record&lt;string, boolean&gt;</code> — expanded tree nodes</td></tr>
          <tr><td><code>savePagination</code></td><td>true</td><td><code>pagination: &#123; paginationCurrentPage, paginationPageSize &#125;</code></td></tr>
          <tr><td><code>saveVisible</code></td><td>true</td><td>Column visibility</td></tr>
          <tr><td><code>saveFocus</code></td><td>true (implicitly false when <code>saveScroll</code> is true)</td><td>Focused cell</td></tr>
          <tr><td><code>saveScroll</code></td><td>false</td><td>Scroll percentage — disables <code>saveFocus</code> to avoid fighting</td></tr>
        </tbody>
      </table>

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>saveState.save()</code></td><td>Returns a <code>GridSavedState</code> object — a plain-JSON bundle of every opted-in field</td></tr>
          <tr><td><code>saveState.restore(state)</code></td><td>Applies the bundle back onto the grid in a single pass (no flicker between fields)</td></tr>
        </tbody>
      </table>

      <h2>Payload Shape</h2>
      <p>Every field is optional; only the ones enabled by <code>save*</code> flags are present.</p>
      <app-code-block lang="typescript" [code]="shapeSnippet" />

      <h2>Usage</h2>
      <app-code-block lang="typescript" [code]="usageSnippet" />
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsSaveStateComponent {
  private gridApi: UiGridApi | null = null;
  protected readonly saved = signal<GridSavedState | null>(null);

  protected readonly demoOptions: GridOptions = {
    id: 'docs-save-state-demo',
    data: createSmallDemoData(12),
    rowHeight: 44,
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: true,
    enablePinning: true,
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'company' },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end' },
    ],
    onRegisterApi: (api) => {
      this.gridApi = api as UiGridApi;
    },
  };

  protected save(): void {
    if (!this.gridApi) return;
    this.saved.set(this.gridApi.saveState.save());
  }

  protected restore(): void {
    const snapshot = this.saved();
    if (!this.gridApi || !snapshot) return;
    this.gridApi.saveState.restore(snapshot);
  }

  protected clear(): void {
    this.saved.set(null);
  }

  protected readonly shapeSnippet = `interface GridSavedState {
  columnOrder?: string[];
  filters?: Record<string, string>;
  sort?: { columnName: string | null; direction: 'asc' | 'desc' | 'none' };
  grouping?: string[];
  pagination?: { paginationCurrentPage: number; paginationPageSize: number };
  expandable?: Record<string, boolean>;
  treeView?: Record<string, boolean>;
  pinning?: Record<string, 'left' | 'right'>;
}`;

  protected readonly usageSnippet = `const options: GridOptions = {
  // Opt out of fields you don't want persisted:
  saveSelection: false,
  saveGroupingExpandedStates: true,     // include the collapsed-group map
  saveScroll: true,                     // remember scroll position on restore

  onRegisterApi: (api) => {
    // Persist on unload, restore on load:
    const storageKey = 'my-grid-state';

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      api.saveState.restore(JSON.parse(saved));
    }

    window.addEventListener('beforeunload', () => {
      localStorage.setItem(storageKey, JSON.stringify(api.saveState.save()));
    });
  },
};`;
}
