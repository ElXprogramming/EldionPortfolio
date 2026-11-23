import type { GithubContributionDay, GithubContributionsResponse } from './statsSchemas';

// Active days snapshot for offline resilience (2025-10-19 to 2026-10-21, total = 100)
const ACTIVE_FALLBACK_DAYS: Readonly<Record<string, readonly [count: number, level: number]>> = {
  '2026-03-12': [2, 1],
  '2026-06-26': [1, 1],
  '2026-06-27': [3, 2],
  '2026-06-28': [2, 1],
  '2026-06-29': [1, 1],
  '2026-07-14': [1, 1],
  '2026-07-15': [5, 3],
  '2026-07-16': [5, 3],
  '2026-09-28': [4, 2],
  '2026-09-29': [1, 1],
  '2026-10-01': [6, 3],
  '2026-10-03': [8, 4],
  '2026-10-04': [3, 2],
  '2026-10-05': [1, 1],
  '2026-10-06': [9, 4],
  '2026-10-07': [5, 3],
  '2026-10-08': [7, 4],
  '2026-10-09': [4, 2],
  '2026-10-10': [7, 4],
  '2026-10-11': [1, 1],
  '2026-10-13': [1, 1],
  '2026-10-14': [8, 4],
  '2026-10-15': [1, 1],
  '2026-10-16': [2, 1],
  '2026-10-17': [2, 1],
  '2026-10-18': [1, 1],
  '2026-10-19': [5, 3],
  '2026-10-20': [2, 1],
  '2026-10-21': [2, 1],
};

function buildFallbackContributions(startIso: string, endIso: string): GithubContributionDay[] {
  const contributions: GithubContributionDay[] = [];
  const cursor = new Date(`${startIso}T00:00:00Z`);
  const endTime = new Date(`${endIso}T00:00:00Z`).getTime();

  while (cursor.getTime() <= endTime) {
    const date = cursor.toISOString().slice(0, 10);
    const active = ACTIVE_FALLBACK_DAYS[date];
    contributions.push({
      date,
      count: active ? active[0] : 0,
      level: active ? active[1] : 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return contributions;
}

export const GITHUB_CONTRIBUTIONS_FALLBACK: GithubContributionsResponse = {
  total: { lastYear: 100 },
  contributions: buildFallbackContributions('2025-10-19', '2026-10-21'),
};
