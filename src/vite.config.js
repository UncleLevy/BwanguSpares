import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-native': 'react-native-web',
      'react-native/Libraries/Animated': 'react-native-web/dist/Animated',
    },
    extensions: [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
    ],
  },

  // FIX FOR MODAL HOST BLOCKED REQUEST
  server: {
    allowedHosts: [
      'ta-01kngqtec45ezzk1znt6dd1s73-5173-xldm7uvlgcr3wt4c8s0px9go8.w.modal.host', // your current host
      '.modal.host',        // allows all *.modal.host subdomains (recommended)
      // You can add more if needed, e.g. '.localhost', 'localhost'
    ],
    // Alternative (less secure but simpler):
    // allowedHosts: true,   // allows ALL hosts (use only for development)
  },

  define: {
    __DEV__: JSON.stringify(false),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },

  optimizeDeps: {
    include: [
      'react-native-web',
      'react-native-web/dist/exports/Platform',
      'react-native-web/dist/exports/StatusBar',
    ],
  },

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});