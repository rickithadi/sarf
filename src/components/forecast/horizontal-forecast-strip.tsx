'use client';

import { useRef, useState } from 'react';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { WindArrow } from '@/components/ui/wind-arrow';
import { formatSurfRange, type UnitSystem } from '@/lib/utils/units';
import { calculateWindQuality, calculateSurfRating, type WindQuality } from '@/lib/breaks/wind-quality';
import type { HourlyForecastData } from './hourly-table';

interface DayData {
  date: Date;
  label: string;
  waveRange: string;
  avgRating: number;
  hourlyRatings: { hour: number; rating: number; windQuality: WindQuality | null }[];
  dominantWindDirections: number[];
}

interface HorizontalForecastStripProps {
  allData: HourlyForecastData[];
  optimalWindDirection: number;
  unit?: UnitSystem;
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  className?: string;
}

/**
 * Surfline-style horizontal scrolling forecast strip
 * Shows all forecast days in a horizontally scrollable row
 */
export function HorizontalForecastStrip({
  allData,
  optimalWindDirection,
  unit = 'imperial',
  selectedDate,
  onSelectDate,
  className,
}: HorizontalForecastStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Group data by day and calculate summaries
  const dayGroups = groupAndSummarize(allData, optimalWindDirection, unit);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (dayGroups.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-1 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dayGroups.map((day, i) => {
          const isSelected = selectedDate
            ? startOfDay(selectedDate).getTime() === day.date.getTime()
            : i === 0;

          return (
            <button
              key={day.date.toISOString()}
              onClick={() => onSelectDate?.(day.date)}
              className={cn(
                'flex-shrink-0 w-24 rounded-lg border transition-all',
                isSelected
                  ? 'bg-slate-800 border-slate-800 text-white'
                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900'
              )}
            >
              {/* Day label */}
              <div className="px-2 pt-2 pb-1">
                <p className={cn(
                  'text-xs font-medium',
                  isSelected ? 'text-gray-300' : 'text-gray-500'
                )}>
                  {day.label}
                </p>
              </div>

              {/* Wave range */}
              <div className="px-2 pb-1">
                <p className={cn(
                  'text-lg font-bold',
                  isSelected ? 'text-white' : 'text-gray-900'
                )}>
                  {day.waveRange}
                </p>
              </div>

              {/* Wind arrows */}
              <div className="px-2 pb-2 flex justify-center gap-0.5">
                {day.dominantWindDirections.slice(0, 4).map((dir, j) => (
                  <WindArrow
                    key={j}
                    direction={dir}
                    quality={null}
                    size="xs"
                    className={isSelected ? 'text-gray-300' : 'text-gray-500'}
                  />
                ))}
              </div>

              {/* Rating bar */}
              <div className="flex h-1.5 rounded-b-lg overflow-hidden">
                {day.hourlyRatings.map((hr, j) => (
                  <div
                    key={j}
                    className={cn('flex-1', getRatingBarColor(hr.rating))}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Group hourly data by day and calculate summaries
 */
function groupAndSummarize(
  data: HourlyForecastData[],
  optimalWindDirection: number,
  unit: UnitSystem
): DayData[] {
  const groups: Map<string, HourlyForecastData[]> = new Map();

  for (const item of data) {
    const dayKey = startOfDay(item.time).toISOString();
    if (!groups.has(dayKey)) {
      groups.set(dayKey, []);
    }
    groups.get(dayKey)!.push(item);
  }

  const result: DayData[] = [];

  for (const [dayKey, hourlyData] of Array.from(groups.entries())) {
    const date = new Date(dayKey);

    // Filter to daylight hours for calculations
    const dayHours = hourlyData.filter((d: HourlyForecastData) => {
      const hour = d.time.getHours();
      return hour >= 6 && hour <= 18;
    });

    if (dayHours.length === 0) continue;

    // Get wave range
    let minHeight = Infinity;
    let maxHeight = 0;
    let maxPeriod: number | null = null;

    for (const h of dayHours) {
      if (h.waveHeight !== null) {
        if (h.waveHeight < minHeight) minHeight = h.waveHeight;
        if (h.waveHeight > maxHeight) {
          maxHeight = h.waveHeight;
          maxPeriod = h.wavePeriod;
        }
      }
    }

    // Calculate hourly ratings for the rating bar (sample 6 periods: 6am, 9am, 12pm, 3pm, 6pm)
    const sampleHours = [6, 9, 12, 15, 18];
    const hourlyRatings: DayData['hourlyRatings'] = [];

    for (const targetHour of sampleHours) {
      const hourData = dayHours.find((d: HourlyForecastData) => d.time.getHours() === targetHour);
      if (hourData) {
        const windQuality = calculateWindQuality(
          hourData.windDirection,
          optimalWindDirection,
          hourData.windSpeed
        );
        const rating = calculateSurfRating({
          windQuality,
          windSpeedKmh: hourData.windSpeed,
          waveHeight: hourData.waveHeight,
          wavePeriod: hourData.wavePeriod,
        }) ?? 0;
        hourlyRatings.push({ hour: targetHour, rating, windQuality });
      }
    }

    // Get dominant wind directions (sample throughout day)
    const windDirections = dayHours
      .filter((d: HourlyForecastData) => d.windDirection !== null)
      .map((d: HourlyForecastData) => d.windDirection!);

    // Calculate average rating
    const avgRating = hourlyRatings.length > 0
      ? hourlyRatings.reduce((sum, hr) => sum + hr.rating, 0) / hourlyRatings.length
      : 0;

    result.push({
      date,
      label: getDayLabel(date),
      waveRange: minHeight !== Infinity
        ? formatSurfRange(maxHeight, maxPeriod, unit)
        : '-',
      avgRating,
      hourlyRatings,
      dominantWindDirections: windDirections.slice(0, 4),
    });
  }

  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE, M/d');
}

function getRatingBarColor(rating: number): string {
  if (rating >= 4) return 'bg-emerald-500';
  if (rating >= 3) return 'bg-green-400';
  if (rating >= 2.5) return 'bg-yellow-400';
  if (rating >= 2) return 'bg-orange-400';
  return 'bg-red-400';
}
