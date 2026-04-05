'use client';

import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { metersToFeet, type UnitSystem } from '@/lib/utils/units';
import { degreesToCardinal, calculateWindQuality, type WindQuality } from '@/lib/breaks/wind-quality';
import { classifySwellType, type SwellType } from '@/lib/utils/wave-quality';
import type { HourlyForecastData } from './hourly-table';

// Wind quality display names for tooltip
const windQualityLabels: Record<WindQuality, string> = {
  offshore: 'Offshore',
  'cross-offshore': 'Cross-offshore',
  'cross-shore': 'Cross-shore',
  'cross-onshore': 'Cross-onshore',
  onshore: 'Onshore',
};

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
  dateNumber: string;
  timeLabel: string;
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
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
 * Get color for period badge based on swell type (filled style)
 */
function getPeriodColor(swellType: SwellType | null): string {
  switch (swellType) {
    case 'ground-swell':
      return 'bg-emerald-500 text-white';
    case 'long-period':
      return 'bg-blue-500 text-white';
    case 'wind-swell':
      return 'bg-amber-500 text-white';
    case 'short-chop':
      return 'bg-red-400 text-white';
    default:
      return 'bg-gray-300 text-gray-600';
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
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlot | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

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
        dateNumber: format(d.time, 'd'),
        timeLabel: format(d.time, 'ha').toLowerCase(),
        waveHeight: d.waveHeight,
        wavePeriod: d.swellPeriod ?? d.wavePeriod,
        waveDirection: d.swellDirection ?? d.waveDirection,
        windSpeed: d.windSpeed,
        windDirection: d.windDirection,
        windQuality,
        swellType: classifySwellType(d.swellPeriod ?? d.wavePeriod),
        isNewDay,
      });
    }

    return slots;
  }, [data, optimalWindDirection]);

  // Handle hover for tooltip
  const handleSlotHover = (slot: TimeSlot | null, event?: React.MouseEvent) => {
    setHoveredSlot(slot);
    if (slot && event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    } else {
      setTooltipPosition(null);
    }
  };

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
                        'w-20 text-center py-2 border-b border-gray-200',
                        i === 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
                      )}
                    >
                      {i === 0 && (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-bold">{slot.dayLabel}</span>
                          <span className="text-sm text-gray-500">{slot.dateNumber}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-600">{slot.timeLabel}</div>
                    </div>
                  ))}
                </div>

                {/* Wind row */}
                <div className="flex border-b border-gray-200">
                  {daySlots.map((slot, i) => (
                    <div
                      key={i}
                      className="w-20 py-3 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onMouseEnter={(e) => handleSlotHover(slot, e)}
                      onMouseLeave={() => handleSlotHover(null)}
                    >
                      {slot.windDirection !== null && slot.windSpeed !== null ? (
                        <>
                          {/* Wind arrow - larger */}
                          <div className={cn('flex justify-center', getWindColor(slot.windQuality))}>
                            <svg
                              className="w-6 h-6"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              style={{
                                transform: `rotate(${getWindArrowRotation(slot.windDirection)}deg)`,
                              }}
                            >
                              <path d="M12 2L6 14h4v8h4v-8h4L12 2z" />
                            </svg>
                          </div>
                          {/* Wind speed - larger */}
                          <div className={cn('text-base font-bold', getWindColor(slot.windQuality))}>
                            {Math.round(slot.windSpeed * 0.539957)}
                          </div>
                          {/* Wind direction */}
                          <div className={cn('text-xs font-medium', getWindColor(slot.windQuality))}>
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
                <div className="flex items-end h-36 border-b border-gray-200 px-1">
                  {daySlots.map((slot, i) => {
                    const height = slot.waveHeight ?? 0;
                    const barHeight = maxHeight > 0 ? (height / maxHeight) * 100 : 0;
                    const displayHeight =
                      unit === 'imperial'
                        ? metersToFeet(height).toFixed(1)
                        : height.toFixed(1);

                    return (
                      <div
                        key={i}
                        className="w-20 flex flex-col items-center justify-end h-full px-1 cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onMouseEnter={(e) => handleSlotHover(slot, e)}
                        onMouseLeave={() => handleSlotHover(null)}
                      >
                        {/* Height value - larger */}
                        <div className="text-sm font-semibold text-gray-700 mb-1">{displayHeight}</div>
                        {/* Bar - wider, navy color */}
                        <div
                          className="w-12 bg-slate-700 rounded-t"
                          style={{ height: `${Math.max(barHeight, 8)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Period circles - filled style */}
                <div className="flex border-b border-gray-200">
                  {daySlots.map((slot, i) => (
                    <div
                      key={i}
                      className="w-20 py-3 flex justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onMouseEnter={(e) => handleSlotHover(slot, e)}
                      onMouseLeave={() => handleSlotHover(null)}
                    >
                      {slot.wavePeriod !== null ? (
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center shadow-sm',
                            getPeriodColor(slot.swellType)
                          )}
                        >
                          <span className="text-sm font-bold">
                            {Math.round(slot.wavePeriod)}s
                          </span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm text-gray-400">-</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tide times with HIGH/Low labels */}
                {dayTides.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 text-xs">
                    {dayTides.slice(0, 4).map((tide, i) => (
                      <span
                        key={i}
                        className={cn(
                          'font-medium',
                          tide.type === 'high' ? 'text-gray-800' : 'text-fuchsia-500'
                        )}
                      >
                        {format(tide.time, 'h:mma').toLowerCase()}{' '}
                        <span className="font-bold">
                          {tide.type === 'high' ? 'HIGH' : 'Low'}
                        </span>
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

      {/* Tooltip */}
      {hoveredSlot && tooltipPosition && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg shadow-lg px-3 py-2 pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 10,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold mb-1">
            {format(hoveredSlot.time, 'EEE d MMM')} · {hoveredSlot.timeLabel}
          </div>
          {hoveredSlot.windSpeed !== null && hoveredSlot.windDirection !== null && (
            <div className="mb-1">
              <span className="text-gray-400">Wind: </span>
              <span className={getWindColor(hoveredSlot.windQuality).replace('text-', 'text-')}>
                {Math.round(hoveredSlot.windSpeed * 0.539957)}kts {degreesToCardinal(hoveredSlot.windDirection)}
              </span>
              {hoveredSlot.windQuality && (
                <span className="text-gray-400"> ({windQualityLabels[hoveredSlot.windQuality]})</span>
              )}
            </div>
          )}
          {hoveredSlot.waveHeight !== null && (
            <div className="mb-1">
              <span className="text-gray-400">Swell: </span>
              {unit === 'imperial'
                ? metersToFeet(hoveredSlot.waveHeight).toFixed(1)
                : hoveredSlot.waveHeight.toFixed(1)}
              {unit === 'imperial' ? 'ft' : 'm'}
              {hoveredSlot.wavePeriod && ` @ ${Math.round(hoveredSlot.wavePeriod)}s`}
              {hoveredSlot.waveDirection !== null && ` ${degreesToCardinal(hoveredSlot.waveDirection)}`}
            </div>
          )}
          {hoveredSlot.swellType && (
            <div className="text-gray-400 capitalize">
              {hoveredSlot.swellType.replace('-', ' ')}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 px-2">
        <span className="font-medium">Period:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          Ground (14s+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Long (10-14s)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          Wind (7-10s)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          Chop (&lt;7s)
        </span>
        <span className="ml-4 font-medium">Tides:</span>
        <span className="text-gray-800 font-medium">HIGH</span>
        <span className="text-fuchsia-500 font-medium">Low</span>
      </div>
    </div>
  );
}
