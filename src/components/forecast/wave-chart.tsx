'use client';

import { useMemo } from 'react';
import { format, startOfDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { metersToFeet, type UnitSystem } from '@/lib/utils/units';

interface WaveDataPoint {
  time: Date;
  height: number | null;
}

interface WaveChartProps {
  data: WaveDataPoint[];
  unit?: UnitSystem;
  height?: number;
  showLabels?: boolean;
  highlightCurrent?: boolean;
  className?: string;
}

/**
 * SVG-based wave height chart showing forecast over time
 */
export function WaveChart({
  data,
  unit = 'imperial',
  height = 120,
  showLabels = true,
  highlightCurrent = true,
  className,
}: WaveChartProps) {
  const chartData = useMemo(() => {
    // Filter to valid data points
    const validData = data.filter(d => d.height !== null);
    if (validData.length === 0) return null;

    // Convert heights if needed
    const heights = validData.map(d =>
      unit === 'imperial' ? metersToFeet(d.height!) : d.height!
    );

    const minHeight = 0;
    const maxHeight = Math.max(...heights, 5); // At least 5ft/m scale
    const range = maxHeight - minHeight;

    // Create SVG path
    const width = 100; // percentage-based
    const padding = { top: 10, bottom: 30, left: 0, right: 0 };
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width - padding.left - padding.right;

    const points = validData.map((d, i) => {
      const x = padding.left + (i / (validData.length - 1)) * chartWidth;
      const normalizedHeight = (heights[i] - minHeight) / range;
      const y = padding.top + chartHeight - (normalizedHeight * chartHeight);
      return { x, y, data: d, height: heights[i] };
    });

    // Create smooth path
    const pathD = points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;

      // Use quadratic bezier for smooth curves
      const prev = points[i - 1];
      const controlX = (prev.x + point.x) / 2;
      return `${acc} Q ${controlX} ${prev.y}, ${point.x} ${point.y}`;
    }, '');

    // Create filled area path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    // Find current time index
    const now = new Date();
    let currentIndex = -1;
    for (let i = 0; i < validData.length; i++) {
      if (validData[i].time > now) {
        currentIndex = Math.max(0, i - 1);
        break;
      }
    }
    if (currentIndex === -1) currentIndex = validData.length - 1;

    // Get day boundaries for labels
    const days: { date: Date; startIndex: number }[] = [];
    let lastDay: string | null = null;
    validData.forEach((d, i) => {
      const dayKey = format(d.time, 'yyyy-MM-dd');
      if (dayKey !== lastDay) {
        days.push({ date: startOfDay(d.time), startIndex: i });
        lastDay = dayKey;
      }
    });

    return {
      points,
      pathD,
      areaD,
      maxHeight,
      currentIndex,
      days,
      chartHeight,
      padding,
    };
  }, [data, unit, height]);

  if (!chartData) {
    return (
      <div className={cn('flex items-center justify-center h-32 text-gray-400', className)}>
        No wave data available
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: `${height}px` }}
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = chartData.padding.top + chartData.chartHeight * (1 - ratio);
          return (
            <line
              key={ratio}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.3"
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Day separator lines */}
        {chartData.days.slice(1).map((day, i) => {
          const x = chartData.points[day.startIndex]?.x;
          if (x === undefined) return null;
          return (
            <line
              key={i}
              x1={x}
              y1={chartData.padding.top}
              x2={x}
              y2={height - chartData.padding.bottom}
              stroke="#d1d5db"
              strokeWidth="0.3"
            />
          );
        })}

        {/* Filled area under curve */}
        <path
          d={chartData.areaD}
          fill="url(#waveGradient)"
        />

        {/* Main wave line */}
        <path
          d={chartData.pathD}
          fill="none"
          stroke="rgb(59, 130, 246)"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current time indicator */}
        {highlightCurrent && chartData.currentIndex >= 0 && (
          <>
            <line
              x1={chartData.points[chartData.currentIndex].x}
              y1={chartData.padding.top}
              x2={chartData.points[chartData.currentIndex].x}
              y2={height - chartData.padding.bottom}
              stroke="rgb(239, 68, 68)"
              strokeWidth="0.5"
              strokeDasharray="1,1"
            />
            <circle
              cx={chartData.points[chartData.currentIndex].x}
              cy={chartData.points[chartData.currentIndex].y}
              r="1.5"
              fill="rgb(239, 68, 68)"
            />
          </>
        )}
      </svg>

      {/* Day labels at bottom */}
      {showLabels && (
        <div className="absolute bottom-0 left-0 right-0 flex">
          {chartData.days.map((day, i) => {
            const startX = (day.startIndex / (chartData.points.length - 1)) * 100;
            const endX = i < chartData.days.length - 1
              ? (chartData.days[i + 1].startIndex / (chartData.points.length - 1)) * 100
              : 100;
            const width = endX - startX;

            return (
              <div
                key={i}
                className="text-center text-xs text-gray-500"
                style={{
                  position: 'absolute',
                  left: `${startX}%`,
                  width: `${width}%`,
                }}
              >
                {isToday(day.date) ? 'Today' : format(day.date, 'EEE')}
              </div>
            );
          })}
        </div>
      )}

      {/* Y-axis labels */}
      <div className="absolute top-0 right-2 text-xs text-gray-400">
        {chartData.maxHeight.toFixed(0)}{unit === 'imperial' ? 'ft' : 'm'}
      </div>
    </div>
  );
}

/**
 * Mini sparkline version of wave chart
 */
export function WaveSparkline({
  data,
  unit = 'imperial',
  className,
}: {
  data: WaveDataPoint[];
  unit?: UnitSystem;
  className?: string;
}) {
  return (
    <WaveChart
      data={data}
      unit={unit}
      height={40}
      showLabels={false}
      highlightCurrent={false}
      className={className}
    />
  );
}
