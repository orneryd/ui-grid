/**
 * Grid i18n — ports `ui.grid.i18n.i18nService` onto the new label shape.
 *
 * The old module shipped 30+ language files that each registered their
 * own nested translation tree. We flatten the same bundle into the
 * modern `GridLabels` interface so consumers can either:
 *  - swap locales by name via `i18nService.setCurrentLang('es')`, OR
 *  - override individual strings via `options.labels: Partial<GridLabels>`.
 *
 * A locale is registered via `i18nService.add(lang, labels)`. Registered
 * locales are looked up in `resolveGridLabels` with the fallback chain
 * `options.labels → current lang → en-US default`.
 */

import { DEFAULT_GRID_LABELS, GridLabels } from './grid.models';
import esLabels from './i18n/es.json';
import frLabels from './i18n/fr.json';
import deLabels from './i18n/de.json';
import jaLabels from './i18n/ja.json';
import zhCnLabels from './i18n/zh-CN.json';

/** Locale code, e.g. 'en-US', 'es', 'fr', 'de'. Consumer-facing; the
 * service is case-insensitive on lookup. */
export type GridLocaleCode = string;

/** Subscription emitted when the current language changes. */
export type GridI18nLanguageListener = (lang: GridLocaleCode) => void;

export class GridI18nService {
  private readonly locales = new Map<string, Partial<GridLabels>>();
  private currentLang: GridLocaleCode = 'en-US';
  private readonly listeners = new Set<GridI18nLanguageListener>();

  constructor() {
    // Register the bundled locales. `en-US` is the fallback — every other
    // bundle is merged on top of it when `get()` is called, so missing
    // translations gracefully fall through to the English string.
    this.locales.set('en-us', DEFAULT_GRID_LABELS);
    this.locales.set('es', esLabels as Partial<GridLabels>);
    this.locales.set('fr', frLabels as Partial<GridLabels>);
    this.locales.set('de', deLabels as Partial<GridLabels>);
    this.locales.set('ja', jaLabels as Partial<GridLabels>);
    this.locales.set('zh-cn', zhCnLabels as Partial<GridLabels>);
  }

  /** Register (or overwrite) a locale. Partial bundles are allowed — any
   * missing key falls back to the default `en-US` string when labels are
   * resolved. Mirrors `i18nService.add(lang, labels)` from the old module. */
  add(lang: GridLocaleCode, labels: Partial<GridLabels>): void {
    this.locales.set(this.normalize(lang), labels);
  }

  /** Look up the full (i.e. merged with en-US fallback) bundle for a
   * language. When the language isn't registered the en-US default is
   * returned — same behaviour as `i18nService.get`. */
  get(lang: GridLocaleCode): GridLabels {
    const registered = this.locales.get(this.normalize(lang));
    if (!registered) return { ...DEFAULT_GRID_LABELS };
    return { ...DEFAULT_GRID_LABELS, ...registered };
  }

  /** Change the active language and notify listeners. Parity with
   * `i18nService.setCurrentLang`. */
  setCurrentLang(lang: GridLocaleCode): void {
    this.currentLang = lang;
    for (const listener of this.listeners) listener(lang);
  }

  getCurrentLang(): GridLocaleCode {
    return this.currentLang;
  }

  /** Returns every registered locale code (normalized to lowercase).
   * Matches `i18nService.getAllLangs` / `getSupportedLanguages`. */
  getSupportedLanguages(): GridLocaleCode[] {
    return [...this.locales.keys()];
  }

  /** Subscribe to language changes. Unsubscribe by calling the returned
   * disposer — the new event bus idiom we use elsewhere in the grid. */
  onLanguageChanged(listener: GridI18nLanguageListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Returns the labels for the current language, merged onto the default
   * so every key is populated. */
  getCurrentLabels(): GridLabels {
    return this.get(this.currentLang);
  }

  private normalize(lang: GridLocaleCode): string {
    return String(lang).toLowerCase();
  }
}

/** A lightweight module-level singleton so consumers can register locales
 * from anywhere without threading the service through every mount. Matches
 * the old `i18nService` being a global Angular service. */
export const gridI18n = new GridI18nService();

/** Merge the grid's own `labels` override onto the i18n service's current
 * locale + the DEFAULT_GRID_LABELS fallback. Used by the controller's
 * `resolveGridLabels` so per-grid overrides always win but unset keys
 * flow through to the locale and finally the default. */
export function resolveLabelsFromI18n(
  options: { labels?: Partial<GridLabels> },
  service: GridI18nService = gridI18n,
): GridLabels {
  return {
    ...service.getCurrentLabels(),
    ...(options.labels ?? {}),
  };
}
