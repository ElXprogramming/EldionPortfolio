import {
  chessStatsResponseSchema,
  type ChessModeStats,
  type ChessStatsResponse,
} from './schemas';
import { CHESS_STATS_FALLBACK } from './chessFallback';

const CHESS_API_PATH = '/api/chess';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 8_000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface ChessRecordSegments {
  winPct: number;
  drawPct: number;
  lossPct: number;
}

export interface ChessAggregateRecord {
  win: number;
  loss: number;
  draw: number;
  total: number;
}

export interface ChessPeakSummary {
  mode: 'Rapid' | 'Blitz' | 'Bullet';
  rating: number;
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

export function getModeTotalGames(mode: ChessModeStats): number {
  const total = mode.win + mode.loss + mode.draw;
  return Number.isFinite(total) && total > 0 ? total : 0;
}

export function calculateWinRate(mode: ChessModeStats): number {
  const total = getModeTotalGames(mode);
  if (total <= 0) {
    return 0;
  }
  return Math.round((mode.win / total) * 100);
}

export function calculateRecordSegments(mode: ChessModeStats): ChessRecordSegments {
  const total = getModeTotalGames(mode);
  if (total <= 0) {
    return { winPct: 0, drawPct: 0, lossPct: 0 };
  }
  const winPct = Number(((mode.win / total) * 100).toFixed(1));
  const drawPct = Number(((mode.draw / total) * 100).toFixed(1));
  const lossPct = Math.max(0, Number((100 - winPct - drawPct).toFixed(1)));
  return { winPct, drawPct, lossPct };
}

export function getAggregateRecord(stats: ChessStatsResponse): ChessAggregateRecord {
  const win = stats.rapid.win + stats.blitz.win + stats.bullet.win;
  const loss = stats.rapid.loss + stats.blitz.loss + stats.bullet.loss;
  const draw = stats.rapid.draw + stats.blitz.draw + stats.bullet.draw;
  return {
    win,
    loss,
    draw,
    total: win + loss + draw,
  };
}

export function getHighestPeakMode(stats: ChessStatsResponse): ChessPeakSummary {
  const entries: readonly ChessPeakSummary[] = [
    { mode: 'Rapid', rating: Math.max(stats.rapid.best, stats.rapid.rating) },
    { mode: 'Blitz', rating: Math.max(stats.blitz.best, stats.blitz.rating) },
    { mode: 'Bullet', rating: Math.max(stats.bullet.best, stats.bullet.rating) },
  ];

  return entries.reduce((highest, current) =>
    current.rating > highest.rating ? current : highest
  );
}
