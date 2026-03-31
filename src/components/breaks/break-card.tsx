import Link from 'next/link';
import { RatingBadge } from '@/components/ui/rating-badge';
import { WindQuality } from '@/lib/breaks/wind-quality';

interface BreakCardProps {
  id: string;
  name: string;
  region: string;
  rating: number | null;
  currentConditions: {
    airTemp: number | null;
    windSpeedKmh: number | null;
    gustKmh: number | null;
    windDir: number | null;
    windQuality: WindQuality | null;
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

function windQualityColor(quality: WindQuality | null): string {
  switch (quality) {
    case 'offshore':
      return 'text-emerald-600';
    case 'cross-offshore':
      return 'text-green-600';
    case 'cross-shore':
      return 'text-yellow-600';
    case 'cross-onshore':
      return 'text-orange-600';
    case 'onshore':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}

export function BreakCard({
  id,
  name,
  region,
  rating,
  currentConditions,
  waveData,
}: BreakCardProps) {
  return (
    <Link
      href={`/${id}`}
      className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{region}</p>
        </div>
        <RatingBadge rating={rating} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Wind</p>
          {currentConditions ? (
            <div className="mt-1">
              <p className="text-sm font-medium text-gray-900">
                {currentConditions.windSpeedKmh !== null
                  ? `${currentConditions.windSpeedKmh} km/h`
                  : 'N/A'}{' '}
                {degreesToCardinal(currentConditions.windDir)}
              </p>
              <p
                className={`text-xs font-medium capitalize ${windQualityColor(
                  currentConditions.windQuality
                )}`}
              >
                {currentConditions.windQuality?.replace('-', ' ') || 'Unknown'}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-400">No data</p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-gray-500">Waves</p>
          {waveData && waveData.height !== null ? (
            <div className="mt-1">
              <p className="text-sm font-medium text-gray-900">
                {waveData.height.toFixed(1)}m
              </p>
              {waveData.period !== null && (
                <p className="text-xs text-gray-500">{waveData.period}s period</p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-400">No data</p>
          )}
        </div>

        {currentConditions && currentConditions.airTemp !== null && (
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Temp</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {currentConditions.airTemp}°C
            </p>
          </div>
        )}

        {currentConditions && currentConditions.gustKmh !== null && (
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Gusts</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {currentConditions.gustKmh} km/h
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
