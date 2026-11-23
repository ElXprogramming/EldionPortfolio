import { useEffect, useMemo, useState } from 'react';
import { Gauge } from 'lucide-react';
import { MonkeytypeIcon } from './Icons';
import BorderGlow from './BorderGlow';
import {
  fetchMonkeytypeStats,
  formatMonkeytypeMode,
  formatMonkeytypeWpm,
} from '../lib/monkeytype';
import { MONKEYTYPE_STATS_FALLBACK } from '../lib/monkeytypeFallback';
import type { MonkeytypeStatsResponse } from '../lib/statsSchemas';
import { EXTERNAL_LINKS } from '../lib/constants';

const MONKEYTYPE_GLOW_COLORS = ['#e2b714', '#fde047', '#eab308'] as const;

export default function MonkeytypeStats({ shouldFetch = true }: { shouldFetch?: boolean }) {
  const [stats, setStats] = useState<MonkeytypeStatsResponse>(MONKEYTYPE_STATS_FALLBACK);

  useEffect(() => {
    if (!shouldFetch) return undefined;
    let isMounted = true;
    fetchMonkeytypeStats()
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

  const modeLabel = useMemo(
    () => formatMonkeytypeMode(stats.mode, stats.modeValue),
    [stats.mode, stats.modeValue]
  );

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
      glowColor="48 88 60"
      colors={MONKEYTYPE_GLOW_COLORS}
      fillOpacity={0.3}
    >
      {/* Top Header: Profile pill */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <a
          href={EXTERNAL_LINKS.monkeytype}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 text-[11px] font-medium text-zinc-200 transition-colors cursor-pointer group shrink-0"
        >
          <MonkeytypeIcon className="w-3.5 h-3.5 text-[#e2b714] group-hover:text-yellow-300 transition-colors" />
          <span>Monkeytype</span>
        </a>
      </div>

      {/* Main Stat: 30s Typing Speed */}
      <div className="flex-1 flex flex-col justify-center min-w-0 px-0.5 py-1">
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#e2b714]">
            <Gauge className="w-3 h-3 shrink-0" aria-hidden="true" />
            Top Speed
          </span>
          {modeLabel && (
            <span className="text-[10px] font-mono text-zinc-500 truncate">{modeLabel}</span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white font-mono leading-none tabular-nums">
              {formatMonkeytypeWpm(stats.topWpm)}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              WPM
            </span>
          </div>
          {stats.accuracy > 0 && (
            <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
              {stats.accuracy}% acc
            </span>
          )}
        </div>
      </div>
    </BorderGlow>
  );
}
