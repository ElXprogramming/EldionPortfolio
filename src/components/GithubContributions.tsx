import { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Trophy,
  Calendar,
  RefreshCw,
  ExternalLink,
  GitCommit,
  Sparkles,
  AlertCircle,
  Palette,
} from 'lucide-react';
import { GithubIcon } from './Icons';
import {
  GITHUB_USERNAME,
  fetchGithubContributions,
  fetchGithubUserProfile,
  calculateContributionStats,
  groupContributionsIntoWeeks,
  getMonthLabels,
  formatDateLabel,
} from '../lib/github';
import { GITHUB_CONTRIBUTIONS_FALLBACK } from '../lib/githubFallback';
import type {
  GithubContributionsResponse,
  GithubContributionDay,
  GithubUserProfile,
} from '../lib/schemas';
import { EXTERNAL_LINKS } from '../lib/constants';

const AVAILABLE_YEARS = [
  { label: 'Last 12 Months', value: 'last' },
  { label: '2026', value: '2026' },
  { label: '2025', value: '2025' },
  { label: '2024', value: '2024' },
  { label: '2022', value: '2022' },
] as const;

const DAY_NAMES = ['', 'Mon', '', 'Wed', '', 'Fri', ''] as const;

type ThemeMode = 'purple' | 'emerald';

export default function GithubContributions() {
  const [selectedYear, setSelectedYear] = useState<string>('last');
  const [theme, setTheme] = useState<ThemeMode>('purple');
  const [contributionsData, setContributionsData] = useState<GithubContributionsResponse | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<GithubUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const [hoveredDay, setHoveredDay] = useState<GithubContributionDay | null>(null);

  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    fetchGithubContributions(selectedYear)
      .then((data) => {
        if (isMounted) {
          setContributionsData(data);
          setIsUsingFallback(false);
          setError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          if (selectedYear === 'last' || selectedYear === '2026') {
            setContributionsData(GITHUB_CONTRIBUTIONS_FALLBACK);
            setIsUsingFallback(true);
            setError(null);
          } else {
            setError('Could not load activity for this year. Please try again.');
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedYear, reloadKey]);

  const handleSelectYear = (year: string) => {
    if (year === selectedYear) return;
    setIsLoading(true);
    setSelectedYear(year);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    fetchGithubUserProfile()
      .then((profile) => {
        if (isMounted && profile) setUserProfile(profile);
      })
      .catch(() => {
        // Silently ignore user profile error
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    return calculateContributionStats(contributionsData?.contributions ?? []);
  }, [contributionsData]);

  const weeks = useMemo(() => {
    return groupContributionsIntoWeeks(contributionsData?.contributions ?? []);
  }, [contributionsData]);

  const monthLabels = useMemo(() => {
    return getMonthLabels(weeks);
  }, [weeks]);

  const getCellColorClass = (level: number): string => {
    if (theme === 'purple') {
      switch (level) {
        case 1:
          return 'bg-purple-950/80 border border-purple-800/70 text-purple-300';
        case 2:
          return 'bg-purple-700 border border-purple-600 shadow-xs shadow-purple-900/30';
        case 3:
          return 'bg-purple-500 border border-purple-400 shadow-sm shadow-purple-500/40';
        case 4:
          return 'bg-[#c084fc] border border-purple-300 shadow-md shadow-purple-400/50';
        default:
          return 'bg-slate-900/90 border border-slate-800/60';
      }
    } else {
      // Classic GitHub Emerald theme
      switch (level) {
        case 1:
          return 'bg-emerald-950/80 border border-emerald-800/70 text-emerald-300';
        case 2:
          return 'bg-emerald-700 border border-emerald-600 shadow-xs shadow-emerald-900/30';
        case 3:
          return 'bg-emerald-500 border border-emerald-400 shadow-sm shadow-emerald-500/40';
        case 4:
          return 'bg-emerald-300 border border-emerald-200 shadow-md shadow-emerald-400/50';
        default:
          return 'bg-slate-900/90 border border-slate-800/60';
      }
    }
  };

  return (
    <div id="contributions" className="mt-16 sm:mt-20 scroll-mt-24">
      <div className="glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <GithubIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Git &amp; Open Source</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-readable-heading flex items-center gap-3">
              <span>GitHub Contribution Activity</span>
              {isLoading && (
                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" aria-hidden="true" />
              )}
            </h3>
            <p className="mt-1 text-slate-300 text-xs sm:text-sm text-readable-body">
              Live contributions, commit streaks, and repositories tracked from{' '}
              <a
                href={EXTERNAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-white font-mono underline decoration-purple-500/40 underline-offset-2 transition-colors inline-flex items-center gap-1"
              >
                @{GITHUB_USERNAME}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* Controls: Year selector, Theme, Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector Buttons */}
            <div className="inline-flex items-center bg-slate-950/80 border border-slate-800/80 rounded-xl p-1 gap-1">
              {AVAILABLE_YEARS.map((yr) => (
                <button
                  key={yr.value}
                  type="button"
                  onClick={() => handleSelectYear(yr.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                    selectedYear === yr.value
                      ? 'bg-purple-600 text-white font-semibold shadow-sm shadow-purple-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {yr.label}
                </button>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'purple' ? 'emerald' : 'purple'))}
              title={`Switch to ${theme === 'purple' ? 'Emerald GitHub' : 'Purple Obsidian'} theme`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">
                {theme === 'purple' ? 'Obsidian' : 'Emerald'}
              </span>
            </button>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh GitHub contributions"
              className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Refresh contributions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Offline Fallback or Error Banner */}
        {isUsingFallback && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Displaying cached verified snapshot. Network request timed out or rate-limited.</span>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-semibold text-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 font-semibold text-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Row (4 Highlights) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-6 relative z-10">
          {/* Total Contributions */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
              <GitCommit className="w-3.5 h-3.5 text-purple-400" />
              <span>Total Commits</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-readable-heading">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {selectedYear === 'last' ? 'In past 365 days' : `Recorded in ${selectedYear}`}
            </div>
          </div>

          {/* Current Streak */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Current Streak</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-readable-heading">
              {stats.currentStreak} <span className="text-sm font-semibold text-slate-400">days</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Consecutive active days
            </div>
          </div>

          {/* Longest Streak */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Longest Streak</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-readable-heading">
              {stats.longestStreak} <span className="text-sm font-semibold text-slate-400">days</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Continuous coding sprint</div>
          </div>

          {/* Active Days */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Active Days</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-readable-heading">
              {stats.activeDays} <span className="text-sm font-semibold text-slate-400">days</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats.maxDay.count > 0 ? `Max: ${stats.maxDay.count} on ${stats.maxDay.date}` : 'No activity recorded'}
            </div>
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="relative my-4">
          {/* Mobile swipe hint */}
          <div className="sm:hidden text-center text-[11px] text-slate-400 mb-2">
            ← Scroll horizontally to view full calendar year →
          </div>

          <div className="overflow-x-auto pb-3 custom-scrollbar">
            <div className="min-w-[760px] p-4 rounded-xl bg-slate-950/70 border border-slate-800/90">
              {/* Month Labels Header */}
              <div className="flex items-center text-[11px] font-mono text-slate-400 mb-2 pl-7 select-none">
                {weeks.map((_, wIndex) => {
                  const mLabel = monthLabels.find((m) => m.weekIndex === wIndex);
                  return (
                    <div
                      key={wIndex}
                      className="w-3.5 text-center shrink-0 mr-1 text-[10px] text-slate-300"
                    >
                      {mLabel ? mLabel.label : ''}
                    </div>
                  );
                })}
              </div>

              {/* Grid: 7 Rows (Sun..Sat) with Left Day Labels */}
              <div className="flex items-start">
                {/* Day Labels Column */}
                <div className="flex flex-col gap-1 pr-2 pt-0.5 select-none shrink-0 w-6">
                  {DAY_NAMES.map((name, dIdx) => (
                    <div
                      key={dIdx}
                      className="h-3 sm:h-3.5 text-[9px] font-mono text-slate-400 leading-none flex items-center"
                    >
                      {name}
                    </div>
                  ))}
                </div>

                {/* Calendar Columns (Weeks) */}
                <div className="flex items-center gap-1">
                  {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1 shrink-0">
                      {week.map((day, dIndex) => {
                        if (!day) {
                          return (
                            <div
                              key={dIndex}
                              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] opacity-0 pointer-events-none"
                            />
                          );
                        }

                        const colorClass = getCellColorClass(day.level);
                        const isHovered = hoveredDay?.date === day.date;

                        return (
                          <div
                            key={day.date}
                            tabIndex={0}
                            role="button"
                            aria-label={`${day.count} contributions on ${day.date}`}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            onFocus={() => setHoveredDay(day)}
                            onBlur={() => setHoveredDay(null)}
                            title={`${day.count} contributions on ${formatDateLabel(day.date)}`}
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] transition-all duration-150 cursor-pointer ${colorClass} ${
                              isHovered
                                ? 'scale-150 z-20 ring-2 ring-white/80 shadow-lg'
                                : 'hover:scale-125'
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hover Details Status Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
                <div className="text-slate-300 font-mono flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  {hoveredDay ? (
                    <span>
                      <strong className="text-white">
                        {hoveredDay.count} {hoveredDay.count === 1 ? 'contribution' : 'contributions'}
                      </strong>{' '}
                      on {formatDateLabel(hoveredDay.date)}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Hover or tap on any square to inspect day activity
                    </span>
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-1.5 select-none font-mono text-[11px] text-slate-400">
                  <span>Less</span>
                  <div className={`w-3 h-3 rounded-[2px] ${getCellColorClass(0)}`} />
                  <div className={`w-3 h-3 rounded-[2px] ${getCellColorClass(1)}`} />
                  <div className={`w-3 h-3 rounded-[2px] ${getCellColorClass(2)}`} />
                  <div className={`w-3 h-3 rounded-[2px] ${getCellColorClass(3)}`} />
                  <div className={`w-3 h-3 rounded-[2px] ${getCellColorClass(4)}`} />
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Profile Footer Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.name ?? GITHUB_USERNAME}
                className="w-10 h-10 rounded-full border border-purple-500/40 shadow-sm object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-950/80 border border-purple-500/30 flex items-center justify-center">
                <GithubIcon className="w-5 h-5 text-purple-300" />
              </div>
            )}
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span>{userProfile?.name ?? 'Eldion Ryan Godius'}</span>
                <span className="text-xs text-purple-300 font-mono font-normal">
                  @{GITHUB_USERNAME}
                </span>
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-3 mt-0.5">
                {userProfile?.public_repos !== undefined && (
                  <span>
                    <strong className="text-slate-200">{userProfile.public_repos}</strong> Public Repos
                  </span>
                )}
                {userProfile?.followers !== undefined && (
                  <span>
                    <strong className="text-slate-200">{userProfile.followers}</strong> Followers
                  </span>
                )}
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Developer
                </span>
              </div>
            </div>
          </div>

          <a
            href={EXTERNAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm cursor-pointer"
          >
            <GithubIcon className="w-4 h-4 text-purple-400" />
            <span>Follow on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
