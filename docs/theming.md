# Theming

UI Grid uses Shadow DOM encapsulation. All visual customization flows through CSS custom properties and `::part()` selectors.

The runtime styles now normalize theme resolution around the public `--ui-grid-*` token names again. Legacy `--app-ui-grid-*` aliases still work as a fallback, but consumer themes should target the public `--ui-grid-*` surface.

## How It Works

The grid component renders inside a Shadow DOM boundary. Parent styles cannot leak in. Instead, the grid exposes two theming surfaces:

1. **CSS custom properties** — set `--ui-grid-*` variables on any ancestor element. They pierce the shadow boundary. Legacy `--app-ui-grid-*` aliases remain supported as fallback input for older app themes.
2. **`::part()` selectors** — target specific structural elements by their part name for full CSS access.

All public styling tokens follow the `--ui-grid-*` naming pattern.

## Recommended Override Pattern

```css
.my-app {
  --ui-grid-surface: #1e1b2e;
  --ui-grid-accent: #8b5cf6;
  --ui-grid-header-background: #2d2640;
  --ui-grid-cell-color: #e2e0f0;
  --ui-grid-border-color: rgba(139, 92, 246, 0.2);
  --ui-grid-row-hover: #322e4a;
}
```

If you already ship older `--app-ui-grid-*` theme tokens, they still work as a compatibility fallback. New consumer themes should use only `--ui-grid-*`.

## CSS Custom Properties

### Foundation

| Variable | Default | Controls |
|----------|---------|----------|
| `--ui-grid-surface` | `#ffffff` | Base surface for the frame, controls, menus, and inputs |
| `--ui-grid-border-color` | `#d4d4d8` | Shared border color across frame, cells, controls, and menus |
| `--ui-grid-header-background` | `#f3f4f6` | Header and filter row background |
| `--ui-grid-header-weight` | `700` | Header label font weight |
| `--ui-grid-cell-color` | `#111827` | Primary text color for rows and controls |
| `--ui-grid-muted-color` | `#6b7280` | Secondary text color for helper copy and inactive controls |
| `--ui-grid-row-odd` | `#fcfcfd` | Odd striped row background |
| `--ui-grid-row-even` | `#f7f7f8` | Even striped row background |
| `--ui-grid-row-hover` | `#eef4ff` | Row hover background |
| `--ui-grid-accent` | `#2563eb` | Accent color for active states, focus rings, and highlighted controls |
| `--ui-grid-group-background` | `#eceff3` | Group header row background |
| `--ui-grid-radius` | `4px` | Base corner radius reused by frame, cards, and inputs |
| `--ui-grid-shadow` | `0 10px 24px rgba(15, 23, 42, 0.08)` | Frame shadow |

### Status Pills

| Variable | Default | Controls |
|----------|---------|----------|
| `--ui-grid-status-active-bg` | `rgba(22, 163, 74, 0.14)` | Active pill background |
| `--ui-grid-status-active-color` | `#166534` | Active pill text |
| `--ui-grid-status-expansion-bg` | `rgba(37, 99, 235, 0.14)` | Expansion pill background |
| `--ui-grid-status-expansion-color` | `#1d4ed8` | Expansion pill text |
| `--ui-grid-status-enterprise-bg` | `rgba(15, 118, 110, 0.14)` | Enterprise pill background |
| `--ui-grid-status-enterprise-color` | `#115e59` | Enterprise pill text |
| `--ui-grid-status-pilot-bg` | `rgba(234, 88, 12, 0.14)` | Pilot pill background |
| `--ui-grid-status-pilot-color` | `#c2410c` | Pilot pill text |
| `--ui-grid-status-pill-padding-block` | `0.2rem` | Vertical pill padding |
| `--ui-grid-status-pill-padding-inline` | `0.55rem` | Horizontal pill padding |
| `--ui-grid-status-pill-radius` | `999px` | Pill border radius |
| `--ui-grid-status-pill-font-size` | `0.85rem` | Pill font size |
| `--ui-grid-status-pill-default-bg` | `rgba(15, 23, 42, 0.07)` | Default pill background when no named state class is applied |

### Shell And Hero

| Variable | Default | Controls |
|----------|---------|----------|
| `--ui-grid-shell-gap` | `1.5rem` | Gap between major shell sections |
| `--ui-grid-hero-gap` | `1.5rem` | Gap between hero content and actions |
| `--ui-grid-hero-padding-block` | `1rem` | Hero top and bottom padding |
| `--ui-grid-eyebrow-margin-block-end` | `0.5rem` | Space under the eyebrow label |
| `--ui-grid-eyebrow-letter-spacing` | `0.18em` | Eyebrow tracking |
| `--ui-grid-eyebrow-font-size` | `0.72rem` | Eyebrow size |
| `--ui-grid-hero-title-font-size` | `clamp(1.4rem, 2vw, 2rem)` | Hero title size |
| `--ui-grid-hero-title-line-height` | `1.1` | Hero title line height |
| `--ui-grid-hero-deck-max-width` | `56ch` | Max width for the intro paragraph |
| `--ui-grid-hero-deck-margin-block-start` | `0.75rem` | Space above the deck paragraph |
| `--ui-grid-hero-actions-gap` | `1rem` | Gap between hero actions |
| `--ui-grid-action-radius` | `999px` | CTA button radius |
| `--ui-grid-action-padding-block` | `0.8rem` | CTA button vertical padding |
| `--ui-grid-action-padding-inline` | `1.1rem` | CTA button horizontal padding |
| `--ui-grid-stats-card-min-width` | `8rem` | Minimum width for hero stats cards |
| `--ui-grid-stats-card-padding-block` | `0.85rem` | Stats card vertical padding |
| `--ui-grid-stats-card-padding-inline` | `1rem` | Stats card horizontal padding |
| `--ui-grid-stats-card-value-font-size` | `1.9rem` | Hero stats numeric size |

### Frame, Metrics, Toolbar, And Scrolling

| Variable | Default | Controls |
|----------|---------|----------|
| `--ui-grid-metrics-gap` | `1rem` | Gap between metric cards |
| `--ui-grid-metric-card-padding-block` | `1rem` | Metric card vertical padding |
| `--ui-grid-metric-card-padding-inline` | `1.1rem` | Metric card horizontal padding |
| `--ui-grid-metric-value-font-size` | `1.3rem` | Metric value size |
| `--ui-grid-toolbar-gap` | `1rem` | Gap inside the toolbar |
| `--ui-grid-toolbar-padding-block` | `1rem` | Toolbar vertical padding |
| `--ui-grid-toolbar-padding-inline` | `1.25rem` | Toolbar horizontal padding |
| `--ui-grid-toolbar-inline-gap` | `0.4rem` | Inline gap in toolbar text blocks |
| `--ui-grid-overflow-x` | `auto` | Horizontal overflow behavior for the single grid scroll container |
| `--ui-grid-overflow-y` | `auto` | Vertical overflow behavior for the single grid scroll container |

### Header, Pinning, And Controls

| Variable | Default | Controls |
|----------|---------|----------|
| `--ui-grid-header-z-index` | `3` | Sticky header and filter row stacking level |
| `--ui-grid-pinned-cell-z-index` | `2` | Sticky pinned cell stacking level |
| `--ui-grid-pin-menu-open-z-index` | `8` | Header cell stacking level when the inline pin chooser is open |
| `--ui-grid-pin-menu-z-index` | `20` | Pin chooser internal stacking level |
| `--ui-grid-header-cell-gap` | `0.75rem` | Gap between header label and action cluster |
| `--ui-grid-header-cell-padding-block` | `0.85rem` | Header cell vertical padding |
| `--ui-grid-header-cell-padding-inline` | `1rem` | Header cell horizontal padding |
| `--ui-grid-header-cell-background-active` | `color-mix(in srgb, var(--ui-grid-accent) 8%, var(--ui-grid-header-background))` | Background for an active sorted header cell |
| `--ui-grid-pinned-divider-shadow-left` | `2px 0 4px rgba(0, 0, 0, 0.06)` | Shadow on the trailing edge of left-pinned columns |
| `--ui-grid-pinned-divider-shadow-right` | `-2px 0 4px rgba(0, 0, 0, 0.06)` | Shadow on the leading edge of right-pinned columns |
| `--ui-grid-pinned-divider-clip-left` | `inset(0 -4px 0 0)` | Clip path for the left pinned divider shadow |
| `--ui-grid-pinned-divider-clip-right` | `inset(0 0 0 -4px)` | Clip path for the right pinned divider shadow |
| `--ui-grid-header-actions-gap` | `0.4rem` | Gap between sort, group, and pin actions |
| `--ui-grid-control-size` | `2rem` | Shared square size for header action chips |
| `--ui-grid-control-radius` | `999px` | Shared control radius |
| `--ui-grid-control-icon-size` | `1rem` | Icon size for action chips and pin arrows |
| `--ui-grid-control-background` | `var(--ui-grid-surface)` | Base control background |
| `--ui-grid-control-border-color` | `var(--ui-grid-border-color)` | Base control border color |
| `--ui-grid-control-color` | `var(--ui-grid-muted-color)` | Base control icon and text color |
| `--ui-grid-control-background-active` | `color-mix(in srgb, var(--ui-grid-accent) 12%, var(--ui-grid-surface))` | Active control background |
| `--ui-grid-control-border-color-active` | `color-mix(in srgb, var(--ui-grid-accent) 35%, var(--ui-grid-border-color))` | Active control border |
| `--ui-grid-control-color-active` | `var(--ui-grid-accent)` | Active control icon and text color |
| `--ui-grid-pin-menu-gap` | `0.25rem` | Gap between inline pin chooser arrows |
| `--ui-grid-pin-menu-padding` | `0.25rem` | Padding inside the inline pin chooser |
| `--ui-grid-pin-menu-radius` | `999px` | Inline pin chooser radius |
| `--ui-grid-pin-menu-shadow` | `0 10px 24px color-mix(in srgb, var(--ui-grid-cell-color) 10%, transparent)` | Inline pin chooser shadow |
| `--ui-grid-pin-menu-action-size` | `1.75rem` | Size of each left or right pin action |
| `--ui-grid-pin-control-collapsed-size` | `1px` | Final collapsed size of the pin button while the chooser opens |
| `--ui-grid-pin-control-transition-duration` | `160ms` | Duration for the inline pin control animation |
| `--ui-grid-pin-control-transition-easing` | `cubic-bezier(0.22, 1, 0.36, 1)` | Easing curve for pin control motion |
| `--ui-grid-pin-menu-scale-closed` | `0.72` | Closed-state scale used before the chooser expands in place |

### Filters

| Variable | Default | Controls |
|----------|---------|----------|
| `--ui-grid-filter-cell-padding-block-start` | `0.75rem` | Filter row top padding |
| `--ui-grid-filter-cell-padding-block-end` | `1rem` | Filter row bottom padding |
| `--ui-grid-filter-cell-padding-inline` | `1rem` | Filter row horizontal padding |
| `--ui-grid-filter-input-padding-block` | `0.55rem` | Filter input vertical padding |
| `--ui-grid-filter-input-padding-inline` | `0.7rem` | Filter input horizontal padding |
| `--ui-grid-filter-input-focus-outline` | `2px solid color-mix(in srgb, var(--ui-grid-accent) 18%, transparent)` | Focus outline for filter inputs |

### Rows, Cells, And Editing

| Variable | Default | Controls |
|----------|---------|----------|
| `--ui-grid-body-cell-padding-block` | `0.95rem` | Body cell vertical padding |
| `--ui-grid-body-cell-padding-inline` | `1rem` | Body cell horizontal padding |
| `--ui-grid-cell-shell-gap` | `0.55rem` | Gap between toggles and content inside a cell |
| `--ui-grid-row-toggle-size` | `1.55rem` | Tree and expandable toggle size |
| `--ui-grid-row-toggle-radius` | `999px` | Tree and expandable toggle radius |
| `--ui-grid-toggle-icon-size` | `1.1rem` | General toggle icon size |
| `--ui-grid-group-disclosure-icon-size` | `0.9rem` | Group row disclosure icon size |
| `--ui-grid-pagination-icon-size` | `1.2rem` | Pagination icon size |
| `--ui-grid-expandable-row-padding-block` | `1rem` | Expanded row vertical padding |
| `--ui-grid-expandable-row-padding-inline` | `1.25rem` | Expanded row horizontal padding |
| `--ui-grid-expandable-row-background` | `color-mix(in srgb, var(--ui-grid-accent) 4%, var(--ui-grid-surface))` | Expanded row background |
| `--ui-grid-cell-focus-background` | `color-mix(in srgb, var(--ui-grid-accent) 10%, var(--ui-grid-surface))` | Focused cell background |
| `--ui-grid-cell-focus-ring` | `inset 0 0 0 1px color-mix(in srgb, var(--ui-grid-accent) 28%, transparent)` | Focus ring for keyboard-focused cells |
| `--ui-grid-cell-editing-background` | `color-mix(in srgb, var(--ui-grid-accent) 7%, var(--ui-grid-surface))` | Editing cell background |
| `--ui-grid-cell-editor-border-color` | `color-mix(in srgb, var(--ui-grid-accent) 45%, var(--ui-grid-border-color))` | Editor border color |
| `--ui-grid-cell-editor-radius` | `calc(var(--ui-grid-radius) - 1px)` | Inline cell editor radius |
| `--ui-grid-cell-editor-padding-block` | `0.45rem` | Editor vertical padding |
| `--ui-grid-cell-editor-padding-inline` | `0.55rem` | Editor horizontal padding |
| `--ui-grid-cell-editor-focus-outline` | `2px solid color-mix(in srgb, var(--ui-grid-accent) 18%, transparent)` | Editor focus outline |

### Group Rows And Drag States

| Variable | Default | Controls |
|----------|---------|----------|
| `--ui-grid-group-row-gap` | `0.9rem` | Gap inside group rows |
| `--ui-grid-group-row-padding-block` | `0.9rem` | Group row vertical padding |
| `--ui-grid-group-row-padding-inline` | `1rem` | Group row horizontal padding |
| `--ui-grid-drag-preview-shadow` | `0 12px 30px rgba(15, 23, 42, 0.16)` | Drag preview shadow for column reordering |
| `--ui-grid-drag-preview-radius` | `0.9rem` | Drag preview radius |
| `--ui-grid-drag-placeholder-opacity` | `0.3` | Placeholder opacity during drag |
| `--ui-grid-drag-placeholder-background` | `color-mix(in srgb, var(--ui-grid-accent) 9%, var(--ui-grid-header-background))` | Placeholder background during drag |
| `--ui-grid-drag-placeholder-border` | `1px dashed color-mix(in srgb, var(--ui-grid-accent) 45%, var(--ui-grid-border-color))` | Placeholder border during drag |
| `--ui-grid-drag-placeholder-shadow` | `inset 0 0 0 1px color-mix(in srgb, var(--ui-grid-accent) 18%, transparent)` | Placeholder shadow during drag |

### Empty State And Pagination

| Variable | Default | Controls |
|----------|---------|----------|
| `--ui-grid-empty-state-gap` | `0.35rem` | Gap between empty-state lines |
| `--ui-grid-empty-state-min-height` | `16rem` | Minimum empty-state height |
| `--ui-grid-empty-state-padding` | `2rem` | Empty-state padding |
| `--ui-grid-pagination-gap` | `1rem` | Gap in the pagination bar |
| `--ui-grid-pagination-padding-block` | `0.85rem` | Pagination bar vertical padding |
| `--ui-grid-pagination-padding-inline` | `1.25rem` | Pagination bar horizontal padding |
| `--ui-grid-pagination-controls-gap` | `0.75rem` | Gap between pagination controls |
| `--ui-grid-pagination-size-gap` | `0.4rem` | Gap between rows-per-page label and select |
| `--ui-grid-pagination-button-padding-block` | `0.45rem` | Pagination button vertical padding |
| `--ui-grid-pagination-button-padding-inline` | `0.8rem` | Pagination button horizontal padding |
| `--ui-grid-pagination-select-padding-block` | `0.35rem` | Pagination select vertical padding |
| `--ui-grid-pagination-select-padding-inline` | `0.55rem` | Pagination select horizontal padding |

## `::part()` Hooks

| Part Name | Target Element |
|-----------|----------------|
| `shell` | Outermost grid wrapper |
| `hero` | Title/toolbar area |
| `grid-frame` | Scrollable grid container |
| `grid-toolbar` | Toolbar with row count |
| `header` | Header row container |
| `header-cell` | Individual header cell |
| `filter-cell` | Filter input cell |
| `body-cell` | Data cell |
| `group-row` | Group header row |
| `expandable-row` | Expanded detail row |
| `pagination` | Pagination footer |
| `empty-state` | Empty state message |

## Example: Custom Brand Theme

```scss
.my-app {
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

/* Target specific parts for full CSS access */
.my-app app-ui-grid::part(header) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## Host Attribute Pattern

The demo app uses `data-color-mode` and `data-visual-mode` attributes on the root component to drive a 2×2 theme matrix (dark/light × studio/wireframe). Each combination defines a full set of semantic CSS tokens that cascade into the grid:

```scss
:host([data-color-mode='dark'][data-visual-mode='default']) {
  --grid-surface: #0b1824;
  --grid-header: #112434;
  --grid-text: #ebf5f9;
  --grid-accent: #67e8f9;
  /* ...then map to --ui-grid-* on the grid container */
}
```

You can use this same pattern in your own app to support multiple themes without JavaScript logic. If you already have legacy `--app-ui-grid-*` aliases in your codebase, you can leave them in place while standardizing new theme work on the public `--ui-grid-*` names.
