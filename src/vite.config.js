import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
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