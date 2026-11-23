import { useState, useEffect, useMemo, useRef, useCallback, type MouseEvent } from 'react';
import { GithubIcon } from './Icons';
import {
  fetchGithubContributions,
  getLatestActiveDate,
  groupContributionsIntoWeeks,
  sumContributions,
} from '../lib/github';
import { GITHUB_CONTRIBUTIONS_FALLBACK } from '../lib/githubFallback';
import type { GithubContributionsResponse, GithubContributionDay } from '../lib/statsSchemas';
import { EXTERNAL_LINKS } from '../lib/constants';
import BorderGlow from './BorderGlow';

const GITHUB_GLOW_COLORS = ['#1ee9a7', '#2dd4bf', '#38bdf8'] as const;

const LEVEL_CLASSES: readonly string[] = [
  'bg-[#010000] border border-white/[0.03]',
  'bg-[#18212d] border border-[#222e3e]/40',
  'bg-[#0f4a40] border border-[#145d50]/40',
  'bg-[#1f8f75] border border-[#25ab8c]/40',
  'bg-[#1ee9a7] border border-[#3af2b5]/60 shadow-[0_0_6px_rgba(30,233,167,0.35)]',
];

function parseIsoDate(dateStr: string): Date | null {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  return Number.isNaN(dateObj.getTime()) ? null : dateObj;
}

function formatHoverDate(dateStr: string): string {
  const dateObj = parseIsoDate(dateStr);
  if (!dateObj) return dateStr;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateYearProgress(): number {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return Math.min(100, Math.max(5, Math.round((dayOfYear / (isLeap ? 366 : 365)) * 100)));
}

export default function GithubContributions({ shouldFetch = true }: { shouldFetch?: boolean }) {
  const [data, setData] = useState<GithubContributionsResponse>(GITHUB_CONTRIBUTIONS_FALLBACK);
  const [hoveredDay, setHoveredDay] = useState<GithubContributionDay | null>(null);
  const [columnsCount, setColumnsCount] = useState<number>(27);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shouldFetch) return undefined;
    let isMounted = true;
    fetchGithubContributions('last')
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch(() => {
        // Fallback snapshot already active
      });

    return () => {
      isMounted = false;
    };
  }, [shouldFetch]);

  // Compute how many columns comfortably fit without horizontal scrolling
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      // Each column is approx 11px cell + 3px gap = 14px
      setColumnsCount(Math.max(14, Math.floor((width + 3) / 14)));
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

  const weeks = useMemo(() => groupContributionsIntoWeeks(data.contributions), [data.contributions]);

  // Display only what fits in the card without horizontal scrolling
  const displayWeeks = useMemo(() => {
    const sliced = weeks.slice(-columnsCount);
    if (sliced.length < columnsCount) {
      const padding = Array.from({ length: columnsCount - sliced.length }, () =>
        Array<GithubContributionDay | null>(7).fill(null)
      );
      return [...padding, ...sliced];
    }
    return sliced;
  }, [weeks, columnsCount]);

  const totalContributions = useMemo(
    () => data.total.lastYear ?? sumContributions(data.contributions),
    [data]
  );

  const progressPercentage = useMemo(() => calculateYearProgress(), []);

  const lastPushedText = useMemo(() => {
    const latestDate = getLatestActiveDate(data.contributions);
    const dateObj = (latestDate ? parseIsoDate(latestDate) : null) ?? new Date();
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [data.contributions]);

  const dayLookup = useMemo(() => {
    const map = new Map<string, GithubContributionDay>();
    for (const day of data.contributions) {
      map.set(day.date, day);
    }
    return map;
  }, [data.contributions]);

  const handleGridMouseOver = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const date = (event.target as HTMLElement).dataset.dayDate;
      if (!date) return;
      const found = dayLookup.get(date);
      if (found) setHoveredDay((prev) => (prev?.date === found.date ? prev : found));
    },
    [dayLookup]
  );

  const contributionGrid = useMemo(
    () => (
      <div className="flex justify-between w-full">
        {displayWeeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-0.5 sm:gap-1">
            {week.map((day, dIdx) =>
              day ? (
                <div
                  key={day.date}
                  data-day-date={day.date}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] sm:rounded-[2.5px] ${LEVEL_CLASSES[day.level] ?? LEVEL_CLASSES[0]} cursor-pointer`}
                />
              ) : (
                <div
                  key={`empty-${wIdx}-${dIdx}`}
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] sm:rounded-[2.5px] opacity-0 pointer-events-none"
                />
              )
            )}
          </div>
        ))}
      </div>
    ),
    [displayWeeks]
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
      glowColor="160 85 68"
      colors={GITHUB_GLOW_COLORS}
      fillOpacity={0.3}
    >
      {/* Top Header: Badge on left, dynamic status text on right */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <a
          href={EXTERNAL_LINKS.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer group shrink-0"
        >
          <GithubIcon className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white transition-colors" />
          <span>Github activity</span>
        </a>

        <div className="text-[11px] text-zinc-400 font-normal text-right truncate transition-all">
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
        onMouseOver={handleGridMouseOver}
        onMouseLeave={() => setHoveredDay(null)}
        className="w-full overflow-hidden py-0.5 mb-3"
      >
        {contributionGrid}
      </div>

      {/* Bottom Bar: Progress on Left, Last Pushed on Right */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="h-1 w-24 sm:w-36 bg-[#18181f] rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="text-[10px] sm:text-[11px] text-zinc-500 font-normal truncate">
          Last pushed on {lastPushedText}
        </div>
      </div>
    </BorderGlow>
  );
}
