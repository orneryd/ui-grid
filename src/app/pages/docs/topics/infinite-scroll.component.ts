import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GridOptions, UiGridApi, UiGridComponent, GridRecord } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';

@Component({
  selector: 'app-docs-infinite-scroll',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Infinite Scroll</h1>
      <p class="docs-lead">
        Bi-directional paging driven by scroll position. The grid raises
        <code>needLoadMoreData</code> as the viewport nears the bottom (and
        <code>needLoadMoreDataTop</code> near the top when enabled); the consumer fetches the next
        window and calls <code>dataLoaded()</code>. Scroll percentage can be saved and restored so
        data swaps don't jump the viewport.
      </p>

      <h2>Live Example</h2>
      <p>Scroll to the bottom — another 20 synthetic rows load per fetch.</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
      <p>
        Rows loaded: <strong>{{ loaded() }}</strong> · Fetches: <strong>{{ fetches() }}</strong>
      </p>

      <h2>Options</h2>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>enableInfiniteScroll</code></td><td>false</td><td>Master toggle. Works in both virtualized and non-virtualized modes.</td></tr>
          <tr><td><code>infiniteScrollRowsFromEnd</code></td><td>20</td><td>Fire <code>needLoadMoreData</code> when the user is within this many rows of the end</td></tr>
          <tr><td><code>infiniteScrollUp</code></td><td>false</td><td>Fire <code>needLoadMoreDataTop</code> when scrolling past the top threshold</td></tr>
          <tr><td><code>infiniteScrollDown</code></td><td>true</td><td>Fire <code>needLoadMoreData</code> when approaching the bottom</td></tr>
        </tbody>
      </table>

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method / Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>infiniteScroll.on.needLoadMoreData(fn)</code></td><td>Fires once when the bottom threshold is crossed. <code>dataLoading</code> is flipped on to suppress repeat fires until <code>dataLoaded()</code> completes.</td></tr>
          <tr><td><code>infiniteScroll.on.needLoadMoreDataTop(fn)</code></td><td>Top-side counterpart (only fires when <code>infiniteScrollUp</code> is enabled)</td></tr>
          <tr><td><code>infiniteScroll.dataLoaded(scrollUp?, scrollDown?)</code></td><td>Called after you've appended / prepended the next window. Arguments override whether future fires remain enabled in each direction.</td></tr>
          <tr><td><code>infiniteScroll.resetScroll(scrollUp?, scrollDown?)</code></td><td>Re-enable the threshold and reset the one-shot guard (use after a full data reset, e.g. filter change)</td></tr>
          <tr><td><code>infiniteScroll.saveScrollPercentage()</code></td><td>Capture the current scroll ratio before swapping data. The next render restores it.</td></tr>
          <tr><td><code>infiniteScroll.dataRemovedTop(scrollUp?, scrollDown?)</code></td><td>Call after trimming rows off the top (so the threshold re-arms)</td></tr>
          <tr><td><code>infiniteScroll.dataRemovedBottom(scrollUp?, scrollDown?)</code></td><td>Call after trimming rows off the bottom</td></tr>
          <tr><td><code>infiniteScroll.setScrollDirections(up, down)</code></td><td>Enable / disable direction flags on the fly</td></tr>
        </tbody>
      </table>

      <h2>Usage</h2>
      <app-code-block lang="typescript" [code]="usageSnippet" />

      <h2>Interaction with Virtualization</h2>
      <p>
        Infinite scroll works with or without virtualization. When virtualization is on, the grid
        fires the threshold event based on the logical scroll position rather than the DOM's
        rendered window, so you don't get spurious fires when the virtual spacer is tall.
      </p>
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsInfiniteScrollComponent {
  private gridApi: UiGridApi | null = null;
  protected readonly loaded = signal(40);
  protected readonly fetches = signal(0);

  private readonly rows: GridRecord[] = Array.from({ length: 40 }, (_value, index) =>
    this.makeRow(index),
  );

  protected readonly demoOptions: GridOptions = {
    id: 'docs-infinite-scroll-demo',
    data: this.rows,
    rowHeight: 40,
    enableInfiniteScroll: true,
    infiniteScrollRowsFromEnd: 8,
    infiniteScrollDown: true,
    columnDefs: [
      { name: 'id', width: '6rem' },
      { name: 'name', displayName: 'Customer' },
      { name: 'revenue', type: 'number', align: 'end' },
    ],
    onRegisterApi: (api) => {
      this.gridApi = api as UiGridApi;
      this.gridApi.infiniteScroll.on.needLoadMoreData(() => {
        this.fetches.update((count) => count + 1);
        const start = this.rows.length;
        for (let index = 0; index < 20; index += 1) {
          this.rows.push(this.makeRow(start + index));
        }
        this.loaded.set(this.rows.length);
        // Let future scroll fires through after we've appended the new window.
        void this.gridApi!.infiniteScroll.dataLoaded();
        this.gridApi!.core.refresh();
      });
    },
  };

  private makeRow(index: number): GridRecord {
    return {
      id: `r-${index + 1}`,
      name: `Customer ${index + 1}`,
      revenue: 10_000 + index * 250,
    };
  }

  protected readonly usageSnippet = `const options: GridOptions = {
  enableInfiniteScroll: true,
  infiniteScrollRowsFromEnd: 20,                // fire 20 rows from the bottom
  infiniteScrollUp: false,
  infiniteScrollDown: true,
  data: initialWindow,
  onRegisterApi: (api) => {
    api.infiniteScroll.on.needLoadMoreData(async () => {
      const nextWindow = await fetch(\`/api/rows?after=\${lastId()}\`).then((r) => r.json());
      options.data = [...options.data, ...nextWindow.rows];
      // dataLoaded re-enables the bottom threshold. Pass false to stop further
      // fires when you've reached the end of the dataset.
      const hasMore = nextWindow.hasMore;
      await api.infiniteScroll.dataLoaded(false, hasMore);
      api.core.refresh();
    });
  },
};`;
}
