import { Component, TemplateRef, computed, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import type {
  GridExpandableTemplateContext,
  GridOptions,
  UiGridApi,
} from '@ornery/ui-grid-core';
import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';
import { UiGridComponent } from './ui-grid.component';

const baseData = [
  { id: 'row-1', name: 'Gamma', status: 'Pilot', revenue: 300 },
  { id: 'row-2', name: 'alpha', status: 'Active', revenue: 100 },
  { id: 'row-3', name: 'Beta', status: 'Active', revenue: 200 },
] as const;

function createOptions(
  overrides: Partial<GridOptions> = {},
  onRegisterApi?: (api: UiGridApi) => void,
): GridOptions {
  return {
    id: 'spec-grid',
    title: 'Spec Grid',
    data: baseData,
    rowIdentity: (row) => String(row['id']),
    enableSorting: true,
    enableFiltering: true,
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'status' },
      { name: 'revenue', align: 'end' },
    ],
    onRegisterApi: (api) => onRegisterApi?.(api as UiGridApi),
    ...overrides,
  };
}

@Component({
  imports: [UiGridComponent],
  template: `<app-ui-grid [options]="options()" />`,
})
class SimpleHostComponent {
  private readonly registeredApi = signal<UiGridApi | null>(null);
  readonly options = signal<GridOptions>(
    createOptions({}, (api) => this.registeredApi.set(api)),
  );
  readonly gridApi = this.registeredApi;
}

@Component({
  imports: [UiGridComponent],
  template: `
    <ng-template #detail let-row>
      <div class="detail-row">{{ row.name }} detail</div>
    </ng-template>
    <app-ui-grid [options]="options()" />
  `,
})
class ExpandableHostComponent {
  private readonly registeredApi = signal<UiGridApi | null>(null);
  private readonly detailTemplate =
    viewChild.required<TemplateRef<GridExpandableTemplateContext>>('detail');

  readonly options = computed<GridOptions>(() =>
    createOptions(
      {
        enableExpandable: true,
        expandableRowTemplate: this.detailTemplate(),
      },
      (api) => this.registeredApi.set(api),
    ),
  );

  readonly gridApi = this.registeredApi;
}

describe('UiGridComponent (vanilla wrapper)', () => {
  beforeAll(async () => {
    await defineStandaloneUiGridElement('ui-grid-element');
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiGridComponent, SimpleHostComponent, ExpandableHostComponent],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a vanilla ui-grid-element and registers the api', async () => {
    const fixture = TestBed.createComponent(SimpleHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.componentInstance;
    expect(host.gridApi()).toBeTruthy();

    const gridEl = (fixture.nativeElement as HTMLElement).querySelector('ui-grid-element');
    expect(gridEl).not.toBeNull();
  });

  it('passes options to the vanilla element and renders rows', async () => {
    const fixture = TestBed.createComponent(SimpleHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const gridEl = (fixture.nativeElement as HTMLElement).querySelector('ui-grid-element')!;
    const shadow = gridEl.shadowRoot!;
    const headers = [...shadow.querySelectorAll('.header-label')].map((n) => n.textContent?.trim());
    expect(headers).toEqual(['Customer', 'Status', 'Revenue']);

    const bodyCells = [...shadow.querySelectorAll('.body-cell')].map((n) => n.textContent?.trim());
    expect(bodyCells).toContain('Gamma');
    expect(bodyCells).toContain('alpha');
  });

  it('exposes the gridApi from the vanilla controller', async () => {
    const fixture = TestBed.createComponent(SimpleHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const gridApi = fixture.componentInstance.gridApi()!;
    expect(gridApi.core).toBeTruthy();
    expect(gridApi.core.getVisibleRows()).toHaveLength(3);
  });

  it('reacts to options changes', async () => {
    const fixture = TestBed.createComponent(SimpleHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const gridApi = fixture.componentInstance.gridApi()!;
    expect(gridApi.core.getVisibleRows()).toHaveLength(3);

    fixture.componentInstance.options.set(
      createOptions({ data: [baseData[0]] }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(gridApi.core.getVisibleRows()).toHaveLength(1);
  });

  it('cleans up the element on destroy', async () => {
    const fixture = TestBed.createComponent(SimpleHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = fixture.nativeElement as HTMLElement;
    expect(hostEl.querySelector('ui-grid-element')).not.toBeNull();

    fixture.destroy();
    expect(hostEl.querySelector('ui-grid-element')).toBeNull();
  });
});
