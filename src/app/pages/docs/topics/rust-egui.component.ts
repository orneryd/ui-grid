import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block.component';

@Component({
  selector: 'app-docs-rust-egui',
  imports: [CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Rust / egui</h1>
      <p class="docs-lead">
        <code>ui-grid-egui</code> is the native Rust adapter for UI Grid on top of
        <code>egui</code>. It lets Rust applications render the grid natively without a browser
        or JavaScript runtime.
      </p>

      <h2>Install</h2>
      <app-code-block lang="toml" [code]="installSnippet" />

      <h2>Minimal Usage</h2>
      <p>
        Create the grid once, keep your <code>EguiColumnExt</code> configuration alongside it,
        and call <code>show()</code> inside your egui frame.
      </p>
      <app-code-block lang="rust" [code]="usageSnippet" />

      <h2>Feature Recipes</h2>
      <p>
        These snippets match the current native API surface: feature flags live on
        <code>GridOptions</code>, while imperative helpers live on <code>EguiGrid</code>.
      </p>
      <app-code-block lang="rust" [code]="featureSnippet" />
      <app-code-block lang="rust" [code]="pinningSnippet" />
      <app-code-block lang="rust" [code]="stateSnippet" />
      <app-code-block lang="rust" [code]="exportSnippet" />

      <h2>Main Exports</h2>
      <table class="docs-table">
        <thead><tr><th>Export</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><code>EguiGrid</code></td><td>The main egui widget adapter.</td></tr>
          <tr><td><code>EguiColumnExt</code></td><td>Per-column native formatter, renderer, and editor hooks.</td></tr>
          <tr><td><code>GridTheme</code> / <code>GridThemePreset</code></td><td>Theme configuration for the native grid surface.</td></tr>
          <tr><td><code>EguiGridEvent</code> / <code>EguiGridEventKind</code></td><td>Native event surface for egui hosts.</td></tr>
        </tbody>
      </table>

      <h2>What The egui Adapter Supports</h2>
      <ul>
        <li>sorting, filtering, grouping, and pagination</li>
        <li>cell editing and focus management</li>
        <li>tree view and expandable rows</li>
        <li>large dataset virtualization</li>
        <li>theme presets and per-column native extensions</li>
      </ul>

      <h2>Column Extensions</h2>
      <p>
        <code>EguiColumnExt</code> is the main customization hook for native Rust applications.
        Use it for formatters, custom cell rendering, and custom edit widgets.
      </p>
      <app-code-block lang="rust" [code]="extensionsSnippet" />

      <h2>Run The Native Demo</h2>
      <app-code-block lang="bash" [code]="demoSnippet" />

      <p>
        The native demo showcases sorting, filtering, grouping, custom renderers, custom editors,
        tree view, theme presets, and large dataset scrolling.
      </p>

      <h2>When To Use Which Rust Path</h2>
      <table class="docs-table">
        <thead><tr><th>Path</th><th>Use It For</th></tr></thead>
        <tbody>
          <tr><td><code>Rust / WASM</code></td><td>Running the Rust engine in a browser host or plain web component setup.</td></tr>
          <tr><td><code>ui-grid-egui</code></td><td>Building a native Rust desktop or egui application surface.</td></tr>
        </tbody>
      </table>

      <p>
        These are complementary delivery paths: Rust/WASM is the browser-native engine route,
        while <code>ui-grid-egui</code> is the native widget adapter for Rust apps.
      </p>

      <h2>See Also</h2>
      <ul>
        <li><a href="https://crates.io/crates/ui-grid-egui" target="_blank" rel="noreferrer">crates.io package</a></li>
        <li><a href="#/docs/rust">Rust / WASM</a></li>
      </ul>
    </section>
  `,
  styles: `@use '../docs-topic';`
})
export class DocsRustEguiComponent {
  protected readonly installSnippet = `[dependencies]
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

  protected readonly featureSnippet = `use ui_grid_core::models::GridGroupingOptions;

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

  protected readonly stateSnippet = `let json = grid.serialize_state()?;

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