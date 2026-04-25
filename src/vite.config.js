import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
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