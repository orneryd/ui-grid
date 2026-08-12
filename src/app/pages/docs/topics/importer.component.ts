import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GridOptions, UiGridApi, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';

interface ImporterRow extends Record<string, unknown> {
  id: string;
  name: string;
  company: string;
  revenue: number;
}

@Component({
  selector: 'app-docs-importer',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Importer</h1>
      <p class="docs-lead">
        Parse JSON or CSV files and append to the grid. The grid owns a lazily-mounted hidden
        <code>&lt;input type="file"&gt;</code> for the file-picker flow
        (<code>importAFile()</code>), or accept an already-acquired <code>File</code>
        (<code>importThisFile(file)</code>) or raw text
        (<code>importText(text, 'json' | 'csv')</code>). When rowEdit is enabled, newly-imported rows
        are flipped dirty automatically so your save handler picks them up.
      </p>

      <h2>Live Example</h2>
      <p>
        Pick a JSON or CSV file with headers <code>name,company,revenue</code> — the imported rows
        get appended below and show up dirty (row-edit is enabled).
      </p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
      <p>
        <button type="button" (click)="importFile()">Import a file…</button>
        <button type="button" (click)="importCsvSample()">Import CSV sample</button>
        <button type="button" (click)="importJsonSample()">Import JSON sample</button>
      </p>
      <p>Rows imported in this session: <strong>{{ imported() }}</strong></p>

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>importer.importAFile()</code></td><td>Trigger the grid's hidden file-input and run <code>importThisFile</code> on the chosen file</td></tr>
          <tr><td><code>importer.importThisFile(file)</code></td><td>Read <code>File</code> via FileReader, sniff the MIME type (JSON vs CSV), parse, and append</td></tr>
          <tr><td><code>importer.importText(text, type?)</code></td><td>Parse an already-loaded string. <code>type</code> forces one parser; otherwise JSON is tried first, CSV is the fallback.</td></tr>
          <tr><td><code>importer.getMenuItems()</code></td><td>Grid-menu entry ("Import") that wires to <code>importAFile</code></td></tr>
        </tbody>
      </table>

      <h2>Options</h2>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>enableImporter</code></td><td>false</td><td>Master toggle — mount the hidden file input and expose the API namespace</td></tr>
          <tr><td><code>importerShowMenu</code></td><td>true</td><td>Contribute the "Import" entry to <code>getMenuItems()</code></td></tr>
          <tr><td><code>importerProcessHeaders</code></td><td>—</td><td><code>(headerRow) =&gt; (columnName | null)[]</code>. Map raw CSV headers to column names. <code>null</code> drops a column. Default matches headers against <code>displayName</code> then <code>name</code>.</td></tr>
          <tr><td><code>importerHeaderFilter</code></td><td>—</td><td><code>(displayName) =&gt; string</code> applied before matching (e.g. lowercase / trim)</td></tr>
          <tr><td><code>importerErrorCallback</code></td><td>—</td><td><code>(key, message, context) =&gt; void</code>. Keys: <code>'importer.invalidJson'</code>, <code>'importer.jsonNotarray'</code>, <code>'importer.invalidCsv'</code>, <code>'importer.noObjects'</code>, <code>'importer.noHeaders'</code>.</td></tr>
          <tr><td><code>importerDataAddCallback</code></td><td>—</td><td><code>(newObjects) =&gt; void</code>. When omitted, parsed rows are appended to <code>options.data</code>.</td></tr>
          <tr><td><code>importerNewObject</code></td><td>—</td><td>Constructor — each imported row becomes <code>Object.assign(new importerNewObject(), parsedObject)</code>. Matches the old module's prototype-preservation mode.</td></tr>
          <tr><td><code>importerObjectCallback</code></td><td>—</td><td><code>(newObject) =&gt; newObject</code>. Post-process each parsed row (e.g. coerce types, assign IDs).</td></tr>
        </tbody>
      </table>

      <h2>CSV Parsing</h2>
      <p>
        The built-in parser handles quoted values, escaped quotes, and CRLF line endings — the same
        rule set the old module used. The first row is taken as the header row; each subsequent row
        becomes an object keyed by the matched column name.
      </p>

      <h2>Row Edit Integration</h2>
      <p>
        When <code>enableCellEdit</code> + a save handler are wired up, the importer calls
        <code>rowEdit.setRowsDirty(newRows)</code> after appending — the newly imported rows hit the
        save pipeline on the next flush, matching the old <code>service.addObjects → rowEdit.setRowsDirty</code>
        handoff.
      </p>

      <h2>Error Handling + i18n</h2>
      <p>
        Errors are localized via the labels bundle. Keys live under the
        <code>importer.*</code> namespace (<code>importerInvalidJson</code>,
        <code>importerJsonNotArray</code>, <code>importerInvalidCsv</code>,
        <code>importerNoObjects</code>, <code>importerNoHeaders</code>). Pass an
        <code>importerErrorCallback</code> to surface errors in your own UI.
      </p>

      <h2>Usage</h2>
      <app-code-block lang="typescript" [code]="usageSnippet" />
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsImporterComponent {
  private gridApi: UiGridApi | null = null;
  protected readonly imported = signal(0);

  protected readonly demoOptions: GridOptions = {
    id: 'docs-importer-demo',
    rowHeight: 44,
    enableImporter: true,
    enableCellEdit: true,
    rowEditWaitInterval: -1,
    rowIdentity: (row) => String((row as ImporterRow).id),
    data: [
      { id: 'i1', name: 'Northwind', company: 'Northwind Inc', revenue: 25000 },
      { id: 'i2', name: 'Blue Harbor', company: 'Blue Harbor Ltd', revenue: 30000 },
    ] satisfies ImporterRow[],
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'company', displayName: 'Company' },
      { name: 'revenue', type: 'number', align: 'end' },
    ],
    importerObjectCallback: (object) => ({
      ...object,
      id: `i-${Math.random().toString(36).slice(2, 9)}`,
    }),
    onRegisterApi: (api) => {
      this.gridApi = api as UiGridApi;
    },
  };

  protected importFile(): void {
    this.gridApi?.importer.importAFile();
  }

  protected importCsvSample(): void {
    const csv =
      'name,company,revenue\nForge Group,Forge Group,55000\nPilot Co,Pilot Co,18000';
    const before = this.demoOptions.data.length;
    this.gridApi?.importer.importText(csv, 'csv');
    this.imported.update((count) => count + (this.demoOptions.data.length - before));
  }

  protected importJsonSample(): void {
    const json = JSON.stringify([
      { name: 'Delta Labs', company: 'Delta Labs', revenue: 42000 },
      { name: 'Echo Works', company: 'Echo Works', revenue: 60000 },
    ]);
    const before = this.demoOptions.data.length;
    this.gridApi?.importer.importText(json, 'json');
    this.imported.update((count) => count + (this.demoOptions.data.length - before));
  }

  protected readonly usageSnippet = `const options: GridOptions = {
  enableImporter: true,
  importerShowMenu: true,

  // Map incoming headers to column names:
  importerHeaderFilter: (displayName) => displayName.trim().toLowerCase(),
  importerProcessHeaders: (headers) => headers.map((header) => {
    if (header === 'customer') return 'name';
    if (header === 'revenue ($)') return 'revenue';
    return header in columnsByName ? header : null;   // null drops the column
  }),

  // Append handler — when omitted, rows are pushed to options.data:
  importerDataAddCallback: async (newObjects) => {
    const saved = await fetch('/api/rows', {
      method: 'POST',
      body: JSON.stringify(newObjects),
    }).then((r) => r.json());
    options.data = [...options.data, ...saved];
    gridApi.core.refresh();
  },

  // Surface parse errors in your own UI:
  importerErrorCallback: (key, message) => toast.error(message),
};

// Programmatic flows:
gridApi.importer.importAFile();                  // opens the hidden <input type="file">
gridApi.importer.importThisFile(dragDroppedFile); // already-acquired File
gridApi.importer.importText(csvString, 'csv');   // already-loaded text
`;
}
