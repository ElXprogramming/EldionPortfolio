import { describe, it, expect } from 'vitest';
import {
  calculateContributionStats,
  groupContributionsIntoWeeks,
  getMonthLabels,
  formatDateLabel,
} from '../github';
import {
  githubContributionsResponseSchema,
  githubUserProfileSchema,
  type GithubContributionDay,
} from '../schemas';

describe('GitHub Contributions Analytics & Formatting', () => {
  const sampleDays: GithubContributionDay[] = [
    { date: '2026-03-01', count: 0, level: 0 },
    { date: '2026-03-02', count: 3, level: 2 },
    { date: '2026-03-03', count: 5, level: 3 },
    { date: '2026-03-04', count: 1, level: 1 },
    { date: '2026-03-05', count: 0, level: 0 },
    { date: '2026-03-06', count: 8, level: 4 },
    { date: '2026-03-07', count: 2, level: 1 },
  ];

  it('calculates total, active days, max day and streaks accurately', () => {
    const stats = calculateContributionStats(sampleDays);
    expect(stats.total).toBe(19);
    expect(stats.activeDays).toBe(5);
    expect(stats.maxDay).toEqual({ date: '2026-03-06', count: 8 });
    expect(stats.longestStreak).toBe(3); // 2026-03-02 to 2026-03-04
    expect(stats.currentStreak).toBe(2); // 2026-03-06 to 2026-03-07
  });

  it('handles empty contributions gracefully', () => {
    const stats = calculateContributionStats([]);
    expect(stats.total).toBe(0);
    expect(stats.activeDays).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.currentStreak).toBe(0);
  });

  it('groups contributions into 7-day columns and pads start/end correctly', () => {
    // 2026-03-01 was Sunday (day 0)
    const weeks = groupIntoWeeksTest(sampleDays);
    expect(weeks.length).toBe(1);
    expect(weeks[0].length).toBe(7);
    expect(weeks[0][0]?.date).toBe('2026-03-01');
    expect(weeks[0][6]?.date).toBe('2026-03-07');
  });

  function groupIntoWeeksTest(days: GithubContributionDay[]) {
    return groupContributionsIntoWeeks(days);
  }

  it('generates month labels from weeks', () => {
    const weeks = groupContributionsIntoWeeks(sampleDays);
    const months = getMonthLabels(weeks);
    expect(months.length).toBeGreaterThan(0);
    expect(months[0].label).toBe('Mar');
  });

  it('formats dates consistently', () => {
    const formatted = formatDateLabel('2026-10-21');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
    expect(formatted).toContain('21');
  });
});

describe('GitHub Schemas Validation', () => {
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
    expect(parsed.contributions.length).toBe(2);
  });

  it('rejects invalid contribution payloads', () => {
    const invalidPayload = {
      total: { '2026': -5 }, // negative count
      contributions: [{ date: 'invalid-date', count: 'two', level: 10 }],
    };
    expect(() => githubContributionsResponseSchema.parse(invalidPayload)).toThrow();
  });

  it('validates GitHub user profile schema', () => {
    const profile = {
      login: 'ElXprogramming',
      name: 'Eldion Ryan Godius',
      avatar_url: 'https://avatars.githubusercontent.com/u/105546962?v=4',
      public_repos: 4,
      followers: 6,
    };
    const parsed = githubUserProfileSchema.parse(profile);
    expect(parsed.login).toBe('ElXprogramming');
    expect(parsed.public_repos).toBe(4);
  });

  it('validates bundled GITHUB_CONTRIBUTIONS_FALLBACK against the schema', async () => {
    const { GITHUB_CONTRIBUTIONS_FALLBACK } = await import('../githubFallback');
    const parsed = githubContributionsResponseSchema.parse(GITHUB_CONTRIBUTIONS_FALLBACK);
    expect(parsed.contributions.length).toBeGreaterThan(0);
    expect(parsed.total.lastYear).toBe(100);
  });

  it('calculates streak correctly when current day is inactive but yesterday was active', () => {
    const days: GithubContributionDay[] = [
      { date: '2026-03-01', count: 1, level: 1 },
      { date: '2026-03-02', count: 2, level: 1 },
      { date: '2026-03-03', count: 0, level: 0 }, // today inactive
    ];
    const stats = calculateContributionStats(days);
    expect(stats.currentStreak).toBe(2);
  });
});

