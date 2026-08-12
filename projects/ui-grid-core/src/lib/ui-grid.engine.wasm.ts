import { initWasmCore } from './grid.core';

type UiGridWasmModule = object;

export function registerUiGridWasmEngineFromModule(_module: UiGridWasmModule): void {
}

export async function enableUiGridWasmEngine(): Promise<void> {
  const ready = await initWasmCore();
  if (!ready) {
    throw new Error('Failed to initialize UI Grid WASM module');
  }
}
