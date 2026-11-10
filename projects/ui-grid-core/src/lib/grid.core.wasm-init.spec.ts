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
  setUiGridWasmPackageLoader,
} from './grid.core.wasm-bridge';
import { setUiGridWasmAssetBase } from './ui-grid.wasm-path';
import { enableUiGridWasmEngine } from '../wasm';

describe('WASM core initialization', () => {
  afterEach(() => {
    clearWasmCoreModule();
    setUiGridWasmPackageLoader(null);
    setUiGridWasmAssetBase(null);
  });

  it('does not load the package runtime without opting in', async () => {
    await expect(initWasmCore()).resolves.toBe(false);
    expect(getWasmCoreInitializationState()).toBe('failed');
    expect(isWasmReady()).toBe(false);
  });

  it('loads the package runtime once for concurrent callers after opting in', async () => {
    await initWasmCore();
    expect(getWasmCoreInitializationState()).toBe('failed');

    const first = enableUiGridWasmEngine().then(() => true);
    const second = initWasmCore();

    expect(getWasmCoreInitializationState()).toBe('loading');
    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(getWasmCoreInitializationState()).toBe('ready');
    expect(isWasmReady()).toBe(true);
  });

  it('opts in while a missing-loader attempt is still pending', async () => {
    const unconfigured = initWasmCore();
    await expect(enableUiGridWasmEngine()).resolves.toBeUndefined();
    await unconfigured;
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
