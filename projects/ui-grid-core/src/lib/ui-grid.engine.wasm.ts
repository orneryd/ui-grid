import { initWasmCore, registerWasmCoreModule } from './grid.core';

type UiGridWasmModule = object;

export function registerUiGridWasmEngineFromModule(module: UiGridWasmModule): void {
  registerWasmCoreModule(module);
}

export async function enableUiGridWasmEngine(): Promise<void> {
  const ready = await initWasmCore();
  if (!ready) {
    throw new Error('Failed to initialize UI Grid WASM module');
  }
}
