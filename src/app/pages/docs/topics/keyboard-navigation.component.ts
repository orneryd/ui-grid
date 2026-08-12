import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-keyboard-navigation',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Keyboard Navigation (CellNav)</h1>
      <p class="docs-lead">
        Full parity with <code>ui.grid.cellNav</code> — arrow, Tab, Home, End, PageUp / PageDown,
        wrap / clamp at the edges, focus persistence across virtualization window changes, and
        <code>keyDownOverrides</code> so consumers can intercept specific combinations without
        re-implementing navigation.
      </p>

      <h2>Live Example</h2>
      <p>
        Click a cell and use the keyboard. Tab / Shift+Tab walks across columns;
        Arrow keys walk in every direction; Enter starts / commits edits; Escape cancels.
      </p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>

      <h2>Keyboard Matrix</h2>
      <table class="docs-table">
        <thead><tr><th>Key</th><th>Action</th></tr></thead>
        <tbody>
          <tr><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td>Move focus up / down one row</td></tr>
          <tr><td><kbd>←</kbd> / <kbd>→</kbd></td><td>Move focus left / right one column</td></tr>
          <tr><td><kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd></td><td>Next / previous cell (wraps to the next / previous row at the edge)</td></tr>
          <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>First / last cell of the current row</td></tr>
          <tr><td><kbd>Ctrl</kbd> + <kbd>Home</kbd> / <kbd>End</kbd></td><td>First / last cell of the grid</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>Begin editing (or commit + move down if already editing)</td></tr>
          <tr><td><kbd>F2</kbd></td><td>Begin editing without replacing the current value</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Cancel edit, restore value</td></tr>
          <tr><td><kbd>Space</kbd></td><td>Toggle row selection (when selection is enabled)</td></tr>
          <tr><td><kbd>Ctrl</kbd> + <kbd>A</kbd></td><td>Select all rows (when multi-select is enabled)</td></tr>
        </tbody>
      </table>

      <h2>Focus Persistence</h2>
      <p>
        The focused cell is tracked by <code>(rowId, columnName)</code>. When the virtual window
        shifts or the pipeline rebuilds (sort, filter, etc.) the focused cell's DOM node is
        re-found and re-focused — so holding the arrow key never drops focus into the grid
        background.
      </p>

      <h2>keyDownOverrides</h2>
      <p>
        Declare key combinations that should bypass the built-in handling — the grid raises
        <code>viewPortKeyDown</code> instead, and you handle the key however you like. Unspecified
        fields on the descriptor are wildcards.
      </p>
      <app-code-block lang="typescript" [code]="overrideSnippet" />

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method / Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>cellNav.getFocusedCell()</code></td><td>Returns <code>&#123; row, col &#125;</code> for the current focus, or <code>null</code></td></tr>
          <tr><td><code>cellNav.scrollToFocus(rowEntity, colDef)</code></td><td>Scroll the viewport so the target cell is visible, then focus it. Returns a promise that resolves after the render settles.</td></tr>
          <tr><td><code>cellNav.getCurrentSelection()</code></td><td>Array of <code>&#123; row, col &#125;</code> for every cell currently in the nav selection rectangle</td></tr>
          <tr><td><code>cellNav.rowColSelectIndex(rowCol)</code></td><td>0-based position of the given cell within the current selection rectangle (<code>-1</code> if outside)</td></tr>
          <tr><td><code>cellNav.on.navigate(fn)</code></td><td>Fires with <code>(newRowCol, oldRowCol)</code> on every focus change</td></tr>
          <tr><td><code>cellNav.on.viewPortKeyDown(fn)</code></td><td>Fires when a <code>keyDownOverrides</code> match lets a key bubble up unhandled</td></tr>
          <tr><td><code>cellNav.on.viewPortKeyPress(fn)</code></td><td>Keypress counterpart</td></tr>
        </tbody>
      </table>

      <h2>Usage</h2>
      <app-code-block lang="typescript" [code]="usageSnippet" />
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsKeyboardNavigationComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'docs-cellnav-demo',
    data: createSmallDemoData(8),
    rowHeight: 44,
    enableSorting: true,
    enableFiltering: true,
    enableCellEdit: true,
    columnDefs: [
      { name: 'name', displayName: 'Customer', enableCellEdit: true },
      { name: 'company', enableCellEdit: true },
      { name: 'status', enableCellEdit: true },
      { name: 'revenue', type: 'number', align: 'end', enableCellEdit: true },
    ],
  };

  protected readonly overrideSnippet = `const options: GridOptions = {
  keyDownOverrides: [
    // Let Ctrl+S through — bind a global "Save" shortcut without the grid
    // swallowing it:
    { key: 's', ctrlKey: true },
    // Any Alt + arrow combination:
    { key: 'ArrowLeft', altKey: true },
    { key: 'ArrowRight', altKey: true },
  ],
  onRegisterApi: (api) => {
    api.cellNav.on.viewPortKeyDown((event, rowCol) => {
      if (event.key === 's' && event.ctrlKey) {
        event.preventDefault();
        saveCurrentView();
      } else if (event.key === 'ArrowLeft' && event.altKey) {
        history.back();
      }
    });
  },
};`;

  protected readonly usageSnippet = `gridApi.cellNav.on.navigate((newRowCol, oldRowCol) => {
  console.log('focus moved to', newRowCol?.row.entity, newRowCol?.col.name);
});

// Programmatic focus:
await gridApi.cellNav.scrollToFocus(rowEntity, colDef);

// Where is the user right now?
const current = gridApi.cellNav.getFocusedCell();
if (current) {
  console.log(current.row.entity, current.col.name);
}`;
}
