# Expandable Rows

Master/detail pattern — expand any row to reveal a custom Angular template below it.

## Setup

```typescript
@Component({
  template: `
    <ng-template #detail let-row>
      <div class="detail-panel">
        <h3>{{ row.name }}</h3>
        <p>Revenue: {{ row.revenue | currency }}</p>
      </div>
    </ng-template>

    <app-ui-grid [options]="gridOptions" />
  `
})
export class MyComponent {
  @ViewChild('detail') detailTemplate!: TemplateRef<any>;

  gridOptions: GridOptions = {
    id: 'master-detail',
    data: this.data,
    enableExpandable: true,
    expandableRowHeight: 120,
    expandableRowTemplate: this.detailTemplate,
    columnDefs: [
      { name: 'name' },
      { name: 'revenue', type: 'number' },
    ],
  };
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableExpandable` | `boolean` | `false` | Enable expandable rows |
| `expandableRowHeight` | `number` | `150` | Min height of the detail row (px) |
| `expandableRowTemplate` | `TemplateRef` | — | Angular template for the detail content |
| `expandableRowHeaderWidth` | `number` | — | Width of the expand toggle column |
| `expandableRowScope` | `Record<string, unknown>` | — | Extra variables injected into template context |

## Template Context

The template receives a `GridExpandableTemplateContext`:

| Property | Type | Description |
|----------|------|-------------|
| `$implicit` | `GridRecord` | The row data (use with `let-row`) |
| `row` | `GridRecord` | Same as `$implicit` |
| `rowIndex` | `number` | Index of the row in the current view |
| `expanded` | `boolean` | Always `true` when the template renders |

## API

| Method | Description |
|--------|-------------|
| `gridApi.expandable.toggleRowExpansion(row)` | Toggle a single row |
| `gridApi.expandable.expandAllRows()` | Expand all rows |
| `gridApi.expandable.collapseAllRows()` | Collapse all rows |
| `gridApi.expandable.toggleAllRows()` | Toggle all rows |
| `gridApi.expandable.on.rowExpandedStateChanged` | `(row, expanded) => void` |

## Expandable vs Tree View

**Expandable rows** show custom template content below a data row (master/detail). **Tree view** shows child data rows that share the same column structure as parents. You can use both simultaneously.
