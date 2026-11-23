import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearMonkeytypeCache,
  fetchMonkeytypeStats,
  formatMonkeytypeMode,
  formatMonkeytypeWpm,
} from '../monkeytype';
import { MONKEYTYPE_STATS_FALLBACK } from '../monkeytypeFallback';
import { monkeytypeStatsResponseSchema } from '../schemas';

describe('Monkeytype Utilities & Schema', () => {
  describe('formatMonkeytypeWpm', () => {
    it('formats valid positive WPM speeds and handles zero or invalid values', () => {
      expect(formatMonkeytypeWpm(128)).toBe('128');
      expect(formatMonkeytypeWpm(128.43)).toBe('128');
      expect(formatMonkeytypeWpm(108.6)).toBe('109');
      expect(formatMonkeytypeWpm(0)).toBe('—');
      expect(formatMonkeytypeWpm(-12)).toBe('—');
      expect(formatMonkeytypeWpm(Number.NaN)).toBe('—');
    });
  });

  describe('formatMonkeytypeMode', () => {
    it('formats time and words modes cleanly and handles missing values', () => {
      expect(formatMonkeytypeMode('words', '10')).toBe('10 words');
      expect(formatMonkeytypeMode('time', '30')).toBe('30s');
      expect(formatMonkeytypeMode(null, null)).toBeNull();
      expect(formatMonkeytypeMode('words', null)).toBeNull();
    });
  });

  describe('monkeytypeStatsResponseSchema & fallback snapshot', () => {
    it('validates clean payloads, sanitizes username, and strips unexpected fields', () => {
      const parsed = monkeytypeStatsResponseSchema.parse({
        username: '  eldion<script>alert(1)</script>  ',
        topWpm: 128,
        accuracy: 100,
        mode: 'words',
        modeValue: '10',
        uid: 'secret-uid-should-be-stripped',
        xp: 586802,
      });

      expect(parsed).toEqual({
        username: 'eldion',
        topWpm: 128,
        accuracy: 100,
        mode: 'words',
        modeValue: '10',
      });
      expect('uid' in parsed).toBe(false);
      expect('xp' in parsed).toBe(false);
    });

    it('rejects malformed accuracy, negative WPM, or invalid modeValue payloads', () => {
      expect(() =>
        monkeytypeStatsResponseSchema.parse({
          username: 'eldion',
          topWpm: -5,
          accuracy: 100,
          mode: 'words',
          modeValue: '10',
        })
      ).toThrow();

      expect(() =>
        monkeytypeStatsResponseSchema.parse({
          username: 'eldion',
          topWpm: 128,
          accuracy: 105,
          mode: 'words',
          modeValue: '10',
        })
      ).toThrow();

      expect(() =>
        monkeytypeStatsResponseSchema.parse({
          username: 'eldion',
          topWpm: 128,
          accuracy: 100,
          mode: 'words',
          modeValue: '<img src=x>',
        })
      ).toThrow();
    });

    it('validates the bundled fallback snapshot', () => {
      const parsed = monkeytypeStatsResponseSchema.parse(MONKEYTYPE_STATS_FALLBACK);
      expect(parsed.username).toBe('eldion');
      expect(parsed.topWpm).toBeGreaterThan(0);
    });
  });
});

describe('fetchMonkeytypeStats', () => {
  const sampleStats = {
    username: 'eldion',
    topWpm: 135,
    accuracy: 99,
    mode: 'words' as const,
    modeValue: '10',
  };

  beforeEach(() => {
    clearMonkeytypeCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    clearMonkeytypeCache();
  });

  it('deduplicates concurrent in-flight requests to /api/monkeytype', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sampleStats,
    } as Response);

    const [a, b] = await Promise.all([fetchMonkeytypeStats(), fetchMonkeytypeStats()]);
    expect(a).toEqual(sampleStats);
    expect(b).toEqual(sampleStats);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/monkeytype',
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

    const first = await fetchMonkeytypeStats();
    const second = await fetchMonkeytypeStats();
    expect(first).toEqual(sampleStats);
    expect(second).toEqual(sampleStats);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6 * 60 * 1000);
    const stale = await fetchMonkeytypeStats();
    expect(stale).toEqual(sampleStats);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back gracefully to bundled snapshot on HTTP error or malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Bad gateway' }),
    } as Response);

    expect(await fetchMonkeytypeStats()).toBe(MONKEYTYPE_STATS_FALLBACK);

    clearMonkeytypeCache();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: true }),
    } as Response);

    expect(await fetchMonkeytypeStats()).toBe(MONKEYTYPE_STATS_FALLBACK);
  });
});
