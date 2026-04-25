import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// __dirname is the directory containing vite.config.js (project root).
// The source files live in <root>/src/.
const srcDir = path.resolve(__dirname, 'src');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': srcDir,
      'react-native': 'react-native-web',
    },
    extensions: ['.web.js', '.web.jsx', '.js', '.jsx', '.ts', '.tsx'],
  },
  optimizeDeps: {
    include: ['react-native-web'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});