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
      next: { revalidate: 600 },
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

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.breaks || [];
  } catch {
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
