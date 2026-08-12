import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'rust',
    loadComponent: () =>
      import('./pages/rust/rust-page.component').then((m) => m.RustPageComponent),
  },
  {
    path: 'web-components',
    loadComponent: () =>
      import('./pages/web-components/web-components.component').then(
        (m) => m.WebComponentsComponent,
      ),
  },
  {
    path: 'react',
    loadComponent: () =>
      import('./pages/docs/topics/react.component').then((m) => m.DocsReactComponent),
  },
  {
    path: 'docs',
    loadComponent: () =>
      import('./pages/docs/docs-layout.component').then((m) => m.DocsLayoutComponent),
  },
  {
    path: 'docs/:topic',
    loadComponent: () =>
      import('./pages/docs/docs-layout.component').then((m) => m.DocsLayoutComponent),
  },
  {
    path: 'themes',
    loadComponent: () => import('./pages/themes/themes.component').then((m) => m.ThemesComponent),
  },
  { path: '**', redirectTo: 'home' },
];
