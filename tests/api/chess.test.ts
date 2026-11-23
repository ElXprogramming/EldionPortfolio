import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../api/chess.ts';

const MOCK_UPSTREAM_RESPONSE = {
  chess_daily: {
    last: { rating: 800, date: 1722673758, rd: 350 },
    record: { win: 4, loss: 5, draw: 0 },
  },
  chess_rapid: {
    last: { rating: 1552, date: 1795259368, rd: 35 },
    best: {
      rating: 1603,
      date: 1789105180,
      game: 'https://www.chess.com/game/live/86271653805',
    },
    record: { win: 770, loss: 726, draw: 75 },
  },
  chess_blitz: {
    last: { rating: 978, date: 1793465309, rd: 43 },
    best: {
      rating: 1303,
      date: 1553346733,
      game: 'https://www.chess.com/game/live/168357195990',
    },
    record: { win: 571, loss: 605, draw: 47 },
  },
  chess_bullet: {
    last: { rating: 935, date: 1795368577, rd: 45 },
    best: {
      rating: 1162,
      date: 1553358109,
      game: 'https://www.chess.com/game/live/5563406130',
    },
    record: { win: 685, loss: 661, draw: 28 },
  },
  fide: 0,
  tactics: { highest: { rating: 1831, date: 1781634540 } },
  puzzle_rush: { best: { total_attempts: 48, score: 45 } },
};

function makeRequest(ip: string, origin?: string, query = ''): Request {
  const headers = new Headers({ 'x-forwarded-for': ip });
  if (origin) {
    headers.set('origin', origin);
  }
  return new Request(`https://eldionryanportfolio.vercel.app/api/chess${query}`, {
    method: 'GET',
    headers,
  });
}

describe('GET /api/chess serverless proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('proxies Chess.com rapid rating only, sends User-Agent, filters fields, and sets cache + security headers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_UPSTREAM_RESPONSE), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await GET(makeRequest('198.51.100.20', 'https://eldionryanportfolio.vercel.app'));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.chess.com/pub/player/eldion_03/stats',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'User-Agent': expect.stringContaining('EldionPortfolio-ChessProxy/1.0'),
        }),
      })
    );

    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      username: 'eldion_03',
      rapidRating: 1552,
    });
    expect('blitz' in body).toBe(false);
    expect('bullet' in body).toBe(false);
    expect('chess_daily' in body).toBe(false);
    expect('tactics' in body).toBe(false);
    expect('puzzle_rush' in body).toBe(false);

    expect(res.headers.get('cache-control')).toContain('s-maxage=3600');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(res.headers.get('access-control-allow-origin')).toBe(
      'https://eldionryanportfolio.vercel.app'
    );
  });

  it('normalizes missing chess_rapid rating safely to 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    const res = await GET(makeRequest('198.51.100.21'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({
      username: 'eldion_03',
      rapidRating: 0,
    });
  });

  it('does not reflect untrusted origins in Access-Control-Allow-Origin', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_UPSTREAM_RESPONSE), { status: 200 })
    );

    const res = await GET(makeRequest('198.51.100.22', 'https://evil.example.com'));
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('returns generic 404 when Chess.com profile is not found', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 0, message: 'User not found' }), { status: 404 })
    );

    const res = await GET(makeRequest('198.51.100.23'));
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Chess.com profile unavailable.');
  });

  it('returns generic 502 error without leaking upstream details on failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal upstream stack trace /srv/chess/internal', { status: 500 })
    );

    const res = await GET(makeRequest('198.51.100.24'));
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unable to fetch Chess.com statistics.');
    expect(body.error).not.toContain('/srv/chess');
  });

  it('blocks oversized upstream payloads to prevent DoS', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const oversized = 'x'.repeat(70 * 1024);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(oversized, { status: 200 })
    );

    const res = await GET(makeRequest('198.51.100.25'));
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('enforces per-IP rate limiting and returns 429 with Retry-After', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response(JSON.stringify(MOCK_UPSTREAM_RESPONSE), { status: 200 })
    );

    const rateLimitIp = '198.51.100.88';
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
