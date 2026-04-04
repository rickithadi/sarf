'use client';

import { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { metersToFeet, type UnitSystem } from '@/lib/utils/units';
import {
  classifySwellType,
  getSwellTypeLabel,
  calculateWaveSteepness,
  categorizeWaveSteepness,
  getSteepnessDescription,
  type SwellType,
  type SteepnessCategory,
} from '@/lib/utils/wave-quality';
import type { HourlyForecastData } from './hourly-table';

interface SwellChartProps {
  data: HourlyForecastData[];
  unit?: UnitSystem;
  height?: number;
  className?: string;
}

interface ChartDataPoint {
  time: Date;
  timeLabel: string;
  swellHeight: number | null;
  swellHeightDisplay: number | null;
  swellPeriod: number | null;
  swellDirection: number | null;
  periodQuality: 'excellent' | 'good' | 'average' | null;
  swellType: SwellType | null;
  steepness: number | null;
  steepnessCategory: SteepnessCategory | null;
  dayBoundary: boolean;
  dayLabel: string;
}

/**
 * Get period quality based on seconds
 * >12s = excellent, 10-12s = good, <10s = average
 */
function getPeriodQuality(period: number | null): 'excellent' | 'good' | 'average' | null {
  if (period === null) return null;
  if (period >= 12) return 'excellent';
  if (period >= 10) return 'good';
  return 'average';
}

/**
 * Get color based on period quality
 */
function getPeriodColor(quality: 'excellent' | 'good' | 'average' | null): string {
  switch (quality) {
    case 'excellent':
      return '#10B981'; // emerald-500
    case 'good':
      return '#22C55E'; // green-500
    case 'average':
      return '#F59E0B'; // amber-500
    default:
      return '#6B7280'; // gray-500
  }
}

/**
 * Get swell type color for display
 */
function getSwellTypeColor(type: SwellType | null): string {
  switch (type) {
    case 'ground-swell':
      return '#10B981'; // emerald-500
    case 'long-period':
      return '#3B82F6'; // blue-500
    case 'wind-swell':
      return '#F59E0B'; // amber-500
    case 'short-chop':
      return '#EF4444'; // red-500
    default:
      return '#6B7280'; // gray-500
  }
}

/**
 * Custom tooltip for swell chart
 */
function SwellTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
  unit: UnitSystem;
}) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;
  const periodQuality = getPeriodQuality(data.swellPeriod);
  const qualityLabel = periodQuality === 'excellent' ? 'Excellent' : periodQuality === 'good' ? 'Good' : 'Average';

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-medium text-gray-900">
        {format(data.time, 'EEE, MMM d')} at {format(data.time, 'h:mm a')}
      </p>
      <div className="space-y-1 text-sm">
        {data.swellHeightDisplay !== null && (
          <p className="text-blue-600">
            Swell Height: <span className="font-medium">
              {data.swellHeightDisplay.toFixed(1)}{unit === 'imperial' ? 'ft' : 'm'}
            </span>
          </p>
        )}
        {data.swellPeriod !== null && (
          <p style={{ color: getPeriodColor(periodQuality) }}>
            Period: <span className="font-medium">{Math.round(data.swellPeriod)}s</span>
            <span className="ml-1 text-xs">({qualityLabel})</span>
          </p>
        )}
        {data.swellType !== null && (
          <p style={{ color: getSwellTypeColor(data.swellType) }}>
            Type: <span className="font-medium">{getSwellTypeLabel(data.swellType)}</span>
          </p>
        )}
        {data.steepnessCategory !== null && (
          <p className="text-gray-600">
            <span className="text-xs">{getSteepnessDescription(data.steepnessCategory)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Dual-axis chart showing swell height and period with quality indicators
 */
export function SwellChart({
  data,
  unit = 'imperial',
  height = 280,
  className,
}: SwellChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return { points: [], dayBoundaries: [], maxHeight: 5, maxPeriod: 15 };

    let lastDay: string | null = null;
    const points: ChartDataPoint[] = data.map((d) => {
      const dayKey = format(d.time, 'yyyy-MM-dd');
      const isDayBoundary = dayKey !== lastDay;
      lastDay = dayKey;

      const heightDisplay = d.swellHeight !== null
        ? (unit === 'imperial' ? metersToFeet(d.swellHeight) : d.swellHeight)
        : null;

      const steepness = calculateWaveSteepness(d.swellHeight, d.swellPeriod);

      return {
        time: d.time,
        timeLabel: format(d.time, 'ha'),
        swellHeight: d.swellHeight,
        swellHeightDisplay: heightDisplay,
        swellPeriod: d.swellPeriod,
        swellDirection: d.swellDirection,
        periodQuality: getPeriodQuality(d.swellPeriod),
        swellType: classifySwellType(d.swellPeriod),
        steepness,
        steepnessCategory: categorizeWaveSteepness(steepness),
        dayBoundary: isDayBoundary,
        dayLabel: isToday(d.time) ? 'Today' : format(d.time, 'EEE'),
      };
    });

    // Find day boundaries for reference lines
    const dayBoundaries = points
      .filter((p) => p.dayBoundary)
      .map((p) => p.time);

    // Calculate max values
    const validHeights = points
      .map((p) => p.swellHeightDisplay)
      .filter((h): h is number => h !== null);
    const validPeriods = points
      .map((p) => p.swellPeriod)
      .filter((p): p is number => p !== null);

    const maxHeight = Math.max(...validHeights, unit === 'imperial' ? 5 : 1.5);
    const maxPeriod = Math.max(...validPeriods, 15);

    return { points, dayBoundaries, maxHeight, maxPeriod };
  }, [data, unit]);

  if (chartData.points.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-32 text-gray-400', className)}>
        No swell data available
      </div>
    );
  }

  // Find current time for reference line
  const now = new Date();

  return (
    <div className={cn('w-full', className)}>
      {/* Swell type legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-gray-500">Swell Type:</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-gray-600">Ground Swell (14s+)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-gray-600">Long Period (10-14s)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-gray-600">Wind Swell (7-10s)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-gray-600">Short Chop (&lt;7s)</span>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData.points}
          margin={{ top: 10, right: 50, left: 10, bottom: 20 }}
        >
          {/* Period quality reference areas */}
          <ReferenceArea
            y1={12}
            y2={chartData.maxPeriod}
            yAxisId="period"
            fill="#10B981"
            fillOpacity={0.1}
          />
          <ReferenceArea
            y1={10}
            y2={12}
            yAxisId="period"
            fill="#22C55E"
            fillOpacity={0.1}
          />
          <ReferenceArea
            y1={0}
            y2={10}
            yAxisId="period"
            fill="#F59E0B"
            fillOpacity={0.08}
          />

          {/* X-axis with time labels */}
          <XAxis
            dataKey="time"
            tickFormatter={(time: Date) => {
              const hour = time.getHours();
              // Show label at 6am, 12pm, 6pm
              if (hour === 0) return format(time, 'EEE');
              if (hour === 6 || hour === 12 || hour === 18) return format(time, 'ha');
              return '';
            }}
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            interval="preserveStartEnd"
          />

          {/* Left Y-axis: Swell Height */}
          <YAxis
            yAxisId="height"
            orientation="left"
            domain={[0, chartData.maxHeight * 1.1]}
            tickFormatter={(value: number) => `${value.toFixed(1)}`}
            tick={{ fontSize: 11, fill: '#3B82F6' }}
            tickLine={false}
            axisLine={false}
            label={{
              value: unit === 'imperial' ? 'Height (ft)' : 'Height (m)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 11, fill: '#3B82F6' },
            }}
          />

          {/* Right Y-axis: Period */}
          <YAxis
            yAxisId="period"
            orientation="right"
            domain={[0, chartData.maxPeriod * 1.1]}
            tickFormatter={(value: number) => `${value}s`}
            tick={{ fontSize: 11, fill: '#10B981' }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'Period (s)',
              angle: 90,
              position: 'insideRight',
              style: { fontSize: 11, fill: '#10B981' },
            }}
          />

          <Tooltip content={<SwellTooltip unit={unit} />} />

          <Legend
            verticalAlign="top"
            height={30}
            formatter={(value: string) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />

          {/* Day separator lines */}
          {chartData.dayBoundaries.slice(1).map((time, i) => (
            <ReferenceLine
              key={i}
              x={time.getTime()}
              stroke="#D1D5DB"
              strokeDasharray="3 3"
              yAxisId="height"
            />
          ))}

          {/* Current time indicator */}
          {chartData.points.length > 0 && now >= chartData.points[0].time && now <= chartData.points[chartData.points.length - 1].time && (
            <ReferenceLine
              x={now.getTime()}
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              yAxisId="height"
              label={{
                value: 'Now',
                position: 'top',
                fill: '#EF4444',
                fontSize: 10,
              }}
            />
          )}

          {/* Swell height area */}
          <Area
            yAxisId="height"
            type="monotone"
            dataKey="swellHeightDisplay"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#swellHeightGradient)"
            name="Swell Height"
            dot={false}
            activeDot={{ r: 4, fill: '#3B82F6' }}
          />

          {/* Period line with dynamic coloring */}
          <Line
            yAxisId="period"
            type="monotone"
            dataKey="swellPeriod"
            stroke="#10B981"
            strokeWidth={2}
            name="Swell Period"
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (!payload || payload.swellPeriod === null) return <circle key={`dot-${props.key}`} />;
              const color = getPeriodColor(payload.periodQuality);
              return (
                <circle
                  key={`dot-${props.key}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={color}
                  stroke="white"
                  strokeWidth={1}
                />
              );
            }}
            activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="swellHeightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
