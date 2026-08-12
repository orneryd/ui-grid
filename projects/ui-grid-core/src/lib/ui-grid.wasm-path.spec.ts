import { afterEach, describe, expect, it } from 'vitest';

import {
  getUiGridWasmAssetBase,
  getUiGridWasmBinaryPath,
  getUiGridWasmModulePath,
  setUiGridWasmAssetBase,
} from './ui-grid.wasm-path';

describe('ui-grid.wasm-path', () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    setUiGridWasmAssetBase(null);
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', {
        value: originalDocument,
        configurable: true,
      });
    } else {
      Reflect.deleteProperty(globalThis, 'document');
    }
  });

  it('derives default wasm paths from document.baseURI', () => {
    Object.defineProperty(globalThis, 'document', {
      value: { baseURI: 'https://example.com/uiGrid/' },
      configurable: true,
    });

    expect(getUiGridWasmAssetBase()).toBe('https://example.com/uiGrid/');
    expect(getUiGridWasmModulePath()).toBe('https://example.com/uiGrid/dist/ui-grid-wasm-web/ui_grid_wasm.js');
    expect(getUiGridWasmBinaryPath()).toBe('https://example.com/uiGrid/dist/ui-grid-wasm-web/ui_grid_wasm_bg.wasm');
  });

  it('lets consumers override the wasm asset base explicitly', () => {
    setUiGridWasmAssetBase('https://cdn.example.com/assets/grid');

    expect(getUiGridWasmAssetBase()).toBe('https://cdn.example.com/assets/grid/');
    expect(getUiGridWasmModulePath()).toBe('https://cdn.example.com/assets/grid/dist/ui-grid-wasm-web/ui_grid_wasm.js');
    expect(getUiGridWasmBinaryPath()).toBe('https://cdn.example.com/assets/grid/dist/ui-grid-wasm-web/ui_grid_wasm_bg.wasm');
  });
});