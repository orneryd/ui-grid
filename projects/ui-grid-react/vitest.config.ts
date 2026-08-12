import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ornery/ui-grid-core': path.resolve(__dirname, '../ui-grid-core/src/index.ts'),
      '@ornery/ui-grid-vanilla': path.resolve(__dirname, '../ui-grid-vanilla/src/index.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.spec.ts', 'src/test-setup.ts'],
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
