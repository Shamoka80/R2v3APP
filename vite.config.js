import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal config for server/vite.ts compatibility
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true
  },
  preview: {
    port: 5173
  }
})