import { HomePageClient } from './client';

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

  return <HomePageClient breaks={breaks} />;
}
