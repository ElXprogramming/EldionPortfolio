import { chessStatsResponseSchema, type ChessStatsResponse } from './schemas';
import { CHESS_STATS_FALLBACK } from './chessFallback';

const CHESS_API_PATH = '/api/chess';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 8_000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let cachedStats: CacheEntry<ChessStatsResponse> | null = null;
let inFlightRequest: Promise<ChessStatsResponse> | null = null;

export function clearChessCache(): void {
  cachedStats = null;
  inFlightRequest = null;
}

export async function fetchChessStats(): Promise<ChessStatsResponse> {
  if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL_MS) {
    return cachedStats.data;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = (async (): Promise<ChessStatsResponse> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(CHESS_API_PATH, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const rawData: unknown = await response.json();
      const validated = chessStatsResponseSchema.parse(rawData);

      cachedStats = {
        data: validated,
        timestamp: Date.now(),
      };

      return validated;
    } catch {
      if (cachedStats) {
        return cachedStats.data;
      }
      return CHESS_STATS_FALLBACK;
    } finally {
      clearTimeout(timer);
      inFlightRequest = null;
    }
  })();

  inFlightRequest = request;
  return request;
}

export function formatChessRating(rating: number): string {
  if (!Number.isFinite(rating) || rating <= 0) {
    return '—';
  }
  return String(Math.floor(rating));
}
