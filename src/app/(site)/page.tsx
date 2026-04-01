import { BreakCard } from '@/components/breaks/break-card';

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
    windQuality: 'offshore' | 'cross-offshore' | 'cross-shore' | 'cross-onshore' | 'onshore' | null;
  } | null;
  waveData: {
    height: number | null;
    period: number | null;
  } | null;
}

async function getBreaks(): Promise<BreakData[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/breaks`;

  console.log('[getBreaks] Fetching from:', url);

  try {
    const res = await fetch(url, {
      cache: 'no-store',
    });

    console.log('[getBreaks] Response status:', res.status);

    if (!res.ok) {
      console.error('[getBreaks] Failed:', res.statusText);
      return [];
    }

    const data = await res.json();
    console.log('[getBreaks] Got breaks:', data.breaks?.length, 'First break:', data.breaks?.[0]?.name);
    return data.breaks || [];
  } catch (error) {
    console.error('[getBreaks] Error:', error);
    return [];
  }
}

export default async function HomePage() {
  const breaks = await getBreaks();

  // Group breaks by region
  const breaksByRegion = breaks.reduce<Record<string, BreakData[]>>((acc, b) => {
    if (!acc[b.region]) {
      acc[b.region] = [];
    }
    acc[b.region].push(b);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Victorian Surf Breaks</h1>
        <p className="mt-2 text-gray-600">
          Real-time surf conditions and AI-powered forecasts for Victoria&apos;s best breaks.
        </p>
      </div>

      {breaks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">
            No surf break data available. Data will appear once the cron jobs have run.
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
