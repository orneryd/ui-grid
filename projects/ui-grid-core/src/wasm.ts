import {
  enableUiGridWasmEngine as enableConfiguredUiGridWasmEngine,
  setUiGridWasmPackageLoader,
} from '@ornery/ui-grid-core';

/**
 * Opt-in WASM engine. Loads `@ornery/ui-grid-wasm` (install it next to core)
 * and switches every grid to it once ready. Grids use the TypeScript engine
 * until then, and if loading fails.
 */
export async function enableUiGridWasmEngine(): Promise<void> {
  setUiGridWasmPackageLoader(() => import('@ornery/ui-grid-wasm/bundler'));
  await enableConfiguredUiGridWasmEngine();
}
