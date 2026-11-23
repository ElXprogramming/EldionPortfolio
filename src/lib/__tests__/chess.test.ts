import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateRecordSegments,
  calculateWinRate,
  clearChessCache,
  fetchChessStats,
  formatChessRating,
  getAggregateRecord,
  getHighestPeakMode,
  getModeTotalGames,
} from '../chess';
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

  describe('record & peak calculations', () => {
    it('computes mode totals, win rate, and W/D/L distribution segments accurately', () => {
      const rapid = { rating: 1552, best: 1603, win: 50, loss: 40, draw: 10 };
      expect(getModeTotalGames(rapid)).toBe(100);
      expect(calculateWinRate(rapid)).toBe(50);
      expect(calculateRecordSegments(rapid)).toEqual({
        winPct: 50,
        drawPct: 10,
        lossPct: 40,
      });

      const empty = { rating: 0, best: 0, win: 0, loss: 0, draw: 0 };
      expect(getModeTotalGames(empty)).toBe(0);
      expect(calculateWinRate(empty)).toBe(0);
      expect(calculateRecordSegments(empty)).toEqual({
        winPct: 0,
        drawPct: 0,
        lossPct: 0,
      });
    });

    it('aggregates W/L/D totals across modes and picks highest peak mode', () => {
      const agg = getAggregateRecord(CHESS_STATS_FALLBACK);
      expect(agg).toEqual({
        win: 2026,
        loss: 1992,
        draw: 150,
        total: 4168,
      });

      expect(getHighestPeakMode(CHESS_STATS_FALLBACK)).toEqual({
        mode: 'Rapid',
        rating: 1603,
      });

      expect(
        getHighestPeakMode({
          username: 'eldion_03',
          rapid: { rating: 1100, best: 1200, win: 10, loss: 5, draw: 1 },
          blitz: { rating: 1450, best: 1500, win: 20, loss: 10, draw: 2 },
          bullet: { rating: 900, best: 1000, win: 5, loss: 5, draw: 0 },
        })
      ).toEqual({ mode: 'Blitz', rating: 1500 });
    });
  });

  describe('chessStatsResponseSchema & fallback snapshot', () => {
    it('validates clean payloads, sanitizes username, and strips unexpected fields', () => {
      const parsed = chessStatsResponseSchema.parse({
        username: '  eldion_03<script>alert(1)</script>  ',
        rapid: { rating: 1552, best: 1603, win: 770, loss: 726, draw: 75, extra: true },
        blitz: { rating: 978, best: 1303, win: 571, loss: 605, draw: 47 },
        bullet: { rating: 935, best: 1162, win: 685, loss: 661, draw: 28 },
        injectedField: 'should-be-stripped',
      });

      expect(parsed.username).toBe('eldion_03');
      expect(parsed.rapid.rating).toBe(1552);
      expect('injectedField' in parsed).toBe(false);
      expect('extra' in parsed.rapid).toBe(false);
    });

    it('rejects malformed or negative stat payloads', () => {
      expect(() =>
        chessStatsResponseSchema.parse({
          username: 'eldion_03',
          rapid: { rating: -10, best: 1000, win: 1, loss: 1, draw: 0 },
        })
      ).toThrow();
    });

    it('validates the bundled fallback snapshot', () => {
      const parsed = chessStatsResponseSchema.parse(CHESS_STATS_FALLBACK);
      expect(parsed.username).toBe('eldion_03');
      expect(parsed.rapid.rating).toBeGreaterThan(0);
    });
  });
});

describe('fetchChessStats', () => {
  const sampleStats = {
    username: 'eldion_03',
    rapid: { rating: 1580, best: 1620, win: 780, loss: 730, draw: 76 },
    blitz: { rating: 1010, best: 1303, win: 580, loss: 610, draw: 48 },
    bullet: { rating: 950, best: 1162, win: 690, loss: 665, draw: 29 },
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
