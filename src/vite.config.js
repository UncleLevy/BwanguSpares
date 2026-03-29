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
})