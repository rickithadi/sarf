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
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
// Wave quality UI components available but hidden for now
// import { SwellTypeBadge, WavePowerIndicator, ConsistencyBadge, SetWaveEstimateCompact } from '@/components/ui/swell-quality-badge';
import { MultidayForecast, HorizontalForecastStrip, SimplifiedForecast, type HourlyForecastData } from '@/components/forecast';
import dynamic from 'next/dynamic';

const WaveChart = dynamic(() => import('@/components/forecast/wave-chart').then(m => m.WaveChart), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse rounded-xl bg-surface-container-high" />,
});
const SwellChart = dynamic(() => import('@/components/forecast/swell-chart').then(m => m.SwellChart), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse rounded-xl bg-surface-container-high" />,
});
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
const MeteoMap = dynamic(() => import('@/components/map/MeteoMap').then(m => m.MeteoMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-surface-container-high" />,
});
import type { GridData } from '@/app/api/map/grid/route';
import { calculateSurfScore, scoreToDecision, toneToColor } from '@/lib/utils/surf-score';

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
  surfSummary: string | null;
}

export function BreakDetailClient({ detail, report, gridData, tideConfidence, surfSummary }: BreakDetailClientProps) {
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
    const isDaylight = (date: Date) => {
      const hour = date.getHours();
      return hour >= 5 && hour <= 20; // Approx sunrise/sunset window
    };
    for (const point of hourlyData) {
      if (!isDaylight(point.time)) {
        if (start) break;
        continue;
      }
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
  const tideFactor = tideConfidence?.score ?? getHeuristicTideFavorability(tides);
  const tideLabel = tideScoreToLabel(tideConfidence?.score ?? tideFactor);
  const tideHint = tideConfidence?.summary ?? getHeuristicTideHint(tides);

  const scoreBreakdown = useMemo(() => {
    if (!waveData) return null;
    return calculateScoreBreakdown(
      waveData.height ?? waveData.swellHeight ?? 0,
      waveData.period ?? waveData.swellPeriod ?? 0,
      currentConditions?.windQuality ?? null,
      tideFactor
    );
  }, [waveData, currentConditions?.windQuality, tideFactor]);
  const surfScore = calculateSurfScore({
    heightMeters: waveData?.height,
    periodSeconds: waveData?.period,
    windQuality: currentConditions?.windQuality ?? null,
    tideFactor,
  });
  const surfDecision = scoreToDecision(surfScore);
  const surfDescription = surfSummary ?? surfDecision.description;
  const decisionColor = toneToColor(surfDecision.tone);

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 xl:px-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface-variant transition hover:bg-surface-container"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Breaks
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tighter text-primary md:text-5xl lg:text-6xl">{breakData.name}</h1>
            <p className="mt-1 text-sm font-bold uppercase tracking-widest text-on-surface-variant">{breakData.region}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <UnitSelector />
            {report && <RatingBadge rating={report.rating} size="lg" />}
            <FavoriteButton breakId={breakData.id} size="lg" />
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-primary p-6 text-on-primary">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Surf score</p>
              <p className="font-display tabular text-5xl font-bold leading-none tracking-tight">
                {surfScore.toFixed(1)}<span className="text-2xl">/10</span>
              </p>
              <p className="mt-2 text-sm text-white/80">{surfDescription}</p>
            </div>
            <div className="flex flex-col items-start gap-2 text-right sm:items-end">
              <span
                className="inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold"
                style={{ backgroundColor: decisionColor, color: 'rgb(var(--brand-navy))' }}
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

      {/* Main 12-col grid — sidebar always visible on desktop */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* ── Left: main content ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Conditions strip — primary data, decision-color accent on swell */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="col-span-2 overflow-hidden rounded-xl bg-surface-container-lowest lg:col-span-2">
              <div className="h-1 w-full" style={{ backgroundColor: decisionColor }} />
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant">Current Swell</p>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight text-on-surface">
                  {waveData?.swellHeight ? formatWaveHeight(waveData.swellHeight, unit, 1) : '—'}
                </p>
                <p className="mt-1.5 text-sm text-on-surface-variant">
                  {waveData?.swellPeriod ? `${Math.round(waveData.swellPeriod)}s period` : 'Period pending'}
                  {waveData?.swellDirectionCardinal ? ` · From ${waveData.swellDirectionCardinal}` : ''}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant">Wind</p>
              <p className="mt-2 font-display text-2xl font-bold tracking-tight text-on-surface">
                {currentConditions ? formatWindSpeed(currentConditions.windSpeedKmh, unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {currentConditions?.windDirCardinal ?? ''}{currentConditions?.windQualityDescription ? ` · ${currentConditions.windQualityDescription}` : ''}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant">Tide</p>
              <p className="mt-2 font-display text-2xl font-bold tracking-tight text-on-surface">{tideLabel}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{tideHint}</p>
            </div>
          </div>

          {/* Tabs nav */}
          <div className="sticky top-16 z-40 -mx-4 bg-surface px-4 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <nav role="tablist" aria-label="Forecast sections" className="flex gap-6">
              {(['report', 'charts', 'guide'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  id={`tab-${tab}`}
                  aria-selected={activeTab === tab}
                  aria-controls={`tabpanel-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'min-h-[44px] px-1 pb-3 text-sm font-medium capitalize transition-colors',
                    activeTab === tab
                      ? 'border-b-2 border-secondary text-secondary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  {tab === 'report' ? 'Forecast' : tab === 'charts' ? 'Charts' : 'Guide'}
                </button>
              ))}
            </nav>
          </div>

          {/* Forecast tab */}
          {activeTab === 'report' && (
            <div role="tabpanel" id="tabpanel-report" aria-labelledby="tab-report" className="space-y-6">
              {/* 10-Day Forecast */}
              <section id="forecast">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-primary">10-Day Forecast</h2>
                  <button
                    onClick={() => setSelectedForecastDate(selectedForecastDate ? null : new Date())}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm text-secondary transition hover:text-primary"
                  >
                    {selectedForecastDate ? (
                      <>
                        <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Simple View
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <HorizontalForecastStrip
                        allData={hourlyData}
                        optimalWindDirection={breakData.optimalWindDirection}
                        unit={unit}
                        selectedDate={selectedForecastDate}
                        onSelectDate={setSelectedForecastDate}
                        className="mb-4"
                      />
                      <MultidayForecast
                        allData={hourlyData}
                        optimalWindDirection={breakData.optimalWindDirection}
                        unit={unit}
                        expandFirstDay
                        selectedDate={selectedForecastDate}
                      />
                    </>
                  ) : (
                    <SimplifiedForecast
                      data={hourlyData}
                      tides={tides}
                      optimalWindDirection={breakData.optimalWindDirection}
                      unit={unit}
                    />
                  )
                ) : (
                  <p className="text-on-surface-variant">No forecast data available</p>
                )}
              </section>

              {/* Morning Call — mobile only (sidebar shows it on desktop) */}
              {report ? (
                <section className="rounded-2xl bg-surface-container-low p-6 lg:hidden">
                  <h2 className="mb-3 font-display text-xl font-semibold tracking-tight text-primary">{report.headline}</h2>
                  <div className="space-y-4 text-on-surface">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Conditions</p>
                      <p className="text-sm">{report.conditions}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Forecast</p>
                      <p className="text-sm">{report.forecast}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Best time</p>
                      <p className="text-sm">{report.bestTime}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-on-surface-variant">
                    LINEUP analysis{report.generatedAt ? ` · ${format(new Date(report.generatedAt), 'MMM d, h:mm a')}` : ''}
                  </p>
                </section>
              ) : (
                <section className="rounded-2xl bg-surface-container-low px-5 py-4 lg:hidden">
                  <p className="text-sm text-on-surface-variant">Analysis is generating — check back shortly.</p>
                </section>
              )}

              {/* Current Conditions & Wave Data */}
              <div id="conditions" className="grid gap-6 md:grid-cols-2">
                <CollapsibleSection title="Current Conditions" defaultOpen>
                  {currentConditions ? (
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Wind</dt>
                        <dd className="font-medium text-on-surface">
                          <WindDisplay
                            direction={currentConditions.windDir}
                            speedKmh={currentConditions.windSpeedKmh}
                            quality={currentConditions.windQuality}
                            unit={unit === 'imperial' ? 'kts' : 'kmh'}
                          />
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Wind Quality</dt>
                        <dd className="font-medium text-on-surface">{currentConditions.windQualityDescription}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Gusts</dt>
                        <dd className="font-medium text-on-surface">{formatWindSpeed(currentConditions.gustKmh, unit)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Air Temp</dt>
                        <dd className="font-medium text-on-surface">{formatTemperature(currentConditions.airTemp, unit)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Humidity</dt>
                        <dd className="font-medium text-on-surface">{currentConditions.humidity ?? 'N/A'}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Pressure</dt>
                        <dd className="font-medium text-on-surface">{currentConditions.pressure ?? 'N/A'} hPa</dd>
                      </div>
                      <div className="pt-2 text-xs text-on-surface-variant">
                        Updated: {format(new Date(currentConditions.updatedAt), 'h:mm a')}
                      </div>
                    </dl>
                  ) : (
                    <p className="text-on-surface-variant">No observation data available</p>
                  )}
                </CollapsibleSection>

                <CollapsibleSection title="Wave Data" defaultOpen>
                  {waveData && waveData.height !== null ? (
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Wave Height</dt>
                        <dd className="font-medium text-on-surface">{formatSurfRange(waveData.height, waveData.period, unit)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Wave Period</dt>
                        <dd className="font-medium text-on-surface">{waveData.period ?? 'N/A'}s</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Wave Direction</dt>
                        <dd className="font-medium text-on-surface">{waveData.directionCardinal}</dd>
                      </div>
                      <div className="pt-3">
                        <h3 className="mb-2 text-sm font-medium text-on-surface">Primary Swell</h3>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-on-surface-variant">Height</dt>
                        <dd className="font-medium text-on-surface">
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
                    <p className="text-on-surface-variant">No wave data available</p>
                  )}
                </CollapsibleSection>
              </div>

              {/* Tides */}
              <CollapsibleSection id="tides" title="Upcoming Tides" defaultOpen={false}>
                {tides.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {tides.map((tide, i) => (
                      <div
                        key={i}
                        className={cn(
                          'rounded-lg px-4 py-2',
                          tide.type === 'high'
                            ? 'bg-brand-ocean/10 text-primary'
                            : 'bg-surface-container text-on-surface'
                        )}
                      >
                        <p className="text-xs opacity-75">{format(new Date(tide.time), 'EEE d MMM')}</p>
                        <p className="text-sm font-medium capitalize">{tide.type}</p>
                        <p className="text-lg font-bold">{format(new Date(tide.time), 'h:mm a')}</p>
                        <p className="text-xs">{tide.height.toFixed(2)}m</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-on-surface-variant">No tide data available</p>
                )}
              </CollapsibleSection>

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

          {/* Charts tab */}
          {activeTab === 'charts' && (
            <div role="tabpanel" id="tabpanel-charts" aria-labelledby="tab-charts" className="space-y-6">
              {/* Wave Height Chart */}
              <section className="rounded-2xl bg-surface-container-lowest p-6">
                <h2 className="mb-4 text-lg font-bold text-on-surface">Wave Height Forecast</h2>
                {chartData.length > 0 ? (
                  <WaveChart data={chartData} unit={unit} height={200} />
                ) : (
                  <p className="text-on-surface-variant">No wave data available</p>
                )}
              </section>

              {/* Swell Analysis Chart */}
              <section className="rounded-2xl bg-surface-container-lowest p-6">
                <h2 className="mb-4 text-lg font-bold text-on-surface">Swell Analysis</h2>
                {hourlyData.length > 0 ? (
                  <SwellChart data={hourlyData} unit={unit} />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="text-center p-4 bg-surface-container-high rounded-xl">
                      <p className="font-display tabular text-2xl font-bold text-secondary">
                        {waveData?.swellPeriod ? `${Math.round(waveData.swellPeriod)}s` : 'N/A'}
                      </p>
                      <p className="text-sm text-on-surface-variant">Primary Swell Period</p>
                    </div>
                    <div className="text-center p-4 bg-surface-container-high rounded-xl">
                      <p className="font-display tabular text-2xl font-bold text-secondary">
                        {waveData?.swellHeight ? formatWaveHeight(waveData.swellHeight, unit) : 'N/A'}
                      </p>
                      <p className="text-sm text-on-surface-variant">Primary Swell Height</p>
                    </div>
                    <div className="text-center p-4 bg-surface-container-high rounded-xl">
                      <p className="font-display tabular text-2xl font-bold text-secondary">
                        {waveData?.swellDirectionCardinal ?? 'N/A'}
                      </p>
                      <p className="text-sm text-on-surface-variant">Swell Direction</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Conditions Overview */}
              <section className="rounded-2xl bg-surface-container-lowest p-6">
                <h2 className="mb-4 text-lg font-semibold text-on-surface">Conditions Overview</h2>
                {hourlyData.length > 0 ? (
                  <ConditionsOverview
                    hourlyData={hourlyData}
                    tides={tides}
                    optimalWindDirection={breakData.optimalWindDirection}
                    unit={unit}
                  />
                ) : (
                  <p className="text-on-surface-variant">No forecast data available</p>
                )}
              </section>
            </div>
          )}

          {/* Guide tab */}
          {activeTab === 'guide' && (
            <div role="tabpanel" id="tabpanel-guide" aria-labelledby="tab-guide" className="space-y-6">
              <CollapsibleSection title="Break Information" defaultOpen>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-on-surface-variant">Location</dt>
                    <dd className="mt-1 text-on-surface">
                      {breakData.lat.toFixed(4)}°S, {Math.abs(breakData.lng).toFixed(4)}°E
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-on-surface-variant">Region</dt>
                    <dd className="mt-1 text-on-surface">{breakData.region}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-on-surface-variant">Optimal Wind Direction</dt>
                    <dd className="mt-1 text-on-surface">
                      {breakData.optimalWindDirection}° ({getCardinalFromDegrees(breakData.optimalWindDirection)})
                    </dd>
                  </div>
                </dl>
              </CollapsibleSection>

              <CollapsibleSection title="Best Conditions" defaultOpen>
                <ul className="space-y-2 text-on-surface">
                  {[
                    `Offshore winds from ${getCardinalFromDegrees(breakData.optimalWindDirection)}`,
                    'Swell period 10+ seconds',
                    'Wave height 0.8-2.5m',
                    'Mid to low tide',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0 text-on-tertiary-container" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            </div>
          )}

        </div>{/* end lg:col-span-8 */}

        {/* ── Desktop Sidebar — always visible ── */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6">
          {/* Morning Call */}
          {report ? (
            <div className="rounded-2xl bg-primary p-8 text-on-primary shadow-[0_20px_40px_rgba(0,30,64,0.12)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold tracking-tighter">Morning Call</h2>
                <svg className="w-8 h-8 text-secondary-container opacity-70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold leading-tight mb-4">{report.headline}</h3>
              <div className="space-y-4 text-sm text-primary-fixed-dim leading-relaxed">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-container mb-1">Conditions</p>
                  <p>{report.conditions}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-container mb-1">Forecast</p>
                  <p>{report.forecast}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-container mb-1">Best time</p>
                  <p>{report.bestTime}</p>
                </div>
              </div>
              <p className="mt-6 text-xs text-white/40" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                LINEUP analysis{report.generatedAt ? ` · ${format(new Date(report.generatedAt), 'MMM d, h:mm a')}` : ''}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-primary p-8 text-on-primary">
              <p className="text-sm text-white/60">Analysis is generating — check back shortly.</p>
            </div>
          )}

          {/* Map */}
          {gridData && process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
            <div className="rounded-2xl bg-surface-container-lowest overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Regional Map</h3>
              </div>
              <MeteoMap
                gridData={gridData}
                breaks={[{ id: breakData.id, name: breakData.name, lat: breakData.lat, lng: breakData.lng }]}
                initialBounds={{
                  sw: [breakData.lat - 3, breakData.lng - 4],
                  ne: [breakData.lat + 3, breakData.lng + 4],
                }}
                height="260px"
              />
            </div>
          )}

          {/* Score Breakdown */}
          {scoreBreakdown && (
            <div className="rounded-2xl bg-surface-container-high p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Score Drivers</h3>
              <ScoreRing breakdown={scoreBreakdown} decision={surfDecision} />
            </div>
          )}

          {/* Spot Analytics */}
          <div className="rounded-2xl bg-surface-container-high p-6 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary pb-4" style={{ borderBottom: '1px solid #c3c6d1' }}>Spot Analytics</h3>
            <div>
              <span className="text-xs font-bold text-outline uppercase block">Optimal Wind</span>
              <span className="text-sm font-bold text-primary">{getCardinalFromDegrees(breakData.optimalWindDirection)} (Offshore)</span>
            </div>
            <div>
              <span className="text-xs font-bold text-outline uppercase block">Best Window</span>
              <span className="text-sm font-bold text-primary">{bestWindowLabel}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-outline uppercase block">Tide Factor</span>
              <span className="text-sm font-bold text-primary">{tideLabel}</span>
            </div>
          </div>
        </aside>

      </div>{/* end 12-col grid */}

      <ScrollToTop />
    </div>
  );
}

function getCardinalFromDegrees(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function tideScoreToLabel(score: number) {
  if (score >= 0.75) return 'Dialed in';
  if (score >= 0.55) return 'Improving';
  return 'Out of phase';
}

function calculateScoreBreakdown(
  heightMeters: number,
  periodSeconds: number,
  windQuality: WindQuality | null,
  tideFactor: number
) {
  const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const swell = clamp(heightMeters / 2.5) * 4;
  const period = clamp(periodSeconds / 14) * 3;
  const windWeights: Record<WindQuality, number> = {
    offshore: 1,
    'cross-offshore': 0.85,
    'cross-shore': 0.65,
    'cross-onshore': 0.4,
    onshore: 0.2,
  };
  const windScore = (windWeights[windQuality ?? 'cross-shore'] ?? 0.55) * 3;
  const tideScore = clamp(tideFactor) * 1.5;
  const total = Math.min(swell + period + windScore + tideScore, 10);
  return {
    total,
    swell,
    period,
    wind: windScore,
    tide: tideScore,
  };
}

function getHeuristicTideFavorability(tides?: Array<{ type: string }>) {
  if (!tides || tides.length === 0) return 0.6;
  const type = tides[0]?.type?.toLowerCase() ?? '';
  if (type.includes('low')) return 0.8;
  if (type.includes('mid')) return 0.7;
  if (type.includes('high')) return 0.55;
  return 0.6;
}

function getHeuristicTideHint(tides?: Array<{ type: string; time: string }>) {
  if (!tides || tides.length === 0) return 'Awaiting tide data';
  const next = tides[0];
  return `${next.type} around ${new Date(next.time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}`;
}

function ScoreRing({
  breakdown,
  decision,
}: {
  breakdown: ReturnType<typeof calculateScoreBreakdown>;
  decision: ReturnType<typeof scoreToDecision>;
}) {
  const progress = (breakdown.total / 10) * 100;
  const gradient = `conic-gradient(#1a60a4 ${progress}%, #e6e8ea ${progress}% 100%)`;
  const contributions = [
    { label: 'Swell', value: breakdown.swell / 4, color: '#1a60a4' },
    { label: 'Period', value: breakdown.period / 3, color: '#004883' },
    { label: 'Wind', value: breakdown.wind / 3, color: '#5ead5c' },
    { label: 'Tide', value: breakdown.tide / 1.5, color: '#a7c8ff' },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <div className="flex items-center justify-center">
        <div
          className="relative h-48 w-48 rounded-full p-4"
          style={{ background: gradient }}
        >
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-surface-container-lowest shadow-inner">
            <p className="text-xs uppercase tracking-[0.4em] text-on-surface-variant">Score</p>
            <p className="font-display tabular text-4xl font-bold text-on-surface tracking-tight">
              {breakdown.total.toFixed(1)}
              <span className="text-base text-on-surface-variant">/10</span>
            </p>
            <span
              className="mt-2 rounded-full px-3 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: toneToColor(decision.tone), color: 'rgb(var(--brand-navy))' }}
            >
              {decision.label}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        {contributions.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between text-sm font-medium text-on-surface">
              <span>{c.label}</span>
              <span>{Math.round(c.value * 100)}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface-container-high">
              <div
                className="h-2 rounded-full"
                style={{ width: `${Math.min(c.value, 1) * 100}%`, backgroundColor: c.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
