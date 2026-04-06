import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      'react-native': 'react-native-web',
      // Optional helpful aliases for React Native Web
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
    __DEV__: process.env.NODE_ENV !== 'production',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
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