import { z } from 'zod';

const MONKEYTYPE_USERNAME = 'eldion';
const MONKEYTYPE_PROFILE_URL = `https://api.monkeytype.com/users/${encodeURIComponent(
  MONKEYTYPE_USERNAME
)}/profile`;
const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_UPSTREAM_BYTES = 64 * 1024;
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_BUCKETS = 500;
const SAFE_MODE_VALUE_REGEX = /^\d{1,5}$/;

const ALLOWED_ORIGINS: ReadonlySet<string> = new Set([
  'https://eldionryanportfolio.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

const queryParamsSchema = z.object({}).strip();

const upstreamPersonalBestEntrySchema = z
  .object({
    wpm: z.number().finite().nonnegative(),
    acc: z.number().finite().min(0).max(100).optional(),
  })
  .strip();

const upstreamPersonalBestsBucketSchema = z.record(
  z.string(),
  z.array(upstreamPersonalBestEntrySchema)
);

const upstreamMonkeytypeProfileSchema = z
  .object({
    data: z
      .object({
        personalBests: z
          .object({
            time: upstreamPersonalBestsBucketSchema.optional(),
            words: upstreamPersonalBestsBucketSchema.optional(),
          })
          .strip()
          .optional(),
      })
      .strip(),
  })
  .strip();

const monkeytypeStatsPayloadSchema = z
  .object({
    topWpm: z.number().int().nonnegative(),
    accuracy: z.number().int().min(0).max(100),
    mode: z.enum(['time', 'words']).nullable(),
    modeValue: z
      .string()
      .regex(SAFE_MODE_VALUE_REGEX)
      .nullable(),
  })
  .strip();

type UpstreamPersonalBests = NonNullable<
  z.infer<typeof upstreamMonkeytypeProfileSchema>['data']['personalBests']
>;

interface TopPersonalBest {
  topWpm: number;
  accuracy: number;
  mode: 'time' | 'words' | null;
  modeValue: string | null;
}

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

function consumeRateLimit(
  clientKey: string,
  now: number
): { allowed: boolean; retryAfterSeconds: number } {
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

function extractTopPersonalBest(personalBests?: UpstreamPersonalBests): TopPersonalBest {
  let bestWpmRaw = 0;
  let bestAccRaw = 0;
  let bestMode: 'time' | 'words' | null = null;
  let bestModeValue: string | null = null;

  const modes: ReadonlyArray<'time' | 'words'> = ['time', 'words'];
  for (const mode of modes) {
    const bucket = personalBests?.[mode];
    if (!bucket) continue;

    for (const [modeValue, entries] of Object.entries(bucket)) {
      if (!SAFE_MODE_VALUE_REGEX.test(modeValue)) continue;

      for (const entry of entries) {
        const acc = entry.acc ?? 0;
        const isFaster = entry.wpm > bestWpmRaw;
        const isTieWithBetterAcc = entry.wpm === bestWpmRaw && bestWpmRaw > 0 && acc > bestAccRaw;

        if (isFaster || isTieWithBetterAcc) {
          bestWpmRaw = entry.wpm;
          bestAccRaw = acc;
          bestMode = mode;
          bestModeValue = modeValue;
        }
      }
    }
  }

  return {
    topWpm: Math.round(bestWpmRaw),
    accuracy: Math.min(100, Math.max(0, Math.round(bestAccRaw))),
    mode: bestWpmRaw > 0 ? bestMode : null,
    modeValue: bestWpmRaw > 0 ? bestModeValue : null,
  };
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

    const upstreamResponse = await fetch(MONKEYTYPE_PROFILE_URL, {
      method: 'GET',
      signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'EldionPortfolio-MonkeytypeProxy/1.0 (+https://eldionryanportfolio.vercel.app)',
      },
    });

    if (upstreamResponse.status === 404) {
      console.error('[api/monkeytype] Target Monkeytype user not found.');
      return new Response(
        JSON.stringify({ error: 'Monkeytype profile unavailable.' }),
        {
          status: 404,
          headers: buildSecurityHeaders(request, 'no-store'),
        }
      );
    }

    if (!upstreamResponse.ok) {
      console.error('[api/monkeytype] Upstream HTTP failure:', upstreamResponse.status);
      return new Response(
        JSON.stringify({ error: 'Unable to fetch Monkeytype statistics.' }),
        {
          status: 502,
          headers: buildSecurityHeaders(request, 'no-store'),
        }
      );
    }

    const rawText = await readBoundedText(upstreamResponse, MAX_UPSTREAM_BYTES);
    const rawJson: unknown = JSON.parse(rawText);
    const validatedUpstream = upstreamMonkeytypeProfileSchema.parse(rawJson);

    const best = extractTopPersonalBest(validatedUpstream.data.personalBests);

    const payload = monkeytypeStatsPayloadSchema.parse({
      topWpm: best.topWpm,
      accuracy: best.accuracy,
      mode: best.mode,
      modeValue: best.modeValue,
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
    console.error('[api/monkeytype] Request failed:', reason);
    return new Response(
      JSON.stringify({ error: 'Unable to fetch Monkeytype statistics.' }),
      {
        status: 502,
        headers: buildSecurityHeaders(request, 'no-store'),
      }
    );
  }
}
