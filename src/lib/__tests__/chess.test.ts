import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearChessCache, fetchChessStats, formatChessRating } from '../chess';
import { CHESS_STATS_FALLBACK } from '../chessFallback';
import { chessStatsResponseSchema } from '../schemas';

describe('Chess.com Utilities & Schema', () => {
  describe('formatChessRating', () => {
    it('formats valid positive ratings and handles zero or invalid values', () => {
      expect(formatChessRating(1552)).toBe('1552');
      expect(formatChessRating(978.9)).toBe('978');
      expect(formatChessRating(0)).toBe('—');
      expect(formatChessRating(-50)).toBe('—');
      expect(formatChessRating(Number.NaN)).toBe('—');
    });
  });

  describe('chessStatsResponseSchema & fallback snapshot', () => {
    it('validates clean rapid-only payloads and strips unexpected fields', () => {
      const parsed = chessStatsResponseSchema.parse({
        username: 'eldion_03',
        rapidRating: 1552,
        blitz: { rating: 978 },
        bullet: { rating: 935 },
        injectedField: 'should-be-stripped',
      });

      expect(parsed).toEqual({
        rapidRating: 1552,
      });
      expect('username' in parsed).toBe(false);
      expect('blitz' in parsed).toBe(false);
      expect('bullet' in parsed).toBe(false);
      expect('injectedField' in parsed).toBe(false);
    });

    it('rejects malformed or negative stat payloads', () => {
      expect(() =>
        chessStatsResponseSchema.parse({
          rapidRating: -10,
        })
      ).toThrow();
    });

    it('validates the bundled fallback snapshot', () => {
      const parsed = chessStatsResponseSchema.parse(CHESS_STATS_FALLBACK);
      expect(parsed.rapidRating).toBeGreaterThan(0);
    });
  });
});

describe('fetchChessStats', () => {
  const sampleStats = {
    rapidRating: 1580,
  };

  beforeEach(() => {
    clearChessCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    clearChessCache();
  });

  it('deduplicates concurrent in-flight requests to /api/chess', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sampleStats,
    } as Response);

    const [a, b] = await Promise.all([fetchChessStats(), fetchChessStats()]);
    expect(a).toEqual(sampleStats);
    expect(b).toEqual(sampleStats);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chess',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    );
  });

  it('caches validated responses within TTL and serves stale data when refresh fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-23T00:00:00Z'));

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => sampleStats,
      } as Response)
      .mockRejectedValueOnce(new Error('Upstream timeout'));

    const first = await fetchChessStats();
    const second = await fetchChessStats();
    expect(first).toEqual(sampleStats);
    expect(second).toEqual(sampleStats);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6 * 60 * 1000);
    const stale = await fetchChessStats();
    expect(stale).toEqual(sampleStats);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back gracefully to bundled snapshot on HTTP error or malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Bad gateway' }),
    } as Response);

    expect(await fetchChessStats()).toBe(CHESS_STATS_FALLBACK);

    clearChessCache();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: true }),
    } as Response);

    expect(await fetchChessStats()).toBe(CHESS_STATS_FALLBACK);
  });
});
