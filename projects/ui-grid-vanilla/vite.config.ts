import path from 'path';
import { defineConfig } from 'vite';
import { scssInlinePlugin } from './scss-plugin';

export default defineConfig({
  root: path.resolve(__dirname, 'demo'),
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
  optimizeDeps: {
    exclude: ['@ornery/ui-grid-core'],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..'), path.resolve(__dirname, '../..')],
    },
  },
  test: {
    dir: path.resolve(__dirname, 'src'),
    environment: 'happy-dom',
  },
});
