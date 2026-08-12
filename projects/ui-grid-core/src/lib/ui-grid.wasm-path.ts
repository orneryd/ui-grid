const uiGridWasmWebModuleRelativePath = 'dist/ui-grid-wasm-web/ui_grid_wasm.js';
const uiGridWasmWebBinaryRelativePath = 'dist/ui-grid-wasm-web/ui_grid_wasm_bg.wasm';

let configuredUiGridWasmAssetBase: string | null = null;

function normalizeUiGridWasmAssetBase(assetBase: string | URL): string {
  const value = String(assetBase);
  return value.endsWith('/') ? value : `${value}/`;
}

function detectDefaultUiGridWasmAssetBase(): string {
  if (configuredUiGridWasmAssetBase) {
    return configuredUiGridWasmAssetBase;
  }

  if (typeof document !== 'undefined' && document.baseURI) {
    return document.baseURI;
  }

  if (typeof location !== 'undefined' && location.href) {
    return location.href;
  }

  return '/';
}

function resolveUiGridWasmAssetUrl(relativePath: string): string {
  const base = detectDefaultUiGridWasmAssetBase();
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(base)) {
    return new URL(relativePath, base).toString();
  }

  const normalizedBase = normalizeUiGridWasmAssetBase(base);
  return `${normalizedBase}${relativePath}`;
}

export function setUiGridWasmAssetBase(assetBase: string | URL | null): void {
  configuredUiGridWasmAssetBase = assetBase ? normalizeUiGridWasmAssetBase(assetBase) : null;
}

export function getUiGridWasmAssetBase(): string {
  return detectDefaultUiGridWasmAssetBase();
}

export function getUiGridWasmModulePath(): string {
  return resolveUiGridWasmAssetUrl(uiGridWasmWebModuleRelativePath);
}

export function getUiGridWasmBinaryPath(): string {
  return resolveUiGridWasmAssetUrl(uiGridWasmWebBinaryRelativePath);
}