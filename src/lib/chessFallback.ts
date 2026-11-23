import { PROFILE } from './constants';
import type { ChessStatsResponse } from './schemas';

// Bundled snapshot for instant initial render and offline resilience
export const CHESS_STATS_FALLBACK: ChessStatsResponse = {
  username: PROFILE.chessUsername,
  rapidRating: 1552,
};
