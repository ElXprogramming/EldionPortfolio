import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../api/monkeytype.ts';

const MOCK_UPSTREAM_RESPONSE = {
  message: 'Profile retrieved',
  data: {
    name: 'eldion',
    addedAt: 1681486355603,
    uid: '8l42cklSxyblKQ5RH0ae8Rl4hfh1',
    xp: 586802,
    streak: 1,
    maxStreak: 14,
    isPremium: false,
    typingStats: {
      completedTests: 4227,
      startedTests: 4249,
      timeTyping: 115680.87,
    },
    personalBests: {
      time: {
        '15': [{ acc: 95.77, consistency: 87.28, raw: 113.6, wpm: 108 }],
        '30': [
          { acc: 93.4, consistency: 84.38, raw: 120.79, wpm: 108.39 },
          { acc: 91.8, consistency: 31.96, raw: 41.19, wpm: 41.19 },
        ],
        '60': [{ acc: 87.93, consistency: 81.52, raw: 109, wpm: 89.6 }],
      },
      words: {
        '10': [{ acc: 100, consistency: 92.35, raw: 128.43, wpm: 128.43 }],
        '25': [{ acc: 95.28, consistency: 74.56, raw: 123.78, wpm: 112.98 }],
        '50': [{ acc: 92.94, consistency: 77.98, raw: 109.51, wpm: 97.57 }],
      },
    },
    allTimeLbs: {
      time: {
        '15': { english: { rank: 204509, count: 544125 } },
      },
    },
  },
};

function makeRequest(ip: string, origin?: string, query = ''): Request {
  const headers = new Headers({ 'x-forwarded-for': ip });
  if (origin) {
    headers.set('origin', origin);
  }
  return new Request(`https://eldionryanportfolio.vercel.app/api/monkeytype${query}`, {
    method: 'GET',
    headers,
  });
}

describe('GET /api/monkeytype serverless proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('proxies Monkeytype profile, picks best 30s time WPM, filters sensitive fields, and sets cache + security headers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_UPSTREAM_RESPONSE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await GET(
      makeRequest('198.51.100.30', 'https://eldionryanportfolio.vercel.app', '?mode=30s')
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.monkeytype.com/users/eldion/profile',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'User-Agent': expect.stringContaining('EldionPortfolio-MonkeytypeProxy/1.0'),
        }),
      })
    );

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      topWpm: 108,
      accuracy: 93,
      mode: 'time',
      modeValue: '30',
    });
    expect('username' in body).toBe(false);
    expect('uid' in body).toBe(false);
    expect('xp' in body).toBe(false);
    expect('typingStats' in body).toBe(false);
    expect('allTimeLbs' in body).toBe(false);
    expect('addedAt' in body).toBe(false);

    expect(res.headers.get('cache-control')).toContain('s-maxage=3600');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(res.headers.get('access-control-allow-origin')).toBe(
      'https://eldionryanportfolio.vercel.app'
    );
  });

  it('breaks 30s WPM ties using highest accuracy and ignores other modes or unsafe keys', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            name: 'eldion',
            personalBests: {
              time: {
                '15': [{ wpm: 145, acc: 100 }],
                '30': [
                  { wpm: 120, acc: 94.2 },
                  { wpm: 120, acc: 98.7 },
                ],
                '<script>': [{ wpm: 999, acc: 100 }],
              },
              words: {
                '10': [{ wpm: 160, acc: 100 }],
              },
            },
          },
        }),
        { status: 200 }
      )
    );

    const res = await GET(makeRequest('198.51.100.31'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      topWpm: 120,
      accuracy: 99,
      mode: 'time',
      modeValue: '30',
    });
  });

  it('normalizes profiles without personal bests safely', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            name: 'eldion',
            personalBests: {},
          },
        }),
        { status: 200 }
      )
    );

    const res = await GET(makeRequest('198.51.100.32'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      topWpm: 0,
      accuracy: 0,
      mode: null,
      modeValue: null,
    });
  });

  it('rejects invalid mode query parameters with 400', async () => {
    const res = await GET(makeRequest('198.51.100.38', undefined, '?mode=invalid'));
    expect(res.status).toBe(400);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('does not reflect untrusted origins in Access-Control-Allow-Origin', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_UPSTREAM_RESPONSE), { status: 200 })
    );

    const res = await GET(makeRequest('198.51.100.33', 'https://evil.example.com'));
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('returns generic 404 when Monkeytype profile is not found', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'User not found', data: { uid: '' } }), { status: 404 })
    );

    const res = await GET(makeRequest('198.51.100.34'));
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Monkeytype profile unavailable.');
  });

  it('returns generic 502 error without leaking upstream details on failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal upstream stack trace /srv/monkeytype/secret', { status: 500 })
    );

    const res = await GET(makeRequest('198.51.100.35'));
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unable to fetch Monkeytype statistics.');
    expect(body.error).not.toContain('/srv/monkeytype');
  });

  it('blocks oversized upstream payloads to prevent DoS', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const oversized = 'x'.repeat(70 * 1024);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(oversized, { status: 200 })
    );

    const res = await GET(makeRequest('198.51.100.36'));
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('enforces per-IP rate limiting and returns 429 with Retry-After', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(JSON.stringify(MOCK_UPSTREAM_RESPONSE), { status: 200 })
    );

    const rateLimitIp = '198.51.100.77';
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
