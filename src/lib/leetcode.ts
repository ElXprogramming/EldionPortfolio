import { leetcodeStatsResponseSchema, type LeetCodeStatsResponse } from './schemas';
import { LEETCODE_STATS_FALLBACK } from './leetcodeFallback';

const LEETCODE_API_PATH = '/api/leetcode';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 8_000;
const UNRANKED_THRESHOLD = 5_000_000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let cachedStats: CacheEntry<LeetCodeStatsResponse> | null = null;
let inFlightRequest: Promise<LeetCodeStatsResponse> | null = null;

export function clearLeetCodeCache(): void {
  cachedStats = null;
  inFlightRequest = null;
}

export async function fetchLeetCodeStats(): Promise<LeetCodeStatsResponse> {
  if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL_MS) {
    return cachedStats.data;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = (async (): Promise<LeetCodeStatsResponse> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(LEETCODE_API_PATH, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const rawData: unknown = await response.json();
      const validated = leetcodeStatsResponseSchema.parse(rawData);

      cachedStats = {
        data: validated,
        timestamp: Date.now(),
      };

      return validated;
    } catch {
      if (cachedStats) {
        return cachedStats.data;
      }
      return LEETCODE_STATS_FALLBACK;
    } finally {
      clearTimeout(timer);
      inFlightRequest = null;
    }
  })();

  inFlightRequest = request;
  return request;
}

export function formatLeetCodeRank(ranking: number): string {
  if (!Number.isFinite(ranking) || ranking <= 0) {
    return 'Unranked';
  }
  if (ranking > UNRANKED_THRESHOLD) {
    return '>5,000,000';
  }
  return `#${Math.floor(ranking).toLocaleString('en-US')}`;
}

export function calculateDifficultyBarWidth(solved: number, total: number): number {
  if (!Number.isFinite(solved) || !Number.isFinite(total) || solved <= 0 || total <= 0) {
    return 0;
  }
  const rawPercent = (solved / total) * 100;
  return Math.min(100, Math.max(4, Number(rawPercent.toFixed(1))));
}

export function calculateOverallProgress(solved: number, total: number): number {
  if (!Number.isFinite(solved) || !Number.isFinite(total) || solved <= 0 || total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(2, Number(((solved / total) * 100).toFixed(1))));
}
