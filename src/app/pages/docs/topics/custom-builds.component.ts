import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block.component';

@Component({
  selector: 'app-docs-custom-builds',
  imports: [CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Custom Builds</h1>
      <p class="docs-lead">
        Ship only the features you use. The build script generates compile-time boolean constants
        that let the bundler tree-shake unused code paths entirely.
      </p>

      <h2>Feature Flag Table</h2>
      <table class="docs-table">
        <thead><tr><th>CLI Name</th><th>TypeScript Constant</th><th>What It Guards</th></tr></thead>
        <tbody>
          <tr><td><code>sorting</code></td><td><code>FEATURE_SORTING</code></td><td>Column sort UI and pipeline sort step</td></tr>
          <tr><td><code>filtering</code></td><td><code>FEATURE_FILTERING</code></td><td>Filter row and pipeline filter step</td></tr>
          <tr><td><code>grouping</code></td><td><code>FEATURE_GROUPING</code></td><td>Group headers and grouping pipeline</td></tr>
          <tr><td><code>pagination</code></td><td><code>FEATURE_PAGINATION</code></td><td>Pagination footer and page slicing</td></tr>
          <tr><td><code>cell-edit</code></td><td><code>FEATURE_CELL_EDIT</code></td><td>Inline editing UI and keyboard handlers</td></tr>
          <tr><td><code>expandable</code></td><td><code>FEATURE_EXPANDABLE</code></td><td>Expandable detail rows</td></tr>
          <tr><td><code>tree-view</code></td><td><code>FEATURE_TREE_VIEW</code></td><td>Tree row rendering and tree pipeline</td></tr>
          <tr><td><code>infinite-scroll</code></td><td><code>FEATURE_INFINITE_SCROLL</code></td><td>Infinite scroll state machine</td></tr>
          <tr><td><code>column-moving</code></td><td><code>FEATURE_COLUMN_MOVING</code></td><td>drag-and-drop on headers</td></tr>
          <tr><td><code>csv-export</code></td><td><code>FEATURE_CSV_EXPORT</code></td><td>CSV export and toolbar button</td></tr>
          <tr><td><code>save-state</code></td><td><code>FEATURE_SAVE_STATE</code></td><td>Save/restore state serialization</td></tr>
          <tr><td><code>auto-resize</code></td><td><code>FEATURE_AUTO_RESIZE</code></td><td>ResizeObserver integration</td></tr>
        </tbody>
      </table>

      <h2>Usage</h2>
      <app-code-block lang="bash" [code]="usageSnippet" />

      <h2>How It Works</h2>
      <ol>
        <li>The script backs up <code>grid.features.ts</code></li>
        <li>Generates a new version with only selected flags set to <code>true</code></li>
        <li>Optionally swaps <code>i18n/en-US.json</code> with the provided locale file</li>
        <li>Runs <code>ng build uiGridPackage --configuration production</code></li>
        <li>Restores the original files (even on build failure)</li>
      </ol>
      <p>
        The bundler sees <code>if (false) {{ '{' }} ... {{ '}' }}</code> and tree-shakes the dead code path entirely.
        The grid API uses noop fallbacks for disabled features, so runtime behavior is always safe.
      </p>

      <h2>Build Presets</h2>
      <p>Higher-level presets are available via the preset build script:</p>
      <app-code-block lang="bash" [code]="presetSnippet" />
      <table class="docs-table">
        <thead><tr><th>Preset</th><th>Includes</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td><code>full</code></td><td>All features + Angular component</td><td>Supported</td></tr>
          <tr><td><code>minimal</code></td><td>Headless core: API, sorting, filtering, pagination</td><td>Supported</td></tr>
          <tr><td><code>data-heavy</code></td><td>Sorting, filtering, viewport, export</td><td>Planned</td></tr>
          <tr><td><code>interactive</code></td><td>Sorting, filtering, grouping, editing, tree, expandable</td><td>Planned</td></tr>
        </tbody>
      </table>
    </section>
  `,
  styles: `@use '../docs-topic';`
})
export class DocsCustomBuildsComponent {
  protected readonly usageSnippet = `# Full build (default — all features enabled)
node scripts/build-grid.mjs

# Minimal build — only sorting and filtering
node scripts/build-grid.mjs --features sorting,filtering

# Custom locale baked in at build time
node scripts/build-grid.mjs --locale projects/ui-grid/src/lib/grid/i18n/fr-FR.json

# Both features and locale
node scripts/build-grid.mjs --features sorting,filtering,pagination --locale i18n/fr-FR.json

# See available flags
node scripts/build-grid.mjs --list

# Dry run — writes generated file but skips ng build
node scripts/build-grid.mjs --features sorting --dry-run`;

  protected readonly presetSnippet = `# Build the full preset (default)
npm run build:library:preset -- --preset=full

# Build the minimal/headless preset
npm run build:library:preset -- --preset=minimal`;
}
