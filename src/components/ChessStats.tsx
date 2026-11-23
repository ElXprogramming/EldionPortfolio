import { useEffect, useMemo, useState } from 'react';
import { Flame, Timer, Zap } from 'lucide-react';
import { ChessIcon } from './Icons';
import BorderGlow from './BorderGlow';
import {
  calculateRecordSegments,
  calculateWinRate,
  fetchChessStats,
  formatChessRating,
  getAggregateRecord,
  getHighestPeakMode,
} from '../lib/chess';
import { CHESS_STATS_FALLBACK } from '../lib/chessFallback';
import type { ChessModeStats, ChessStatsResponse } from '../lib/schemas';
import { EXTERNAL_LINKS } from '../lib/constants';

const CHESS_GLOW_COLORS = ['#81b64c', '#a3e635', '#4ade80'] as const;

interface ModeCardConfig {
  key: 'rapid' | 'blitz' | 'bullet';
  label: 'Rapid' | 'Blitz' | 'Bullet';
  Icon: typeof Timer;
  accentClass: string;
  stats: ChessModeStats;
}

export default function ChessStats() {
  const [stats, setStats] = useState<ChessStatsResponse>(CHESS_STATS_FALLBACK);

  useEffect(() => {
    let isMounted = true;
    fetchChessStats()
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

  const modes = useMemo<readonly ModeCardConfig[]>(
    () => [
      {
        key: 'rapid',
        label: 'Rapid',
        Icon: Timer,
        accentClass: 'text-lime-400',
        stats: stats.rapid,
      },
      {
        key: 'blitz',
        label: 'Blitz',
        Icon: Zap,
        accentClass: 'text-amber-400',
        stats: stats.blitz,
      },
      {
        key: 'bullet',
        label: 'Bullet',
        Icon: Flame,
        accentClass: 'text-orange-400',
        stats: stats.bullet,
      },
    ],
    [stats]
  );

  const aggregate = useMemo(() => getAggregateRecord(stats), [stats]);
  const highestPeak = useMemo(() => getHighestPeakMode(stats), [stats]);

  return (
    <BorderGlow
      innerClassName="p-3.5 sm:p-4"
      backgroundColor="#08080a"
      borderRadius={16}
      glowRadius={30}
      glowIntensity={0.85}
      edgeSensitivity={28}
      coneSpread={25}
      glowColor="90 55 58"
      colors={CHESS_GLOW_COLORS}
      fillOpacity={0.3}
    >
      {/* Top Header: Profile pill + Highest Peak summary */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <a
          href={EXTERNAL_LINKS.chess}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer group shrink-0"
        >
          <ChessIcon className="w-3.5 h-3.5 text-[#81b64c] group-hover:text-lime-300 transition-colors" />
          <span>Chess.com stats</span>
        </a>

        <div className="text-[11px] text-zinc-400 font-normal text-right truncate">
          Peak{' '}
          <span className="font-semibold text-zinc-200 font-mono">
            {formatChessRating(highestPeak.rating)}
          </span>{' '}
          <span className="text-zinc-500">{highestPeak.mode}</span>
        </div>
      </div>

      {/* Mode Tiles: Rapid / Blitz / Bullet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5">
        {modes.map(({ key, label, Icon, accentClass, stats: modeStats }) => {
          const segments = calculateRecordSegments(modeStats);
          const winRate = calculateWinRate(modeStats);

          return (
            <div
              key={key}
              className="rounded-lg bg-[#111116] border border-white/5 px-2.5 py-2 min-w-0"
            >
              {/* Mode label + Peak rating */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold ${accentClass}`}
                >
                  <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                  {label}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 truncate">
                  Peak{' '}
                  <span className="text-zinc-300 font-medium">
                    {formatChessRating(modeStats.best)}
                  </span>
                </span>
              </div>

              {/* Current rating + Win rate */}
              <div className="flex items-baseline justify-between gap-1 mb-1.5">
                <span className="text-base font-bold text-white font-mono leading-none tabular-nums">
                  {formatChessRating(modeStats.rating)}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                  {winRate}% W
                </span>
              </div>

              {/* Micro W/D/L distribution bar */}
              <div
                className="h-1 w-full bg-[#1b1b23] rounded-full overflow-hidden flex mb-1.5"
                role="img"
                aria-label={`${label} record: ${modeStats.win} wins, ${modeStats.loss} losses, ${modeStats.draw} draws`}
              >
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${segments.winPct}%` }}
                />
                <div
                  className="h-full bg-zinc-400 transition-all duration-500"
                  style={{ width: `${segments.drawPct}%` }}
                />
                <div
                  className="h-full bg-rose-400 transition-all duration-500"
                  style={{ width: `${segments.lossPct}%` }}
                />
              </div>

              {/* Exact W / L / D totals */}
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono tabular-nums">
                <span className="text-emerald-400">{modeStats.win}W</span>
                <span className="text-rose-400">{modeStats.loss}L</span>
                <span className="text-zinc-400">{modeStats.draw}D</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer: Handle + Aggregate games & W/L/D */}
      <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px] sm:text-[11px] text-zinc-500">
        <span className="font-mono truncate">@{stats.username}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-400">
            <span className="font-mono text-zinc-200 font-medium">
              {aggregate.total.toLocaleString('en-US')}
            </span>{' '}
            games
          </span>
          <span aria-hidden="true" className="text-zinc-700">·</span>
          <span className="font-mono tabular-nums">
            <span className="text-emerald-400 font-medium">{aggregate.win}W</span>{' '}
            <span className="text-rose-400 font-medium">{aggregate.loss}L</span>{' '}
            <span className="text-zinc-400 font-medium">{aggregate.draw}D</span>
          </span>
        </div>
      </div>
    </BorderGlow>
  );
}
