const uiGridWasmModulePath = '../../../dist/ui-grid-wasm-web/ui_grid_wasm.js';
const uiGridWasmBinaryPath = '/dist/ui-grid-wasm-web/ui_grid_wasm_bg.wasm';

type UiGridWasmModule = {
  default(input?: unknown): Promise<unknown>;
};

export function registerReactUiGridWasmEngineFromModule(_module: UiGridWasmModule): void {
}

export async function enableReactUiGridWasmEngine(): Promise<void> {
  const module = await import(/* @vite-ignore */ uiGridWasmModulePath);
  await module.default(uiGridWasmBinaryPath);
}
