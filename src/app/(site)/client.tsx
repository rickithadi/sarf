'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { BreakCard } from '@/components/breaks/break-card';
import { FavoritesFilter, useFavorites } from '@/components/ui/favorites';
import { UnitToggle, useUnit } from '@/components/ui/unit-toggle';
import type { WindQuality } from '@/lib/breaks/wind-quality';
import dynamic from 'next/dynamic';
import type { GridData } from '@/app/api/map/grid/route';
import { formatSurfRange, formatWindSpeed } from '@/lib/utils/units';
import { calculateSurfScore, scoreToDecision, toneToColor } from '@/lib/utils/surf-score';

const MeteoMap = dynamic(() => import('@/components/map/MeteoMap').then((m) => m.MeteoMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-primary/20" />,
});

interface BreakData {
  id: string;
  name: string;
  region: string;
  rating: number | null;
  reportGeneratedAt: string | null;
  reportConditions: string | null;
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
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const regions = Object.keys(breaks.reduce<Record<string, number>>((acc, b) => {
      acc[b.region] = (acc[b.region] || 0) + 1;
      return acc;
    }, {}));
    if (regions.length > 0 && !activeRegion) setActiveRegion(regions[0]);
  }, [breaks, activeRegion]);

  const filteredBreaks = showOnlyFavorites ? breaks.filter((b) => isFavorite(b.id)) : breaks;

  const sortedBreaks = [...filteredBreaks].sort((a, b) => {
    const aFav = isFavorite(a.id);
    const bFav = isFavorite(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  const breaksByRegion = sortedBreaks.reduce<Record<string, BreakData[]>>((acc, b) => {
    if (!acc[b.region]) acc[b.region] = [];
    acc[b.region].push(b);
    return acc;
  }, {});

  const regions = Object.keys(breaksByRegion);

  const heroData = useMemo(() => {
    if (breaks.length === 0) return null;
    const scored = [...breaks].sort((a, b) => {
      const aScore = calculateSurfScore({
        heightMeters: a.waveData?.height,
        periodSeconds: a.waveData?.period,
        windQuality: a.currentConditions?.windQuality ?? null,
      });
      const bScore = calculateSurfScore({
        heightMeters: b.waveData?.height,
        periodSeconds: b.waveData?.period,
        windQuality: b.currentConditions?.windQuality ?? null,
      });
      return bScore - aScore;
    });
    const best = scored[0];
    const surfable = breaks.filter((b) => b.waveData?.height);
    const lastUpdatedTimestamp = breaks
      .map((b) => b.currentConditions?.updatedAt)
      .filter(Boolean)
      .map((date) => new Date(date as string).getTime())
      .sort((a, b) => b - a)[0];
    return {
      best,
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
  const heroDecisionColor = heroDecision ? toneToColor(heroDecision.tone) : '#5ead5c';
  const heroWindQualityLabel = heroData?.best?.currentConditions?.windQuality
    ? heroData.best.currentConditions.windQuality.replace(/-/g, ' ')
    : null;
  const heroWaveSummary = heroData?.best?.waveData?.height
    ? formatSurfRange(heroData.best.waveData.height, heroData.best.waveData.period, unit)
    : 'Flat';
  const heroPeriodLabel = heroData?.best?.waveData?.period
    ? `${Math.round(heroData.best.waveData.period)}s`
    : '—';
  const heroLastUpdatedLabel = heroData?.lastUpdated
    ? formatDistanceToNow(heroData.lastUpdated, { addSuffix: true })
    : 'Awaiting update';

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 xl:px-8">
      <h1 className="sr-only">LINEUP — Victorian Surf Breaks Live Conditions</h1>

      {/* ── Hero ── */}
      {heroData && heroData.best && (
        <section className="relative mb-10 overflow-hidden rounded-2xl bg-primary">
          {/* Grain */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'repeat',
              backgroundSize: '180px 180px',
            }}
          />
          {/* Decision color accent — left rail */}
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: heroDecisionColor }} />

          <div className="relative z-10 px-8 py-10 md:px-12 md:py-14">
            {/* Eyebrow */}
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.35em] text-white/35">
              Best right now · {heroData.best.region}
            </p>

            {/* Name + score row */}
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-4xl font-black leading-none tracking-tight text-white md:text-6xl">
                  {heroData.best.name}
                </h2>

                {/* Verdict badge */}
                {heroDecision && (
                  <span
                    className="mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                    style={{ backgroundColor: `${heroDecisionColor}30`, color: heroDecisionColor }}
                  >
                    {heroDecision.label}
                  </span>
                )}

                {/* Claude conditions — the "why" */}
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 md:text-base md:text-white/60">
                  {heroData.best.reportConditions ?? heroDecision?.description ?? '—'}
                </p>

                {/* Stat row */}
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">Swell</p>
                    <p className="font-display text-lg font-bold text-white">{heroWaveSummary}</p>
                  </div>
                  {heroPeriodLabel !== '—' && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/30">Period</p>
                      <p className="font-display text-lg font-bold text-white">{heroPeriodLabel}</p>
                    </div>
                  )}
                  {heroWindQualityLabel && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/30">Wind</p>
                      <p className="font-display text-lg font-bold capitalize text-white">{heroWindQualityLabel}</p>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={`/${heroData.best.id}`}
                  className="mt-7 inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-bold text-primary transition hover:bg-white/90"
                >
                  Full forecast →
                </Link>
              </div>

              {/* Score — right side, desktop only */}
              {heroScore !== null && (
                <div className="hidden shrink-0 flex-col items-end md:flex">
                  <p
                    className="font-display text-8xl font-black leading-none tabular-nums"
                    style={{ color: heroDecisionColor }}
                  >
                    {heroScore.toFixed(1)}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-white/30">/ 10</p>
                </div>
              )}
            </div>

            {/* Meta footer */}
            <p className="mt-8 text-xs uppercase tracking-[0.3em] text-white/30">
              {heroData.openBreaks} of {heroData.totalBreaks} breaks with data · updated {heroLastUpdatedLabel}
            </p>
          </div>
        </section>
      )}

      {/* ── Controls bar ── */}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low px-5 py-2.5">
        <FavoritesFilter showOnlyFavorites={showOnlyFavorites} onToggle={() => setShowOnlyFavorites(!showOnlyFavorites)} />
        <UnitToggle />
      </div>

      {/* ── Main grid: break cards + map sidebar ── */}
      <div className={`grid grid-cols-1 gap-8 ${mapData ? 'lg:grid-cols-12' : ''}`}>

        {/* Left: break cards */}
        <div className={mapData ? 'lg:col-span-8' : ''}>
          {/* Region filter */}
          {regions.length > 1 && (
            <div className="sticky top-[72px] z-10 mb-6 -mx-4 bg-surface px-4 py-2 sm:-mx-0 sm:rounded-full sm:px-6">
              <div className="flex gap-2 overflow-x-auto text-sm">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => { setActiveRegion(region); scrollToRegion(region); }}
                    className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeRegion === region
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          )}

          {breaks.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low p-8 text-center">
              <p className="text-on-surface-variant">Conditions are loading — live data typically updates every 30 minutes.</p>
            </div>
          ) : showOnlyFavorites && filteredBreaks.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low p-8 text-center">
              <p className="text-on-surface-variant">No favorite breaks yet. Click the heart icon on any break to add it to your favorites.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(breaksByRegion).map(([region, regionBreaks]) => (
                <section key={region} id={`region-${slugifyRegion(region)}`}>
                  <div className="mb-4 flex items-baseline gap-3">
                    <h2 className="font-display text-3xl font-extrabold tracking-tight text-primary">{region}</h2>
                    <span className="text-sm font-bold text-outline uppercase tracking-widest">
                      {regionBreaks.length} spot{regionBreaks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                    {regionBreaks.map((b, i) => (
                      <BreakCard
                        key={b.id}
                        id={b.id}
                        name={b.name}
                        region={b.region}
                        reportGeneratedAt={b.reportGeneratedAt}
                        reportConditions={b.reportConditions}
                        currentConditions={b.currentConditions}
                        waveData={b.waveData}
                        featured={i === 0}
                        className={i === 0 ? 'col-span-full' : ''}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Right: map sidebar — only rendered when map data is available */}
        {mapData && (
          <aside className="lg:col-span-4">
            <div className="overflow-hidden rounded-2xl">
              <div className="bg-primary px-5 py-4">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/80">Wave + Wind</h3>
                  <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[0.625rem] font-medium text-white/50">Beta</span>
                </div>
              </div>
              <div className="h-[320px]">
                <MeteoMap gridData={mapData.gridData} breaks={mapData.breaks} initialBounds={mapData.bounds} height="100%" />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
