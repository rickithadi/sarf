'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/components/ui/favorites';
import { useUnit } from '@/components/ui/unit-toggle';
import { formatSurfRange, formatWindSpeed } from '@/lib/utils/units';
import { WindQuality } from '@/lib/breaks/wind-quality';
import { calculateSurfScore, scoreToDecision, toneToColor } from '@/lib/utils/surf-score';

interface BreakCardProps {
  id: string;
  name: string;
  region: string;
  reportGeneratedAt?: string | null;
  currentConditions: {
    airTemp: number | null;
    windSpeedKmh: number | null;
    gustKmh: number | null;
    windDir: number | null;
    windQuality: WindQuality | null;
    updatedAt?: string | Date;
  } | null;
  waveData: {
    height: number | null;
    period: number | null;
  } | null;
  featured?: boolean;
  className?: string;
}

function degreesToCardinal(degrees: number | null): string {
  if (degrees === null) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export function BreakCard({
  id,
  name,
  region,
  reportGeneratedAt,
  currentConditions,
  waveData,
  featured = false,
  className,
}: BreakCardProps) {
  const { unit } = useUnit();
  const lastUpdated = currentConditions?.updatedAt
    ? formatDistanceToNow(new Date(currentConditions.updatedAt), { addSuffix: true })
    : reportGeneratedAt
    ? formatDistanceToNow(new Date(reportGeneratedAt), { addSuffix: true })
    : null;
  const surfRange = waveData?.height !== null && waveData?.height !== undefined
    ? formatSurfRange(waveData.height, waveData.period, unit)
    : 'Flat';
  const periodLabel = waveData?.period ? `${Math.round(waveData.period)}s` : '—';
  const windSummary = currentConditions
    ? `${formatWindSpeed(currentConditions.windSpeedKmh, unit)} ${degreesToCardinal(currentConditions.windDir)}`
    : 'Calm';
  const score = calculateSurfScore({
    heightMeters: waveData?.height,
    periodSeconds: waveData?.period,
    windQuality: currentConditions?.windQuality ?? null,
  });
  const decision = scoreToDecision(score);
  const decisionColor = toneToColor(decision.tone);

  if (featured) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-surface-container-lowest transition-shadow hover:shadow-[0_20px_40px_rgba(0,30,64,0.06)]',
          className
        )}
      >
        {/* Decision state strip — color communicates verdict at a glance */}
        <div className="h-1 w-full" style={{ backgroundColor: decisionColor }} />
        <div className="absolute top-5 right-5 z-10">
          <FavoriteButton breakId={id} size="sm" />
        </div>
        <Link href={`/${id}`} className="block p-5 sm:flex sm:items-center sm:gap-8 sm:p-6">
          {/* Left: decision badge, name, data, description */}
          <div className="min-w-0 flex-1">
            <span
              className="mb-3 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold"
              style={{ backgroundColor: `${decisionColor}40`, color: decisionColor }}
            >
              {decision.label}
            </span>
            <h3 className="font-display text-xl font-bold tracking-tight text-on-surface sm:text-2xl">{name}</h3>
            <p className="mt-0.5 text-sm text-on-surface-variant">{region}</p>
            <p className="mt-3 text-base font-medium text-on-surface">
              {surfRange}
              <span className="text-sm font-normal text-on-surface-variant"> · {periodLabel} · {windSummary}</span>
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">{decision.description}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              Updated {lastUpdated ?? 'recently'}
            </p>
          </div>

          {/* Right: score */}
          <div className="mt-4 flex items-center justify-end sm:mt-0 sm:flex-col sm:items-end sm:gap-2 sm:text-right">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant sm:text-right">Score</p>
              <p className="font-display tabular text-4xl font-bold leading-none tracking-tight text-on-surface sm:text-5xl">
                {score.toFixed(1)}<span className="text-xl sm:text-2xl">/10</span>
              </p>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-surface-container-lowest transition-shadow hover:shadow-[0_20px_40px_rgba(0,30,64,0.06)]',
        className
      )}
    >
      {/* Decision state strip */}
      <div className="h-0.5 w-full" style={{ backgroundColor: decisionColor }} />
      <div className="p-5">
        <div className="absolute top-[1.125rem] right-4">
          <FavoriteButton breakId={id} size="sm" />
        </div>

        <Link href={`/${id}`} className="block">
          <div className="flex items-start justify-between pr-8">
            <div>
              <span
                className="mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ backgroundColor: `${decisionColor}40`, color: decisionColor }}
              >
                {decision.label}
              </span>
              <h3 className="font-display text-lg font-semibold tracking-tight text-on-surface">{name}</h3>
            </div>
            <div className="text-right">
              <p className="font-display tabular text-3xl font-bold tracking-tight text-on-surface">
                {score.toFixed(1)}<span className="text-base">/10</span>
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm text-on-surface-variant">
            {surfRange} · {periodLabel} · {windSummary}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">{decision.description}</p>

          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-on-surface-variant">
            Updated {lastUpdated ?? 'recently'}
          </p>
        </Link>
      </div>
    </div>
  );
}
