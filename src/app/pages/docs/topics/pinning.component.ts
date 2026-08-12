import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-pinning',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Column Pinning</h1>
      <p class="docs-lead">
        Pin columns to the left or right edge. Pinned columns stick during horizontal scroll via
        <code>position: sticky</code> offsets computed per cell. The grid uses three separate scroll
        containers (header strip, filter strip, body viewport) with JS-synced
        <code>scrollLeft</code> so sticky positioning resolves correctly in each region.
      </p>

      <h2>Live Example</h2>
      <p>
        The <strong>Customer</strong> column is pinned left, <strong>Revenue</strong> pinned right.
        Scroll horizontally or use the pin menu in any header to pin / unpin additional columns.
      </p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>

      <h2>Options</h2>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Location</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>enablePinning</code></td><td>GridOptions</td><td>Master toggle — renders the pin menu on every pinnable column</td></tr>
          <tr><td><code>enablePinning</code></td><td>colDef</td><td>Per-column override (<code>false</code> disables the menu for that column only)</td></tr>
          <tr><td><code>pinnedLeft</code> / <code>pinnedRight</code></td><td>colDef</td><td>Pin the column in that direction on initial render</td></tr>
        </tbody>
      </table>

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method / Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>pinning.pinColumn(columnName, direction)</code></td><td><code>direction</code>: <code>'left'</code> / <code>'right'</code> / <code>'none'</code></td></tr>
          <tr><td><code>pinning.on.columnPinned(fn)</code></td><td>Fires with <code>(columnName, direction)</code> on any pin change</td></tr>
        </tbody>
      </table>

      <h2>How the Sticky Layout Works</h2>
      <p>
        Each pinned cell gets <code>position: sticky</code> with a computed <code>left</code> or
        <code>right</code> offset. The three regions (header strip, filter strip, body viewport)
        are each their own scroll container so <code>sticky</code> resolves correctly even inside
        the virtualized body. They share the same column track template so the pinned rails stay
        perfectly aligned. Horizontal scroll is driven by the body viewport;
        <code>syncHeaderHorizontalScroll</code> mirrors <code>scrollLeft</code> onto the header
        and filter strips on every scroll frame. A wheel handler on the strips forwards gestures
        to the body viewport to prevent desync.
      </p>

      <h2>Styling</h2>
      <p>
        Pinned cells get the <code>.is-pinned</code> class. The divider shadow between the pinned
        edge and the scrolling center area is driven by:
      </p>
      <table class="docs-table docs-table-compact">
        <thead><tr><th>Variable</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><code>--ui-grid-pinned-divider-shadow-left</code></td><td>Drop shadow cast onto the left-pinned rail when scrolled away from start</td></tr>
          <tr><td><code>--ui-grid-pinned-divider-shadow-right</code></td><td>Drop shadow cast onto the right-pinned rail when scrolled away from end</td></tr>
          <tr><td><code>--ui-grid-pinned-divider-clip-left</code> / <code>-right</code></td><td>Clip masks so the shadow doesn't bleed outside the frame</td></tr>
          <tr><td><code>--ui-grid-pin-menu-*</code></td><td>Radius / padding / shadow for the pop-up pin menu</td></tr>
        </tbody>
      </table>

      <h2>Usage</h2>
      <app-code-block lang="typescript" [code]="usageSnippet" />
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsPinningComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'docs-pinning-demo',
    data: createSmallDemoData(8),
    rowHeight: 44,
    enableSorting: true,
    enableFiltering: true,
    enablePinning: true,
    columnDefs: [
      { name: 'name', displayName: 'Customer', pinnedLeft: true, width: '12rem' },
      { name: 'company', width: '14rem' },
      { name: 'status', width: '10rem' },
      {
        name: 'revenue',
        type: 'number',
        align: 'end',
        pinnedRight: true,
        width: '10rem',
      },
    ],
  };

  protected readonly usageSnippet = `const options: GridOptions = {
  enablePinning: true,
  columnDefs: [
    { name: 'name', pinnedLeft: true },          // sticks to the left edge
    { name: 'company' },                         // scrolls normally
    { name: 'status' },
    { name: 'revenue', pinnedRight: true },      // sticks to the right edge
  ],
  onRegisterApi: (api) => {
    // Toggle pinning at runtime:
    api.pinning.pinColumn('status', 'left');
    api.pinning.pinColumn('status', 'none');     // unpin

    api.pinning.on.columnPinned((columnName, direction) => {
      console.log(columnName, '→', direction);
    });
  },
};`;
}
