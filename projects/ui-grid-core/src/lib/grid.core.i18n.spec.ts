import { afterEach, describe, expect, it, vi } from 'vitest';
import { GridI18nService, gridI18n } from './grid.core.i18n';
import { DEFAULT_GRID_LABELS } from './grid.models';

describe('GridI18nService', () => {
  it('defaults to en-US and returns the full default label bundle', () => {
    const service = new GridI18nService();
    expect(service.getCurrentLang()).toBe('en-US');
    expect(service.getCurrentLabels()).toEqual(DEFAULT_GRID_LABELS);
  });

  it('ships Spanish / French / German / Japanese / Chinese bundles out of the box', () => {
    const service = new GridI18nService();
    const supported = service.getSupportedLanguages();
    expect(supported).toEqual(expect.arrayContaining(['en-us', 'es', 'fr', 'de', 'ja', 'zh-cn']));
  });

  it('get() falls back to en-US for any missing key in a partial bundle', () => {
    const service = new GridI18nService();
    service.add('pt-br', { sortDefault: 'Ordenar' }); // single key only
    const labels = service.get('pt-br');
    expect(labels.sortDefault).toBe('Ordenar');
    expect(labels.groupColumn).toBe(DEFAULT_GRID_LABELS.groupColumn);
  });

  it('setCurrentLang fires the languageChanged listener', () => {
    const service = new GridI18nService();
    const listener = vi.fn();
    service.onLanguageChanged(listener);
    service.setCurrentLang('es');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('es');
  });

  it('onLanguageChanged returns a disposer that unsubscribes', () => {
    const service = new GridI18nService();
    const listener = vi.fn();
    const dispose = service.onLanguageChanged(listener);
    service.setCurrentLang('es');
    dispose();
    service.setCurrentLang('fr');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('is case-insensitive on lookups', () => {
    const service = new GridI18nService();
    service.add('PT-BR', { sortDefault: 'Ordenar' });
    expect(service.get('pt-br').sortDefault).toBe('Ordenar');
    expect(service.get('PT-BR').sortDefault).toBe('Ordenar');
  });

  it('the module-level singleton is shared across imports', () => {
    // Sanity check that `gridI18n` is stable — the global service is the
    // one the controller resolves labels from, so tests that mutate it
    // must restore state.
    const before = gridI18n.getCurrentLang();
    gridI18n.setCurrentLang('fr');
    expect(gridI18n.getCurrentLang()).toBe('fr');
    gridI18n.setCurrentLang(before);
  });
});

describe('resolveGridLabels integration with the i18n service', () => {
  afterEach(() => {
    gridI18n.setCurrentLang('en-US');
  });

  it('routes through the current language', async () => {
    const { resolveGridLabels } = await import('./grid.core.viewmodel');
    gridI18n.setCurrentLang('es');
    const labels = resolveGridLabels();
    expect(labels.sortDefault).toBe('Ordenar');
  });

  it('lets `options.labels` override per-key on top of the locale', async () => {
    const { resolveGridLabels } = await import('./grid.core.viewmodel');
    gridI18n.setCurrentLang('es');
    const labels = resolveGridLabels({ sortDefault: 'Custom' });
    expect(labels.sortDefault).toBe('Custom');
    // Unoverridden keys still come from the Spanish bundle.
    expect(labels.groupColumn).toBe('Agrupar por esta columna');
  });
});
