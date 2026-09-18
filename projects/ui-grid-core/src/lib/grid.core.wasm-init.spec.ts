import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ornery/ui-grid-wasm/bundler', () => ({
  version: () => 'test',
}));

import {
  clearWasmCoreModule,
  getWasmCoreInitializationState,
  initWasmCore,
  isWasmReady,
  registerWasmCoreModule,
} from './grid.core.wasm-bridge';
import { setUiGridWasmAssetBase } from './ui-grid.wasm-path';

describe('WASM core initialization', () => {
  afterEach(() => {
    clearWasmCoreModule();
    setUiGridWasmAssetBase(null);
  });

  it('loads the package runtime once for concurrent callers', async () => {
    expect(getWasmCoreInitializationState()).toBe('idle');

    const first = initWasmCore();
    const second = initWasmCore();

    expect(getWasmCoreInitializationState()).toBe('loading');
    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(getWasmCoreInitializationState()).toBe('ready');
    expect(isWasmReady()).toBe(true);
  });

  it('memoizes a failed external load until configuration changes', async () => {
    setUiGridWasmAssetBase('https://invalid.example/first');

    await expect(initWasmCore()).resolves.toBe(false);
    expect(getWasmCoreInitializationState()).toBe('failed');
    await expect(initWasmCore()).resolves.toBe(false);
    expect(getWasmCoreInitializationState()).toBe('failed');

    setUiGridWasmAssetBase('https://invalid.example/second');
    expect(getWasmCoreInitializationState()).toBe('idle');
  });

  it('accepts a preinitialized module without loading an asset', async () => {
    registerWasmCoreModule({});

    expect(getWasmCoreInitializationState()).toBe('ready');
    expect(isWasmReady()).toBe(true);
    await expect(initWasmCore()).resolves.toBe(true);
  });
});
