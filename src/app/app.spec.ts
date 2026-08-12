import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the navigation bar with brand and links', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const brand = compiled.querySelector('.nav-brand');
    const links = [...compiled.querySelectorAll('.nav-link')].map((el) => el.textContent?.trim());
    const themeButtons = compiled.querySelectorAll('.nav-theme-btn');

    expect(brand?.textContent).toContain('UI Grid');
    expect(links).toEqual(expect.arrayContaining(['Demo', 'Rust', 'Docs', 'Themes']));
    expect(themeButtons).toHaveLength(2);
  });

  it('should default to dark mode and allow toggling both the color and visual themes', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const [colorBtn, visualBtn] = [...host.querySelectorAll('.nav-theme-btn')] as HTMLButtonElement[];

    expect(host.getAttribute('data-color-mode')).toBe('dark');
    expect(host.getAttribute('data-visual-mode')).toBe('default');

    colorBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.getAttribute('data-color-mode')).toBe('light');

    visualBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.getAttribute('data-visual-mode')).toBe('wireframe');
    expect(host.querySelector('.nav-theme-label')?.textContent).toContain('Wireframe light');
  });

  it('should render a router outlet for page content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const outlet = fixture.nativeElement.querySelector('router-outlet');
    expect(outlet).toBeTruthy();
  });
});
