import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-getting-started',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Getting Started</h1>
      <p class="docs-lead">
        Get up and running with <code>&#64;ornery/ui-grid</code> in under five minutes.
        The grid ships as a standalone Angular component — no module imports required.
      </p>

      <h2>Install</h2>
      <app-code-block lang="bash" [code]="installSnippet" />

      <h2>Minimal Setup</h2>
      <p>Import <code>UiGridComponent</code> and pass a <code>GridOptions</code> object:</p>
      <app-code-block lang="typescript" [code]="minimalSnippet" />

      <h3>Required GridOptions fields</h3>
      <table class="docs-table">
        <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>id</code></td><td><code>string</code></td><td>Unique grid identifier (used for CSV filenames and row IDs)</td></tr>
          <tr><td><code>data</code></td><td><code>readonly GridRecord[]</code></td><td>Array of row objects</td></tr>
          <tr><td><code>columnDefs</code></td><td><code>readonly GridColumnDef[]</code></td><td>Column definitions — at minimum, each needs a <code>name</code></td></tr>
        </tbody>
      </table>

      <h2>Live Example</h2>
      <p>A minimal grid with 5 rows, sorting enabled (the default):</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>

      <h2>Web Component (Vanilla)</h2>
      <p>
        The grid also ships as a framework-free custom element via
        <code>&#64;ornery/ui-grid-vanilla</code>. Use it in any HTML page:
      </p>
      <app-code-block lang="html" [code]="elementSnippet" />

      <h2>Next Steps</h2>
      <ul>
        <li><a href="#/docs/features">Features overview</a> — see everything the grid can do</li>
        <li><a href="#/docs/theming">Theming</a> — customize colors and layout via CSS custom properties</li>
        <li><a href="#/docs/api-reference">API Reference</a> — full GridOptions, GridColumnDef, and UiGridApi documentation</li>
      </ul>
    </section>
  `,
  styles: `@use '../docs-topic';`
})
export class DocsGettingStartedComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'getting-started-demo',
    data: createSmallDemoData(5),
    rowHeight: 48,
    enableSorting: true,
    enableFiltering: false,
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'company' },
      { name: 'revenue', type: 'number', align: 'end', formatter: (v) => `$${Number(v).toLocaleString()}` }
    ]
  };

  protected readonly installSnippet = `npm install @ornery/ui-grid`;

  protected readonly minimalSnippet = `import { Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';

@Component({
  selector: 'app-my-grid',
  imports: [UiGridComponent],
  template: \`<app-ui-grid [options]="gridOptions" />\`
})
export class MyGridComponent {
  gridOptions: GridOptions = {
    id: 'my-grid',
    data: [
      { name: 'Alice', role: 'Engineer' },
      { name: 'Bob', role: 'Designer' },
    ],
    columnDefs: [
      { name: 'name' },
      { name: 'role' },
    ],
  };
}`;

  protected readonly elementSnippet = `<script type="module">
  import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';
  await defineStandaloneUiGridElement();
</script>

<ui-grid-element
  id="my-grid"
  grid-id="element-demo"
  enable-sorting
  column-defs='[{"name":"name"},{"name":"role"}]'
  data='[{"name":"Alice","role":"Engineer"},{"name":"Bob","role":"Designer"}]'>
</ui-grid-element>`;
}
