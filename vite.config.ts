import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'example/**/*']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EarReflectJS',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') {
          return 'ear-reflect-js.js';
        }
        return `ear-reflect-js.${format}.cjs`;
      }
    },
    rollupOptions: {
      output: {
        globals: {
          'ear-reflect-js': 'EarReflectJS'
        }
      }
    },
    sourcemap: true,
    minify: 'terser'
  },
  server: {
    port: 3000,
    open: '/example/index.html'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});

