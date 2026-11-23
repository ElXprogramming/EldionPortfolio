import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { ChessIcon } from './Icons';
import BorderGlow from './BorderGlow';
import { fetchChessStats, formatChessRating } from '../lib/chess';
import { CHESS_STATS_FALLBACK } from '../lib/chessFallback';
import type { ChessStatsResponse } from '../lib/statsSchemas';
import { EXTERNAL_LINKS } from '../lib/constants';

const CHESS_GLOW_COLORS = ['#81b64c', '#a3e635', '#4ade80'] as const;

export default function ChessStats({ shouldFetch = true }: { shouldFetch?: boolean }) {
  const [stats, setStats] = useState<ChessStatsResponse>(CHESS_STATS_FALLBACK);

  useEffect(() => {
    if (!shouldFetch) return undefined;
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
  }, [shouldFetch]);

  return (
    <BorderGlow
      className="h-full"
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
      {/* Top Header: Profile pill */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <a
          href={EXTERNAL_LINKS.chess}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer group shrink-0"
        >
          <ChessIcon className="w-3.5 h-3.5 text-[#81b64c] group-hover:text-lime-300 transition-colors" />
          <span>Chess.com</span>
        </a>
      </div>

      {/* Main Stat: Rapid Rating */}
      <div className="flex-1 flex flex-col justify-center min-w-0 px-0.5 py-1">
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-lime-400">
            <Timer className="w-3 h-3 shrink-0" aria-hidden="true" />
            Rapid
          </span>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white font-mono leading-none tabular-nums">
            {formatChessRating(stats.rapidRating)}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            rating
          </span>
        </div>
      </div>
    </BorderGlow>
  );
}
