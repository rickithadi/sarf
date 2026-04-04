'use client';

import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { metersToFeet, type UnitSystem } from '@/lib/utils/units';
import { degreesToCardinal, calculateWindQuality, type WindQuality } from '@/lib/breaks/wind-quality';
import { classifySwellType, type SwellType } from '@/lib/utils/wave-quality';
import type { HourlyForecastData } from './hourly-table';

interface SimplifiedForecastProps {
  data: HourlyForecastData[];
  tides?: Array<{ time: string; type: string; height: number }>;
  optimalWindDirection: number;
  unit?: UnitSystem;
  className?: string;
}

interface TimeSlot {
  time: Date;
  dayLabel: string;
  timeLabel: string;
  waveHeight: number | null;
  wavePeriod: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  windQuality: WindQuality | null;
  swellType: SwellType | null;
  isNewDay: boolean;
}

/**
 * Get wind arrow rotation from direction degrees
 * Direction is where wind comes FROM, arrow shows direction
 */
function getWindArrowRotation(degrees: number): number {
  return degrees + 180; // Point in direction wind is blowing
}

/**
 * Get color for wind based on quality
 */
function getWindColor(quality: WindQuality | null): string {
  switch (quality) {
    case 'offshore':
      return 'text-emerald-500';
    case 'cross-offshore':
      return 'text-green-500';
    case 'cross-shore':
      return 'text-yellow-500';
    case 'cross-onshore':
      return 'text-orange-500';
    case 'onshore':
      return 'text-red-500';
    default:
      return 'text-fuchsia-500';
  }
}

/**
 * Get color for period badge based on swell type
 */
function getPeriodColor(swellType: SwellType | null): string {
  switch (swellType) {
    case 'ground-swell':
      return 'border-emerald-500 text-emerald-600';
    case 'long-period':
      return 'border-blue-500 text-blue-600';
    case 'wind-swell':
      return 'border-amber-500 text-amber-600';
    case 'short-chop':
      return 'border-red-400 text-red-500';
    default:
      return 'border-gray-300 text-gray-500';
  }
}

/**
 * Simplified visual forecast component
 * Based on clean horizontal grid design
 */
export function SimplifiedForecast({
  data,
  tides = [],
  optimalWindDirection,
  unit = 'imperial',
  className,
}: SimplifiedForecastProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Process data into time slots (6-hour intervals: 12am, 6am, 12pm, 6pm)
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    let lastDay: string | null = null;

    // Filter to 6-hour intervals
    const filtered = data.filter((d) => {
      const hour = d.time.getHours();
      return hour === 0 || hour === 6 || hour === 12 || hour === 18;
    });

    for (const d of filtered) {
      const dayKey = format(d.time, 'yyyy-MM-dd');
      const isNewDay = dayKey !== lastDay;
      lastDay = dayKey;

      const windQuality = calculateWindQuality(
        d.windDirection,
        optimalWindDirection,
        d.windSpeed
      );

      slots.push({
        time: d.time,
        dayLabel: format(d.time, 'EEE'),
        timeLabel: format(d.time, 'ha').toLowerCase(),
        waveHeight: d.waveHeight,
        wavePeriod: d.swellPeriod ?? d.wavePeriod,
        windSpeed: d.windSpeed,
        windDirection: d.windDirection,
        windQuality,
        swellType: classifySwellType(d.swellPeriod ?? d.wavePeriod),
        isNewDay,
      });
    }

    return slots;
  }, [data, optimalWindDirection]);

  // Get max wave height for bar scaling
  const maxHeight = useMemo(() => {
    const heights = timeSlots
      .map((s) => s.waveHeight)
      .filter((h): h is number => h !== null);
    return Math.max(...heights, 1);
  }, [timeSlots]);

  // Process tides by day
  const tidesByDay = useMemo(() => {
    const byDay: Map<string, Array<{ time: Date; type: string; height: number }>> = new Map();

    for (const tide of tides) {
      const tideDate = new Date(tide.time);
      const dayKey = format(tideDate, 'yyyy-MM-dd');

      if (!byDay.has(dayKey)) {
        byDay.set(dayKey, []);
      }
      byDay.get(dayKey)!.push({
        time: tideDate,
        type: tide.type,
        height: tide.height,
      });
    }

    return byDay;
  }, [tides]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (timeSlots.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No forecast data available
      </div>
    );
  }

  // Group slots by day for rendering
  const slotsByDay: Map<string, TimeSlot[]> = new Map();
  for (const slot of timeSlots) {
    const dayKey = format(slot.time, 'yyyy-MM-dd');
    if (!slotsByDay.has(dayKey)) {
      slotsByDay.set(dayKey, []);
    }
    slotsByDay.get(dayKey)!.push(slot);
  }

  return (
    <div className={cn('relative', className)}>
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="inline-flex min-w-full">
          {Array.from(slotsByDay.entries()).map(([dayKey, daySlots]) => {
            const dayTides = tidesByDay.get(dayKey) ?? [];

            return (
              <div
                key={dayKey}
                className="flex-shrink-0 border-r border-gray-200 last:border-r-0"
              >
                {/* Day header row */}
                <div className="flex">
                  {daySlots.map((slot, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-16 text-center py-2 border-b border-gray-100',
                        i === 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
                      )}
                    >
                      <div className="text-sm">{i === 0 ? slot.dayLabel : ''}</div>
                      <div className="text-xs">{slot.timeLabel}</div>
                    </div>
                  ))}
                </div>

                {/* Wind row */}
                <div className="flex border-b border-gray-100">
                  {daySlots.map((slot, i) => (
                    <div key={i} className="w-16 py-2 text-center">
                      {slot.windDirection !== null && slot.windSpeed !== null ? (
                        <>
                          {/* Wind arrow */}
                          <div className={cn('flex justify-center', getWindColor(slot.windQuality))}>
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              style={{
                                transform: `rotate(${getWindArrowRotation(slot.windDirection)}deg)`,
                              }}
                            >
                              <path d="M12 2L6 14h4v8h4v-8h4L12 2z" />
                            </svg>
                          </div>
                          {/* Wind speed */}
                          <div className={cn('text-sm font-bold', getWindColor(slot.windQuality))}>
                            {Math.round(slot.windSpeed * 0.539957)}
                          </div>
                          {/* Wind direction */}
                          <div className={cn('text-xs', getWindColor(slot.windQuality))}>
                            {degreesToCardinal(slot.windDirection)}
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-300 text-xs">-</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Wave height bars */}
                <div className="flex items-end h-32 border-b border-gray-100 px-1">
                  {daySlots.map((slot, i) => {
                    const height = slot.waveHeight ?? 0;
                    const barHeight = maxHeight > 0 ? (height / maxHeight) * 100 : 0;
                    const displayHeight =
                      unit === 'imperial'
                        ? metersToFeet(height).toFixed(1)
                        : height.toFixed(1);

                    return (
                      <div key={i} className="w-16 flex flex-col items-center justify-end h-full px-1">
                        {/* Height value */}
                        <div className="text-xs text-gray-600 mb-1">{displayHeight}</div>
                        {/* Bar */}
                        <div
                          className="w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                          style={{ height: `${Math.max(barHeight, 5)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Period circles */}
                <div className="flex border-b border-gray-100">
                  {daySlots.map((slot, i) => (
                    <div key={i} className="w-16 py-2 flex justify-center">
                      {slot.wavePeriod !== null ? (
                        <div
                          className={cn(
                            'w-9 h-9 rounded-full border-2 flex items-center justify-center',
                            getPeriodColor(slot.swellType)
                          )}
                        >
                          <span className="text-xs font-semibold">
                            {Math.round(slot.wavePeriod)}s
                          </span>
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-400">-</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tide times */}
                {dayTides.length > 0 && (
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 px-2 py-2 text-xs">
                    {dayTides.slice(0, 4).map((tide, i) => (
                      <span
                        key={i}
                        className={cn(
                          'font-medium',
                          tide.type === 'high' ? 'text-gray-900' : 'text-fuchsia-500'
                        )}
                      >
                        {format(tide.time, 'h:mma').toLowerCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 px-2">
        <span className="font-medium">Period:</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-emerald-500" />
          Ground (14s+)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-blue-500" />
          Long (10-14s)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-amber-500" />
          Wind (7-10s)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-red-400" />
          Chop (&lt;7s)
        </span>
        <span className="ml-4 font-medium">Tides:</span>
        <span className="text-gray-900">High</span>
        <span className="text-fuchsia-500">Low</span>
      </div>
    </div>
  );
}
