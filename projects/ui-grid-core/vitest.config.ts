import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ornery/ui-grid-core': path.resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    dir: path.resolve(__dirname, 'src'),
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/lib/i18n/**',
        'src/lib/grid-core-styles.ts',
      ],
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
