import { PROFILE } from './constants';
import {
  githubContributionsResponseSchema,
  type GithubContributionsResponse,
  type GithubContributionDay,
} from './schemas';
import { GITHUB_CONTRIBUTIONS_FALLBACK } from './githubFallback';
import { SafeUserError } from './security';

const GITHUB_API_BASE = 'https://github-contributions-api.jogruber.de/v4';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 8000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const contributionsCache = new Map<string, CacheEntry<GithubContributionsResponse>>();
const inFlightRequests = new Map<string, Promise<GithubContributionsResponse>>();

export function clearContributionsCache(): void {
  contributionsCache.clear();
  inFlightRequests.clear();
}

export async function fetchGithubContributions(
  year: string = 'last'
): Promise<GithubContributionsResponse> {
  const cacheKey = `contributions-${year}`;
  const cached = contributionsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const pending = inFlightRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  const request = (async (): Promise<GithubContributionsResponse> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const url = `${GITHUB_API_BASE}/${encodeURIComponent(PROFILE.githubUsername)}?y=${encodeURIComponent(year)}`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new SafeUserError(`Failed to fetch GitHub contributions (HTTP ${response.status})`);
      }

      const rawData: unknown = await response.json();
      const validatedData = githubContributionsResponseSchema.parse(rawData);

      contributionsCache.set(cacheKey, {
        data: validatedData,
        timestamp: Date.now(),
      });

      return validatedData;
    } catch (err) {
      // Serve stale cached data gracefully when offline or rate-limited
      if (cached) {
        return cached.data;
      }

      // Fall back to bundled snapshot for rolling last-year or current-year queries
      if (year === 'last' || year === String(new Date().getFullYear())) {
        return GITHUB_CONTRIBUTIONS_FALLBACK;
      }

      if (err instanceof SafeUserError) {
        throw err;
      }

      throw new SafeUserError('Unable to load GitHub contributions at this time. Please try again.');
    } finally {
      clearTimeout(timer);
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, request);
  return request;
}

export function sumContributions(contributions: readonly GithubContributionDay[]): number {
  let total = 0;
  for (const day of contributions) {
    total += day.count;
  }
  return total;
}

export function getLatestActiveDate(contributions: readonly GithubContributionDay[]): string | null {
  for (let i = contributions.length - 1; i >= 0; i--) {
    if (contributions[i].count > 0) {
      return contributions[i].date;
    }
  }
  return null;
}

export function groupContributionsIntoWeeks(
  contributions: readonly GithubContributionDay[]
): Array<Array<GithubContributionDay | null>> {
  if (contributions.length === 0) return [];

  const weeks: Array<Array<GithubContributionDay | null>> = [];
  const startDay = new Date(`${contributions[0].date}T00:00:00Z`).getUTCDay();
  let currentWeek: Array<GithubContributionDay | null> = Array.from({ length: startDay }, () => null);

  for (const day of contributions) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}
