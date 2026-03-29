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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'recharts', 'lucide-react'],
          'map-vendor': ['react-leaflet', 'leaflet'],
          'three-vendor': ['three'],
        },
      },
    },
  },
})