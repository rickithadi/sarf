import { NextResponse } from 'next/server';
import { getCached, setCached, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import { fetchMarineForecast } from '@/lib/open-meteo/marine';
import { fetchWeatherForecast } from '@/lib/open-meteo/weather';

// Victorian Southern Ocean grid: lat -34 to -42, lng 138 to 151 (~1° spacing)
const LAT_START = -34;
const LAT_END = -42;
const LNG_START = 138;
const LNG_END = 151;
const SPACING = 1;

function buildGrid(): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  for (let lat = LAT_START; lat >= LAT_END; lat -= SPACING) {
    for (let lng = LNG_START; lng <= LNG_END; lng += SPACING) {
      points.push({ lat: Math.round(lat * 10) / 10, lng: Math.round(lng * 10) / 10 });
    }
  }
  return points;
}

export interface GridPoint {
  lat: number;
  lng: number;
  waveHeight: (number | null)[];
  waveDirection: (number | null)[];
  wavePeriod: (number | null)[];
  windSpeed: (number | null)[];
  windDirection: (number | null)[];
}

export interface GridData {
  generatedAt: string;
  hours: string[]; // ISO timestamps, every 3h for 7 days = 56 entries
  points: GridPoint[];
}

// Thin hourly arrays to every-3h to keep payload manageable
function thinToEvery3h<T>(arr: T[]): T[] {
  return arr.filter((_, i) => i % 3 === 0);
}

async function fetchGridData(): Promise<GridData> {
  const gridPoints = buildGrid();

  // Fetch marine + weather for all points in parallel (batched to avoid overwhelming)
  const BATCH_SIZE = 20;
  const results: GridPoint[] = [];
  let hours: string[] = [];

  for (let i = 0; i < gridPoints.length; i += BATCH_SIZE) {
    const batch = gridPoints.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async ({ lat, lng }) => {
        const [marine, weather] = await Promise.all([
          fetchMarineForecast(lat, lng, 7),
          fetchWeatherForecast(lat, lng, 7),
        ]);

        // Skip land points (all wave heights null)
        if (marine.length === 0 || marine.every(p => p.waveHeight === null)) {
          return null;
        }

        // Capture hours array once from the first valid point
        if (hours.length === 0 && marine.length > 0) {
          hours = thinToEvery3h(marine.map(p => p.time.toISOString()));
        }

        return {
          lat,
          lng,
          waveHeight: thinToEvery3h(marine.map(p => p.waveHeight)),
          waveDirection: thinToEvery3h(marine.map(p => p.waveDirection)),
          wavePeriod: thinToEvery3h(marine.map(p => p.wavePeriod)),
          windSpeed: thinToEvery3h(weather.map(p => p.windSpeed10m)),
          windDirection: thinToEvery3h(weather.map(p => p.windDirection10m)),
        };
      })
    );

    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    hours,
    points: results,
  };
}

export async function GET() {
  try {
    const cached = await getCached<GridData>(cacheKeys.mapGrid());
    if (cached) {
      return NextResponse.json(cached);
    }

    const data = await fetchGridData();
    await setCached(cacheKeys.mapGrid(), data, cacheTTL.mapGrid);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Grid API error:', error);
    return NextResponse.json({ error: 'Failed to fetch grid data' }, { status: 500 });
  }
}
