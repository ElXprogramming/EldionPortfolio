import * as z from 'zod/mini';

const nonNegInt = () => z.int().check(z.nonnegative());

const githubContributionDaySchema = z.object({
  date: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')),
  count: nonNegInt(),
  level: z.int().check(z.gte(0), z.lte(4)),
});

export type GithubContributionDay = z.infer<typeof githubContributionDaySchema>;

export const githubContributionsResponseSchema = z.object({
  total: z.record(z.string(), nonNegInt()),
  contributions: z.array(githubContributionDaySchema),
});

export type GithubContributionsResponse = z.infer<typeof githubContributionsResponseSchema>;

export const leetcodeStatsResponseSchema = z.object({
  totalSolved: nonNegInt(),
  totalQuestions: nonNegInt(),
  easySolved: nonNegInt(),
  totalEasy: nonNegInt(),
  mediumSolved: nonNegInt(),
  totalMedium: nonNegInt(),
  hardSolved: nonNegInt(),
  totalHard: nonNegInt(),
});

export type LeetCodeStatsResponse = z.infer<typeof leetcodeStatsResponseSchema>;

export const chessStatsResponseSchema = z.object({
  rapidRating: nonNegInt(),
});

export type ChessStatsResponse = z.infer<typeof chessStatsResponseSchema>;

export const monkeytypeStatsResponseSchema = z.object({
  topWpm: nonNegInt(),
  accuracy: z.int().check(z.gte(0), z.lte(100)),
  mode: z.nullable(z.literal('time')),
  modeValue: z.nullable(z.literal('30')),
});

export type MonkeytypeStatsResponse = z.infer<typeof monkeytypeStatsResponseSchema>;
