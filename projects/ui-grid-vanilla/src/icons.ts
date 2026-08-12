/**
 * Icon registry for the vanilla grid element.
 *
 * The grid draws its own sort / group / tree / expand / pin / pagination
 * icons via inline SVGs. Consumers can override any individual icon by
 * passing an `iconOverrides` map in GridOptions or by writing to the
 * element's `controlIcons` property at runtime. This module owns the
 * icon registry class plus the SVG markup helpers so the element file
 * doesn't have to.
 */

import { iconMarkup } from './templates';

export type UiGridControlIconKey =
  | 'sortNone'
  | 'sortAsc'
  | 'sortDesc'
  | 'group'
  | 'groupExpanded'
  | 'groupCollapsed'
  | 'treeExpanded'
  | 'treeCollapsed'
  | 'expandExpanded'
  | 'expandCollapsed'
  | 'pin'
  | 'pinLeft'
  | 'pinRight'
  | 'paginationPrev'
  | 'paginationNext';

export interface UiGridIconDefinition {
  viewBox?: string;
  path: string;
}

export type UiGridIconOverrides = Partial<Record<UiGridControlIconKey, UiGridIconDefinition>>;

export const DEFAULT_ICONS: Record<UiGridControlIconKey, UiGridIconDefinition> = {
  sortNone: { path: 'M7 6h10v2H7V6Zm0 5h7v2H7v-2Zm0 5h4v2H7v-2Z' },
  sortAsc: { path: 'M12 5l-6 6h4v8h4v-8h4z' },
  sortDesc: { path: 'M12 19l6-6h-4V5h-4v8H6z' },
  group: { path: 'M4 6h8v4H4V6Zm0 8h8v4H4v-4Zm10-8h6v4h-6V6Zm0 8h6v4h-6v-4Z' },
  groupExpanded: { path: 'M7 10l5 5 5-5z' },
  groupCollapsed: { path: 'M10 7l5 5-5 5z' },
  treeExpanded: { path: 'M7 10l5 5 5-5z' },
  treeCollapsed: { path: 'M10 7l5 5-5 5z' },
  expandExpanded: { path: 'M7 10l5 5 5-5z' },
  expandCollapsed: { path: 'M10 7l5 5-5 5z' },
  pin: { path: 'M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z' },
  pinLeft: { path: 'M10 6 4 12l6 6v-4h10v-4H10V6z' },
  pinRight: { path: 'M14 6v4H4v4h10v4l6-6-6-6z' },
  paginationPrev: { path: 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z' },
  paginationNext: { path: 'M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z' },
};

/**
 * Holds the active set of icons (defaults merged with consumer overrides)
 * and renders the inline SVG markup for each one. A single instance lives
 * on the element.
 */
export class IconRegistry {
  private overrides: UiGridIconOverrides = {};
  private resolved: Record<UiGridControlIconKey, UiGridIconDefinition> = { ...DEFAULT_ICONS };

  getOverrides(): UiGridIconOverrides {
    return { ...this.overrides };
  }

  setOverrides(value: UiGridIconOverrides): void {
    this.overrides = value ?? {};
    this.resolved = { ...DEFAULT_ICONS, ...this.overrides };
  }

  resolve(key: UiGridControlIconKey): UiGridIconDefinition {
    return this.resolved[key];
  }

  /** Render the SVG markup for a control icon (sort, group, pin, …). */
  renderControlIcon(key: UiGridControlIconKey): string {
    return this.renderIconWithClass('control-icon', key);
  }

  /** Render the SVG markup with an arbitrary wrapper class. */
  renderIconWithClass(svgClass: string, key: UiGridControlIconKey): string {
    const icon = this.resolve(key);
    return iconMarkup(svgClass, icon.viewBox ?? '0 0 24 24', icon.path);
  }
}
