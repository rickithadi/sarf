import { HomePageClient } from './client';
import type { GridData } from '@/app/api/map/grid/route';

const VICTORIA_BOUNDS = {
  sw: [-42, 138] as [number, number],
  ne: [-34, 151] as [number, number],
};

async function getGridData(): Promise<GridData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/map/grid`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface BreakData {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  rating: number | null;
  reportGeneratedAt: string | null;
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
  const mapEnabled = process.env.NEXT_PUBLIC_ENABLE_MAP === 'true';
  const [breaks, gridData] = await Promise.all([getBreaks(), mapEnabled ? getGridData() : null]);

  const mapData =
    mapEnabled && gridData && process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      ? {
          gridData,
          breaks: breaks.map((b) => ({
            id: b.id,
            name: b.name,
            lat: b.lat,
            lng: b.lng,
          })),
          bounds: VICTORIA_BOUNDS,
        }
      : null;

  return <HomePageClient breaks={breaks} mapData={mapData} />;
}
