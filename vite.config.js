import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

// Build AFC (+ bundled Heart Lock) as a single ES-module bundle (assets/main.js)
// that the userscript loader imports with a dynamic import(). Mirrors BC-HSC.
export default defineConfig({
  base: './',
  define: {
    __AFC_VERSION__: JSON.stringify(pkg.version),
  },
  server: { cors: true },
  preview: { cors: true },
  build: {
    target: 'es2020',
    rollupOptions: {
      input: 'src/main.js',
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
