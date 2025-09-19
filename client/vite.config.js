import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@assets": path.resolve(import.meta.dirname, "../attached_assets"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true }
    }
  },
  preview: { port: 5173 }
})