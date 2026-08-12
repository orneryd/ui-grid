import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../shared/code-block.component';
import { createSmallDemoData } from '../shared/demo-data';

@Component({
  selector: 'app-themes',
  imports: [UiGridComponent, CodeBlockComponent],
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemesComponent {
  protected readonly previewOptions: GridOptions = {
    id: 'theme-preview',
    data: createSmallDemoData(8),
    rowHeight: 46,
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: false,
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'company' },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end', formatter: (v) => `$${Number(v).toLocaleString()}` }
    ]
  };

  protected readonly sampleTheme = `/* Your app's SCSS — override grid variables on any ancestor */
.my-app-shell {
  /* Core surfaces */
  --ui-grid-surface: #1e1b2e;
  --ui-grid-border-color: rgba(139, 92, 246, 0.2);
  --ui-grid-header-background: #2d2640;
  --ui-grid-header-weight: 700;

  /* Cell text */
  --ui-grid-cell-color: #e2e0f0;
  --ui-grid-muted-color: #8b7fb0;

  /* Row striping */
  --ui-grid-row-odd: #1e1b2e;
  --ui-grid-row-even: #252238;
  --ui-grid-row-hover: #322e4a;

  /* Accent (sort indicators, focus rings) */
  --ui-grid-accent: #8b5cf6;

  /* Grouping */
  --ui-grid-group-background: #2d2640;

  /* Shape */
  --ui-grid-radius: 16px;
  --ui-grid-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

/* Target specific parts for full CSS access */
.my-app-shell app-ui-grid::part(header) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.my-app-shell app-ui-grid::part(pagination) {
  border-top: 2px solid rgba(139, 92, 246, 0.3);
}`;

  protected readonly hostAttrSnippet = `/* The demo app uses data attributes on the host element */
:host([data-color-mode='dark'][data-visual-mode='default']) {
  --grid-surface: #0b1824;
  --grid-header: #112434;
  --grid-text: #ebf5f9;
  --grid-accent: #67e8f9;
  /* ... then map to --ui-grid-* variables */
}

:host([data-color-mode='light'][data-visual-mode='wireframe']) {
  --grid-surface: #fbfffc;
  --grid-header: #edfdf1;
  --grid-text: #113723;
  --grid-accent: #14804a;
}`;
}
