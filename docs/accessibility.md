# Accessibility

UI Grid is built with accessibility as a core concern. The grid applies WAI-ARIA grid semantics, supports full keyboard navigation, manages focus across editing and scrolling, and routes all visible text through the i18n system so screen reader announcements localize automatically.

## ARIA Roles

The grid maps its structure to the [WAI-ARIA grid pattern](https://www.w3.org/WAI/ARIA/apd/pattern/grid/):

| Element | Role | Notes |
|---------|------|-------|
| Grid container | `grid` | Top-level landmark; `aria-label` set from `options.title` (defaults to `"Data grid"`) |
| Header row | `row` | Contains column headers |
| Header cell | `columnheader` | One per visible column |
| Body container | `rowgroup` | Groups all data rows |
| Data row | `row` | One per visible record |
| Data cell | `gridcell` | Contains cell content or editor |
| Group row | `row` | Collapsible group header with `aria-expanded` |
| Pagination | `navigation` | `aria-label` from `labels.paginationPage` |

When tree view or expandable rows are active, `aria-expanded` is set on the toggle buttons to communicate open/closed state to assistive technology.

## aria-* Attributes

| Attribute | Where | Value |
|-----------|-------|-------|
| `aria-label` | Grid container | `options.title` or `"Data grid"` |
| `aria-label` | Sort buttons | Dynamic: `"Sort"`, `"Sort ascending"`, `"Sort descending"` (from i18n labels) |
| `aria-label` | Group toggle buttons | `"Group by this column"` / `"Remove grouping"` |
| `aria-label` | Tree toggle buttons | `"Collapse"` / `"Expand"` |
| `aria-label` | Expand detail buttons | `"Expand row"` / `"Collapse row"` |
| `aria-label` | Filter inputs | `"Filter {column name}"` |
| `aria-label` | Cell editor input | Column display name |
| `aria-label` | Pagination nav | `"Page"` |
| `aria-label` | Previous/Next buttons | `"Previous"` / `"Next"` |
| `aria-sort` | Column headers | `"ascending"`, `"descending"`, or `"none"` |
| `aria-expanded` | Tree/expand/group toggles | `true` or `false` |
| `aria-hidden` | Decorative SVG icons | `true` (with `focusable="false"`) |

All `aria-label` values are sourced from the i18n `GridLabels` object, so they localize automatically when you provide translated labels.

## Keyboard Navigation

Every data cell receives `tabindex="0"`, making the grid fully keyboard-navigable. The following keys are handled:

### Grid Navigation

| Key | Action |
|-----|--------|
| `Arrow Left` | Move focus one cell left (wraps to previous row) |
| `Arrow Right` | Move focus one cell right (wraps to next row) |
| `Arrow Up` | Move focus one row up |
| `Arrow Down` | Move focus one row down |
| `Tab` | Move to next cell (same as Arrow Right) |
| `Shift + Tab` | Move to previous cell (same as Arrow Left) |
| `Enter` | Move down one row (Shift+Enter = up) |

### Cell Editing

| Key | Action |
|-----|--------|
| `F2` | Begin editing the focused cell (if editable) |
| `Backspace` / `Delete` | Clear cell value and enter edit mode |
| Any printable character | Begin editing with that character as initial input |
| `Escape` | Cancel edit, restore original value, return focus to cell |
| `Enter` | Commit edit, move focus down (Shift = up) |
| `Tab` | Commit edit, move focus to next cell (Shift = previous) |

A "printable character" is any single-character key pressed without Ctrl, Meta, or Alt modifiers.

## Focus Management

Focus management operates inside the grid's Shadow DOM:

- **Cell focus** — after keyboard navigation or virtual scroll repositioning, `focusGridRenderedCell()` queries the shadow root for the target cell by `data-row-id` and `data-col-name` attributes. A `requestAnimationFrame` retry handles cases where Angular hasn't rendered the target cell yet.
- **Editor focus** — when a cell enters edit mode, `focusGridEditor()` finds the editor input in the shadow root and calls `input.select()` to select all text.
- **Cancellation** — a focus token prevents stale focus calls from previous navigation actions.

## Screen Reader Support

Visually hidden text (`.sr-only` / `.ui-grid-sr-only`) provides labels where icon-only buttons or implicit context would otherwise leave screen reader users without information:

- Sort buttons include hidden text matching the `aria-label`
- Group toggle buttons include hidden text for the action
- Filter cells include a hidden `"Filter {column name}"` label
- Group disclosure rows include hidden `"Collapse group"` / `"Expand group"` text
- Pagination Previous/Next icon buttons include hidden text

The `.sr-only` class uses the standard clip technique (1px box, `overflow: hidden`, `clip: rect(0,0,0,0)`), available as both `.sr-only` and `.ui-grid-sr-only` in the grid's Shadow DOM styles.

## Localized Announcements

Every screen reader label flows through the `GridLabels` i18n system. When you provide translated labels (via `GridOptions.labels` at runtime or a baked-in locale at build time), all ARIA labels and screen reader text update automatically. See the [Internationalization](./i18n.md) guide for details.

## Theming and Contrast

The grid's CSS custom property system supports high-contrast themes:

- Override `--ui-grid-cell-color`, `--ui-grid-muted-color`, `--ui-grid-surface`, and `--ui-grid-accent` to meet WCAG contrast ratios
- The `data-color-mode` / `data-visual-mode` attribute pattern (used in the demo app) demonstrates how to provide accessible light and dark modes without JavaScript theme-switching logic
- Focus indicators use the `--ui-grid-accent` color for sort indicators and active states

## Custom Cell Templates

When providing custom cell templates via `cellTemplate` or `cellRenderer`, ensure your content is accessible:

- Use semantic HTML elements where possible
- Add `aria-label` or `aria-labelledby` to interactive elements
- Ensure custom controls are keyboard-reachable (`tabindex="0"` on interactive elements)
- Maintain sufficient color contrast in custom-rendered content
