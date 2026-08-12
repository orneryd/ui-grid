import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type ColorMode = 'dark' | 'light';
type VisualMode = 'default' | 'wireframe';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-color-mode]': 'colorMode()',
    '[attr.data-visual-mode]': 'visualMode()'
  }
})
export class App {
  protected readonly repoUrl = 'https://github.com/orneryd/uiGrid';
  protected readonly colorMode = signal<ColorMode>('dark');
  protected readonly visualMode = signal<VisualMode>('default');
  protected readonly isDarkMode = computed(() => this.colorMode() === 'dark');
  protected readonly isWireframeMode = computed(() => this.visualMode() === 'wireframe');
  protected readonly activeThemeName = computed(() =>
    `${this.isWireframeMode() ? 'Wireframe' : 'Studio'} ${this.isDarkMode() ? 'dark' : 'light'}`
  );

  protected toggleColorMode(): void {
    this.colorMode.update((mode) => (mode === 'dark' ? 'light' : 'dark'));
  }

  protected toggleVisualMode(): void {
    this.visualMode.update((mode) => (mode === 'default' ? 'wireframe' : 'default'));
  }
}
