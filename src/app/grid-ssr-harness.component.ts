import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FILTER_CONDITIONS, GridOptions, GridRecord, UiGridComponent } from '@ornery/ui-grid';

export const SSR_HARNESS_ROW_COUNT = 1000;
export const SSR_HARNESS_ROW_HEIGHT = 48;
export const SSR_HARNESS_VISIBLE_ROW_COUNT = 5;

function createSsrHarnessRows(count = SSR_HARNESS_ROW_COUNT): GridRecord[] {
  return Array.from({ length: count }, (_value, index) => ({
    id: `ssr-row-${index + 1}`,
    name: `SSR Row ${index + 1}`,
    status: index % 2 === 0 ? 'Active' : 'Pilot',
    revenue: 1000 + index * 25,
    account: { owner: `SSR Owner ${index + 1}` }
  }));
}

@Component({
  selector: 'app-grid-ssr-harness',
  imports: [UiGridComponent],
  template: `<app-ui-grid [options]="options" />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridSsrHarnessComponent {
  protected readonly options: GridOptions = {
    id: 'grid-ssr-harness',
    title: 'Grid SSR Harness',
    emptyMessage: 'No SSR rows',
    data: createSsrHarnessRows(),
    rowIdentity: (row) => String(row['id']),
    rowHeight: SSR_HARNESS_ROW_HEIGHT,
    minRowsToShow: SSR_HARNESS_VISIBLE_ROW_COUNT,
    enableSorting: true,
    enableFiltering: true,
    enableGrouping: false,
    enableColumnMoving: false,
    enableVirtualization: true,
    virtualizationThreshold: 1,
    columnDefs: [
      { name: 'name', displayName: 'Customer', width: 'minmax(12rem, 1fr)' },
      { name: 'status', width: 'minmax(8rem, 0.7fr)', filter: { condition: FILTER_CONDITIONS.exact } },
      {
        name: 'revenue',
        align: 'end',
        width: 'minmax(8rem, 0.7fr)',
        filter: { condition: FILTER_CONDITIONS.greaterThan },
        formatter: (value) => `$${value}`
      },
      { name: 'owner', field: 'account.owner', displayName: 'Owner', width: 'minmax(10rem, 0.8fr)' }
    ]
  };
}