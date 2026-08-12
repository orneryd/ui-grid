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
    outExtension: () => ({ js: '.js' }),
    tsconfig: './tsconfig.json',
    noExternal: ['@ornery/ui-grid-core'],
    esbuildPlugins: [scssInlineEsbuild()],
  },
]);
