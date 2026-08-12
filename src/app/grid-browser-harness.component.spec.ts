import { TestBed } from '@angular/core/testing';
import { GridBrowserHarnessComponent } from './grid-browser-harness.component';

describe('GridBrowserHarnessComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridBrowserHarnessComponent]
    }).compileComponents();
  });

  it('renders the expandable virtual-scroll scenario by default', async () => {
    const fixture = TestBed.createComponent(GridBrowserHarnessComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance as any;
    const root = fixture.nativeElement as HTMLElement;
    const options = component.options();

    expect(root.textContent).toContain('Virtual scroll branch harness');
    expect(options.title).toBe('Browser Harness: Expandable');
    expect(options.enableExpandable).toBe(true);
    expect(options.virtualizationThreshold).toBe(1);
    expect(options.expandableRowTemplate).toBeTruthy();
  });

  it('switches between tree and templated virtual-scroll scenarios', async () => {
    const fixture = TestBed.createComponent(GridBrowserHarnessComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance as any;

    component.setMode('tree');
    fixture.detectChanges();
    let options = component.options();
    expect(options.enableTreeView).toBe(true);
    expect(options.treeChildrenField).toBe('children');
    expect(options.data[0]['children']).toBeTruthy();

    component.setMode('templated');
    fixture.detectChanges();
    options = component.options();
    const statusColumn = options.columnDefs.find((column: { name: string }) => column.name === 'status');
    expect(statusColumn?.cellTemplate).toBeTruthy();
    expect(options.enableExpandable).not.toBe(true);
  });
});