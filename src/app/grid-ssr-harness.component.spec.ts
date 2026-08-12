import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { GridSsrHarnessComponent } from './grid-ssr-harness.component';

describe('GridSsrHarnessComponent', () => {
  it('renders an empty shell during SSR (grid initializes client-side only)', async () => {
    const html = await renderApplication(
      (context) => bootstrapApplication(GridSsrHarnessComponent, {
        providers: [provideServerRendering()]
      }, context),
      {
        document: '<!doctype html><html><body><app-grid-ssr-harness></app-grid-ssr-harness></body></html>',
        url: 'http://localhost/ssr-harness',
        allowedHosts: ['localhost']
      }
    );

    expect(html).toContain('app-grid-ssr-harness');
    expect(html).toContain('app-ui-grid');
    expect(html).not.toContain('data-row-id');
  });
});
