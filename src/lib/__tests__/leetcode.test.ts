import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateDifficultyBarWidth,
  calculateOverallProgress,
  clearLeetCodeCache,
  fetchLeetCodeStats,
} from '../leetcode';
import { LEETCODE_STATS_FALLBACK } from '../leetcodeFallback';
import { leetcodeStatsResponseSchema } from '../schemas';

describe('LeetCode Utilities & Schema', () => {
  describe('progress bar calculations', () => {
    it('returns 0 for zero/invalid values and applies visible minimum width for positive solves', () => {
      expect(calculateDifficultyBarWidth(0, 978)).toBe(0);
      expect(calculateDifficultyBarWidth(3, 0)).toBe(0);
      expect(calculateDifficultyBarWidth(3, 978)).toBe(4);
      expect(calculateDifficultyBarWidth(500, 1000)).toBe(50);
      expect(calculateDifficultyBarWidth(1200, 1000)).toBe(100);

      expect(calculateOverallProgress(0, 4123)).toBe(0);
      expect(calculateOverallProgress(3, 4123)).toBe(2);
      expect(calculateOverallProgress(4123, 4123)).toBe(100);
    });
  });

  describe('leetcodeStatsResponseSchema & fallback snapshot', () => {
    it('validates clean payloads and strips unexpected fields', () => {
      const parsed = leetcodeStatsResponseSchema.parse({
        username: 'eldion03',
        totalSolved: 15,
        totalQuestions: 4123,
        easySolved: 10,
        totalEasy: 978,
        mediumSolved: 4,
        totalMedium: 2152,
        hardSolved: 1,
        totalHard: 993,
        ranking: 982100,
        streak: 5,
        totalActiveDays: 12,
        injectedField: 'should-be-stripped',
      });

      expect(parsed.totalSolved).toBe(15);
      expect('username' in parsed).toBe(false);
      expect('ranking' in parsed).toBe(false);
      expect('injectedField' in parsed).toBe(false);
    });

    it('rejects malformed or negative stat payloads', () => {
      expect(() =>
        leetcodeStatsResponseSchema.parse({
          totalSolved: -1,
        })
      ).toThrow();
    });

    it('validates the bundled fallback snapshot', () => {
      const parsed = leetcodeStatsResponseSchema.parse(LEETCODE_STATS_FALLBACK);
      expect(parsed.totalSolved).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('fetchLeetCodeStats', () => {
  const sampleStats = {
    totalSolved: 12,
    totalQuestions: 4123,
    easySolved: 9,
    totalEasy: 978,
    mediumSolved: 3,
    totalMedium: 2152,
    hardSolved: 0,
    totalHard: 993,
    streak: 4,
    totalActiveDays: 9,
  };

  beforeEach(() => {
    clearLeetCodeCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    clearLeetCodeCache();
  });

  it('deduplicates concurrent in-flight requests to /api/leetcode', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sampleStats,
    } as Response);

    const [a, b] = await Promise.all([fetchLeetCodeStats(), fetchLeetCodeStats()]);
    expect(a).toEqual(sampleStats);
    expect(b).toEqual(sampleStats);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/leetcode',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    );
  });

  it('caches validated responses within TTL and serves stale data when refresh fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-22T00:00:00Z'));

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => sampleStats,
      } as Response)
      .mockRejectedValueOnce(new Error('Upstream timeout'));

    const first = await fetchLeetCodeStats();
    const second = await fetchLeetCodeStats();
    expect(first).toEqual(sampleStats);
    expect(second).toEqual(sampleStats);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6 * 60 * 1000);
    const stale = await fetchLeetCodeStats();
    expect(stale).toEqual(sampleStats);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back gracefully to bundled snapshot on HTTP error or malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Bad gateway' }),
    } as Response);

    expect(await fetchLeetCodeStats()).toBe(LEETCODE_STATS_FALLBACK);

    clearLeetCodeCache();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: true }),
    } as Response);

    expect(await fetchLeetCodeStats()).toBe(LEETCODE_STATS_FALLBACK);
  });
});
