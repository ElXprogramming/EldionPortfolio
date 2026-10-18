import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://*.supabase.co ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '),
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    allowedHosts: ['localhost', '127.0.0.1'],
    headers: SECURITY_HEADERS,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    allowedHosts: ['localhost', '127.0.0.1'],
    headers: SECURITY_HEADERS,
  },

  server: {
    host: true,           // listen on 0.0.0.0 (required for tunnel)
    port: 5173,
    allowedHosts: true,   // allow all hosts including cloudflared tunnel domain
  },
  preview: {
    host: true,           // listen on 0.0.0.0
    port: 4173,
    allowedHosts: true,   // allow all hosts including cloudflared tunnel domain in preview mode
  },

});