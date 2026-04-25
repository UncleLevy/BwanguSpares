import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/app_temp/src',
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