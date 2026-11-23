import { z } from 'zod';

const CHESS_USERNAME = 'eldion_03';
const CHESS_STATS_URL = `https://api.chess.com/pub/player/${encodeURIComponent(
  CHESS_USERNAME.toLowerCase()
)}/stats`;
const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_UPSTREAM_BYTES = 64 * 1024;
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_BUCKETS = 500;

const ALLOWED_ORIGINS: ReadonlySet<string> = new Set([
  'https://eldionryanportfolio.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

const queryParamsSchema = z.object({}).strip();

const upstreamRapidStatsSchema = z
  .object({
    last: z
      .object({
        rating: z.number().int().nonnegative(),
      })
      .strip()
      .optional(),
  })
  .strip();

const upstreamChessStatsSchema = z
  .object({
    chess_rapid: upstreamRapidStatsSchema.optional(),
  })
  .strip();

const chessStatsPayloadSchema = z
  .object({
    username: z.string().trim().min(1).max(64),
    rapidRating: z.number().int().nonnegative(),
  })
  .strip();

const rateLimitBuckets = new Map<string, number[]>();

function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp.slice(0, 64);
    }
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return realIp.slice(0, 64);
  }
  return 'unknown';
}

function consumeRateLimit(clientKey: string, now: number): { allowed: boolean; retryAfterSeconds: number } {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const existing = rateLimitBuckets.get(clientKey);
  const recent = existing ? existing.filter((ts) => ts > windowStart) : [];

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitBuckets.set(clientKey, recent);
    const oldest = recent[0] ?? now;
    const retryAfterMs = Math.max(1_000, oldest + RATE_LIMIT_WINDOW_MS - now);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1_000),
    };
  }

  if (!rateLimitBuckets.has(clientKey) && rateLimitBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
    const oldestKey = rateLimitBuckets.keys().next().value;
    if (oldestKey !== undefined) {
      rateLimitBuckets.delete(oldestKey);
    }
  }

  recent.push(now);
  rateLimitBuckets.set(clientKey, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

function buildSecurityHeaders(request: Request, cacheControl: string): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  });

  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET');
    headers.set('Vary', 'Origin');
  }

  return headers;
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  const contentLengthHeader = response.headers.get('content-length');
  if (contentLengthHeader) {
    const declaredLength = Number(contentLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      throw new Error('UPSTREAM_PAYLOAD_TOO_LARGE');
    }
  }

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let totalBytes = 0;
    let output = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          throw new Error('UPSTREAM_PAYLOAD_TOO_LARGE');
        }
        output += decoder.decode(value, { stream: true });
      }
      output += decoder.decode();
      return output;
    } finally {
      reader.releaseLock();
    }
  }

  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new Error('UPSTREAM_PAYLOAD_TOO_LARGE');
  }
  return text;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const parsedUrl = new URL(request.url, 'https://eldionryanportfolio.vercel.app');
    queryParamsSchema.parse(Object.fromEntries(parsedUrl.searchParams.entries()));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request parameters.' }), {
      status: 400,
      headers: buildSecurityHeaders(request, 'no-store'),
    });
  }

  const rateLimit = consumeRateLimit(getClientKey(request), Date.now());
  if (!rateLimit.allowed) {
    const headers = buildSecurityHeaders(request, 'no-store');
    headers.set('Retry-After', String(rateLimit.retryAfterSeconds));
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers,
      }
    );
  }

  try {
    const timeoutSignal = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
    const signal =
      typeof AbortSignal.any === 'function' && request.signal
        ? AbortSignal.any([request.signal, timeoutSignal])
        : timeoutSignal;

    const upstreamResponse = await fetch(CHESS_STATS_URL, {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'EldionPortfolio-ChessProxy/1.0 (+https://eldionryanportfolio.vercel.app)',
      },
    });

    if (upstreamResponse.status === 404) {
      console.error('[api/chess] Target Chess.com user not found.');
      return new Response(
        JSON.stringify({ error: 'Chess.com profile unavailable.' }),
        {
          status: 404,
          headers: buildSecurityHeaders(request, 'no-store'),
        }
      );
    }

    if (!upstreamResponse.ok) {
      console.error('[api/chess] Upstream HTTP failure:', upstreamResponse.status);
      return new Response(
        JSON.stringify({ error: 'Unable to fetch Chess.com statistics.' }),
        {
          status: 502,
          headers: buildSecurityHeaders(request, 'no-store'),
        }
      );
    }

    const rawText = await readBoundedText(upstreamResponse, MAX_UPSTREAM_BYTES);
    const rawJson: unknown = JSON.parse(rawText);
    const validatedUpstream = upstreamChessStatsSchema.parse(rawJson);

    const payload = chessStatsPayloadSchema.parse({
      username: CHESS_USERNAME,
      rapidRating: validatedUpstream.chess_rapid?.last?.rating ?? 0,
    });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: buildSecurityHeaders(
        request,
        'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
      ),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.name : 'UnknownError';
    console.error('[api/chess] Request failed:', reason);
    return new Response(
      JSON.stringify({ error: 'Unable to fetch Chess.com statistics.' }),
      {
        status: 502,
        headers: buildSecurityHeaders(request, 'no-store'),
      }
    );
  }
}
