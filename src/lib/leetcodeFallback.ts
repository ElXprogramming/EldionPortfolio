import type { LeetCodeStatsResponse } from './statsSchemas';

// Bundled snapshot for instant initial render and offline resilience
export const LEETCODE_STATS_FALLBACK: LeetCodeStatsResponse = {
  totalSolved: 3,
  totalQuestions: 4123,
  easySolved: 3,
  totalEasy: 978,
  mediumSolved: 0,
  totalMedium: 2152,
  hardSolved: 0,
  totalHard: 993,
};
