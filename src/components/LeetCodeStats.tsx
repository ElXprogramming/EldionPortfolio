import { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { LeetCodeIcon } from './Icons';
import BorderGlow from './BorderGlow';
import {
  calculateDifficultyBarWidth,
  calculateOverallProgress,
  fetchLeetCodeStats,
  formatLeetCodeRank,
} from '../lib/leetcode';
import { LEETCODE_STATS_FALLBACK } from '../lib/leetcodeFallback';
import type { LeetCodeStatsResponse } from '../lib/schemas';
import { EXTERNAL_LINKS } from '../lib/constants';

const LEETCODE_GLOW_COLORS = ['#ffa116', '#f59e0b', '#fbbf24'] as const;

const RING_RADIUS = 19;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function LeetCodeStats() {
  const [stats, setStats] = useState<LeetCodeStatsResponse>(LEETCODE_STATS_FALLBACK);

  useEffect(() => {
    let isMounted = true;
    fetchLeetCodeStats()
      .then((res) => {
        if (isMounted) setStats(res);
      })
      .catch(() => {
        // Fallback snapshot already active
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedRank = useMemo(() => formatLeetCodeRank(stats.ranking), [stats.ranking]);

  const ringStrokeOffset = useMemo(() => {
    const progress = calculateOverallProgress(stats.totalSolved, stats.totalQuestions);
    return RING_CIRCUMFERENCE * (1 - progress / 100);
  }, [stats.totalSolved, stats.totalQuestions]);

  const difficulties = useMemo(
    () => [
      {
        label: 'Easy',
        solved: stats.easySolved,
        total: stats.totalEasy,
        textClass: 'text-emerald-400',
        barClass: 'bg-emerald-400',
        width: calculateDifficultyBarWidth(stats.easySolved, stats.totalEasy),
      },
      {
        label: 'Med',
        solved: stats.mediumSolved,
        total: stats.totalMedium,
        textClass: 'text-amber-400',
        barClass: 'bg-amber-400',
        width: calculateDifficultyBarWidth(stats.mediumSolved, stats.totalMedium),
      },
      {
        label: 'Hard',
        solved: stats.hardSolved,
        total: stats.totalHard,
        textClass: 'text-rose-400',
        barClass: 'bg-rose-400',
        width: calculateDifficultyBarWidth(stats.hardSolved, stats.totalHard),
      },
    ],
    [stats]
  );

  return (
    <BorderGlow
      innerClassName="p-3.5 sm:p-4"
      backgroundColor="#08080a"
      borderRadius={16}
      glowRadius={30}
      glowIntensity={0.85}
      edgeSensitivity={28}
      coneSpread={25}
      glowColor="38 95 60"
      colors={LEETCODE_GLOW_COLORS}
      fillOpacity={0.3}
    >
      {/* Top Header: Profile pill + Global rank */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <a
          href={EXTERNAL_LINKS.leetcode}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer group shrink-0"
        >
          <LeetCodeIcon className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
          <span>LeetCode stats</span>
        </a>

        <div className="text-[11px] text-zinc-400 font-normal text-right truncate">
          Rank <span className="font-semibold text-zinc-200 font-mono">{formattedRank}</span>
        </div>
      </div>

      {/* Compact Stats Row: Mini solved ring + Easy/Med/Hard micro-bars */}
      <div className="flex items-center gap-3.5 mb-2.5">
        <div
          className="relative w-12 h-12 shrink-0 flex items-center justify-center"
          role="img"
          aria-label={`${stats.totalSolved} of ${stats.totalQuestions} LeetCode problems solved`}
        >
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
            <circle
              cx="22"
              cy="22"
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="3"
            />
            <circle
              cx="22"
              cy="22"
              r={RING_RADIUS}
              fill="none"
              stroke="#ffa116"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringStrokeOffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-xs font-bold text-white font-mono">{stats.totalSolved}</span>
            <span className="text-[8px] text-zinc-500 uppercase tracking-wider mt-0.5">solved</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 flex-1 min-w-0">
          {difficulties.map((item) => (
            <div
              key={item.label}
              className="rounded-lg bg-[#111116] border border-white/5 px-2 py-1.5 min-w-0"
            >
              <div className="flex items-baseline justify-between gap-1 mb-1">
                <span className={`text-[10px] font-mono font-semibold ${item.textClass}`}>
                  {item.label}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 truncate">
                  <span className="text-zinc-200 font-semibold">{item.solved}</span>/{item.total}
                </span>
              </div>
              <div className="h-1 w-full bg-[#1b1b23] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.barClass}`}
                  style={{ width: `${item.width}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer: Streak / Active Days */}
      <div className="flex items-center justify-end gap-2 pt-0.5 text-[10px] sm:text-[11px] text-zinc-500">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-zinc-400">
            <Flame className="w-3 h-3 text-amber-400" aria-hidden="true" />
            <span className="font-mono text-zinc-200 font-medium">{stats.streak}d</span> streak
          </span>
          <span aria-hidden="true" className="text-zinc-700">·</span>
          <span>
            <span className="font-mono text-zinc-300 font-medium">{stats.totalActiveDays}</span>{' '}
            active {stats.totalActiveDays === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>
    </BorderGlow>
  );
}
