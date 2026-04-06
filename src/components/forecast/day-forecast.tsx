'use client';

import { useState } from 'react';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { DayRating } from '@/components/ui/day-rating';
// UI components available but hidden for simplified view
// import { DateConfidenceBadge } from '@/components/ui/confidence-indicator';
// import { SwellTypeBadge } from '@/components/ui/swell-quality-badge';
import { HourlyTable, CompactHourlyRow, type HourlyForecastData } from './hourly-table';
import { formatSurfRange, type UnitSystem } from '@/lib/utils/units';
import { calculateWindQuality, calculateSurfRating, type WindQuality } from '@/lib/breaks/wind-quality';
import { classifySwellType, type SwellType } from '@/lib/utils/wave-quality';

interface DayForecastProps {
  date: Date;
  hourlyData: HourlyForecastData[];
  optimalWindDirection: number;
  unit?: UnitSystem;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Get day label (Today, Tomorrow, or day name with date)
 */
function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE M/d');
}

/**
 * Calculate best conditions summary for a day
 */
function getDaySummary(
  hourlyData: HourlyForecastData[],
  optimalWindDirection: number
): {
  bestSurf: { range: string; time: Date } | null;
  avgRating: number;
  bestWindQuality: WindQuality | null;
  dominantSwellType: SwellType | null;
} {
  if (hourlyData.length === 0) {
    return { bestSurf: null, avgRating: 0, bestWindQuality: null, dominantSwellType: null };
  }

  // Filter to daylight hours (6am - 6pm)
  const dayHours = hourlyData.filter((d) => {
    const hour = d.time.getHours();
    return hour >= 6 && hour <= 18;
  });

  if (dayHours.length === 0) {
    return { bestSurf: null, avgRating: 0, bestWindQuality: null, dominantSwellType: null };
  }

  // Find best wave height
  let bestSurf: { range: string; time: Date } | null = null;
  let maxHeight = 0;

  for (const h of dayHours) {
    if (h.waveHeight !== null && h.waveHeight > maxHeight) {
      maxHeight = h.waveHeight;
      bestSurf = {
        range: formatSurfRange(h.waveHeight, h.wavePeriod, 'imperial'),
        time: h.time,
      };
    }
  }

  // Calculate average rating and find best wind
  let totalRating = 0;
  let ratingCount = 0;
  let bestWindScore = 0;
  let bestWindQuality: WindQuality | null = null;

  for (const h of dayHours) {
    const windQuality = calculateWindQuality(h.windDirection, optimalWindDirection, h.windSpeed);
    const rating = calculateSurfRating({
      windQuality,
      windSpeedKmh: h.windSpeed,
      waveHeight: h.waveHeight,
      wavePeriod: h.wavePeriod,
    });

    if (rating !== null) {
      totalRating += rating;
      ratingCount++;
    }

    const windScore = getWindScore(windQuality);
    if (windScore > bestWindScore) {
      bestWindScore = windScore;
      bestWindQuality = windQuality;
    }
  }

  const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;

  // Get dominant swell type (most common or from peak wave height)
  const swellTypes = dayHours
    .filter((h) => h.swellPeriod !== null)
    .map((h) => classifySwellType(h.swellPeriod));
  const dominantSwellType = swellTypes.length > 0 ? swellTypes[Math.floor(swellTypes.length / 2)] : null;

  return { bestSurf, avgRating, bestWindQuality, dominantSwellType };
}

function getWindScore(quality: WindQuality | null): number {
  switch (quality) {
    case 'offshore': return 5;
    case 'cross-offshore': return 4;
    case 'cross-shore': return 3;
    case 'cross-onshore': return 2;
    case 'onshore': return 1;
    default: return 0;
  }
}

/**
 * Collapsible day forecast section
 */
export function DayForecast({
  date,
  hourlyData,
  optimalWindDirection,
  unit = 'imperial',
  defaultExpanded = false,
  className,
}: DayForecastProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const dayLabel = getDayLabel(date);
  const summary = getDaySummary(hourlyData, optimalWindDirection);

  return (
    <div className={cn('rounded-xl bg-surface-container-lowest overflow-hidden', className)}>
      {/* Header (clickable) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left',
          'hover:bg-surface-container transition-colors',
          isExpanded ? 'bg-surface-container' : 'bg-surface-container-lowest'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Expand/collapse icon */}
          <svg
            className={cn(
              'w-5 h-5 text-on-surface-variant transition-transform',
              isExpanded ? 'rotate-90' : ''
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          {/* Day label */}
          <span className="font-semibold text-on-surface">{dayLabel}</span>

          {/* Day rating */}
          {summary.avgRating > 0 && (
            <DayRating rating={summary.avgRating} size="sm" />
          )}
        </div>

        {/* Summary when collapsed */}
        {!isExpanded && summary.bestSurf && (
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-secondary">
              {summary.bestSurf.range}
            </span>
            {summary.bestWindQuality && (
              <span className={cn(
                'capitalize',
                getWindQualityTextColor(summary.bestWindQuality)
              )}>
                {summary.bestWindQuality.replace('-', ' ')}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div>
          {/* Desktop: Full table */}
          <div className="hidden md:block">
            <HourlyTable
              data={hourlyData}
              optimalWindDirection={optimalWindDirection}
              unit={unit}
            />
          </div>

          {/* Mobile: Compact rows */}
          <div className="md:hidden">
            {hourlyData
              .filter((d) => {
                const hour = d.time.getHours();
                return hour >= 6 && hour <= 18;
              })
              .map((data, i) => (
                <CompactHourlyRow
                  key={i}
                  data={data}
                  optimalWindDirection={optimalWindDirection}
                  unit={unit}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getWindQualityTextColor(quality: WindQuality): string {
  switch (quality) {
    case 'offshore': return 'text-emerald-600';
    case 'cross-offshore': return 'text-green-600';
    case 'cross-shore': return 'text-yellow-600';
    case 'cross-onshore': return 'text-orange-600';
    case 'onshore': return 'text-red-600';
  }
}

/**
 * Multi-day forecast list
 */
interface MultidayForecastProps {
  allData: HourlyForecastData[];
  optimalWindDirection: number;
  unit?: UnitSystem;
  expandFirstDay?: boolean;
  selectedDate?: Date;
  className?: string;
}

export function MultidayForecast({
  allData,
  optimalWindDirection,
  unit = 'imperial',
  expandFirstDay = true,
  selectedDate,
  className,
}: MultidayForecastProps) {
  // Group data by day
  const dayGroups = groupByDay(allData);

  // Filter to selected date if provided
  const filteredGroups = selectedDate
    ? dayGroups.filter(
        (g) => startOfDay(g.date).getTime() === startOfDay(selectedDate).getTime()
      )
    : dayGroups;

  return (
    <div className={cn('space-y-3', className)}>
      {filteredGroups.map((group, i) => (
        <DayForecast
          key={group.date.toISOString()}
          date={group.date}
          hourlyData={group.data}
          optimalWindDirection={optimalWindDirection}
          unit={unit}
          defaultExpanded={expandFirstDay && i === 0}
        />
      ))}
    </div>
  );
}

/**
 * Group hourly data by day
 */
function groupByDay(data: HourlyForecastData[]): { date: Date; data: HourlyForecastData[] }[] {
  const groups: Map<string, { date: Date; data: HourlyForecastData[] }> = new Map();

  for (const item of data) {
    const dayKey = startOfDay(item.time).toISOString();

    if (!groups.has(dayKey)) {
      groups.set(dayKey, {
        date: startOfDay(item.time),
        data: [],
      });
    }

    groups.get(dayKey)!.data.push(item);
  }

  // Sort by date and return as array
  return Array.from(groups.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}
