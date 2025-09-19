# From repo root
cat > vite.config.ts <<'TS'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
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
TS

# Ensure the plugin is present in the client
npm --prefix client i -D @vitejs/plugin-react@latest
