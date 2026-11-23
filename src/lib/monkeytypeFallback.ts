import type { MonkeytypeStatsResponse } from './schemas';

// Bundled snapshot (30s time mode) for instant initial render and offline resilience
export const MONKEYTYPE_STATS_FALLBACK: MonkeytypeStatsResponse = {
  topWpm: 108,
  accuracy: 93,
  mode: 'time',
  modeValue: '30',
};
