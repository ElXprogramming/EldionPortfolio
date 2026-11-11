import { useState, useEffect, useMemo } from 'react';
import { ExternalLink, GitCommit, Flame, Calendar } from 'lucide-react';
import { GithubIcon } from './Icons';
import {
  fetchGithubContributions,
  calculateContributionStats,
  groupContributionsIntoWeeks,
} from '../lib/github';
import { GITHUB_CONTRIBUTIONS_FALLBACK } from '../lib/githubFallback';
import type { GithubContributionsResponse } from '../lib/schemas';
import { EXTERNAL_LINKS, PROFILE } from '../lib/constants';

const getLevelColor = (level: number) => {
  switch (level) {
    case 1:
      return 'bg-purple-900/40 border-purple-800/40';
    case 2:
      return 'bg-purple-700/60 border-purple-600/50';
    case 3:
      return 'bg-purple-500/80 border-purple-400/60';
    case 4:
      return 'bg-purple-400 border-purple-300';
    default:
      return 'bg-[#18181f] border-white/5';
  }
};

export default function GithubContributions() {
  const [data, setData] = useState<GithubContributionsResponse>(GITHUB_CONTRIBUTIONS_FALLBACK);

  useEffect(() => {
    let isMounted = true;
    fetchGithubContributions('last')
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch(() => {
        // Fallback snapshot used automatically
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => calculateContributionStats(data.contributions), [data]);
  const weeks = useMemo(() => groupContributionsIntoWeeks(data.contributions), [data]);

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-[#111116] border border-white/10 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
          <GithubIcon className="w-4 h-4 text-purple-400" />
          <span>GitHub Contributions</span>
        </div>

        <a
          href={EXTERNAL_LINKS.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors group cursor-pointer"
        >
          <span>@{PROFILE.githubUsername}</span>
          <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-purple-400 transition-colors" />
        </a>
      </div>

      {/* Minimalist Stats Counters */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="p-2.5 rounded-xl bg-[#141419] border border-white/5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <GitCommit className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-zinc-400 uppercase truncate">Total</div>
            <div className="text-sm font-bold text-white font-mono truncate">{stats.total}</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#141419] border border-white/5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-zinc-400 uppercase truncate">Streak</div>
            <div className="text-sm font-bold text-white font-mono truncate">{stats.longestStreak}d</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#141419] border border-white/5 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-zinc-400 uppercase truncate">Active</div>
            <div className="text-sm font-bold text-white font-mono truncate">{stats.activeDays}d</div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                day ? (
                  <div
                    key={day.date}
                    className={`w-2.5 h-2.5 rounded-[2px] border ${getLevelColor(day.level)} transition-colors cursor-pointer hover:scale-125`}
                    title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`}
                  />
                ) : (
                  <div key={`empty-${dIdx}`} className="w-2.5 h-2.5 opacity-0" />
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/5 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400">Past 12 Months Activity</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="w-2 h-2 rounded-[2px] bg-[#18181f] border border-white/5" />
          <span className="w-2 h-2 rounded-[2px] bg-purple-900/40 border border-purple-800/40" />
          <span className="w-2 h-2 rounded-[2px] bg-purple-700/60 border border-purple-600/50" />
          <span className="w-2 h-2 rounded-[2px] bg-purple-500/80 border border-purple-400/60" />
          <span className="w-2 h-2 rounded-[2px] bg-purple-400 border border-purple-300" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
