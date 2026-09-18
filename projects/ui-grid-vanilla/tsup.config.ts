import path from 'node:path';
import { defineConfig } from 'tsup';
import { scssInlineEsbuild } from './scss-plugin';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    tsconfig: './tsconfig.json',
    esbuildPlugins: [scssInlineEsbuild()],
  },
  {
    entry: { 'ui-grid-element': 'src/browser.ts' },
    format: ['esm'],
    dts: false,
    splitting: false,
    platform: 'browser',
    target: 'es2022',
    outDir: 'dist/browser',
    external: ['@ornery/ui-grid-wasm/bundler'],
    outExtension: () => ({ js: '.js' }),
    tsconfig: './tsconfig.json',
    noExternal: ['@ornery/ui-grid-core'],
    esbuildOptions(options) {
      options.alias = {
        ...options.alias,
        '@ornery/ui-grid-core': path.resolve(__dirname, '../ui-grid-core/dist/index.mjs'),
      };
    },
    esbuildPlugins: [scssInlineEsbuild()],
  },
]);
