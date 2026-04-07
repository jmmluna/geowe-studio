import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LayerExporterVue',
      fileName: 'index',
      formats: ['es']
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        extend: true,
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
