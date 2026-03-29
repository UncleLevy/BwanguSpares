import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import base44 from '@base44/vite-plugin'

export default defineConfig({
  plugins: [react(), base44()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Heavy map library — only used in FindNearby
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'vendor-maps';
          }
          // Charts — only used in analytics views
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          // 3D library — only used if three.js pages exist
          if (id.includes('three')) {
            return 'vendor-three';
          }
          // Rich text editor
          if (id.includes('react-quill') || id.includes('quill')) {
            return 'vendor-quill';
          }
          // Animation library
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          // Stripe
          if (id.includes('@stripe')) {
            return 'vendor-stripe';
          }
          // General React ecosystem vendors
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Increase chunk size warning limit slightly since we're intentionally splitting
    chunkSizeWarningLimit: 600,
  },
})