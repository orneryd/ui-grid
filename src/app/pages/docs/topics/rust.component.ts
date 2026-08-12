import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block.component';

@Component({
  selector: 'app-docs-rust',
  imports: [CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Rust / WASM</h1>
      <p class="docs-lead">
        Use UI Grid's Rust pipeline in Angular, React, or vanilla hosts without changing the
        public <code>gridOptions</code> / <code>columnDefs</code> surface. The host framework still
        renders the grid; Rust owns the shared pipeline and state math.
      </p>

      <h2>What runs in Rust today</h2>
      <ul>
        <li>Filtering, sorting, grouping, and pagination</li>
        <li>Pinning state, tree flattening, and virtualization math</li>
        <li>Save-state normalization and shared pipeline output</li>
      </ul>

      <h2>Angular Usage</h2>
      <p>Register the engine once, then keep using the Angular component normally.</p>
      <app-code-block lang="typescript" [code]="angularSnippet" />

      <h2>React Usage</h2>
      <p>The React wrapper provides a matching helper for the same Rust pipeline.</p>
      <app-code-block lang="tsx" [code]="reactSnippet" />

      <h2>Vanilla / Web Component Usage</h2>
      <p>For a plain browser host, register the module and then mount the standalone element.</p>
      <app-code-block lang="typescript" [code]="vanillaSnippet" />

      <h2>Feature Recipes</h2>
      <p>These options stay identical across Angular, React, and vanilla renderers.</p>
      <app-code-block lang="typescript" [code]="featureSnippet" />
      <app-code-block lang="typescript" [code]="stateSnippet" />

      <h2>Local Workflow</h2>
      <app-code-block lang="bash" [code]="prereqSnippet" />
      <app-code-block lang="bash" [code]="installSnippet" />
      <app-code-block lang="bash" [code]="rustBuildSnippet" />
      <app-code-block lang="bash" [code]="libraryBuildSnippet" />
      <app-code-block lang="bash" [code]="runSnippet" />

      <h3>Open in the browser</h3>
      <app-code-block lang="text" [code]="urlSnippet" />

      <h2>Validation</h2>
      <app-code-block lang="bash" [code]="manualSnippet" />
      <app-code-block lang="bash" [code]="validationSnippet" />

      <h2>Current boundary</h2>
      <p>
        The browser wrappers still own DOM rendering and framework integration. Rust currently owns
        the shared pipeline, state transitions, and pinning math; native Rust rendering lives in
        <code>ui-grid-egui</code>.
      </p>
    </section>
  `,
  styles: `
    @use '../docs-topic';
  `,
})
export class DocsRustComponent {
  protected readonly angularSnippet = `import { Component, computed } from '@angular/core';
import { UiGridComponent, type GridOptions } from '@ornery/ui-grid';
import { enableUiGridWasmEngine } from '@ornery/ui-grid-core';

await enableUiGridWasmEngine();

@Component({
  selector: 'app-rust-wasm-angular-demo',
  imports: [UiGridComponent],
  template: '<app-ui-grid [options]="options()" />',
})
export class RustWasmAngularDemoComponent {
  protected readonly options = computed<GridOptions>(() => ({
    id: 'rust-wasm-angular',
    data: createDemoData(),
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: true,
    enablePinning: true,
    grouping: { groupBy: ['status'] },
    columnDefs: [
      { name: 'name', pinnedLeft: true },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end' },
      { name: 'owner', field: 'account.owner' },
    ],
  }));
}`;

  protected readonly reactSnippet = `import { UiGrid, enableReactUiGridWasmEngine } from '@ornery/ui-grid-react';
import { type GridOptions } from '@ornery/ui-grid-core';

await enableReactUiGridWasmEngine();

const options: GridOptions = {
  id: 'rust-wasm-react',
  data,
  enableSorting: true,
  enableFiltering: true,
  enablePinning: true,
  columnDefs: [
    { name: 'name', pinnedLeft: true },
    { name: 'department' },
    { name: 'region' },
    { name: 'total', align: 'end' },
  ],
};

export function RustWasmReactGrid() {
  return <UiGrid options={options} />;
}`;

  protected readonly vanillaSnippet = `import initWasm, * as wasmModule from '../../../dist/ui-grid-wasm-web/ui_grid_wasm.js';
import {
  defineStandaloneUiGridElement,
  registerVanillaUiGridRustModule,
  type VanillaUiGridElement,
} from '@ornery/ui-grid-vanilla';

await registerVanillaUiGridRustModule(
  {
    default: initWasm,
  },
  '/dist/ui-grid-wasm-web/ui_grid_wasm_bg.wasm',
);

await defineStandaloneUiGridElement();

const grid = document.querySelector('ui-grid-element') as VanillaUiGridElement;
grid.options = options;`;

  protected readonly featureSnippet = `const options = {
  enableSorting: true,
  enableFiltering: true,
  enableGrouping: true,
  enableTreeView: true,
  enableExpandable: true,
  enablePinning: true,
  grouping: { groupBy: ['status'] },
  treeChildrenField: 'children',
  columnDefs: [
    { name: 'name', pinnedLeft: true },
    { name: 'status' },
    { name: 'revenue', type: 'number', align: 'end' },
  ],
};`;

  protected readonly stateSnippet = `let savedState = null;

const options = {
  onRegisterApi: (api) => {
    savedState = api.saveState.save();
    api.saveState.restore(savedState);
  },
};`;

  protected readonly prereqSnippet = `curl https://sh.rustup.rs -sSf | sh
cargo install wasm-pack`;

  protected readonly installSnippet = `npm ci
cd projects/ui-grid-vanilla && npm install && cd ../..`;

  protected readonly rustBuildSnippet = `npm run build:rust:web`;

  protected readonly libraryBuildSnippet = `npm run build:library`;

  protected readonly runSnippet = `npm run start:vanilla`;

  protected readonly urlSnippet = `http://127.0.0.1:4174/`;

  protected readonly manualSnippet = `npm run build:library
npm run build:rust:web
npm run start --prefix projects/ui-grid-vanilla -- --host 127.0.0.1 --port 4174`;

  protected readonly validationSnippet = `npm run test:angular -- --watch=false
npm run test:react
npm run test:vanilla
npm run build:rust:wasm
npm run build:rust:web`;
}
