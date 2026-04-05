'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
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
    : 'Calm / N/A';
  const score = calculateSurfScore({
    heightMeters: waveData?.height,
    periodSeconds: waveData?.period,
    windQuality: currentConditions?.windQuality ?? null,
  });
  const decision = scoreToDecision(score);
  const decisionColor = toneToColor(decision.tone);

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg">
      <div className="absolute top-4 right-4">
        <FavoriteButton breakId={id} size="sm" />
      </div>

      <Link href={`/${id}`} className="block">
        <div className="flex items-start justify-between pr-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{region}</p>
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
            <p className="text-3xl font-bold text-slate-900">
              {score.toFixed(1)}<span className="text-base">/10</span>
            </p>
            <span
              className="mt-1 inline-flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: decisionColor, color: '#0B1F2A' }}
            >
              {decision.label}
            </span>
          </div>
        </div>

        <p className="mt-4 text-base font-medium text-slate-900">
          {surfRange}
          <span className="text-sm text-slate-500"> · {periodLabel} · {windSummary}</span>
        </p>
        <p className="mt-2 text-sm text-slate-600">{decision.description}</p>

        <div className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
          Updated {lastUpdated ?? 'recently'}
        </div>
      </Link>
    </div>
  );
}
