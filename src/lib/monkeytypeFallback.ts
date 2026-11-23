import { PROFILE } from './constants';
import type { MonkeytypeStatsResponse } from './schemas';

// Bundled snapshot for instant initial render and offline resilience
export const MONKEYTYPE_STATS_FALLBACK: MonkeytypeStatsResponse = {
  username: PROFILE.monkeytypeUsername,
  topWpm: 128,
  accuracy: 100,
  mode: 'words',
  modeValue: '10',
};
