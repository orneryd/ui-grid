import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-i18n',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Internationalization</h1>
      <p class="docs-lead">
        Override any UI string at runtime via the <code>labels</code> option, or bake in a
        complete locale file at build time.
      </p>

      <h2>Default Labels (en-US)</h2>
      <table class="docs-table docs-table-compact">
        <thead><tr><th>Key</th><th>Default Value</th></tr></thead>
        <tbody>
          <tr><td><code>sortDefault</code></td><td>Sort</td></tr>
          <tr><td><code>sortAsc</code></td><td>Sort ascending</td></tr>
          <tr><td><code>sortDesc</code></td><td>Sort descending</td></tr>
          <tr><td><code>groupColumn</code></td><td>Group by this column</td></tr>
          <tr><td><code>ungroupColumn</code></td><td>Ungroup this column</td></tr>
          <tr><td><code>groupCollapse</code></td><td>Collapse group</td></tr>
          <tr><td><code>groupExpand</code></td><td>Expand group</td></tr>
          <tr><td><code>treeCollapse</code></td><td>Collapse</td></tr>
          <tr><td><code>treeExpand</code></td><td>Expand</td></tr>
          <tr><td><code>expandDetail</code></td><td>Expand row</td></tr>
          <tr><td><code>collapseDetail</code></td><td>Collapse row</td></tr>
          <tr><td><code>filterPlaceholder</code></td><td>Filter...</td></tr>
          <tr><td><code>filterDisabled</code></td><td>Filter disabled</td></tr>
          <tr><td><code>filterColumn</code></td><td>Filter this column</td></tr>
          <tr><td><code>paginationPrevious</code></td><td>Previous</td></tr>
          <tr><td><code>paginationNext</code></td><td>Next</td></tr>
          <tr><td><code>paginationPage</code></td><td>Page</td></tr>
          <tr><td><code>paginationOf</code></td><td>of</td></tr>
          <tr><td><code>paginationRows</code></td><td>rows</td></tr>
          <tr><td><code>emptyHeading</code></td><td>No data</td></tr>
          <tr><td><code>emptyDescription</code></td><td>No rows to display</td></tr>
          <tr><td><code>toolbarOf</code></td><td>of</td></tr>
          <tr><td><code>toolbarRows</code></td><td>rows</td></tr>
          <tr><td><code>statsVisibleRows</code></td><td>visible rows</td></tr>
          <tr><td><code>groupRowsSuffix</code></td><td>rows</td></tr>
        </tbody>
      </table>

      <h2>Runtime Override</h2>
      <p>Pass partial overrides via <code>GridOptions.labels</code>:</p>
      <app-code-block lang="typescript" [code]="runtimeSnippet" />

      <h2>Build-Time Locale</h2>
      <p>Bake in a complete locale file at build time (replaces <code>en-US.json</code>):</p>
      <app-code-block lang="bash" [code]="buildSnippet" />

      <h2>Creating a Locale File</h2>
      <p>
        Copy <code>projects/ui-grid/src/lib/grid/i18n/en-US.json</code> and translate all 26 keys.
        The file must be valid JSON with the same key names.
      </p>

      <h2>Live Example</h2>
      <p>This grid has custom French labels for the filter placeholder and empty state:</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
    </section>
  `,
  styles: `@use '../docs-topic';`
})
export class DocsI18nComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'i18n-demo',
    data: createSmallDemoData(3),
    rowHeight: 48,
    enableSorting: true,
    enableFiltering: true,
    labels: {
      filterPlaceholder: 'Filtrer...',
      emptyHeading: 'Aucune donnée',
      emptyDescription: 'Aucune ligne à afficher',
      sortAsc: 'Tri croissant',
      sortDesc: 'Tri décroissant',
      toolbarOf: 'de',
      toolbarRows: 'lignes'
    },
    columnDefs: [
      { name: 'name', displayName: 'Nom' },
      { name: 'company', displayName: 'Entreprise' },
      { name: 'status', displayName: 'Statut' }
    ]
  };

  protected readonly runtimeSnippet = `const gridOptions: GridOptions = {
  id: 'my-grid',
  data: myData,
  columnDefs: myColumns,
  labels: {
    filterPlaceholder: 'Filtrer...',
    emptyHeading: 'Aucune donnée',
    emptyDescription: 'Aucune ligne à afficher',
    paginationPrevious: 'Précédent',
    paginationNext: 'Suivant',
  },
};`;

  protected readonly buildSnippet = `# Bake in French labels at build time
node scripts/build-grid.mjs --locale projects/ui-grid/src/lib/grid/i18n/fr-FR.json`;
}
