import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { GET as handleLeetCodeGet } from './api/leetcode.ts';
import { GET as handleChessGet } from './api/chess.ts';

const LOCAL_API_ROUTES: Readonly<
  Record<string, { handler: (request: Request) => Promise<Response>; fallbackError: string }>
> = {
  '/api/leetcode': {
    handler: handleLeetCodeGet,
    fallbackError: 'Unable to fetch LeetCode statistics.',
  },
  '/api/chess': {
    handler: handleChessGet,
    fallbackError: 'Unable to fetch Chess.com statistics.',
  },
};

function attachLocalApiMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  const pathname = (req.url ?? '').split('?')[0];
  const route = LOCAL_API_ROUTES[pathname];
  if (!route) {
    next();
    return;
  }

  if ((req.method ?? 'GET').toUpperCase() !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  const host = req.headers.host ?? 'localhost:5173';
  const requestUrl = `http://${host}${req.url ?? pathname}`;
  const headers = new Headers();

  for (const key of ['origin', 'x-forwarded-for', 'x-real-ip'] as const) {
    const raw = req.headers[key];
    if (typeof raw === 'string') {
      headers.set(key, raw);
    } else if (Array.isArray(raw) && raw.length > 0) {
      headers.set(key, raw.join(', '));
    }
  }

  void route
    .handler(new Request(requestUrl, { method: 'GET', headers }))
    .then(async (webRes) => {
      res.statusCode = webRes.status;
      webRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.end(await webRes.text());
    })
    .catch(() => {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.end(JSON.stringify({ error: route.fallbackError }));
    });
}

function localApiDevPlugin(): Plugin {
  return {
    name: 'local-api-dev-proxy',
    configureServer(server) {
      server.middlewares.use(attachLocalApiMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(attachLocalApiMiddleware);
    },
  };
}

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
    "connect-src 'self' https://*.supabase.co https://github-contributions-api.jogruber.de ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '),
};

export default defineConfig({
  plugins: [react(), tailwindcss(), localApiDevPlugin()],
  server: {
    host: true, // listen on 0.0.0.0 (required for tunnel)
    port: 5173,
    allowedHosts: true, // allow all hosts including cloudflared tunnel domain
    headers: SECURITY_HEADERS,
  },
  preview: {
    host: true, // listen on 0.0.0.0
    port: 4173,
    allowedHosts: true, // allow all hosts including cloudflared tunnel domain in preview mode
    headers: SECURITY_HEADERS,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }
        },
      },
    },
  },
});