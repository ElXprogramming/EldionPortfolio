import { z } from 'zod';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const LEETCODE_USERNAME = 'eldion03';
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

const LEETCODE_STATS_QUERY = `
  query userProfileStats($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      profile {
        ranking
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      userCalendar {
        streak
        totalActiveDays
      }
    }
  }
`;

const queryParamsSchema = z.object({}).strip();

const difficultyCountSchema = z
  .object({
    difficulty: z.enum(['All', 'Easy', 'Medium', 'Hard']),
    count: z.number().int().nonnegative(),
  })
  .strip();

const upstreamGraphqlResponseSchema = z
  .object({
    data: z
      .object({
        allQuestionsCount: z.array(difficultyCountSchema),
        matchedUser: z
          .object({
            username: z.string().trim().min(1).max(64),
            profile: z
              .object({
                ranking: z.number().int().nonnegative().nullable().optional(),
              })
              .strip()
              .nullable()
              .optional(),
            submitStatsGlobal: z
              .object({
                acSubmissionNum: z.array(difficultyCountSchema),
              })
              .strip(),
            userCalendar: z
              .object({
                streak: z.number().int().nonnegative().nullable().optional(),
                totalActiveDays: z.number().int().nonnegative().nullable().optional(),
              })
              .strip()
              .nullable()
              .optional(),
          })
          .strip()
          .nullable(),
      })
      .strip(),
  })
  .strip();

const leetcodeStatsPayloadSchema = z
  .object({
    username: z.string().trim().min(1).max(64),
    totalSolved: z.number().int().nonnegative(),
    totalQuestions: z.number().int().nonnegative(),
    easySolved: z.number().int().nonnegative(),
    totalEasy: z.number().int().nonnegative(),
    mediumSolved: z.number().int().nonnegative(),
    totalMedium: z.number().int().nonnegative(),
    hardSolved: z.number().int().nonnegative(),
    totalHard: z.number().int().nonnegative(),
    ranking: z.number().int().nonnegative(),
    streak: z.number().int().nonnegative(),
    totalActiveDays: z.number().int().nonnegative(),
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

function getCountByDifficulty(
  items: ReadonlyArray<{ difficulty: 'All' | 'Easy' | 'Medium' | 'Hard'; count: number }>,
  difficulty: 'All' | 'Easy' | 'Medium' | 'Hard'
): number {
  return items.find((item) => item.difficulty === difficulty)?.count ?? 0;
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

    const upstreamResponse = await fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Referer: `https://leetcode.com/u/${encodeURIComponent(LEETCODE_USERNAME)}/`,
        'User-Agent': 'EldionPortfolio-LeetCodeProxy/1.0',
      },
      body: JSON.stringify({
        query: LEETCODE_STATS_QUERY,
        variables: { username: LEETCODE_USERNAME },
      }),
    });

    if (!upstreamResponse.ok) {
      console.error('[api/leetcode] Upstream HTTP failure:', upstreamResponse.status);
      return new Response(
        JSON.stringify({ error: 'Unable to fetch LeetCode statistics.' }),
        {
          status: 502,
          headers: buildSecurityHeaders(request, 'no-store'),
        }
      );
    }

    const rawText = await readBoundedText(upstreamResponse, MAX_UPSTREAM_BYTES);
    const rawJson: unknown = JSON.parse(rawText);
    const validatedUpstream = upstreamGraphqlResponseSchema.parse(rawJson);

    const matchedUser = validatedUpstream.data.matchedUser;
    if (!matchedUser) {
      console.error('[api/leetcode] Target LeetCode user not found.');
      return new Response(
        JSON.stringify({ error: 'LeetCode profile unavailable.' }),
        {
          status: 404,
          headers: buildSecurityHeaders(request, 'no-store'),
        }
      );
    }

    const allQuestions = validatedUpstream.data.allQuestionsCount;
    const solvedCounts = matchedUser.submitStatsGlobal.acSubmissionNum;

    const payload = leetcodeStatsPayloadSchema.parse({
      username: matchedUser.username,
      totalSolved: getCountByDifficulty(solvedCounts, 'All'),
      totalQuestions: getCountByDifficulty(allQuestions, 'All'),
      easySolved: getCountByDifficulty(solvedCounts, 'Easy'),
      totalEasy: getCountByDifficulty(allQuestions, 'Easy'),
      mediumSolved: getCountByDifficulty(solvedCounts, 'Medium'),
      totalMedium: getCountByDifficulty(allQuestions, 'Medium'),
      hardSolved: getCountByDifficulty(solvedCounts, 'Hard'),
      totalHard: getCountByDifficulty(allQuestions, 'Hard'),
      ranking: matchedUser.profile?.ranking ?? 0,
      streak: matchedUser.userCalendar?.streak ?? 0,
      totalActiveDays: matchedUser.userCalendar?.totalActiveDays ?? 0,
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
    console.error('[api/leetcode] Request failed:', reason);
    return new Response(
      JSON.stringify({ error: 'Unable to fetch LeetCode statistics.' }),
      {
        status: 502,
        headers: buildSecurityHeaders(request, 'no-store'),
      }
    );
  }
}
