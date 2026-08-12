import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block.component';

@Component({
  selector: 'app-docs-web-component',
  imports: [CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Web Component</h1>
      <p class="docs-lead">
        The grid's rendering engine is a framework-free custom element
        (<code>&lt;ui-grid-element&gt;</code>) from the
        <code>&#64;ornery/ui-grid-vanilla</code> package. Both the Angular and React wrappers are
        thin bridges that mount this same element and project framework-specific templates into it
        via a slot-based portal system.
      </p>

      <h2>Architecture</h2>
      <p>
        <code>&#64;ornery/ui-grid-vanilla</code> owns the Shadow DOM renderer, the pipeline, and the
        declarative attribute surface. The Angular wrapper (<code>&#64;ornery/ui-grid</code>) and
        the React wrapper (<code>&#64;ornery/ui-grid-react</code>) both mount
        <code>&lt;ui-grid-element&gt;</code> internally and bridge their native template systems
        (Angular <code>ng-template</code> / React render functions) into the element via the
        <code>setFrameworkRenderedSlots()</code> API.
      </p>
      <p>You can also use the vanilla element directly in any HTML page — no framework required.</p>

      <h2>Install</h2>
      <app-code-block lang="bash" [code]="installSnippet" />

      <h2>Register &amp; Use (declarative)</h2>
      <p>
        All grid options are available as HTML attributes. JSON options use kebab-case attribute
        names; boolean flags are presence-based.
      </p>
      <app-code-block lang="html" [code]="declarativeSnippet" />

      <h2>Slot Templates</h2>
      <p>
        Customise cell rendering by placing <code>&lt;template&gt;</code> children inside the
        element. Values are injected via <code>{{ '{{token}}' }}</code>
        string interpolation. Dot-path traversal (e.g.&nbsp;<code>row.account.owner</code>) works;
        function calls and operators do not.
      </p>

      <h3>Cell slots — <code>slot="cell-&#123;columnName&#125;"</code></h3>
      <table class="docs-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>value</code></td>
            <td><code>unknown</code></td>
            <td>Raw cell value as stored in the row data</td>
          </tr>
          <tr>
            <td><code>valueText</code></td>
            <td><code>string</code></td>
            <td>
              String coercion of <code>value</code> (via <code>String()</code>) — never null or
              undefined
            </td>
          </tr>
          <tr>
            <td><code>valueLower</code></td>
            <td><code>string</code></td>
            <td>Lowercase <code>valueText</code> — handy for CSS class suffixes</td>
          </tr>
          <tr>
            <td><code>row</code></td>
            <td><code>object</code></td>
            <td>
              Full row data record. Dot-path traversal: <code>row.field</code>,
              <code>row.nested.field</code>
            </td>
          </tr>
          <tr>
            <td><code>column</code></td>
            <td><code>object</code></td>
            <td>The <code>GridColumnDef</code> descriptor for this cell</td>
          </tr>
          <tr>
            <td><code>rowIndex</code></td>
            <td><code>number</code></td>
            <td>0-based visible row index</td>
          </tr>
        </tbody>
      </table>
      <app-code-block lang="html" [code]="cellSlotSnippet" />

      <h3>Expandable-row slot — <code>slot="expandable-row"</code></h3>
      <table class="docs-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>row</code></td>
            <td><code>object</code></td>
            <td>Full row data record</td>
          </tr>
          <tr>
            <td><code>expanded</code></td>
            <td><code>boolean</code></td>
            <td>Whether the row is currently expanded</td>
          </tr>
          <tr>
            <td><code>rowIndex</code></td>
            <td><code>number</code></td>
            <td>0-based visible row index</td>
          </tr>
        </tbody>
      </table>
      <app-code-block lang="html" [code]="expandableSlotSnippet" />

      <h2>Imperative Augmentation</h2>
      <p>
        Spread the public <code>options</code> getter to merge in callbacks and advanced options
        without losing the declarative data.
      </p>
      <app-code-block lang="javascript" [code]="imperativeSnippet" />

      <h2>Declarative Surface</h2>
      <p>
        Every attribute maps 1-to-1 to a <code>GridOptions</code> key. JavaScript property
        assignments always win over attribute values.
      </p>
      <app-code-block lang="html" [code]="declarativeSurfaceSnippet" />

      <h2>Events</h2>
      <app-code-block lang="javascript" [code]="eventsSnippet" />

      <h2>Performance Guidance</h2>
      <p>
        Use declarative attributes for initial mount and infrequent configuration changes. Replacing
        a large JSON <code>data</code> attribute repeatedly is more expensive than imperative row
        updates because the element must parse the new payload, merge options, and re-enter its
        declarative sync path.
      </p>
      <p>
        For streaming datasets, the most efficient sequence is: mount declaratively if you want
        HTML-first setup, then send live row changes through
        <code>grid.setData(rows)</code>. That path is specifically optimized to patch the mounted
        grid instead of treating every tick like a full reconfiguration.
      </p>

      <h2>Live Data (high-frequency feeds)</h2>
      <p>
        Use <code>setData(rows)</code> for high-frequency data swaps — it patches cells in-place
        without rebuilding the full shadow DOM.
      </p>
      <app-code-block lang="javascript" [code]="setDataSnippet" />

      <h2>Framework Wrappers</h2>
      <p>
        Both the Angular and React packages mount <code>&lt;ui-grid-element&gt;</code> and project
        framework templates into it. You never interact with the vanilla element directly when using
        a wrapper — the wrapper handles registration, options bridging, and template projection
        automatically.
      </p>

      <h3>Angular</h3>
      <p>
        The Angular wrapper (<code>&#64;ornery/ui-grid</code>) uses
        <code>ng-template</code> with typed contexts for cell and expandable-row templates.
      </p>
      <app-code-block lang="html" [code]="angularCellTemplateSnippet" />
      <app-code-block lang="typescript" [code]="angularCellTemplateOptionsSnippet" />

      <h3>React</h3>
      <p>
        The React wrapper (<code>&#64;ornery/ui-grid-react</code>) uses a
        <code>cellRenderers</code> map — each key is a column name, each value is a render function
        that receives a <code>GridCellTemplateContext</code> and returns a <code>ReactNode</code>.
      </p>
      <app-code-block lang="tsx" [code]="reactCellRendererSnippet" />

      <h2>Styling</h2>
      <app-code-block lang="css" [code]="styleSnippet" />
    </section>
  `,
  styles: `
    @use '../docs-topic';
  `,
})
export class DocsWebComponentComponent {
  protected readonly installSnippet = `npm install @ornery/ui-grid-vanilla @ornery/ui-grid-core`;

  protected readonly declarativeSnippet = `import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';
await defineStandaloneUiGridElement();

<!-- HTML -->
<ui-grid-element
  id="my-grid"
  grid-id="accounts-grid"
  title="Accounts"
  row-height="48"
  column-defs='[{"name":"name"},{"name":"status"},{"name":"revenue","type":"number"}]'
  data='[{"id":"1","name":"Alice","status":"Active","revenue":120000}]'
  enable-sorting
  enable-filtering
  enable-virtualization>
</ui-grid-element>`;

  protected readonly cellSlotSnippet = `<ui-grid-element
  id="orders-grid"
  column-defs='[{"name":"status"},{"name":"amount"}]'
  data='[...]'>

  <!-- cell-{columnName}: renders a custom cell for that column -->
  <template slot="cell-status">
    <span class="pill pill-{{valueLower}}">{{value}}</span>
  </template>

  <!-- Access nested row fields with dot-path notation -->
  <template slot="cell-amount">
    <strong title="{{row.currency}} {{valueText}}">{{valueText}}</strong>
  </template>

</ui-grid-element>`;

  protected readonly expandableSlotSnippet = `<ui-grid-element enable-expandable expandable-row-height="112" ...>

  <!-- slot="expandable-row" renders the detail panel below each expanded row -->
  <template slot="expandable-row">
    <article class="detail-card">
      <h3>{{row.name}}</h3>
      <p>Account owner: {{row.account.owner}}</p>
      <p>Row {{rowIndex}} — expanded: {{expanded}}</p>
    </article>
  </template>

</ui-grid-element>`;

  protected readonly imperativeSnippet = `const grid = document.querySelector('#my-grid');

// Spread grid.options to preserve declarative data/columnDefs
grid.options = {
  ...grid.options,
  benchmark: { iterations: 40 },
  onRegisterApi: (api) => {
    api.core.on.rowsVisibleChanged((rows) => console.log(rows.length));
  },
};`;

  protected readonly declarativeSurfaceSnippet = `<!-- Scalar attributes -->
grid-id="my-id"
title="My Grid"
row-height="48"
virtualization-threshold="25"
empty-message="No rows found."

<!-- JSON attributes -->
column-defs='[{ "name": "status" }]'
data='[{ "id": "1", "status": "Active" }]'
grouping='{ "groupBy": ["status"] }'
pagination-page-sizes='[10, 25, 50]'

<!-- Boolean flags (presence = true) -->
enable-sorting
enable-filtering
enable-grouping
enable-column-moving
enable-column-resizing
enable-pinning
enable-cell-edit
enable-cell-edit-on-focus
enable-pagination
enable-pagination-controls
enable-expandable
enable-tree-view
enable-virtualization
enable-row-selection
enable-infinite-scroll`;

  protected readonly eventsSnippet = `grid.options = {
  ...grid.options,
  onRegisterApi: (api) => {
    api.core.on.sortChanged((column, direction) => {
      console.log('Sort:', column, direction);
    });
    api.core.on.filterChanged((filters) => {
      console.log('Filters:', filters);
    });
    api.edit.on.afterCellEdit((row, col, newVal, oldVal) => {
      console.log('Edited:', col, oldVal, '->', newVal);
    });
    api.selection.on.rowSelectionChanged((row) => {
      console.log('Selected:', row);
    });
  },
};`;

  protected readonly setDataSnippet = `// Fast in-place cell patching — no full re-render
const grid = document.querySelector('#trading-grid');

setInterval(() => {
  rows = tickTradingRows(rows, rng, 6);
  grid.setData(rows);
}, 150);`;

  protected readonly angularCellTemplateSnippet = `<!-- Define the ng-template in your Angular component -->
<ng-template #statusCell
  let-value
  let-row="row"
  let-column="column"
  let-rowIndex="rowIndex">
  <span class="pill" [ngClass]="'pill-' + (value | lowercase)">{{ value }}</span>
</ng-template>`;

  protected readonly angularCellTemplateOptionsSnippet = `// Wire the TemplateRef into a column definition
import { TemplateRef } from '@angular/core';
import { GridCellTemplateContext } from '@ornery/ui-grid';

@ViewChild('statusCell') statusCellTpl!: TemplateRef<GridCellTemplateContext>;

ngAfterViewInit() {
  this.gridOptions = {
    ...this.gridOptions,
    columnDefs: this.gridOptions.columnDefs.map(col =>
      col.name === 'status' ? { ...col, cellTemplate: this.statusCellTpl } : col
    ),
  };
}`;

  protected readonly reactCellRendererSnippet = `import { mountUiGrid, styledCell } from '@ornery/ui-grid-react';
import type { GridCellTemplateContext } from '@ornery/ui-grid-core';

mountUiGrid(host, {
  options,
  cellRenderers: {
    status: ({ value }: GridCellTemplateContext) => {
      const cls = String(value).toLowerCase();
      return styledCell(String(value), 'inherit', {
        borderRadius: '999px',
        padding: '0.2rem 0.55rem',
        background: \`var(--pill-bg-\${cls})\`,
      });
    },
    price: ({ value, row }: GridCellTemplateContext) =>
      styledCell(String(value), String(row['priceColor'])),
  },
});`;

  protected readonly styleSnippet = `.my-container {
  --ui-grid-surface: #1a1a2e;
  --ui-grid-cell-color: #e0e0e0;
  --ui-grid-accent: #00d4aa;
  --ui-grid-border-color: rgba(0, 212, 170, 0.2);
  --ui-grid-header-background: #242440;
}`;
}
