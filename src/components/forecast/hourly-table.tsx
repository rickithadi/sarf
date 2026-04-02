'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { WindArrow } from '@/components/ui/wind-arrow';
import { SwellArrow } from '@/components/ui/swell-arrow';
import { formatSurfRange, formatWaveHeight, formatWindSpeed, type UnitSystem } from '@/lib/utils/units';
import { degreesToCardinal, type WindQuality, calculateWindQuality } from '@/lib/breaks/wind-quality';

export interface HourlyForecastData {
  time: Date;
  // Wave data
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  // Swell data (primary)
  swellHeight: number | null;
  swellPeriod: number | null;
  swellDirection: number | null;
  // Wind data
  windSpeed: number | null; // km/h
  windGust: number | null; // km/h
  windDirection: number | null;
  windQuality: WindQuality | null;
}

interface HourlyTableProps {
  data: HourlyForecastData[];
  optimalWindDirection: number;
  unit?: UnitSystem;
  startHour?: number; // Default 6am
  endHour?: number; // Default 6pm
  className?: string;
}

/**
 * Surfline-style hourly forecast table
 * Shows surf height range, primary swell, secondary swell, and wind
 */
export function HourlyTable({
  data,
  optimalWindDirection,
  unit = 'imperial',
  startHour = 6,
  endHour = 18,
  className,
}: HourlyTableProps) {
  // Filter to daylight hours (6am - 6pm by default)
  const filteredData = data.filter((d) => {
    const hour = d.time.getHours();
    return hour >= startHour && hour <= endHour;
  });

  if (filteredData.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        No forecast data available
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 pr-4 font-medium">Time</th>
            <th className="py-2 px-4 font-medium">Surf</th>
            <th className="py-2 px-4 font-medium">Primary Swell</th>
            <th className="py-2 px-4 font-medium">Wind</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, i) => {
            // Calculate wind quality for this hour
            const windQuality = calculateWindQuality(
              row.windDirection,
              optimalWindDirection,
              row.windSpeed
            );

            return (
              <tr
                key={i}
                className={cn(
                  'border-b border-gray-100',
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                )}
              >
                {/* Time */}
                <td className="py-3 pr-4 font-medium text-gray-900">
                  {format(row.time, 'h a')}
                </td>

                {/* Surf Range */}
                <td className="py-3 px-4">
                  <span className="font-semibold text-gray-900">
                    {formatSurfRange(row.waveHeight, row.wavePeriod, unit)}
                  </span>
                </td>

                {/* Primary Swell */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    {row.swellHeight !== null ? (
                      <>
                        <span className="font-medium">
                          {formatWaveHeight(row.swellHeight, unit, 1)}
                        </span>
                        <span className="text-gray-500">
                          {row.swellPeriod ? `${Math.round(row.swellPeriod)}s` : ''}
                        </span>
                        <span className="text-gray-500">
                          {degreesToCardinal(row.swellDirection)}
                        </span>
                        <SwellArrow direction={row.swellDirection} size="sm" />
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>

                {/* Wind */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    {row.windSpeed !== null ? (
                      <>
                        <WindArrow
                          direction={row.windDirection}
                          quality={windQuality}
                          size="sm"
                        />
                        <span className={cn(
                          'font-medium',
                          getWindTextColor(windQuality)
                        )}>
                          {formatWindSpeed(row.windSpeed, unit)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {degreesToCardinal(row.windDirection)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Get text color based on wind quality
 */
function getWindTextColor(quality: WindQuality | null): string {
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
      return 'text-gray-600';
  }
}

/**
 * Compact hourly row for mobile view
 */
interface CompactHourlyRowProps {
  data: HourlyForecastData;
  optimalWindDirection: number;
  unit?: UnitSystem;
}

export function CompactHourlyRow({
  data,
  optimalWindDirection,
  unit = 'imperial',
}: CompactHourlyRowProps) {
  const windQuality = calculateWindQuality(
    data.windDirection,
    optimalWindDirection,
    data.windSpeed
  );

  return (
    <div className="flex items-center justify-between py-2 px-3 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <span className="font-medium text-gray-900 w-12">
          {format(data.time, 'h a')}
        </span>
        <span className="font-semibold text-blue-600">
          {formatSurfRange(data.waveHeight, data.wavePeriod, unit)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {data.swellHeight !== null && (
          <span className="text-sm text-gray-600">
            {formatWaveHeight(data.swellHeight, unit, 1)} {data.swellPeriod ? `${Math.round(data.swellPeriod)}s` : ''}
          </span>
        )}
        <WindArrow direction={data.windDirection} quality={windQuality} size="sm" />
        <span className={cn('text-sm font-medium', getWindTextColor(windQuality))}>
          {formatWindSpeed(data.windSpeed, unit)}
        </span>
      </div>
    </div>
  );
}
