import type { GridOptions } from '@ornery/ui-grid-core';

import {
  defineStandaloneUiGridElement,
  type VanillaUiGridElement,
} from './ui-grid-standalone.element';
export {
  createVanillaGridController,
  type GridControllerSnapshot,
  type GridSaveState,
  type VanillaGridController,
} from './grid-controller';
export {
  defineStandaloneUiGridElement,
  UiGridStandaloneElement,
  type VanillaUiGridElement,
  type UiGridControlIconKey,
  type UiGridIconDefinition,
  type UiGridIconOverrides,
  type FrameworkRenderedSlotsConfig,
  type FrameworkCellSlot,
  type FrameworkHeaderSlot,
  type FrameworkFilterSlot,
  type FrameworkGroupRowSlot,
  type FrameworkExpandableRowSlot,
  type FrameworkEmptyStateSlot,
  type FrameworkSlotDelta,
} from './ui-grid-standalone.element';

export { UIGridTemplate } from './components/grid-template';
export type { GridOptions, UiGridApi } from '@ornery/ui-grid-core';

export interface UiGridRustWebModule {
  default(input?: unknown): Promise<unknown>;
}

export { defineStandaloneUiGridElement as defineUiGridElement };

export async function registerVanillaUiGridRustModule(
  module: UiGridRustWebModule,
  input?: unknown,
): Promise<void> {
  await module.default(input);
}

export async function mountVanillaUiGrid(
  target: Element,
  options: GridOptions,
  rustModule?: UiGridRustWebModule,
  tagName = 'ui-grid-element',
): Promise<VanillaUiGridElement> {
  if (rustModule) {
    try {
      await registerVanillaUiGridRustModule(rustModule);
    } catch {
      // Fall back to JS engine when WASM cannot be initialized.
    }
  }

  await defineStandaloneUiGridElement(tagName);

  const grid = document.createElement(tagName) as VanillaUiGridElement;
  grid.options = options;
  target.replaceChildren(grid);
  return grid;
}
