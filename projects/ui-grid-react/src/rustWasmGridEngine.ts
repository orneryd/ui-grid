import {
  enableUiGridWasmEngine,
  registerUiGridWasmEngineFromModule,
} from '@ornery/ui-grid-core';

type UiGridWasmModule = object;

export function registerReactUiGridWasmEngineFromModule(module: UiGridWasmModule): void {
  registerUiGridWasmEngineFromModule(module);
}

export async function enableReactUiGridWasmEngine(): Promise<void> {
  await enableUiGridWasmEngine();
}
