import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { GridOptions, UiGridApi, UiGridComponent } from '@ornery/ui-grid';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-docs-row-edit',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Row Edit (Dirty Tracking)</h1>
      <p class="docs-lead">
        Per-row save state ported from <code>ui.grid.rowEdit</code>. Cells flip the row dirty on
        commit, a debounced timer fires <code>saveRow</code>, and consumer-supplied save promises
        resolve the row clean or move it into an error state. Row-level flags
        <code>isDirty</code> / <code>isSaving</code> / <code>isError</code> paint CSS classes that
        you can theme.
      </p>

      <h2>Live Example</h2>
      <p>
        Edit any cell. After the wait interval the row fires <code>saveRow</code>. This demo's
        handler flips alternating rows into success / error to showcase both paths.
      </p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
      <p>
        <strong>Dirty rows:</strong> {{ dirtyCount() }} ·
        <strong>Error rows:</strong> {{ errorCount() }} ·
        <button type="button" (click)="flush()">Flush all</button>
        <button type="button" (click)="retry()">Retry errored rows</button>
      </p>

      <h2>Options</h2>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>rowEditWaitInterval</code></td><td>2000 ms</td><td>Debounce window after the last edit before <code>saveRow</code> fires. <code>-1</code> disables the timer (manual flush only).</td></tr>
          <tr><td><code>rowEditMenuFlushDirtyRows</code></td><td>true</td><td>Contribute a "Save changes" entry to the grid menu (shown only when there are dirty rows)</td></tr>
          <tr><td><code>rowEditMenuCancelDirtyRows</code></td><td>true</td><td>Contribute a "Retry errored rows" entry to the grid menu (shown only when there are error rows)</td></tr>
          <tr><td><code>rowEditMenuItemOrder</code></td><td>300</td><td>Starting <code>order</code> for the row-edit menu entries</td></tr>
        </tbody>
      </table>

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method / Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>rowEdit.on.saveRow(fn)</code></td><td>Raised when the debounce timer elapses or <code>flushDirtyRows()</code> is called. Your handler must call <code>setSavePromise</code> synchronously.</td></tr>
          <tr><td><code>rowEdit.setSavePromise(entity, promise)</code></td><td>Attach the save promise. Resolve → row clean. Reject → row error.</td></tr>
          <tr><td><code>rowEdit.getDirtyRows()</code> / <code>getErrorRows()</code></td><td>Returns the current dirty / error <code>GridRow[]</code></td></tr>
          <tr><td><code>rowEdit.flushDirtyRows()</code></td><td>Fire <code>saveRow</code> for every dirty row, resolves when every save promise settles</td></tr>
          <tr><td><code>rowEdit.retryErroredRows()</code></td><td>Fire <code>saveRow</code> for every row currently in the error state</td></tr>
          <tr><td><code>rowEdit.setRowsDirty(entities)</code> / <code>setRowsClean(entities)</code></td><td>Programmatic flag flips (matches the old module for bulk imports / server-side reconciliation)</td></tr>
          <tr><td><code>rowEdit.getMenuItems()</code></td><td>Menu entries to plug into a grid menu component</td></tr>
        </tbody>
      </table>

      <h2>Styling Hooks</h2>
      <p>Every cell of a flagged row gets a CSS class applied. Override via tokens:</p>
      <table class="docs-table">
        <thead><tr><th>Class</th><th>CSS Variable</th><th>Default</th></tr></thead>
        <tbody>
          <tr><td><code>.ui-grid-row-dirty</code></td><td><code>--ui-grid-row-dirty-color</code>, <code>--ui-grid-row-dirty-bg</code></td><td>#610B38 on accent-tinted bg</td></tr>
          <tr><td><code>.ui-grid-row-saving</code></td><td><code>--ui-grid-row-saving-color</code>, <code>--ui-grid-row-saving-opacity</code></td><td>#848484 at 0.75 opacity</td></tr>
          <tr><td><code>.ui-grid-row-error</code></td><td><code>--ui-grid-row-error-color</code>, <code>--ui-grid-row-error-bg</code></td><td>#FF0000 on red-tinted bg</td></tr>
        </tbody>
      </table>

      <h2>Usage</h2>
      <app-code-block lang="typescript" [code]="usageSnippet" />
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsRowEditComponent {
  private gridApi: UiGridApi | null = null;
  protected readonly dirtyCount = signal(0);
  protected readonly errorCount = signal(0);
  private saveCount = 0;

  protected readonly demoOptions: GridOptions = {
    id: 'docs-row-edit-demo',
    rowHeight: 44,
    enableCellEdit: true,
    rowEditWaitInterval: 600,
    rowIdentity: (row) => String((row as Row).id),
    data: [
      { id: 'r1', name: 'Alpha', email: 'alpha@example.com' },
      { id: 'r2', name: 'Beta', email: 'beta@example.com' },
      { id: 'r3', name: 'Gamma', email: 'gamma@example.com' },
      { id: 'r4', name: 'Delta', email: 'delta@example.com' },
    ] satisfies Row[],
    columnDefs: [
      { name: 'name', displayName: 'Name', enableCellEdit: true },
      { name: 'email', displayName: 'Email', enableCellEdit: true },
    ],
    onRegisterApi: (api) => {
      this.gridApi = api as UiGridApi;
      // Alternating success / error so you can see both states.
      this.gridApi.rowEdit.on.saveRow((rowEntity) => {
        this.saveCount += 1;
        const fail = this.saveCount % 3 === 0;
        const savePromise = new Promise<void>((resolve, reject) =>
          setTimeout(() => (fail ? reject(new Error('simulated')) : resolve()), 500),
        );
        this.gridApi!.rowEdit.setSavePromise(rowEntity, savePromise);
        savePromise.finally(() => this.syncCounts()).catch(() => undefined);
        this.syncCounts();
      });
    },
  };

  private syncCounts(): void {
    if (!this.gridApi) return;
    this.dirtyCount.set(this.gridApi.rowEdit.getDirtyRows().length);
    this.errorCount.set(this.gridApi.rowEdit.getErrorRows().length);
  }

  protected flush(): void {
    void this.gridApi?.rowEdit.flushDirtyRows().then(() => this.syncCounts());
  }

  protected retry(): void {
    void this.gridApi?.rowEdit.retryErroredRows().then(() => this.syncCounts());
  }

  protected readonly usageSnippet = `const options: GridOptions = {
  enableCellEdit: true,
  rowEditWaitInterval: 2000,     // ms to wait after last edit before saveRow fires
  onRegisterApi: (api) => {
    api.rowEdit.on.saveRow((rowEntity) => {
      const savePromise = fetch('/api/rows/' + rowEntity.id, {
        method: 'PUT',
        body: JSON.stringify(rowEntity),
      }).then((r) => r.ok ? undefined : Promise.reject(r));
      api.rowEdit.setSavePromise(rowEntity, savePromise);
    });
  },
};

// Manual flush (bypass the debounce):
await gridApi.rowEdit.flushDirtyRows();

// Retry the rows that errored:
await gridApi.rowEdit.retryErroredRows();
`;
}
