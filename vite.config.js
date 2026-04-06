import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      'react-native': 'react-native-web',
      // Optional but helpful aliases
      'react-native/Libraries/Animated': 'react-native-web/dist/Animated',
      'react-native/Libraries/Components': 'react-native-web/dist/Components',
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

  // Important for React Native Web compatibility
  define: {
    __DEV__: process.env.NODE_ENV !== 'production',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },

  // Optimize dependencies to prevent common React Native Web issues
  optimizeDeps: {
    include: [
      'react-native-web',
      'react-native-web/dist/modules/Platform',
      'react-native-web/dist/exports/Platform',
      'react-native-web/dist/exports/StatusBar',
    ],
  },

  // Optional: Better build output for production
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});