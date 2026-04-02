'use client';

import { useState } from 'react';
import { BreakCard } from '@/components/breaks/break-card';
import { FavoritesFilter, useFavorites } from '@/components/ui/favorites';
import { UnitToggle } from '@/components/ui/unit-toggle';
import type { WindQuality } from '@/lib/breaks/wind-quality';

interface BreakData {
  id: string;
  name: string;
  region: string;
  rating: number | null;
  currentConditions: {
    airTemp: number | null;
    windSpeedKmh: number | null;
    gustKmh: number | null;
    windDir: number | null;
    windQuality: WindQuality | null;
  } | null;
  waveData: {
    height: number | null;
    period: number | null;
  } | null;
}

interface HomePageClientProps {
  breaks: BreakData[];
}

export function HomePageClient({ breaks }: HomePageClientProps) {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const { isFavorite } = useFavorites();

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Victorian Surf Breaks</h1>
          <p className="mt-2 text-gray-600">
            Real-time surf conditions and AI-powered forecasts for Victoria&apos;s best breaks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FavoritesFilter
            showOnlyFavorites={showOnlyFavorites}
            onToggle={() => setShowOnlyFavorites(!showOnlyFavorites)}
          />
          <UnitToggle />
        </div>
      </div>

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
        <div className="space-y-8">
          {Object.entries(breaksByRegion).map(([region, regionBreaks]) => (
            <section key={region}>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">{region}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regionBreaks.map((b) => (
                  <BreakCard
                    key={b.id}
                    id={b.id}
                    name={b.name}
                    region={b.region}
                    rating={b.rating}
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
