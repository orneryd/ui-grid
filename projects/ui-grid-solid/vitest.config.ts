import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import { fileURLToPath } from 'node:url';
import { scssInlinePlugin } from '../ui-grid-vanilla/scss-plugin';

export const config = defineConfig({
  plugins: [solid(), scssInlinePlugin()],
  server: { fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] } },
  resolve: {
    conditions: ['browser'],
    alias: {
      '@ornery/ui-grid-core': fileURLToPath(new URL('../ui-grid-core/src/index.ts', import.meta.url)),
      '@ornery/ui-grid-vanilla': fileURLToPath(new URL('../ui-grid-vanilla/src/index.ts', import.meta.url)),
    },
  },
  test: { environment: 'happy-dom', include: ['src/**/*.test.tsx'] },
});
export { config as default };
