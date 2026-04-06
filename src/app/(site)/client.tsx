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
import { calculateSurfScore, scoreToDecision } from '@/lib/utils/surf-score';

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
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.waveData?.height ?? 0) - (a.waveData?.height ?? 0);
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
  const heroWaveSummary = heroData?.best?.waveData?.height
    ? formatSurfRange(heroData.best.waveData.height, heroData.best.waveData.period, unit)
    : 'Flat';
  const heroPeriodLabel = heroData?.best?.waveData?.period
    ? `${Math.round(heroData.best.waveData.period)}s`
    : '—';
  const heroWindSpeedLabel =
    heroData?.best?.currentConditions?.windSpeedKmh !== null && heroData?.best?.currentConditions?.windSpeedKmh !== undefined
      ? formatWindSpeed(heroData.best.currentConditions.windSpeedKmh, unit)
      : 'Calm';
  const heroLastUpdatedLabel = heroData?.lastUpdated
    ? formatDistanceToNow(heroData.lastUpdated, { addSuffix: true })
    : 'Awaiting update';

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 xl:px-8">
      <h1 className="sr-only">LINEUP — Victorian Surf Breaks Live Conditions</h1>

      {/* ── Hero: Full-width editorial banner ── */}
      {heroData && heroData.best && (
        <section className="relative mb-10 h-[480px] w-full overflow-hidden rounded-3xl flex items-end md:h-[560px]">
          {/* Gradient background (editorial ocean feel) */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #1a60a4 0%, #001e40 50%, #002504 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,30,64,0.95) 0%, rgba(0,30,64,0.2) 60%, transparent 100%)' }} />

          {/* Content */}
          <div className="relative z-10 w-full p-8 md:p-10 grid grid-cols-1 gap-6 items-end md:grid-cols-12 md:gap-8">
            <div className="md:col-span-8">
              <p className="text-white/50 text-xs font-bold uppercase tracking-[0.25em] mb-3">Best Right Now</p>
              <h2 className="font-display text-5xl font-black text-white tracking-tighter leading-none mb-2 md:text-7xl">
                {heroData.best.name}
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-white/60 text-sm tracking-widest uppercase font-medium">{heroData.best.region}</span>
                {heroDecision && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-widest text-white" style={{ backgroundColor: '#5ead5c' }}>
                    {heroDecision.label}
                  </span>
                )}
              </div>
              <p className="text-white/80 text-base max-w-xl leading-relaxed md:text-lg">
                {heroData.openBreaks} of {heroData.totalBreaks} breaks live · Updated {heroLastUpdatedLabel}
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href={`/${heroData.best.id}`}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-on-primary px-6 py-2.5 text-sm font-bold text-primary transition hover:bg-white/90"
                >
                  Open {heroData.best.name}
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white/70 transition hover:text-white"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  How it works
                </Link>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="md:col-span-4 flex gap-4 justify-start md:justify-end pb-1">
              <div className="rounded-2xl p-5 text-white min-w-[120px]" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="block text-[0.6875rem] font-medium uppercase tracking-widest text-white/60 mb-1">Surf</span>
                <span className="block font-display text-3xl font-black tabular">{heroWaveSummary}</span>
              </div>
              <div className="rounded-2xl p-5 text-white min-w-[120px]" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="block text-[0.6875rem] font-medium uppercase tracking-widest text-white/60 mb-1">Period</span>
                <span className="block font-display text-3xl font-black tabular">{heroPeriodLabel}</span>
              </div>
              <div className="rounded-2xl p-5 text-white min-w-[120px]" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="block text-[0.6875rem] font-medium uppercase tracking-widest text-white/60 mb-1">Wind</span>
                <span className="block font-display text-3xl font-black tabular">{heroWindSpeedLabel}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Controls bar ── */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <FavoritesFilter showOnlyFavorites={showOnlyFavorites} onToggle={() => setShowOnlyFavorites(!showOnlyFavorites)} />
        <UnitToggle />
      </div>

      {/* ── Main 12-col grid: break cards + sidebar ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* Left: break cards (col-span-8) */}
        <div className="lg:col-span-8">
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

        {/* Right: sidebar (col-span-4) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Map widget */}
          {mapData && (
            <div className="rounded-2xl overflow-hidden bg-primary" style={{ background: 'linear-gradient(135deg, #001e40 0%, #1a60a4 100%)' }}>
              <div className="p-6 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-secondary-container" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <h3 className="font-display text-lg font-bold text-on-primary tracking-tight">Wave + Wind Map</h3>
                  <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-on-primary/70">Beta</span>
                </div>
              </div>
              <div className="h-[300px]">
                <MeteoMap gridData={mapData.gridData} breaks={mapData.breaks} initialBounds={mapData.bounds} height="100%" />
              </div>
            </div>
          )}

          {/* Forecaster's Note */}
          <div className="rounded-2xl bg-surface-container-low p-8" style={{ borderLeft: '4px solid #001e40' }}>
            <h3 className="font-display text-lg font-bold text-primary mb-4">Forecaster&apos;s Note</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed italic mb-6">
              &ldquo;Victorian surf is driven by Southern Ocean groundswells — the best sessions arrive after fronts clear, when SW energy fires the reefs and offshore winds groom the face. Watch the swell period more than the height.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-black">L</div>
              <div>
                <span className="block text-xs font-bold text-primary">LINEUP Intelligence</span>
                <span className="block text-[10px] text-outline">Victorian Coast</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          {heroData && (
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_20px_40px_rgba(0,30,64,0.06)]">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Live Feed</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Breaks reporting</span>
                  <span className="font-display font-bold text-primary tabular">{heroData.openBreaks}/{heroData.totalBreaks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Favorites tracked</span>
                  <span className="font-display font-bold text-primary tabular">{heroData.favoritesCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Last updated</span>
                  <span className="font-display font-bold text-primary tabular text-sm">{heroLastUpdatedLabel}</span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
