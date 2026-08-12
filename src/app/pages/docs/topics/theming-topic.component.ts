import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block.component';

interface ThemingVariableRow {
  name: string;
  defaultValue: string;
  description: string;
}

interface ThemingVariableGroup {
  title: string;
  rows: ThemingVariableRow[];
}

@Component({
  selector: 'app-docs-theming-topic',
  imports: [CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Theming</h1>
      <p class="docs-lead">
        UI Grid uses Shadow DOM encapsulation. All visual customization flows through
        CSS custom properties and <code>::part()</code> selectors — no style overrides needed.
      </p>

      <h2>How It Works</h2>
      <p>
        The grid component renders inside a Shadow DOM boundary. Parent styles cannot leak in.
        Instead, the grid exposes two theming surfaces:
      </p>
      <ol>
        <li><strong>CSS custom properties</strong> — set <code>--ui-grid-*</code> variables on any ancestor element. They pierce the shadow boundary.</li>
        <li><strong><code>::part()</code> selectors</strong> — target specific structural elements by their part name for full CSS access.</li>
      </ol>

      <p>
        The public override surface is the <code>--ui-grid-*</code> namespace. The component also defines
        internal <code>--app-ui-grid-*</code> fallbacks, but those are implementation details rather than the supported theming API.
      </p>

      <h2>CSS Custom Properties</h2>
      @for (group of cssVariableGroups; track group.title) {
      <h3>{{ group.title }}</h3>
      <table class="docs-table">
        <thead><tr><th>Variable</th><th>Default</th><th>Controls</th></tr></thead>
        <tbody>
          @for (row of group.rows; track row.name) {
          <tr>
            <td><code>{{ row.name }}</code></td>
            <td><code>{{ row.defaultValue }}</code></td>
            <td>{{ row.description }}</td>
          </tr>
          }
        </tbody>
      </table>
      }

      <h2>::part() Hooks</h2>
      <table class="docs-table">
        <thead><tr><th>Part Name</th><th>Target Element</th></tr></thead>
        <tbody>
          <tr><td><code>shell</code></td><td>Outermost grid wrapper</td></tr>
          <tr><td><code>hero</code></td><td>Title/toolbar area</td></tr>
          <tr><td><code>grid-frame</code></td><td>Scrollable grid container</td></tr>
          <tr><td><code>grid-toolbar</code></td><td>Toolbar with row count</td></tr>
          <tr><td><code>header</code></td><td>Header row container</td></tr>
          <tr><td><code>header-cell</code></td><td>Individual header cell</td></tr>
          <tr><td><code>filter-cell</code></td><td>Filter input cell</td></tr>
          <tr><td><code>body-cell</code></td><td>Data cell</td></tr>
          <tr><td><code>group-row</code></td><td>Group header row</td></tr>
          <tr><td><code>expandable-row</code></td><td>Expanded detail row</td></tr>
          <tr><td><code>pagination</code></td><td>Pagination footer</td></tr>
          <tr><td><code>empty-state</code></td><td>Empty state message</td></tr>
        </tbody>
      </table>

      <h2>Example: Custom Brand Theme</h2>
      <app-code-block lang="scss" [code]="themeSnippet" />

      <p>
        See the <a href="#/themes">Themes page</a> for a live preview of all four built-in theme modes
        and a copy-pasteable theme SCSS block.
      </p>
    </section>
  `,
  styles: `@use '../docs-topic';`
})
export class DocsThemingTopicComponent {
  protected readonly cssVariableGroups: ThemingVariableGroup[] = [
    {
      title: 'Foundation',
      rows: [
        { name: '--ui-grid-surface', defaultValue: '#ffffff', description: 'Base surface for the frame, controls, menus, and inputs.' },
        { name: '--ui-grid-border-color', defaultValue: '#d4d4d8', description: 'Shared border color across frame, cells, controls, and menus.' },
        { name: '--ui-grid-header-background', defaultValue: '#f3f4f6', description: 'Header and filter row background.' },
        { name: '--ui-grid-header-weight', defaultValue: '700', description: 'Header label font weight.' },
        { name: '--ui-grid-cell-color', defaultValue: '#111827', description: 'Primary text color for rows and controls.' },
        { name: '--ui-grid-muted-color', defaultValue: '#6b7280', description: 'Secondary text color for helper copy and inactive controls.' },
        { name: '--ui-grid-row-odd', defaultValue: '#fcfcfd', description: 'Odd striped row background.' },
        { name: '--ui-grid-row-even', defaultValue: '#f7f7f8', description: 'Even striped row background.' },
        { name: '--ui-grid-row-hover', defaultValue: '#eef4ff', description: 'Row hover background.' },
        { name: '--ui-grid-accent', defaultValue: '#2563eb', description: 'Accent color for active states, focus rings, and highlighted controls.' },
        { name: '--ui-grid-group-background', defaultValue: '#eceff3', description: 'Group header row background.' },
        { name: '--ui-grid-radius', defaultValue: '4px', description: 'Base corner radius reused by frame, cards, and inputs.' },
        { name: '--ui-grid-shadow', defaultValue: '0 10px 24px rgba(15, 23, 42, 0.08)', description: 'Frame shadow.' },
      ],
    },
    {
      title: 'Status Pills',
      rows: [
        { name: '--ui-grid-status-active-bg', defaultValue: 'rgba(22, 163, 74, 0.14)', description: 'Active pill background.' },
        { name: '--ui-grid-status-active-color', defaultValue: '#166534', description: 'Active pill text.' },
        { name: '--ui-grid-status-expansion-bg', defaultValue: 'rgba(37, 99, 235, 0.14)', description: 'Expansion pill background.' },
        { name: '--ui-grid-status-expansion-color', defaultValue: '#1d4ed8', description: 'Expansion pill text.' },
        { name: '--ui-grid-status-enterprise-bg', defaultValue: 'rgba(15, 118, 110, 0.14)', description: 'Enterprise pill background.' },
        { name: '--ui-grid-status-enterprise-color', defaultValue: '#115e59', description: 'Enterprise pill text.' },
        { name: '--ui-grid-status-pilot-bg', defaultValue: 'rgba(234, 88, 12, 0.14)', description: 'Pilot pill background.' },
        { name: '--ui-grid-status-pilot-color', defaultValue: '#c2410c', description: 'Pilot pill text.' },
        { name: '--ui-grid-status-pill-padding-block', defaultValue: '0.2rem', description: 'Vertical pill padding.' },
        { name: '--ui-grid-status-pill-padding-inline', defaultValue: '0.55rem', description: 'Horizontal pill padding.' },
        { name: '--ui-grid-status-pill-radius', defaultValue: '999px', description: 'Pill border radius.' },
        { name: '--ui-grid-status-pill-font-size', defaultValue: '0.85rem', description: 'Pill font size.' },
        { name: '--ui-grid-status-pill-default-bg', defaultValue: 'rgba(15, 23, 42, 0.07)', description: 'Default pill background when no named state class is applied.' },
      ],
    },
    {
      title: 'Shell And Hero',
      rows: [
        { name: '--ui-grid-shell-gap', defaultValue: '1.5rem', description: 'Gap between major shell sections.' },
        { name: '--ui-grid-hero-gap', defaultValue: '1.5rem', description: 'Gap between hero content and actions.' },
        { name: '--ui-grid-hero-padding-block', defaultValue: '1rem', description: 'Hero top and bottom padding.' },
        { name: '--ui-grid-eyebrow-margin-block-end', defaultValue: '0.5rem', description: 'Space under the eyebrow label.' },
        { name: '--ui-grid-eyebrow-letter-spacing', defaultValue: '0.18em', description: 'Eyebrow tracking.' },
        { name: '--ui-grid-eyebrow-font-size', defaultValue: '0.72rem', description: 'Eyebrow size.' },
        { name: '--ui-grid-hero-title-font-size', defaultValue: 'clamp(1.4rem, 2vw, 2rem)', description: 'Hero title size.' },
        { name: '--ui-grid-hero-title-line-height', defaultValue: '1.1', description: 'Hero title line height.' },
        { name: '--ui-grid-hero-deck-max-width', defaultValue: '56ch', description: 'Max width for the intro paragraph.' },
        { name: '--ui-grid-hero-deck-margin-block-start', defaultValue: '0.75rem', description: 'Space above the deck paragraph.' },
        { name: '--ui-grid-hero-actions-gap', defaultValue: '1rem', description: 'Gap between hero actions.' },
        { name: '--ui-grid-action-radius', defaultValue: '999px', description: 'CTA button radius.' },
        { name: '--ui-grid-action-padding-block', defaultValue: '0.8rem', description: 'CTA button vertical padding.' },
        { name: '--ui-grid-action-padding-inline', defaultValue: '1.1rem', description: 'CTA button horizontal padding.' },
        { name: '--ui-grid-stats-card-min-width', defaultValue: '8rem', description: 'Minimum width for hero stats cards.' },
        { name: '--ui-grid-stats-card-padding-block', defaultValue: '0.85rem', description: 'Stats card vertical padding.' },
        { name: '--ui-grid-stats-card-padding-inline', defaultValue: '1rem', description: 'Stats card horizontal padding.' },
        { name: '--ui-grid-stats-card-value-font-size', defaultValue: '1.9rem', description: 'Hero stats numeric size.' },
      ],
    },
    {
      title: 'Frame, Metrics, Toolbar, And Scrolling',
      rows: [
        { name: '--ui-grid-metrics-gap', defaultValue: '1rem', description: 'Gap between metric cards.' },
        { name: '--ui-grid-metric-card-padding-block', defaultValue: '1rem', description: 'Metric card vertical padding.' },
        { name: '--ui-grid-metric-card-padding-inline', defaultValue: '1.1rem', description: 'Metric card horizontal padding.' },
        { name: '--ui-grid-metric-value-font-size', defaultValue: '1.3rem', description: 'Metric value size.' },
        { name: '--ui-grid-toolbar-gap', defaultValue: '1rem', description: 'Gap inside the toolbar.' },
        { name: '--ui-grid-toolbar-padding-block', defaultValue: '1rem', description: 'Toolbar vertical padding.' },
        { name: '--ui-grid-toolbar-padding-inline', defaultValue: '1.25rem', description: 'Toolbar horizontal padding.' },
        { name: '--ui-grid-toolbar-inline-gap', defaultValue: '0.4rem', description: 'Inline gap in toolbar text blocks.' },
        { name: '--ui-grid-overflow-x', defaultValue: 'auto', description: 'Horizontal overflow behavior for the single grid scroll container.' },
        { name: '--ui-grid-overflow-y', defaultValue: 'auto', description: 'Vertical overflow behavior for the single grid scroll container.' },
      ],
    },
    {
      title: 'Header, Pinning, And Controls',
      rows: [
        { name: '--ui-grid-header-z-index', defaultValue: '3', description: 'Sticky header and filter row stacking level.' },
        { name: '--ui-grid-pinned-cell-z-index', defaultValue: '2', description: 'Sticky pinned cell stacking level.' },
        { name: '--ui-grid-pin-menu-open-z-index', defaultValue: '8', description: 'Header cell stacking level when the inline pin chooser is open.' },
        { name: '--ui-grid-pin-menu-z-index', defaultValue: '20', description: 'Pin chooser internal stacking level.' },
        { name: '--ui-grid-header-cell-gap', defaultValue: '0.75rem', description: 'Gap between header label and action cluster.' },
        { name: '--ui-grid-header-cell-padding-block', defaultValue: '0.85rem', description: 'Header cell vertical padding.' },
        { name: '--ui-grid-header-cell-padding-inline', defaultValue: '1rem', description: 'Header cell horizontal padding.' },
        { name: '--ui-grid-header-cell-background-active', defaultValue: 'color-mix(in srgb, var(--ui-grid-accent) 8%, var(--ui-grid-header-background))', description: 'Background for an active sorted header cell.' },
        { name: '--ui-grid-pinned-divider-shadow-left', defaultValue: '2px 0 4px rgba(0, 0, 0, 0.06)', description: 'Shadow on the trailing edge of left-pinned columns.' },
        { name: '--ui-grid-pinned-divider-shadow-right', defaultValue: '-2px 0 4px rgba(0, 0, 0, 0.06)', description: 'Shadow on the leading edge of right-pinned columns.' },
        { name: '--ui-grid-pinned-divider-clip-left', defaultValue: 'inset(0 -4px 0 0)', description: 'Clip path for the left pinned divider shadow.' },
        { name: '--ui-grid-pinned-divider-clip-right', defaultValue: 'inset(0 0 0 -4px)', description: 'Clip path for the right pinned divider shadow.' },
        { name: '--ui-grid-header-actions-gap', defaultValue: '0.4rem', description: 'Gap between sort, group, and pin actions.' },
        { name: '--ui-grid-control-size', defaultValue: '2rem', description: 'Shared square size for header action chips.' },
        { name: '--ui-grid-control-radius', defaultValue: '999px', description: 'Shared control radius.' },
        { name: '--ui-grid-control-icon-size', defaultValue: '1rem', description: 'Icon size for action chips and pin arrows.' },
        { name: '--ui-grid-control-background', defaultValue: 'var(--ui-grid-surface)', description: 'Base control background.' },
        { name: '--ui-grid-control-border-color', defaultValue: 'var(--ui-grid-border-color)', description: 'Base control border color.' },
        { name: '--ui-grid-control-color', defaultValue: 'var(--ui-grid-muted-color)', description: 'Base control icon and text color.' },
        { name: '--ui-grid-control-background-active', defaultValue: 'color-mix(in srgb, var(--ui-grid-accent) 12%, var(--ui-grid-surface))', description: 'Active control background.' },
        { name: '--ui-grid-control-border-color-active', defaultValue: 'color-mix(in srgb, var(--ui-grid-accent) 35%, var(--ui-grid-border-color))', description: 'Active control border.' },
        { name: '--ui-grid-control-color-active', defaultValue: 'var(--ui-grid-accent)', description: 'Active control icon and text color.' },
        { name: '--ui-grid-pin-menu-gap', defaultValue: '0.25rem', description: 'Gap between inline pin chooser arrows.' },
        { name: '--ui-grid-pin-menu-padding', defaultValue: '0.25rem', description: 'Padding inside the inline pin chooser.' },
        { name: '--ui-grid-pin-menu-radius', defaultValue: '999px', description: 'Inline pin chooser radius.' },
        { name: '--ui-grid-pin-menu-shadow', defaultValue: '0 10px 24px color-mix(in srgb, var(--ui-grid-cell-color) 10%, transparent)', description: 'Inline pin chooser shadow.' },
        { name: '--ui-grid-pin-menu-action-size', defaultValue: '1.75rem', description: 'Size of each left or right pin action.' },
        { name: '--ui-grid-pin-control-collapsed-size', defaultValue: '1px', description: 'Final collapsed size of the pin button while the chooser opens.' },
        { name: '--ui-grid-pin-control-transition-duration', defaultValue: '160ms', description: 'Duration for the inline pin control animation.' },
        { name: '--ui-grid-pin-control-transition-easing', defaultValue: 'cubic-bezier(0.22, 1, 0.36, 1)', description: 'Easing curve for pin control motion.' },
        { name: '--ui-grid-pin-menu-scale-closed', defaultValue: '0.72', description: 'Closed-state scale used before the chooser expands in place.' },
      ],
    },
    {
      title: 'Filters',
      rows: [
        { name: '--ui-grid-filter-cell-padding-block-start', defaultValue: '0.75rem', description: 'Filter row top padding.' },
        { name: '--ui-grid-filter-cell-padding-block-end', defaultValue: '1rem', description: 'Filter row bottom padding.' },
        { name: '--ui-grid-filter-cell-padding-inline', defaultValue: '1rem', description: 'Filter row horizontal padding.' },
        { name: '--ui-grid-filter-input-padding-block', defaultValue: '0.55rem', description: 'Filter input vertical padding.' },
        { name: '--ui-grid-filter-input-padding-inline', defaultValue: '0.7rem', description: 'Filter input horizontal padding.' },
        { name: '--ui-grid-filter-input-focus-outline', defaultValue: '2px solid color-mix(in srgb, var(--ui-grid-accent) 18%, transparent)', description: 'Focus outline for filter inputs.' },
      ],
    },
    {
      title: 'Rows, Cells, And Editing',
      rows: [
        { name: '--ui-grid-body-cell-padding-block', defaultValue: '0.95rem', description: 'Body cell vertical padding.' },
        { name: '--ui-grid-body-cell-padding-inline', defaultValue: '1rem', description: 'Body cell horizontal padding.' },
        { name: '--ui-grid-cell-shell-gap', defaultValue: '0.55rem', description: 'Gap between toggles and content inside a cell.' },
        { name: '--ui-grid-row-toggle-size', defaultValue: '1.55rem', description: 'Tree and expandable toggle size.' },
        { name: '--ui-grid-row-toggle-radius', defaultValue: '999px', description: 'Tree and expandable toggle radius.' },
        { name: '--ui-grid-toggle-icon-size', defaultValue: '1.1rem', description: 'General toggle icon size.' },
        { name: '--ui-grid-group-disclosure-icon-size', defaultValue: '0.9rem', description: 'Group row disclosure icon size.' },
        { name: '--ui-grid-pagination-icon-size', defaultValue: '1.2rem', description: 'Pagination icon size.' },
        { name: '--ui-grid-expandable-row-padding-block', defaultValue: '1rem', description: 'Expanded row vertical padding.' },
        { name: '--ui-grid-expandable-row-padding-inline', defaultValue: '1.25rem', description: 'Expanded row horizontal padding.' },
        { name: '--ui-grid-expandable-row-background', defaultValue: 'color-mix(in srgb, var(--ui-grid-accent) 4%, var(--ui-grid-surface))', description: 'Expanded row background.' },
        { name: '--ui-grid-cell-focus-background', defaultValue: 'color-mix(in srgb, var(--ui-grid-accent) 10%, var(--ui-grid-surface))', description: 'Focused cell background.' },
        { name: '--ui-grid-cell-focus-ring', defaultValue: 'inset 0 0 0 1px color-mix(in srgb, var(--ui-grid-accent) 28%, transparent)', description: 'Focus ring for keyboard-focused cells.' },
        { name: '--ui-grid-cell-editing-background', defaultValue: 'color-mix(in srgb, var(--ui-grid-accent) 7%, var(--ui-grid-surface))', description: 'Editing cell background.' },
        { name: '--ui-grid-cell-editor-border-color', defaultValue: 'color-mix(in srgb, var(--ui-grid-accent) 45%, var(--ui-grid-border-color))', description: 'Editor border color.' },
        { name: '--ui-grid-cell-editor-radius', defaultValue: 'calc(var(--ui-grid-radius) - 1px)', description: 'Inline cell editor radius.' },
        { name: '--ui-grid-cell-editor-padding-block', defaultValue: '0.45rem', description: 'Editor vertical padding.' },
        { name: '--ui-grid-cell-editor-padding-inline', defaultValue: '0.55rem', description: 'Editor horizontal padding.' },
        { name: '--ui-grid-cell-editor-focus-outline', defaultValue: '2px solid color-mix(in srgb, var(--ui-grid-accent) 18%, transparent)', description: 'Editor focus outline.' },
      ],
    },
    {
      title: 'Group Rows And Drag States',
      rows: [
        { name: '--ui-grid-group-row-gap', defaultValue: '0.9rem', description: 'Gap inside group rows.' },
        { name: '--ui-grid-group-row-padding-block', defaultValue: '0.9rem', description: 'Group row vertical padding.' },
        { name: '--ui-grid-group-row-padding-inline', defaultValue: '1rem', description: 'Group row horizontal padding.' },
        { name: '--ui-grid-drag-preview-shadow', defaultValue: '0 12px 30px rgba(15, 23, 42, 0.16)', description: 'Drag preview shadow for column reordering.' },
        { name: '--ui-grid-drag-preview-radius', defaultValue: '0.9rem', description: 'Drag preview radius.' },
        { name: '--ui-grid-drag-placeholder-opacity', defaultValue: '0.3', description: 'Placeholder opacity during drag.' },
        { name: '--ui-grid-drag-placeholder-background', defaultValue: 'color-mix(in srgb, var(--ui-grid-accent) 9%, var(--ui-grid-header-background))', description: 'Placeholder background during drag.' },
        { name: '--ui-grid-drag-placeholder-border', defaultValue: '1px dashed color-mix(in srgb, var(--ui-grid-accent) 45%, var(--ui-grid-border-color))', description: 'Placeholder border during drag.' },
        { name: '--ui-grid-drag-placeholder-shadow', defaultValue: 'inset 0 0 0 1px color-mix(in srgb, var(--ui-grid-accent) 18%, transparent)', description: 'Placeholder shadow during drag.' },
      ],
    },
    {
      title: 'Empty State And Pagination',
      rows: [
        { name: '--ui-grid-empty-state-gap', defaultValue: '0.35rem', description: 'Gap between empty-state lines.' },
        { name: '--ui-grid-empty-state-min-height', defaultValue: '16rem', description: 'Minimum empty-state height.' },
        { name: '--ui-grid-empty-state-padding', defaultValue: '2rem', description: 'Empty-state padding.' },
        { name: '--ui-grid-pagination-gap', defaultValue: '1rem', description: 'Gap in the pagination bar.' },
        { name: '--ui-grid-pagination-padding-block', defaultValue: '0.85rem', description: 'Pagination bar vertical padding.' },
        { name: '--ui-grid-pagination-padding-inline', defaultValue: '1.25rem', description: 'Pagination bar horizontal padding.' },
        { name: '--ui-grid-pagination-controls-gap', defaultValue: '0.75rem', description: 'Gap between pagination controls.' },
        { name: '--ui-grid-pagination-size-gap', defaultValue: '0.4rem', description: 'Gap between rows-per-page label and select.' },
        { name: '--ui-grid-pagination-button-padding-block', defaultValue: '0.45rem', description: 'Pagination button vertical padding.' },
        { name: '--ui-grid-pagination-button-padding-inline', defaultValue: '0.8rem', description: 'Pagination button horizontal padding.' },
        { name: '--ui-grid-pagination-select-padding-block', defaultValue: '0.35rem', description: 'Pagination select vertical padding.' },
        { name: '--ui-grid-pagination-select-padding-inline', defaultValue: '0.55rem', description: 'Pagination select horizontal padding.' },
      ],
    },
  ];

  protected readonly themeSnippet = `.my-app {
  /* foundation */
  --ui-grid-surface: #1e1b2e;
  --ui-grid-border-color: rgba(139, 92, 246, 0.2);
  --ui-grid-header-background: #2d2640;
  --ui-grid-cell-color: #e2e0f0;
  --ui-grid-muted-color: #8b7fb0;
  --ui-grid-row-odd: #1e1b2e;
  --ui-grid-row-even: #252238;
  --ui-grid-row-hover: #322e4a;
  --ui-grid-accent: #8b5cf6;
  --ui-grid-group-background: #2d2640;

  /* structure */
  --ui-grid-radius: 16px;
  --ui-grid-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  --ui-grid-toolbar-padding-inline: 1.5rem;
  --ui-grid-body-cell-padding-inline: 1.25rem;

  /* controls */
  --ui-grid-control-size: 2.15rem;
  --ui-grid-pin-control-transition-duration: 200ms;
  --ui-grid-pin-menu-action-size: 1.9rem;
}

/* Or target specific parts */
.my-app app-ui-grid::part(header) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}`;
}
