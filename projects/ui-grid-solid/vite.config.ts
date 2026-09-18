import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export const config = defineConfig(({ isSsrBuild }) => ({
  plugins: [solid({ ssr: isSsrBuild })],
  build: {
    emptyOutDir: !isSsrBuild,
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => isSsrBuild ? 'server.js' : 'index.js' },
    rollupOptions: {
      output: { entryFileNames: isSsrBuild ? 'server.js' : 'index.js' },
      external: ['solid-js', '@solidjs/web', '@ornery/ui-grid-core', '@ornery/ui-grid-vanilla'],
    },
  },
  server: {
    port: 3000,
  },
}));
export { config as default };
