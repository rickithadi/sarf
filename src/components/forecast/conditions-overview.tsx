'use client';

import { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Brush,
  ReferenceArea,
} from 'recharts';
import { cn } from '@/lib/utils';
import { metersToFeet, kmhToKnots, type UnitSystem } from '@/lib/utils/units';
import { calculateWindQuality, type WindQuality } from '@/lib/breaks/wind-quality';
import type { HourlyForecastData } from './hourly-table';

interface TideData {
  time: string;
  type: string;
  height: number;
}

interface ConditionsOverviewProps {
  hourlyData: HourlyForecastData[];
  tides?: TideData[];
  optimalWindDirection: number;
  unit?: UnitSystem;
  className?: string;
}

interface ChartDataPoint {
  time: Date;
  timestamp: number;
  timeLabel: string;
  // Wave data
  waveHeight: number | null;
  waveHeightDisplay: number | null;
  // Wind data
  windSpeed: number | null;
  windSpeedDisplay: number | null;
  windGust: number | null;
  windGustDisplay: number | null;
  windDirection: number | null;
  windQuality: WindQuality | null;
  // Day info
  dayBoundary: boolean;
  dayLabel: string;
}


/**
 * Get color based on wind quality
 */
function getWindQualityColor(quality: WindQuality | null): string {
  switch (quality) {
    case 'offshore':
      return '#10B981'; // emerald-500
    case 'cross-offshore':
      return '#22C55E'; // green-500
    case 'cross-shore':
      return '#EAB308'; // yellow-500
    case 'cross-onshore':
      return '#F97316'; // orange-500
    case 'onshore':
      return '#EF4444'; // red-500
    default:
      return '#6B7280'; // gray-500
  }
}

/**
 * Custom tooltip for the combined chart
 */
function CombinedTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint; dataKey: string; color: string }>;
  unit: UnitSystem;
}) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;
  const windQualityLabels: Record<WindQuality, string> = {
    'offshore': 'Offshore',
    'cross-offshore': 'Cross-offshore',
    'cross-shore': 'Cross-shore',
    'cross-onshore': 'Cross-onshore',
    'onshore': 'Onshore',
  };
  const windQualityLabel = data.windQuality ? windQualityLabels[data.windQuality] : 'N/A';

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-2 text-sm font-medium text-gray-900">
        {format(data.time, 'EEE, MMM d')} at {format(data.time, 'h:mm a')}
      </p>
      <div className="space-y-1 text-sm">
        {data.waveHeightDisplay !== null && (
          <p className="text-blue-600">
            Wave Height: <span className="font-medium">
              {data.waveHeightDisplay.toFixed(1)}{unit === 'imperial' ? 'ft' : 'm'}
            </span>
          </p>
        )}
        {data.windSpeedDisplay !== null && (
          <p style={{ color: getWindQualityColor(data.windQuality) }}>
            Wind: <span className="font-medium">
              {Math.round(data.windSpeedDisplay)}{unit === 'imperial' ? 'kts' : 'km/h'}
            </span>
            {data.windGustDisplay !== null && (
              <span className="text-gray-500">
                {' '}(gusts {Math.round(data.windGustDisplay)})
              </span>
            )}
          </p>
        )}
        {data.windQuality && (
          <p className="text-xs text-gray-500">
            Wind Quality: <span style={{ color: getWindQualityColor(data.windQuality) }}>{windQualityLabel}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Identify "good windows" where conditions align
 * Good conditions: offshore/cross-offshore wind + decent wave height
 */
function findGoodWindows(
  data: ChartDataPoint[]
): Array<{ start: number; end: number }> {
  const windows: Array<{ start: number; end: number }> = [];
  let windowStart: number | null = null;

  data.forEach((point, i) => {
    const isGood = (
      (point.windQuality === 'offshore' || point.windQuality === 'cross-offshore') &&
      point.waveHeightDisplay !== null &&
      point.waveHeightDisplay > 0
    );

    if (isGood && windowStart === null) {
      windowStart = point.timestamp;
    } else if (!isGood && windowStart !== null) {
      windows.push({ start: windowStart, end: data[i - 1].timestamp });
      windowStart = null;
    }
  });

  // Close any open window at the end
  if (windowStart !== null && data.length > 0) {
    windows.push({ start: windowStart, end: data[data.length - 1].timestamp });
  }

  return windows;
}

/**
 * Interpolate tide heights between extremes for smooth visualization
 */
function interpolateTides(
  tides: TideData[],
  hourlyData: HourlyForecastData[]
): Array<{ timestamp: number; height: number }> {
  if (tides.length === 0 || hourlyData.length === 0) return [];

  const tidePoints = tides.map((t) => ({
    timestamp: new Date(t.time).getTime(),
    height: t.height,
  })).sort((a, b) => a.timestamp - b.timestamp);

  // Create interpolated points for each hour
  const result: Array<{ timestamp: number; height: number }> = [];

  hourlyData.forEach((h) => {
    const ts = h.time.getTime();

    // Find surrounding tide points
    let before = tidePoints[0];
    let after = tidePoints[tidePoints.length - 1];

    for (let i = 0; i < tidePoints.length - 1; i++) {
      if (tidePoints[i].timestamp <= ts && tidePoints[i + 1].timestamp >= ts) {
        before = tidePoints[i];
        after = tidePoints[i + 1];
        break;
      }
    }

    // Linear interpolation
    if (before.timestamp === after.timestamp) {
      result.push({ timestamp: ts, height: before.height });
    } else {
      const ratio = (ts - before.timestamp) / (after.timestamp - before.timestamp);
      // Use cosine interpolation for smoother tide curve
      const smoothRatio = (1 - Math.cos(ratio * Math.PI)) / 2;
      const height = before.height + (after.height - before.height) * smoothRatio;
      result.push({ timestamp: ts, height });
    }
  });

  return result;
}

/**
 * Stacked synchronized charts showing wave height, wind, and tide conditions
 */
export function ConditionsOverview({
  hourlyData,
  tides = [],
  optimalWindDirection,
  unit = 'imperial',
  className,
}: ConditionsOverviewProps) {
  const { chartData, goodWindows, tideData, maxWave, maxWind, maxTide } = useMemo(() => {
    if (hourlyData.length === 0) {
      return { chartData: [], goodWindows: [], tideData: [], maxWave: 5, maxWind: 30, maxTide: 2 };
    }

    let lastDay: string | null = null;
    const points: ChartDataPoint[] = hourlyData.map((d) => {
      const dayKey = format(d.time, 'yyyy-MM-dd');
      const isDayBoundary = dayKey !== lastDay;
      lastDay = dayKey;

      const waveHeightDisplay = d.waveHeight !== null
        ? (unit === 'imperial' ? metersToFeet(d.waveHeight) : d.waveHeight)
        : null;

      const windSpeedDisplay = d.windSpeed !== null
        ? (unit === 'imperial' ? kmhToKnots(d.windSpeed) : d.windSpeed)
        : null;

      const windGustDisplay = d.windGust !== null
        ? (unit === 'imperial' ? kmhToKnots(d.windGust) : d.windGust)
        : null;

      const windQuality = calculateWindQuality(
        d.windDirection,
        optimalWindDirection,
        d.windSpeed
      );

      return {
        time: d.time,
        timestamp: d.time.getTime(),
        timeLabel: format(d.time, 'ha'),
        waveHeight: d.waveHeight,
        waveHeightDisplay,
        windSpeed: d.windSpeed,
        windSpeedDisplay,
        windGust: d.windGust,
        windGustDisplay,
        windDirection: d.windDirection,
        windQuality,
        dayBoundary: isDayBoundary,
        dayLabel: isToday(d.time) ? 'Today' : format(d.time, 'EEE'),
      };
    });

    // Calculate good windows
    const windows = findGoodWindows(points);

    // Interpolate tide data
    const interpolatedTides = interpolateTides(tides, hourlyData);

    // Calculate max values
    const validWaves = points.map((p) => p.waveHeightDisplay).filter((h): h is number => h !== null);
    const validWinds = points.map((p) => p.windGustDisplay ?? p.windSpeedDisplay).filter((w): w is number => w !== null);
    const validTides = interpolatedTides.map((t) => t.height);

    return {
      chartData: points,
      goodWindows: windows,
      tideData: interpolatedTides,
      maxWave: Math.max(...validWaves, unit === 'imperial' ? 5 : 1.5),
      maxWind: Math.max(...validWinds, unit === 'imperial' ? 20 : 35),
      maxTide: Math.max(...validTides, 2),
    };
  }, [hourlyData, tides, optimalWindDirection, unit]);

  if (chartData.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-32 text-gray-400', className)}>
        No forecast data available
      </div>
    );
  }

  const now = new Date();
  const nowTimestamp = now.getTime();
  const isNowInRange = chartData.length > 0 && nowTimestamp >= chartData[0].timestamp && nowTimestamp <= chartData[chartData.length - 1].timestamp;

  // Get day boundaries for X-axis labels
  const dayBoundaries = chartData.filter((p) => p.dayBoundary);

  // Shared X-axis tick formatter
  const formatXAxis = (timestamp: number) => {
    const time = new Date(timestamp);
    const hour = time.getHours();
    if (hour === 0) return format(time, 'EEE');
    if (hour === 6 || hour === 12 || hour === 18) return format(time, 'ha');
    return '';
  };

  // Merge tide data into chart data for combined chart
  const combinedData = chartData.map((point) => {
    const tidePoint = tideData.find((t) => t.timestamp === point.timestamp);
    return {
      ...point,
      tideHeight: tidePoint?.height ?? null,
    };
  });

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Wind quality legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-gray-500">Wind Quality:</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-gray-600">Offshore</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-gray-600">Cross-offshore</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-gray-600">Cross-shore</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-gray-600">Cross-onshore</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-gray-600">Onshore</span>
        </span>
      </div>

      {/* Wave Height Chart */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">Wave Height</h3>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={combinedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            {/* Good windows highlighting */}
            {goodWindows.map((window, i) => (
              <ReferenceArea
                key={i}
                x1={window.start}
                x2={window.end}
                fill="#10B981"
                fillOpacity={0.15}
              />
            ))}

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, maxWave * 1.1]}
              tickFormatter={(v) => `${v.toFixed(0)}`}
              tick={{ fontSize: 10, fill: '#3B82F6' }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip content={<CombinedTooltip unit={unit} />} />

            {/* Day separator lines */}
            {dayBoundaries.slice(1).map((point, i) => (
              <ReferenceLine
                key={i}
                x={point.timestamp}
                stroke="#D1D5DB"
                strokeDasharray="3 3"
              />
            ))}

            {/* Current time */}
            {isNowInRange && (
              <ReferenceLine x={nowTimestamp} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 2" />
            )}

            <Area
              type="monotone"
              dataKey="waveHeightDisplay"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#waveGradient)"
              dot={false}
            />

            <defs>
              <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Wind Speed Chart */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">Wind Speed</h3>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={combinedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            {/* Good windows highlighting */}
            {goodWindows.map((window, i) => (
              <ReferenceArea
                key={i}
                x1={window.start}
                x2={window.end}
                fill="#10B981"
                fillOpacity={0.15}
              />
            ))}

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, maxWind * 1.1]}
              tickFormatter={(v) => `${v.toFixed(0)}`}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip content={<CombinedTooltip unit={unit} />} />

            {/* Day separator lines */}
            {dayBoundaries.slice(1).map((point, i) => (
              <ReferenceLine
                key={i}
                x={point.timestamp}
                stroke="#D1D5DB"
                strokeDasharray="3 3"
              />
            ))}

            {/* Current time */}
            {isNowInRange && (
              <ReferenceLine x={nowTimestamp} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 2" />
            )}

            {/* Gust overlay (area) */}
            <Area
              type="monotone"
              dataKey="windGustDisplay"
              stroke="none"
              fill="#9CA3AF"
              fillOpacity={0.2}
            />

            {/* Wind speed line with quality coloring */}
            <Line
              type="monotone"
              dataKey="windSpeedDisplay"
              stroke="#6B7280"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload || payload.windSpeedDisplay === null) return <circle key={`wind-dot-${props.key}`} />;
                const color = getWindQualityColor(payload.windQuality);
                // Only show dots at key hours
                const hour = payload.time.getHours();
                if (hour % 3 !== 0) return <circle key={`wind-dot-${props.key}`} />;
                return (
                  <circle
                    key={`wind-dot-${props.key}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={color}
                    stroke="white"
                    strokeWidth={1}
                  />
                );
              }}
              activeDot={{ r: 5, strokeWidth: 2, fill: 'white' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Tide Chart */}
      {tideData.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">Tide</h3>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart
              data={combinedData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              {/* Good windows highlighting */}
              {goodWindows.map((window, i) => (
                <ReferenceArea
                  key={i}
                  x1={window.start}
                  x2={window.end}
                  fill="#10B981"
                  fillOpacity={0.15}
                />
              ))}

              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, maxTide * 1.2]}
                tickFormatter={(v) => `${v.toFixed(1)}m`}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return [`${value.toFixed(2)}m`, 'Tide Height'];
                  }
                  return ['-', 'Tide Height'];
                }}
                labelFormatter={(ts) => {
                  if (typeof ts === 'number') {
                    return format(new Date(ts), 'EEE h:mm a');
                  }
                  return '';
                }}
              />

              {/* Day separator lines */}
              {dayBoundaries.slice(1).map((point, i) => (
                <ReferenceLine
                  key={i}
                  x={point.timestamp}
                  stroke="#D1D5DB"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Current time */}
              {isNowInRange && (
                <ReferenceLine x={nowTimestamp} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 2" />
              )}

              <Area
                type="monotone"
                dataKey="tideHeight"
                stroke="#6B7280"
                strokeWidth={1.5}
                fill="url(#tideGradient)"
              />

              <defs>
                <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6B7280" stopOpacity={0.05} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Time scrubber/brush */}
      <div className="pt-2">
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={combinedData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <Area
              type="monotone"
              dataKey="waveHeightDisplay"
              stroke="#E5E7EB"
              fill="#F3F4F6"
            />
            <Brush
              dataKey="timestamp"
              height={30}
              stroke="#3B82F6"
              tickFormatter={(ts) => format(new Date(ts), 'MMM d')}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Good windows legend */}
      {goodWindows.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block h-3 w-3 rounded bg-emerald-500 opacity-30" />
          <span>Highlighted areas indicate good surfing windows (offshore wind + waves)</span>
        </div>
      )}
    </div>
  );
}
