import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GPKGLoader',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: ['ol'],
      output: {
        extend: true
      }
    }
  }
});
