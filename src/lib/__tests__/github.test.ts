import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearContributionsCache,
  fetchGithubContributions,
  getLatestActiveDate,
  groupContributionsIntoWeeks,
  sumContributions,
} from '../github';
import { GITHUB_CONTRIBUTIONS_FALLBACK } from '../githubFallback';
import {
  githubContributionsResponseSchema,
  type GithubContributionDay,
} from '../schemas';
import { SafeUserError } from '../security';

describe('GitHub Contributions Utilities', () => {
  const sampleDays: GithubContributionDay[] = [
    { date: '2026-03-01', count: 0, level: 0 },
    { date: '2026-03-02', count: 3, level: 2 },
    { date: '2026-03-03', count: 5, level: 3 },
    { date: '2026-03-04', count: 1, level: 1 },
    { date: '2026-03-05', count: 0, level: 0 },
    { date: '2026-03-06', count: 8, level: 4 },
    { date: '2026-03-07', count: 2, level: 1 },
  ];

  describe('sumContributions', () => {
    it('sums contribution counts accurately and returns 0 for empty lists', () => {
      expect(sumContributions(sampleDays)).toBe(19);
      expect(sumContributions([])).toBe(0);
    });
  });

  describe('getLatestActiveDate', () => {
    it('returns the most recent date with positive contributions', () => {
      expect(getLatestActiveDate(sampleDays)).toBe('2026-03-07');
      expect(
        getLatestActiveDate([
          { date: '2026-03-01', count: 2, level: 1 },
          { date: '2026-03-02', count: 0, level: 0 },
          { date: '2026-03-03', count: 0, level: 0 },
        ])
      ).toBe('2026-03-01');
    });

    it('returns null when there are no active days', () => {
      expect(getLatestActiveDate([])).toBeNull();
      expect(getLatestActiveDate([{ date: '2026-03-01', count: 0, level: 0 }])).toBeNull();
    });
  });

  describe('groupContributionsIntoWeeks', () => {
    it('groups a full Sunday-Saturday span into a single 7-day column', () => {
      // 2026-03-01 is Sunday (UTC day 0)
      const weeks = groupContributionsIntoWeeks(sampleDays);
      expect(weeks).toHaveLength(1);
      expect(weeks[0]).toHaveLength(7);
      expect(weeks[0][0]?.date).toBe('2026-03-01');
      expect(weeks[0][6]?.date).toBe('2026-03-07');
    });

    it('pads leading and trailing days with null when span starts/ends mid-week', () => {
      // 2026-03-04 is Wednesday (UTC day 3), 2026-03-05 is Thursday (UTC day 4)
      const weeks = groupContributionsIntoWeeks([
        { date: '2026-03-04', count: 1, level: 1 },
        { date: '2026-03-05', count: 2, level: 1 },
      ]);
      expect(weeks).toHaveLength(1);
      expect(weeks[0]).toHaveLength(7);
      expect(weeks[0].slice(0, 3)).toEqual([null, null, null]);
      expect(weeks[0][3]?.date).toBe('2026-03-04');
      expect(weeks[0][4]?.date).toBe('2026-03-05');
      expect(weeks[0].slice(5)).toEqual([null, null]);
    });

    it('returns empty array for empty input', () => {
      expect(groupContributionsIntoWeeks([])).toEqual([]);
    });
  });
});

describe('GitHub Schemas & Fallback Snapshot', () => {
  it('validates valid GitHub contribution payloads', () => {
    const payload = {
      total: { '2026': 100, lastYear: 100 },
      contributions: [
        { date: '2026-10-20', count: 1, level: 1 },
        { date: '2026-10-21', count: 0, level: 0 },
      ],
    };
    const parsed = githubContributionsResponseSchema.parse(payload);
    expect(parsed.total['2026']).toBe(100);
    expect(parsed.contributions).toHaveLength(2);
  });

  it('rejects invalid contribution payloads', () => {
    const invalidPayload = {
      total: { '2026': -5 },
      contributions: [{ date: 'invalid-date', count: 'two', level: 10 }],
    };
    expect(() => githubContributionsResponseSchema.parse(invalidPayload)).toThrow();
  });

  it('generates a complete, schema-valid fallback snapshot', () => {
    const parsed = githubContributionsResponseSchema.parse(GITHUB_CONTRIBUTIONS_FALLBACK);
    expect(parsed.contributions).toHaveLength(368);
    expect(parsed.contributions[0]?.date).toBe('2025-10-19');
    expect(parsed.contributions.at(-1)?.date).toBe('2026-10-21');
    expect(parsed.total.lastYear).toBe(100);
    expect(sumContributions(parsed.contributions)).toBe(100);
    expect(getLatestActiveDate(parsed.contributions)).toBe('2026-10-21');
  });
});

describe('fetchGithubContributions', () => {
  beforeEach(() => {
    clearContributionsCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    clearContributionsCache();
  });

  it('deduplicates concurrent in-flight requests for the same year', async () => {
    const mockPayload = {
      total: { lastYear: 99 },
      contributions: [{ date: '2026-10-20', count: 99, level: 4 }],
    };

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const [a, b] = await Promise.all([
      fetchGithubContributions('last'),
      fetchGithubContributions('last'),
    ]);

    expect(a).toEqual(mockPayload);
    expect(b).toEqual(mockPayload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches, validates, and caches responses within TTL', async () => {
    const mockPayload = {
      total: { lastYear: 42 },
      contributions: [{ date: '2026-10-20', count: 42, level: 4 }],
    };

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPayload,
    } as Response);

    const first = await fetchGithubContributions('last');
    const second = await fetchGithubContributions('last');

    expect(first).toEqual(mockPayload);
    expect(second).toEqual(mockPayload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('serves stale cached data if a refresh fails after TTL expiry', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T00:00:00Z'));

    const mockPayload = {
      total: { lastYear: 25 },
      contributions: [{ date: '2026-10-20', count: 25, level: 3 }],
    };

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPayload,
      } as Response)
      .mockRejectedValueOnce(new Error('Network down'));

    const fresh = await fetchGithubContributions('last');
    expect(fresh).toEqual(mockPayload);

    vi.advanceTimersByTime(6 * 60 * 1000);
    const stale = await fetchGithubContributions('last');
    expect(stale).toEqual(mockPayload);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to bundled snapshot on network failure for last year', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));

    const result = await fetchGithubContributions('last');
    expect(result).toBe(GITHUB_CONTRIBUTIONS_FALLBACK);
  });

  it('throws SafeUserError on HTTP failure or malformed payload for historical years', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response);

    await expect(fetchGithubContributions('2021')).rejects.toThrow(SafeUserError);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ invalid: true }),
    } as Response);

    await expect(fetchGithubContributions('2020')).rejects.toThrow(SafeUserError);
  });
});
