import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../api/leetcode.ts';

const MOCK_UPSTREAM_RESPONSE = {
  data: {
    allQuestionsCount: [
      { difficulty: 'All', count: 4123 },
      { difficulty: 'Easy', count: 978 },
      { difficulty: 'Medium', count: 2152 },
      { difficulty: 'Hard', count: 993 },
    ],
    matchedUser: {
      username: 'eldion03',
      profile: {
        ranking: 5000001,
        secretInternalField: 'do-not-expose',
      },
      submitStatsGlobal: {
        acSubmissionNum: [
          { difficulty: 'All', count: 3, submissions: 23 },
          { difficulty: 'Easy', count: 3, submissions: 23 },
          { difficulty: 'Medium', count: 0, submissions: 0 },
          { difficulty: 'Hard', count: 0, submissions: 0 },
        ],
      },
      userCalendar: {
        streak: 2,
        totalActiveDays: 3,
      },
    },
  },
};

function makeRequest(ip: string, origin?: string, query = ''): Request {
  const headers = new Headers({ 'x-forwarded-for': ip });
  if (origin) {
    headers.set('origin', origin);
  }
  return new Request(`https://eldionryanportfolio.vercel.app/api/leetcode${query}`, {
    method: 'GET',
    headers,
  });
}

describe('GET /api/leetcode serverless proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('proxies LeetCode GraphQL stats, filters response fields, and sets cache + security headers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_UPSTREAM_RESPONSE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await GET(makeRequest('198.51.100.10', 'https://eldionryanportfolio.vercel.app'));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      username: 'eldion03',
      totalSolved: 3,
      totalQuestions: 4123,
      easySolved: 3,
      totalEasy: 978,
      mediumSolved: 0,
      totalMedium: 2152,
      hardSolved: 0,
      totalHard: 993,
      ranking: 5000001,
      streak: 2,
      totalActiveDays: 3,
    });
    expect('secretInternalField' in body).toBe(false);

    expect(res.headers.get('cache-control')).toContain('s-maxage=3600');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(res.headers.get('access-control-allow-origin')).toBe(
      'https://eldionryanportfolio.vercel.app'
    );
  });

  it('does not reflect untrusted origins in Access-Control-Allow-Origin', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_UPSTREAM_RESPONSE), { status: 200 })
    );

    const res = await GET(makeRequest('198.51.100.11', 'https://evil.example.com'));
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('returns generic 502 error without leaking upstream details on failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal PostgreSQL error at /var/lib/secret', { status: 500 })
    );

    const res = await GET(makeRequest('198.51.100.12'));
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unable to fetch LeetCode statistics.');
    expect(body.error).not.toContain('/var/lib');
  });

  it('blocks oversized upstream payloads to prevent DoS', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const oversized = 'x'.repeat(70 * 1024);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(oversized, { status: 200 })
    );

    const res = await GET(makeRequest('198.51.100.13'));
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('enforces per-IP rate limiting and returns 429 with Retry-After', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(JSON.stringify(MOCK_UPSTREAM_RESPONSE), { status: 200 })
    );

    const rateLimitIp = '198.51.100.99';
    for (let i = 0; i < 30; i++) {
      const okRes = await GET(makeRequest(rateLimitIp));
      expect(okRes.status).toBe(200);
    }

    const blockedRes = await GET(makeRequest(rateLimitIp));
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get('retry-after')).toBeTruthy();
    expect(blockedRes.headers.get('cache-control')).toBe('no-store');
  });
});
