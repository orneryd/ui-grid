import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    tsconfig: 'tsconfig.json',
  },
  {
    // Imports the main entry by name so both entries share one engine state.
    entry: ['src/wasm.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    tsconfig: 'tsconfig.json',
    external: ['@ornery/ui-grid-core', '@ornery/ui-grid-wasm'],
  },
]);
