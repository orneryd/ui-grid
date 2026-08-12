import path from 'path';
import { defineConfig } from 'vitest/config';
import { scssInlinePlugin } from './scss-plugin';

export default defineConfig({
  plugins: [scssInlinePlugin()],
  resolve: {
    alias: {
      '@ornery/ui-grid-core': path.resolve(__dirname, '../ui-grid-core/src/index.ts'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(__dirname, 'node_modules')],
      },
    },
  },
  test: {
    dir: path.resolve(__dirname, 'src'),
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/test-setup.ts'],
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
