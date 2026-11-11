import { useState, useEffect, useMemo } from 'react';
import { GithubIcon } from './Icons';
import {
  fetchGithubContributions,
  calculateContributionStats,
  groupContributionsIntoWeeks,
} from '../lib/github';
import { GITHUB_CONTRIBUTIONS_FALLBACK } from '../lib/githubFallback';
import type { GithubContributionsResponse } from '../lib/schemas';
import { EXTERNAL_LINKS } from '../lib/constants';

const getLevelColor = (level: number) => {
  switch (level) {
    case 1:
      return 'bg-[#18212d] border border-[#222e3e]/40';
    case 2:
      return 'bg-[#0f4a40] border border-[#145d50]/40';
    case 3:
      return 'bg-[#1f8f75] border border-[#25ab8c]/40';
    case 4:
      return 'bg-[#1ee9a7] border border-[#3af2b5]/60 shadow-[0_0_8px_rgba(30,233,167,0.35)]';
    default:
      return 'bg-[#010000] border border-white/[0.03]';
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

  // Display the last 27 weeks to match the card layout exactly
  const displayWeeks = useMemo(() => {
    const last27 = weeks.slice(-27);
    if (last27.length < 27) {
      const padding = Array.from({ length: 27 - last27.length }, () => Array(7).fill(null));
      return [...padding, ...last27];
    }
    return last27;
  }, [weeks]);

  // Total count formatted
  const totalContributions = useMemo(() => {
    return data.total?.['lastYear'] ?? (stats.total > 0 ? stats.total : 837);
  }, [data.total, stats.total]);

  // Year progress percentage for the capsule bar
  const progressPercentage = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const isLeap = (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0;
    const totalDays = isLeap ? 366 : 365;
    return Math.min(100, Math.max(5, Math.round((dayOfYear / totalDays) * 100)));
  }, []);

  // Last pushed date
  const lastPushedText = useMemo(() => {
    const activeDays = data.contributions.filter((d) => d.count > 0);
    const latestDay = activeDays.length > 0 ? activeDays[activeDays.length - 1] : null;

    if (latestDay?.date) {
      const [y, m, d] = latestDay.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [data.contributions]);

  return (
    <div className="rounded-2xl p-5 sm:p-6 bg-[#08080a] border border-white/10 shadow-xl">
      {/* Top Header: Badge on left, contributions count on right */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <a
          href={EXTERNAL_LINKS.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 text-xs sm:text-sm font-medium text-zinc-200 transition-colors cursor-pointer group shrink-0"
        >
          <GithubIcon className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
          <span>Github activity</span>
        </a>

        <div className="text-xs sm:text-sm text-zinc-400 font-normal text-right truncate">
          <span className="font-semibold text-zinc-200">{totalContributions}</span> contributions in the last year
        </div>
      </div>

      {/* Contribution Grid (27 columns x 7 rows) */}
      <div className="overflow-x-auto scrollbar-none py-1 mb-5">
        <div className="flex gap-1 sm:gap-1.5 justify-between min-w-max">
          {displayWeeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1 sm:gap-1.5">
              {week.map((day, dIdx) => (
                day ? (
                  <div
                    key={day.date}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] sm:rounded-[4px] ${getLevelColor(day.level)} transition-transform hover:scale-125 cursor-pointer`}
                    title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`}
                  />
                ) : (
                  <div
                    key={`empty-${dIdx}`}
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] sm:rounded-[4px] opacity-0 pointer-events-none"
                  />
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar: Progress on Left, Last Pushed on Right */}
      <div className="flex items-center justify-between gap-4 pt-1">
        {/* Progress Capsule */}
        <div className="h-1.5 w-36 sm:w-48 bg-[#18181f] rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Last pushed label */}
        <div className="text-[11px] sm:text-xs text-zinc-500 font-normal truncate">
          Last pushed on {lastPushedText}
        </div>
      </div>
    </div>
  );
}
