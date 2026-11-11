import { useState, useEffect, useMemo, useRef } from 'react';
import { GithubIcon } from './Icons';
import {
  fetchGithubContributions,
  calculateContributionStats,
  groupContributionsIntoWeeks,
} from '../lib/github';
import { GITHUB_CONTRIBUTIONS_FALLBACK } from '../lib/githubFallback';
import type { GithubContributionsResponse, GithubContributionDay } from '../lib/schemas';
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
      return 'bg-[#1ee9a7] border border-[#3af2b5]/60 shadow-[0_0_6px_rgba(30,233,167,0.35)]';
    default:
      return 'bg-[#010000] border border-white/[0.03]';
  }
};

const formatHoverDate = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export default function GithubContributions() {
  const [data, setData] = useState<GithubContributionsResponse>(GITHUB_CONTRIBUTIONS_FALLBACK);
  const [hoveredDay, setHoveredDay] = useState<GithubContributionDay | null>(null);
  const [columnsCount, setColumnsCount] = useState<number>(27);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Compute how many columns comfortably fit without horizontal scrolling
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      // Each column is approx 11px cell + 3px gap = 14px
      const count = Math.max(14, Math.floor((width + 3) / 14));
      setColumnsCount(count);
    };

    updateColumns();

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const ro = new ResizeObserver(updateColumns);
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const stats = useMemo(() => calculateContributionStats(data.contributions), [data]);
  const weeks = useMemo(() => groupContributionsIntoWeeks(data.contributions), [data]);

  // Display only what fits in the card without horizontal scrolling
  const displayWeeks = useMemo(() => {
    const sliced = weeks.slice(-columnsCount);
    if (sliced.length < columnsCount) {
      const padding = Array.from({ length: columnsCount - sliced.length }, () => Array(7).fill(null));
      return [...padding, ...sliced];
    }
    return sliced;
  }, [weeks, columnsCount]);

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
    <div className="rounded-xl sm:rounded-2xl p-3.5 sm:p-4 bg-[#08080a] border border-white/10 shadow-lg">
      {/* Top Header: Badge on left, dynamic status text on right */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <a
          href={EXTERNAL_LINKS.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 text-[11px] sm:text-xs font-medium text-zinc-200 transition-colors cursor-pointer group shrink-0"
        >
          <GithubIcon className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white transition-colors" />
          <span>Github activity</span>
        </a>

        <div className="text-[11px] sm:text-xs text-zinc-400 font-normal text-right truncate transition-all">
          {hoveredDay ? (
            <span>
              <span className="font-semibold text-zinc-200">{hoveredDay.count}</span>{' '}
              {hoveredDay.count === 1 ? 'contribution' : 'contributions'} on{' '}
              <span className="text-zinc-300 font-medium">{formatHoverDate(hoveredDay.date)}</span>
            </span>
          ) : (
            <span>
              <span className="font-semibold text-zinc-200">{totalContributions}</span> contributions in the last year
            </span>
          )}
        </div>
      </div>

      {/* Contribution Grid: fits 100% of the card with no scroll */}
      <div
        ref={containerRef}
        onMouseLeave={() => setHoveredDay(null)}
        className="w-full overflow-hidden py-0.5 mb-3"
      >
        <div className="flex justify-between w-full">
          {displayWeeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-0.5 sm:gap-1">
              {week.map((day, dIdx) => (
                day ? (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] sm:rounded-[2.5px] ${getLevelColor(day.level)} cursor-pointer`}
                  />
                ) : (
                  <div
                    key={`empty-${dIdx}`}
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] sm:rounded-[2.5px] opacity-0 pointer-events-none"
                  />
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar: Progress on Left, Last Pushed on Right */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        {/* Progress Capsule */}
        <div className="h-1 w-24 sm:w-36 bg-[#18181f] rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Last pushed label */}
        <div className="text-[10px] sm:text-[11px] text-zinc-500 font-normal truncate">
          Last pushed on {lastPushedText}
        </div>
      </div>
    </div>
  );
}
