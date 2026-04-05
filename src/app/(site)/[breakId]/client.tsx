'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RatingBadge } from '@/components/ui/rating-badge';
import { FavoriteButton } from '@/components/ui/favorites';
import { UnitSelector, useUnit } from '@/components/ui/unit-toggle';
import { WindDisplay } from '@/components/ui/wind-arrow';
import { SwellDisplay } from '@/components/ui/swell-arrow';
// Wave quality UI components available but hidden for now
// import { SwellTypeBadge, WavePowerIndicator, ConsistencyBadge, SetWaveEstimateCompact } from '@/components/ui/swell-quality-badge';
import { MultidayForecast, HorizontalForecastStrip, SimplifiedForecast, type HourlyForecastData } from '@/components/forecast';
import { WaveChart } from '@/components/forecast/wave-chart';
import { SwellChart } from '@/components/forecast/swell-chart';
import { ConditionsOverview } from '@/components/forecast/conditions-overview';
import { NearbySpots, calculateDistance } from '@/components/breaks/nearby-spots';
import {
  formatSurfRange,
  formatWaveHeight,
  formatWindSpeed,
  formatTemperature,
} from '@/lib/utils/units';
import type { WindQuality } from '@/lib/breaks/wind-quality';
// Wave quality calculations available but hidden for now
// import { analyzeWave, classifySwellType, calculateSetWaveEstimate } from '@/lib/utils/wave-quality';
import { MeteoMap } from '@/components/map/MeteoMap';
import type { GridData } from '@/app/api/map/grid/route';
import { calculateSurfScore, scoreToDecision, toneToColor } from '@/lib/utils/surf-score';
import { useEffect, useState } from 'react';

type TabType = 'report' | 'charts' | 'guide';

interface BreakDetailClientProps {
  detail: {
    break: {
      id: string;
      name: string;
      region: string;
      lat: number;
      lng: number;
      optimalWindDirection: number;
    };
    currentConditions: {
      airTemp: number | null;
      windSpeedKmh: number | null;
      gustKmh: number | null;
      windDir: number | null;
      windDirCardinal: string;
      windQuality: WindQuality | null;
      windQualityDescription: string;
      pressure: number | null;
      humidity: number | null;
      updatedAt: string;
    } | null;
    waveData: {
      height: number | null;
      period: number | null;
      direction: number | null;
      directionCardinal: string;
      swellHeight: number | null;
      swellPeriod: number | null;
      swellDirection: number | null;
      swellDirectionCardinal: string;
    } | null;
    hourlyForecast?: Array<{
      time: string;
      waveHeight: number | null;
      wavePeriod: number | null;
      waveDirection: number | null;
      swellHeight: number | null;
      swellPeriod: number | null;
      swellDirection: number | null;
      windSpeed: number | null;
      windGust: number | null;
      windDirection: number | null;
      windQuality: WindQuality | null;
    }>;
    tides?: Array<{
      time: string;
      type: string;
      height: number;
    }>;
    nearbySpots?: Array<{
      id: string;
      name: string;
      lat: number;
      lng: number;
      waveHeight: number | null;
      wavePeriod: number | null;
    }>;
  };
  report: {
    rating: number;
    headline: string;
    conditions: string;
    forecast: string;
    bestTime: string;
    generatedAt?: string;
  } | null;
  gridData: GridData | null;
  tideConfidence: { score: number; summary: string } | null;
}

export function BreakDetailClient({ detail, report, gridData, tideConfidence }: BreakDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [selectedForecastDate, setSelectedForecastDate] = useState<Date | null>(null);
  const { unit } = useUnit();

  const {
    break: breakData,
    currentConditions,
    waveData,
    hourlyForecast = [],
    tides = [],
    nearbySpots = [],
  } = detail;

  // Convert hourly forecast to the format expected by components
  const hourlyData: HourlyForecastData[] = (hourlyForecast || []).map((h) => ({
    time: new Date(h.time),
    waveHeight: h.waveHeight,
    wavePeriod: h.wavePeriod,
    waveDirection: h.waveDirection,
    swellHeight: h.swellHeight,
    swellPeriod: h.swellPeriod,
    swellDirection: h.swellDirection,
    windSpeed: h.windSpeed,
    windGust: h.windGust,
    windDirection: h.windDirection,
    windQuality: h.windQuality,
  }));

  // Calculate distances for nearby spots
  const nearbyWithDistance = (nearbySpots || []).map((spot) => ({
    ...spot,
    rating: null,
    distance: calculateDistance(breakData.lat, breakData.lng, spot.lat, spot.lng),
  })).sort((a, b) => a.distance - b.distance);

  // Prepare chart data
  const chartData = hourlyData.map((h) => ({
    time: h.time,
    height: h.waveHeight,
  }));

  const bestWindow = useMemo(() => {
    if (hourlyData.length === 0) return null;
    let start: Date | null = null;
    let end: Date | null = null;
    for (const point of hourlyData) {
      const waveOk = (point.waveHeight ?? 0) >= 0.5;
      const windOk = point.windQuality === 'offshore' || point.windQuality === 'cross-offshore';
      if (waveOk && windOk) {
        if (!start) start = point.time;
        end = point.time;
      } else if (start) {
        break;
      }
    }
    if (!start || !end) return null;
    return { start, end };
  }, [hourlyData]);

  const bestWindowLabel = bestWindow
    ? `${format(bestWindow.start, 'EEE h a')} – ${format(bestWindow.end, 'h a')}`
    : report?.bestTime ?? 'Not set';
  const swellStatValue = waveData?.swellHeight
    ? `${formatWaveHeight(waveData.swellHeight, unit, 1)} · ${waveData.swellPeriod ? `${Math.round(waveData.swellPeriod)}s` : ''}`
    : 'Pending';
  const swellHint = waveData?.swellDirectionCardinal ? `From ${waveData.swellDirectionCardinal}` : 'Direction pending';
  const windStatValue = currentConditions
    ? `${formatWindSpeed(currentConditions.windSpeedKmh, unit)} ${currentConditions.windDirCardinal}`
    : 'Calm / N/A';
  const windHint = currentConditions?.windQualityDescription ?? 'Wind data pending';
  const tideFactor = tideConfidence?.score ?? getHeuristicTideFavorability(tides);
  const tideLabel = tideScoreToLabel(tideConfidence?.score ?? tideFactor);
  const tideHint = tideConfidence?.summary ?? getHeuristicTideHint(tides);
  const surfScore = calculateSurfScore({
    heightMeters: waveData?.height,
    periodSeconds: waveData?.period,
    windQuality: currentConditions?.windQuality ?? null,
    tideFactor,
  });
  const surfDecision = scoreToDecision(surfScore);
  const decisionColor = toneToColor(surfDecision.tone);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-blue-600"
      >
        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to all breaks
      </Link>

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{breakData.name}</h1>
              <p className="mt-1 text-gray-600">{breakData.region}</p>
            </div>
            <FavoriteButton breakId={breakData.id} size="lg" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <UnitSelector />
            {report && <RatingBadge rating={report.rating} size="lg" />}
            <a
              href="mailto:team@lineup.app?subject=LINEUP%20spot%20alerts"
              className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Get LINEUP alerts
            </a>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-[#0B1F2A] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Surf score</p>
              <p className="text-5xl font-bold leading-none">
                {surfScore.toFixed(1)}<span className="text-2xl">/10</span>
              </p>
              <p className="mt-2 text-sm text-white/80">{surfDecision.description}</p>
            </div>
            <div className="flex flex-col items-start gap-2 text-right sm:items-end">
              <span
                className="inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold"
                style={{ backgroundColor: decisionColor, color: '#0B1F2A' }}
              >
                {surfDecision.label}
              </span>
              <p className="text-sm text-white/70">
                {waveData?.height !== null && waveData?.height !== undefined
                  ? `${formatSurfRange(waveData.height, waveData.period, unit)} · ${waveData?.period ? `${Math.round(waveData.period)}s` : '—'}`
                  : 'Flat seas'}
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {currentConditions
                  ? `${formatWindSpeed(currentConditions.windSpeedKmh, unit)} ${currentConditions.windDirCardinal}`
                  : 'Calm / N/A'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStat label="Best window" value={bestWindowLabel} hint="Offshore wind + >0.5m swell" />
        <QuickStat label="Primary swell" value={swellStatValue} hint={swellHint} />
        <QuickStat label="Wind status" value={windStatValue} hint={windHint} />
        <QuickStat label="Tide call" value={tideLabel} hint={tideHint} />
      </section>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6">
          {(['report', 'charts', 'guide'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3 text-sm font-medium capitalize transition-colors',
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab === 'report' ? 'Report & Forecast' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* AI Report */}
          {report && (
            <section className="rounded-lg border border-blue-100 bg-blue-50 p-6">
              <h2 className="mb-2 text-xl font-semibold text-blue-900">{report.headline}</h2>
              <div className="space-y-4 text-blue-800">
                <div>
                  <h3 className="font-medium">Current Conditions</h3>
                  <p className="text-sm">{report.conditions}</p>
                </div>
                <div>
                  <h3 className="font-medium">Forecast</h3>
                  <p className="text-sm">{report.forecast}</p>
                </div>
                <div>
                  <h3 className="font-medium">Best Time to Surf</h3>
                  <p className="text-sm">{report.bestTime}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-blue-600">
                AI-generated report{report.generatedAt ? ` · ${format(new Date(report.generatedAt), 'MMM d, h:mm a')}` : ''}
              </p>
            </section>
          )}

          {/* 10-Day Forecast */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">10-Day Forecast</h2>
              <button
                onClick={() => setSelectedForecastDate(selectedForecastDate ? null : new Date())}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {selectedForecastDate ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Simple View
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Detailed View
                  </>
                )}
              </button>
            </div>
            {hourlyData.length > 0 ? (
              selectedForecastDate ? (
                <>
                  {/* Day selector strip */}
                  <HorizontalForecastStrip
                    allData={hourlyData}
                    optimalWindDirection={breakData.optimalWindDirection}
                    unit={unit}
                    selectedDate={selectedForecastDate}
                    onSelectDate={setSelectedForecastDate}
                    className="mb-4"
                  />
                  {/* Detailed day forecast */}
                  <MultidayForecast
                    allData={hourlyData}
                    optimalWindDirection={breakData.optimalWindDirection}
                    unit={unit}
                    expandFirstDay
                    selectedDate={selectedForecastDate}
                  />
                </>
              ) : (
                /* Simplified visual forecast - default view */
                <SimplifiedForecast
                  data={hourlyData}
                  tides={tides}
                  optimalWindDirection={breakData.optimalWindDirection}
                  unit={unit}
                />
              )
            ) : (
              <p className="text-gray-400">No forecast data available</p>
            )}
          </section>

          {/* Current Conditions & Wave Data Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Conditions */}
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Current Conditions</h2>
              {currentConditions ? (
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Wind</dt>
                    <dd className="font-medium text-gray-900">
                      <WindDisplay
                        direction={currentConditions.windDir}
                        speedKmh={currentConditions.windSpeedKmh}
                        quality={currentConditions.windQuality}
                        unit={unit === 'imperial' ? 'kts' : 'kmh'}
                      />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Wind Quality</dt>
                    <dd className="font-medium text-gray-900">
                      {currentConditions.windQualityDescription}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Gusts</dt>
                    <dd className="font-medium text-gray-900">
                      {formatWindSpeed(currentConditions.gustKmh, unit)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Air Temp</dt>
                    <dd className="font-medium text-gray-900">
                      {formatTemperature(currentConditions.airTemp, unit)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Humidity</dt>
                    <dd className="font-medium text-gray-900">
                      {currentConditions.humidity ?? 'N/A'}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Pressure</dt>
                    <dd className="font-medium text-gray-900">
                      {currentConditions.pressure ?? 'N/A'} hPa
                    </dd>
                  </div>
                  <div className="border-t border-gray-100 pt-2 text-xs text-gray-400">
                    Updated: {format(new Date(currentConditions.updatedAt), 'h:mm a')}
                  </div>
                </dl>
              ) : (
                <p className="text-gray-400">No observation data available</p>
              )}
            </section>

            {/* Wave Data */}
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Wave Data</h2>
              {waveData && waveData.height !== null ? (
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Wave Height</dt>
                    <dd className="font-medium text-gray-900">
                      {formatSurfRange(waveData.height, waveData.period, unit)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Wave Period</dt>
                    <dd className="font-medium text-gray-900">{waveData.period ?? 'N/A'}s</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Wave Direction</dt>
                    <dd className="font-medium text-gray-900">{waveData.directionCardinal}</dd>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <h3 className="mb-2 text-sm font-medium text-gray-700">Primary Swell</h3>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Height</dt>
                    <dd className="font-medium text-gray-900">
                      <SwellDisplay
                        heightMeters={waveData.swellHeight}
                        periodSeconds={waveData.swellPeriod}
                        directionDegrees={waveData.swellDirection}
                        system={unit}
                      />
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-gray-400">No wave data available</p>
              )}
            </section>
          </div>

          {/* Tides */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Tides</h2>
            {tides.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {tides.map((tide, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-lg px-4 py-2',
                      tide.type === 'high'
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-gray-50 text-gray-800'
                    )}
                  >
                    <p className="text-sm font-medium capitalize">{tide.type}</p>
                    <p className="text-lg font-bold">
                      {format(new Date(tide.time), 'h:mm a')}
                    </p>
                    <p className="text-xs">{tide.height.toFixed(2)}m</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No tide data available</p>
            )}
          </section>

          {/* Nearby Spots */}
          {nearbyWithDistance.length > 0 && (
            <NearbySpots
              spots={nearbyWithDistance}
              currentSpotId={breakData.id}
              unit={unit}
            />
          )}
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Meteorological Map */}
          {gridData && process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
            <section className="rounded-lg border border-gray-200 overflow-hidden">
              <MeteoMap
                gridData={gridData}
                breaks={[{ id: breakData.id, name: breakData.name, lat: breakData.lat, lng: breakData.lng }]}
                initialBounds={{
                  sw: [breakData.lat - 3, breakData.lng - 4],
                  ne: [breakData.lat + 3, breakData.lng + 4],
                }}
                height="380px"
              />
            </section>
          )}

          {/* Wave Height Chart */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Wave Height Forecast</h2>
            {chartData.length > 0 ? (
              <WaveChart data={chartData} unit={unit} height={200} />
            ) : (
              <p className="text-gray-400">No wave data available</p>
            )}
          </section>

          {/* Swell Analysis Chart */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Swell Analysis</h2>
            {hourlyData.length > 0 ? (
              <SwellChart data={hourlyData} unit={unit} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {waveData?.swellPeriod ? `${Math.round(waveData.swellPeriod)}s` : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">Primary Swell Period</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {waveData?.swellHeight ? formatWaveHeight(waveData.swellHeight, unit) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">Primary Swell Height</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {waveData?.swellDirectionCardinal ?? 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">Swell Direction</p>
                </div>
              </div>
            )}
          </section>

          {/* Conditions Overview */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Conditions Overview</h2>
            {hourlyData.length > 0 ? (
              <ConditionsOverview
                hourlyData={hourlyData}
                tides={tides}
                optimalWindDirection={breakData.optimalWindDirection}
                unit={unit}
              />
            ) : (
              <p className="text-gray-400">No forecast data available</p>
            )}
          </section>
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Break Info */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Break Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-gray-900">
                  {breakData.lat.toFixed(4)}°S, {Math.abs(breakData.lng).toFixed(4)}°E
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Region</dt>
                <dd className="mt-1 text-gray-900">{breakData.region}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Optimal Wind Direction</dt>
                <dd className="mt-1 text-gray-900">
                  {breakData.optimalWindDirection}° (
                  {getCardinalFromDegrees(breakData.optimalWindDirection)})
                </dd>
              </div>
            </dl>
          </section>

          {/* Best Conditions */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Best Conditions</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Offshore winds from {getCardinalFromDegrees(breakData.optimalWindDirection)}
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Swell period 10+ seconds
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Wave height 0.8-2.5m
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mid to low tide
              </li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

function getCardinalFromDegrees(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function QuickStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#2E8BC0]/30 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function tideScoreToLabel(score: number) {
  if (score >= 0.75) return 'Dialed in';
  if (score >= 0.55) return 'Improving';
  return 'Out of phase';
}

function getHeuristicTideFavorability(tides?: Array<{ type: string }>) {
  if (!tides || tides.length === 0) return 0.6;
  const type = tides[0]?.type?.toLowerCase() ?? '';
  if (type.includes('low')) return 0.8;
  if (type.includes('mid')) return 0.7;
  if (type.includes('high')) return 0.55;
  return 0.6;
}

function getHeuristicTideHint(tides?: Array<{ type: string }>) {
  if (!tides || tides.length === 0) return 'Awaiting tide data';
  const next = tides[0];
  return `${next.type} around ${new Date(next.time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}`;
}
