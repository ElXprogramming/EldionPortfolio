import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,           // listen on 0.0.0.0 (required for tunnel)
    port: 5173,
    allowedHosts: true,   // allow all hosts including cloudflared tunnel domain
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,           // listen on 0.0.0.0
    port: 4173,
    allowedHosts: true,   // allow all hosts including cloudflared tunnel domain in preview mode
  },
})