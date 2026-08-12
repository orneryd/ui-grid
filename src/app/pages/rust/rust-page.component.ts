import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../shared/code-block.component';

type RustSection = 'wasm' | 'egui';

@Component({
  selector: 'app-rust-page',
  imports: [RouterLink, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="rust-page-shell">
      <header class="page-hero">
        <div class="page-copy">
          <p class="eyebrow">Native & Browser</p>
          <h1>Rust</h1>
          <p class="page-summary">
            UI Grid ships two Rust delivery paths: a WASM engine that powers Angular, React, and
            vanilla browser hosts; and a native <code>egui</code> adapter for desktop applications.
          </p>
          <p class="page-links">
            <a routerLink="/home" class="demo-link">Angular Demo</a>
            <a routerLink="/react" class="demo-link demo-link-secondary">React Demo</a>
            <a routerLink="/web-components" class="demo-link demo-link-secondary">Web Components</a>
            <a routerLink="/docs" class="demo-link demo-link-secondary">Docs</a>
          </p>
        </div>
      </header>

      <div class="section-switch" role="tablist" aria-label="Rust section">
        <button
          type="button"
          class="section-button"
          [class.section-button-active]="section() === 'wasm'"
          [attr.aria-selected]="section() === 'wasm'"
          (click)="setSection('wasm')"
        >
          Rust / WASM
        </button>
        <button
          type="button"
          class="section-button"
          [class.section-button-active]="section() === 'egui'"
          [attr.aria-selected]="section() === 'egui'"
          (click)="setSection('egui')"
        >
          egui Native
        </button>
      </div>

      @if (section() === 'wasm') {
        <section class="content-panel">
          <header class="panel-header">
            <div>
              <h2>Rust / WASM</h2>
              <p>
                Use UI Grid's Rust pipeline in Angular, React, or vanilla hosts. The host framework
                renders the grid; Rust owns the shared pipeline and state math.
              </p>
            </div>
          </header>

          <div class="topic-body">
            <h3>What runs in Rust</h3>
            <ul>
              <li>Filtering, sorting, grouping, and pagination</li>
              <li>Pinning state, tree flattening, and virtualization math</li>
              <li>Save-state normalization and shared pipeline output</li>
            </ul>

            <h3>Angular Usage</h3>
            <p>Register the engine once, then keep using the Angular component normally.</p>
            <app-code-block lang="typescript" [code]="angularSnippet" />

            <h3>React Usage</h3>
            <p>The React wrapper provides a matching helper for the same Rust pipeline.</p>
            <app-code-block lang="tsx" [code]="reactSnippet" />

            <h3>Vanilla / Web Component Usage</h3>
            <p>For a plain browser host, register the module and then mount the standalone element.</p>
            <app-code-block lang="typescript" [code]="vanillaSnippet" />

            <h3>Feature Options</h3>
            <p>These options stay identical across Angular, React, and vanilla renderers.</p>
            <app-code-block lang="typescript" [code]="featureSnippet" />

            <h3>Save &amp; Restore State</h3>
            <app-code-block lang="typescript" [code]="stateSnippet" />

            <h3>Local Workflow</h3>
            <app-code-block lang="bash" [code]="prereqSnippet" />
            <app-code-block lang="bash" [code]="installSnippet" />
            <app-code-block lang="bash" [code]="rustBuildSnippet" />
            <app-code-block lang="bash" [code]="libraryBuildSnippet" />
            <app-code-block lang="bash" [code]="runSnippet" />
          </div>
        </section>
      }

      @if (section() === 'egui') {
        <section class="content-panel">
          <header class="panel-header">
            <div>
              <h2>egui Native</h2>
              <p>
                <code>ui-grid-egui</code> is the native Rust adapter for UI Grid on top of
                <code>egui</code>. Render the grid natively without a browser or JavaScript runtime.
              </p>
            </div>
          </header>

          <figure class="section-screenshot">
            <img
              src="docs/screenshots/pinning-100k.png"
              alt="ui-grid-egui demo showing pinned columns with a fixed header and filter row"
            />
          </figure>

          <div class="topic-body">
            <h3>Install</h3>
            <app-code-block lang="toml" [code]="installEguiSnippet" />

            <h3>Minimal Usage</h3>
            <p>
              Create the grid once, keep your <code>EguiColumnExt</code> configuration alongside
              it, and call <code>show()</code> inside your egui frame.
            </p>
            <app-code-block lang="rust" [code]="usageSnippet" />

            <h3>Features: Sorting, Filtering, Grouping</h3>
            <app-code-block lang="rust" [code]="featureEguiSnippet" />

            <h3>Pinning</h3>
            <app-code-block lang="rust" [code]="pinningSnippet" />

            <h3>Save &amp; Restore State</h3>
            <app-code-block lang="rust" [code]="stateEguiSnippet" />

            <h3>CSV Export</h3>
            <app-code-block lang="rust" [code]="exportSnippet" />

            <h3>Column Extensions</h3>
            <p>
              <code>EguiColumnExt</code> is the main customization hook: formatters, custom cell
              rendering, and custom edit widgets.
            </p>
            <app-code-block lang="rust" [code]="extensionsSnippet" />

            <h3>Run the Native Demo</h3>
            <app-code-block lang="bash" [code]="demoSnippet" />

            <h3>Main Exports</h3>
            <table class="docs-table">
              <thead><tr><th>Export</th><th>Purpose</th></tr></thead>
              <tbody>
                <tr><td><code>EguiGrid</code></td><td>The main egui widget adapter.</td></tr>
                <tr><td><code>EguiColumnExt</code></td><td>Per-column native formatter, renderer, and editor hooks.</td></tr>
                <tr><td><code>GridTheme</code> / <code>GridThemePreset</code></td><td>Theme configuration for the native grid surface.</td></tr>
                <tr><td><code>EguiGridEvent</code> / <code>EguiGridEventKind</code></td><td>Native event surface for egui hosts.</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      }
    </main>
  `,
  styles: `
    .rust-page-shell {
      min-height: 100vh;
      width: min(1380px, calc(100% - 2rem));
      margin: 0 auto;
      padding: clamp(1rem, 2vw, 2rem);
      display: grid;
      gap: 1.25rem;
      align-content: start;
    }

    .page-hero,
    .content-panel {
      position: relative;
      border: 1px solid var(--card-border);
      border-radius: var(--theme-radius);
      background: var(--panel-surface);
      box-shadow: var(--card-shadow);
      backdrop-filter: var(--theme-card-filter);
    }

    .page-hero {
      overflow: hidden;
      padding: clamp(1rem, 1.5vw, 1.75rem);
      background:
        radial-gradient(
          circle at top right,
          color-mix(in srgb, var(--teal-strong) 18%, transparent),
          transparent 30%
        ),
        linear-gradient(145deg, var(--panel-surface-strong), var(--panel-surface-alt));
    }

    .page-copy {
      display: grid;
      gap: 0.6rem;
      max-width: 60rem;
    }

    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 0.76rem;
      font-weight: 800;
      color: var(--teal-strong);
    }

    .page-copy h1 {
      margin: 0;
      color: var(--ink-strong);
    }

    .page-summary {
      margin: 0;
      line-height: 1.6;
      color: color-mix(in srgb, var(--ink-strong) 74%, var(--teal-strong) 26%);
    }

    .page-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0;
    }

    .demo-link {
      display: inline-flex;
      align-items: center;
      padding: 0.4rem 0.9rem;
      border-radius: calc(var(--theme-radius) * 0.6);
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      background: var(--teal-strong);
      color: var(--ink-on-accent, #fff);
      transition: opacity 120ms ease;

      &:hover { opacity: 0.85; }
    }

    .demo-link-secondary {
      background: var(--control-surface);
      color: var(--ink-strong);
      border: 1px solid var(--card-border);
    }

    .section-switch {
      display: flex;
      gap: 0.5rem;
    }

    .section-button {
      padding: 0.5rem 1.25rem;
      border: 1px solid var(--card-border);
      border-radius: calc(var(--theme-radius) * 0.7);
      background: var(--control-surface);
      color: var(--ink-muted);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 120ms ease, color 120ms ease, border-color 120ms ease;

      &:hover:not(.section-button-active) {
        background: var(--control-hover-surface, var(--panel-surface));
        color: var(--ink-strong);
      }
    }

    .section-button-active {
      background: var(--teal-strong);
      color: var(--ink-on-accent, #fff);
      border-color: var(--teal-strong);
    }

    .content-panel {
      display: grid;
      min-width: 0;
    }

    .panel-header {
      padding: clamp(0.875rem, 1.25vw, 1.25rem) clamp(0.875rem, 1.25vw, 1.25rem) 0;
    }

    .panel-header h2 {
      margin: 0 0 0.3rem;
      color: var(--ink-strong);
    }

    .panel-header p {
      margin: 0;
      line-height: 1.6;
      color: color-mix(in srgb, var(--ink-strong) 74%, var(--teal-strong) 26%);
    }

    .section-screenshot {
      margin: 0;
      padding: clamp(0.75rem, 1vw, 1rem) clamp(0.875rem, 1.25vw, 1.25rem) 0;
    }

    .section-screenshot img {
      display: block;
      width: 100%;
      max-width: 100%;
      border-radius: calc(var(--theme-radius) * 0.8);
      border: 1px solid var(--card-border);
      box-shadow: var(--card-shadow);
    }

    .topic-body {
      padding: clamp(0.875rem, 1.25vw, 1.25rem);
      display: grid;
      gap: 1rem;
      min-width: 0;

      h3 {
        margin: 0.5rem 0 0;
        font-size: 1rem;
        color: var(--ink-strong);
      }

      p {
        margin: 0;
        line-height: 1.6;
        color: color-mix(in srgb, var(--ink-strong) 74%, var(--teal-strong) 26%);
      }

      ul {
        margin: 0;
        padding-left: 1.4rem;
        color: color-mix(in srgb, var(--ink-strong) 74%, var(--teal-strong) 26%);
        line-height: 1.8;
      }
    }

    .docs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th, td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--card-border);
        color: var(--ink-strong);
      }

      th {
        font-weight: 700;
        color: var(--ink-muted);
        background: var(--panel-surface-alt);
      }
    }

    @media (max-width: 960px) {
      .rust-page-shell {
        width: min(100%, calc(100% - 1rem));
        padding: 0.5rem;
      }

      .docs-table {
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
    }
  `,
})
export class RustPageComponent {
  protected readonly section = signal<RustSection>('wasm');

  setSection(value: RustSection): void {
    this.section.set(value);
  }

  // WASM snippets
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

  // egui snippets
  protected readonly installEguiSnippet = `[dependencies]
ui-grid-egui = "0.1"
ui-grid-core = "0.1"`;

  protected readonly usageSnippet = `use ui_grid_egui::{EguiColumnExt, EguiGrid, GridThemePreset};
use ui_grid_core::models::{GridColumnDef, GridColumnType, GridOptions};

let mut grid = EguiGrid::new();
let theme = GridThemePreset::DefaultDark.build();
let mut options = GridOptions {
    id: "accounts-egui".into(),
    title: Some("Accounts".into()),
    enable_sorting: true,
    enable_filtering: true,
    enable_virtualization: true,
    ..GridOptions::default()
};

let columns = vec![
    GridColumnDef {
        name: "account_id".into(),
        display_name: Some("Account".into()),
        r#type: GridColumnType::String,
        ..GridColumnDef::default()
    },
    GridColumnDef {
        name: "revenue".into(),
        display_name: Some("Revenue".into()),
        r#type: GridColumnType::Number,
        align: Some("end".into()),
        ..GridColumnDef::default()
    },
];

let mut column_ext: Vec<EguiColumnExt> = vec![];

// Inside your egui frame:
grid.show(ui, &mut options, &columns, &mut column_ext, &theme);`;

  protected readonly featureEguiSnippet = `use ui_grid_core::models::GridGroupingOptions;

let mut options = GridOptions {
    enable_sorting: true,
    enable_filtering: true,
    enable_grouping: true,
    enable_tree_view: true,
    enable_expandable: true,
    enable_virtualization: true,
    grouping: Some(GridGroupingOptions {
        group_by: vec!["status".into()],
    }),
    tree_children_field: Some("children".into()),
    ..GridOptions::default()
};`;

  protected readonly pinningSnippet = `use ui_grid_core::pinning::PinDirection;

let mut options = GridOptions {
    enable_pinning: true,
    ..GridOptions::default()
};

let columns = vec![
    GridColumnDef {
        name: "account_id".into(),
        pinned_left: true,
        ..GridColumnDef::default()
    },
    GridColumnDef {
        name: "status".into(),
        ..GridColumnDef::default()
    },
];

grid.pin_column("status", PinDirection::Right);`;

  protected readonly stateEguiSnippet = `let json = grid.serialize_state()?;

// later
grid.deserialize_state(&json)?;

let saved = grid.save_state();
grid.restore_state(&saved);`;

  protected readonly exportSnippet = `let payload = grid.export_csv(&options, &columns);
println!("{}", payload.content);

let visible_count = grid.export_with(&options, &columns, |context| {
    context.visible_rows.len()
});`;

  protected readonly extensionsSnippet = `let ext = vec![
    EguiColumnExt::new("revenue")
      .with_formatter(|value, _row| format!("\${}", value)),

    EguiColumnExt::new("status")
        .with_cell_renderer(|ui, ctx| {
            ui.label(ctx.value.as_str().unwrap_or(""));
        }),

    EguiColumnExt::new("date")
        .with_cell_editor(|ui, value, _theme| {
            let response = ui.text_edit_singleline(value);
            response.changed()
        }),
];`;

  protected readonly demoSnippet = `cargo run -p ui-grid-egui --example demo --release`;
}
