'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { BreakCard } from '@/components/breaks/break-card';
import { FavoritesFilter, useFavorites } from '@/components/ui/favorites';
import { UnitToggle, useUnit } from '@/components/ui/unit-toggle';
import type { WindQuality } from '@/lib/breaks/wind-quality';
import { MeteoMap } from '@/components/map/MeteoMap';
import type { GridData } from '@/app/api/map/grid/route';
import { formatSurfRange } from '@/lib/utils/units';
import { calculateSurfScore, scoreToDecision, toneToColor } from '@/lib/utils/surf-score';

interface BreakData {
  id: string;
  name: string;
  region: string;
  rating: number | null;
  reportGeneratedAt: string | null;
  currentConditions: {
    airTemp: number | null;
    windSpeedKmh: number | null;
    gustKmh: number | null;
    windDir: number | null;
    windQuality: WindQuality | null;
    updatedAt?: string;
  } | null;
  waveData: {
    height: number | null;
    period: number | null;
  } | null;
}

interface HomePageClientProps {
  breaks: BreakData[];
  mapData: null | {
    gridData: GridData;
    breaks: Array<{ id: string; name: string; lat: number; lng: number }>;
    bounds: {
      sw: [number, number];
      ne: [number, number];
    };
  };
}

function slugifyRegion(region: string) {
  return region
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function HomePageClient({ breaks, mapData }: HomePageClientProps) {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const { isFavorite, favorites } = useFavorites();
  const { unit } = useUnit();

  const scrollToRegion = useCallback((region: string) => {
    const id = `region-${slugifyRegion(region)}`;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    const regions = Object.keys(breaks.reduce<Record<string, number>>((acc, b) => {
      acc[b.region] = (acc[b.region] || 0) + 1;
      return acc;
    }, {}));
    if (regions.length > 0 && !activeRegion) {
      setActiveRegion(regions[0]);
    }
  }, [breaks, activeRegion]);

  // Filter breaks if showing only favorites
  const filteredBreaks = showOnlyFavorites
    ? breaks.filter((b) => isFavorite(b.id))
    : breaks;

  // Sort favorites to top
  const sortedBreaks = [...filteredBreaks].sort((a, b) => {
    const aFav = isFavorite(a.id);
    const bFav = isFavorite(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  // Group breaks by region
  const breaksByRegion = sortedBreaks.reduce<Record<string, BreakData[]>>((acc, b) => {
    if (!acc[b.region]) {
      acc[b.region] = [];
    }
    acc[b.region].push(b);
    return acc;
  }, {});

  const regions = Object.keys(breaksByRegion);

  const heroData = useMemo(() => {
    if (breaks.length === 0) {
      return null;
    }

    const scored = [...breaks].sort((a, b) => {
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.waveData?.height ?? 0) - (a.waveData?.height ?? 0);
    });

    const best = scored[0];
    const surfable = breaks.filter((b) => b.waveData?.height);
    const avgHeightMeters = surfable.length
      ? surfable.reduce((sum, b) => sum + (b.waveData?.height ?? 0), 0) / surfable.length
      : null;

    const lastUpdatedTimestamp = breaks
      .map((b) => b.currentConditions?.updatedAt)
      .filter(Boolean)
      .map((date) => new Date(date as string).getTime())
      .sort((a, b) => b - a)[0];

    return {
      best,
      avgHeightMeters,
      openBreaks: surfable.length,
      totalBreaks: breaks.length,
      favoritesCount: favorites.size,
      lastUpdated: lastUpdatedTimestamp ? new Date(lastUpdatedTimestamp) : null,
    };
  }, [breaks, favorites.size]);

  const heroScore = useMemo(() => {
    if (!heroData?.best) return null;
    return calculateSurfScore({
      heightMeters: heroData.best.waveData?.height,
      periodSeconds: heroData.best.waveData?.period,
      windQuality: heroData.best.currentConditions?.windQuality ?? null,
    });
  }, [heroData]);

  const heroDecision = heroScore !== null ? scoreToDecision(heroScore) : null;

  const heroTimeline = useMemo(() => {
    if (!heroData?.best) return [];
    return buildHeroTimeline(heroData.best, unit, heroScore ?? 0, heroDecision?.label ?? 'Check in');
  }, [heroData, heroScore, heroDecision?.label, unit]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2E8BC0]">Lineup · Know when it’s on</p>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">LINEUP decision dashboard</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            A decision-first forecast for Australian surfers. We surface the best spot, surf score, and next move—no raw data overload.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FavoritesFilter
            showOnlyFavorites={showOnlyFavorites}
            onToggle={() => setShowOnlyFavorites(!showOnlyFavorites)}
          />
          <UnitToggle />
        </div>
      </div>

      {heroData && heroData.best && (
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-[#0B1F2A] p-6 text-white shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">Best spot right now</p>
                <h2 className="mt-1 text-3xl font-semibold">{heroData.best.name}</h2>
                <p className="text-sm text-white/70">{heroData.best.region} · Know when it’s on.</p>
              </div>
              {heroScore !== null && heroDecision && (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs uppercase text-white/60">Surf score</p>
                    <p className="text-5xl font-bold leading-none">
                      {heroScore.toFixed(1)}<span className="text-2xl">/10</span>
                    </p>
                  </div>
                  <span
                    className="rounded-full px-4 py-2 text-sm font-semibold"
                    style={{ backgroundColor: toneToColor(heroDecision.tone), color: '#0B1F2A' }}
                  >
                    {heroDecision.label}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-4 text-base text-white/80">
              {heroDecision?.description ?? 'Smart lineup picks driven by swell, wind, and tide signals.'}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {heroTimeline.map((entry) => (
                <div key={entry.label} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">{entry.label}</p>
                  <p className="mt-1 text-lg font-semibold">{entry.recommendation}</p>
                  <p className="text-sm text-white/70">{entry.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${heroData.best.id}`}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0B1F2A]"
              >
                Open {heroData.best.name}
              </Link>
              <a
                href="mailto:team@lineup.app?subject=LINEUP%20alerts"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Get LINEUP alerts
              </a>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                How LINEUP works
              </Link>
            </div>
          </div>

          {mapData && (
            <section id="surf-map" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live overlay</p>
                  <h3 className="text-lg font-semibold text-slate-900">Wave + wind map</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Beta</span>
              </div>
              <div className="h-[260px] rounded-xl border border-slate-100 overflow-hidden">
                <MeteoMap
                  gridData={mapData.gridData}
                  breaks={mapData.breaks}
                  initialBounds={mapData.bounds}
                  height="100%"
                />
              </div>
            </section>
          )}
        </section>
      )}

      {regions.length > 1 && (
        <div className="sticky top-16 z-10 mb-6 -mx-4 bg-white/80 backdrop-blur-md px-4 py-2 shadow-sm sm:rounded-full sm:border sm:border-gray-100 sm:px-6">
          <div className="flex gap-2 overflow-x-auto text-sm">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => {
                  setActiveRegion(region);
                  scrollToRegion(region);
                }}
                className={`whitespace-nowrap rounded-full px-3 py-1 font-medium transition-colors ${
                  activeRegion === region ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      )}

      {breaks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">
            No surf break data available. Data will appear once the cron jobs have run.
          </p>
        </div>
      ) : showOnlyFavorites && filteredBreaks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">
            No favorite breaks yet. Click the heart icon on any break to add it to your favorites.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(breaksByRegion).map(([region, regionBreaks]) => (
            <section key={region} id={`region-${slugifyRegion(region)}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Region</p>
                  <h2 className="text-xl font-semibold text-gray-900">{region}</h2>
                </div>
                <button
                  onClick={() => scrollToRegion(region)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Top of list
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regionBreaks.map((b) => (
                  <BreakCard
                    key={b.id}
                    id={b.id}
                    name={b.name}
                    region={b.region}
                    reportGeneratedAt={b.reportGeneratedAt}
                    currentConditions={b.currentConditions}
                    waveData={b.waveData}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function buildHeroTimeline(best: BreakData, unit: 'metric' | 'imperial', score: number, call: string) {
  const waveSummary = best.waveData?.height
    ? formatSurfRange(best.waveData.height, best.waveData.period, unit)
    : 'Flat';
  const periodLabel = best.waveData?.period ? `${Math.round(best.waveData.period)}s` : '—';
  const windLabel = best.currentConditions?.windQuality?.replace('-', ' ') ?? 'Calm winds';
  const nowCard = {
    label: 'Now',
    recommendation: call,
    detail: `${waveSummary} · ${periodLabel} · ${windLabel}`,
  };

  const laterCall = score >= 7 ? 'Stays on' : score >= 5 ? 'Improves with tide' : 'Monitor later';
  const laterDetail = score >= 7 ? 'Wind holds steady, plenty of push.' : 'Watch for tide shift + cleaner wind.';

  const tonightCall = score >= 6 ? 'Evening pulse' : 'Likely fades';
  const tonightDetail = score >= 6 ? 'Expect mellow but rideable sundown session.' : 'Energy drops after sunset.';

  return [nowCard, { label: '+3h', recommendation: laterCall, detail: laterDetail }, { label: 'Tonight', recommendation: tonightCall, detail: tonightDetail }];
}
