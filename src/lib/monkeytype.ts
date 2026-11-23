import { monkeytypeStatsResponseSchema, type MonkeytypeStatsResponse } from './schemas';
import { MONKEYTYPE_STATS_FALLBACK } from './monkeytypeFallback';

const MONKEYTYPE_API_PATH = '/api/monkeytype';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 8_000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let cachedStats: CacheEntry<MonkeytypeStatsResponse> | null = null;
let inFlightRequest: Promise<MonkeytypeStatsResponse> | null = null;

export function clearMonkeytypeCache(): void {
  cachedStats = null;
  inFlightRequest = null;
}

export async function fetchMonkeytypeStats(): Promise<MonkeytypeStatsResponse> {
  if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_TTL_MS) {
    return cachedStats.data;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = (async (): Promise<MonkeytypeStatsResponse> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(MONKEYTYPE_API_PATH, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      const rawData: unknown = await response.json();
      const validated = monkeytypeStatsResponseSchema.parse(rawData);

      cachedStats = {
        data: validated,
        timestamp: Date.now(),
      };

      return validated;
    } catch {
      if (cachedStats) {
        return cachedStats.data;
      }
      return MONKEYTYPE_STATS_FALLBACK;
    } finally {
      clearTimeout(timer);
      inFlightRequest = null;
    }
  })();

  inFlightRequest = request;
  return request;
}

export function formatMonkeytypeWpm(wpm: number): string {
  if (!Number.isFinite(wpm) || wpm <= 0) {
    return '—';
  }
  return String(Math.round(wpm));
}

export function formatMonkeytypeMode(
  mode: MonkeytypeStatsResponse['mode'],
  modeValue: MonkeytypeStatsResponse['modeValue']
): string | null {
  if (!mode || !modeValue) {
    return null;
  }
  return mode === 'time' ? `${modeValue}s` : `${modeValue} words`;
}
