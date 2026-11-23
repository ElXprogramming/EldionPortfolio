import { PROFILE } from './constants';
import type { ChessStatsResponse } from './schemas';

// Bundled snapshot for instant initial render and offline resilience
export const CHESS_STATS_FALLBACK: ChessStatsResponse = {
  username: PROFILE.chessUsername,
  rapid: {
    rating: 1552,
    best: 1603,
    win: 770,
    loss: 726,
    draw: 75,
  },
  blitz: {
    rating: 978,
    best: 1303,
    win: 571,
    loss: 605,
    draw: 47,
  },
  bullet: {
    rating: 935,
    best: 1162,
    win: 685,
    loss: 661,
    draw: 28,
  },
};
