import {
  githubContributionsResponseSchema,
  githubUserProfileSchema,
  type GithubContributionsResponse,
  type GithubContributionDay,
  type GithubUserProfile,
} from './schemas';
import { GITHUB_CONTRIBUTIONS_FALLBACK } from './githubFallback';
import { sanitizeExternalUrl, SafeUserError } from './security';

export const GITHUB_USERNAME = 'ElXprogramming';
export const GITHUB_API_BASE = 'https://github-contributions-api.jogruber.de/v4';
export const GITHUB_USERS_API = 'https://api.github.com/users';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
const REQUEST_TIMEOUT_MS = 8000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const contributionsCache = new Map<string, CacheEntry<GithubContributionsResponse>>();
let userProfileCache: CacheEntry<GithubUserProfile> | null = null;

export async function fetchGithubContributions(
  year: string = 'last'
): Promise<GithubContributionsResponse> {
  const cacheKey = `contributions-${year}`;
  const cached = contributionsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `${GITHUB_API_BASE}/${encodeURIComponent(GITHUB_USERNAME)}?y=${encodeURIComponent(year)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new SafeUserError(`Failed to fetch GitHub contributions (HTTP ${response.status})`);
    }

    const rawData = await response.json();
    const validatedData = githubContributionsResponseSchema.parse(rawData);

    contributionsCache.set(cacheKey, {
      data: validatedData,
      timestamp: Date.now(),
    });

    return validatedData;
  } catch (err) {
    clearTimeout(timer);

    // If cache has any data (even expired), return it gracefully
    if (cached) {
      return cached.data;
    }

    // If requesting last year or current year, fallback to verified bundled snapshot
    if (year === 'last' || year === '2026') {
      return GITHUB_CONTRIBUTIONS_FALLBACK;
    }

    if (err instanceof SafeUserError) {
      throw err;
    }

    throw new SafeUserError('Unable to load GitHub contributions at this time. Please try again.');
  }
}

export async function fetchGithubUserProfile(): Promise<GithubUserProfile | null> {
  if (userProfileCache && Date.now() - userProfileCache.timestamp < CACHE_TTL_MS) {
    return userProfileCache.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `${GITHUB_USERS_API}/${encodeURIComponent(GITHUB_USERNAME)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      return null;
    }

    const raw = await response.json();
    const parsed = githubUserProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return null;
    }

    const sanitizedProfile: GithubUserProfile = {
      ...parsed.data,
      avatar_url:
        sanitizeExternalUrl(parsed.data.avatar_url, ['avatars.githubusercontent.com']) ??
        parsed.data.avatar_url,
      html_url: parsed.data.html_url
        ? sanitizeExternalUrl(parsed.data.html_url, ['github.com']) ?? undefined
        : undefined,
    };

    userProfileCache = {
      data: sanitizedProfile,
      timestamp: Date.now(),
    };

    return sanitizedProfile;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export interface ContributionStats {
  total: number;
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
  maxDay: {
    date: string;
    count: number;
  };
}

export function calculateContributionStats(
  contributions: readonly GithubContributionDay[]
): ContributionStats {
  if (!contributions || contributions.length === 0) {
    return {
      total: 0,
      activeDays: 0,
      longestStreak: 0,
      currentStreak: 0,
      maxDay: { date: '', count: 0 },
    };
  }

  let total = 0;
  let activeDays = 0;
  let maxDay = { date: '', count: 0 };
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < contributions.length; i++) {
    const day = contributions[i];
    total += day.count;

    if (day.count > 0) {
      activeDays++;
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      if (day.count > maxDay.count) {
        maxDay = { date: day.date, count: day.count };
      }
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current streak from today backwards
  for (let i = contributions.length - 1; i >= 0; i--) {
    if (contributions[i].count > 0) {
      currentStreak++;
    } else {
      // If the very latest day in data has 0 contributions, allow checking yesterday before breaking
      if (i === contributions.length - 1) {
        continue;
      }
      break;
    }
  }

  return {
    total,
    activeDays,
    longestStreak,
    currentStreak,
    maxDay,
  };
}

export function groupContributionsIntoWeeks(
  contributions: readonly GithubContributionDay[]
): Array<Array<GithubContributionDay | null>> {
  if (!contributions || contributions.length === 0) return [];

  const weeks: Array<Array<GithubContributionDay | null>> = [];
  let currentWeek: Array<GithubContributionDay | null> = [];

  const firstDate = new Date(`${contributions[0].date}T00:00:00Z`);
  const startDay = firstDate.getUTCDay(); // 0 is Sunday

  // Pad the first week with nulls for days preceding the start date
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  for (const day of contributions) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Pad the final week with nulls if needed to fill all 7 days
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export interface MonthLabel {
  weekIndex: number;
  label: string;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function getMonthLabels(
  weeks: ReadonlyArray<ReadonlyArray<GithubContributionDay | null>>
): MonthLabel[] {
  const months: MonthLabel[] = [];
  let lastMonth = -1;

  weeks.forEach((week, wIndex) => {
    const firstValidDay = week.find((d): d is GithubContributionDay => d !== null);
    if (firstValidDay) {
      const m = new Date(`${firstValidDay.date}T00:00:00Z`).getUTCMonth();
      if (m !== lastMonth) {
        // Prevent squishing labels too close to each other (at least 2 weeks apart)
        if (months.length === 0 || wIndex - months[months.length - 1].weekIndex >= 2) {
          months.push({ weekIndex: wIndex, label: MONTH_NAMES[m] });
          lastMonth = m;
        }
      }
    }
  });

  return months;
}

export function formatDateLabel(dateString: string): string {
  try {
    const date = new Date(`${dateString}T00:00:00Z`);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateString;
  }
}
