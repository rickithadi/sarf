import { notFound } from 'next/navigation';
import { BreakDetailClient } from './client';
import type { GridData } from '@/app/api/map/grid/route';
import { getTideConfidence } from '@/lib/claude/tide-confidence';

interface BreakDetail {
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
    windQuality: 'offshore' | 'cross-offshore' | 'cross-shore' | 'cross-onshore' | 'onshore' | null;
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
    windQuality: 'offshore' | 'cross-offshore' | 'cross-shore' | 'cross-onshore' | 'onshore' | null;
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
}

interface SurfReport {
  rating: number;
  headline: string;
  conditions: string;
  forecast: string;
  bestTime: string;
  generatedAt?: string;
}

async function getBreakDetail(breakId: string): Promise<BreakDetail | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/breaks/${breakId}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.error('Failed to fetch break:', res.statusText);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching break:', error);
    return null;
  }
}

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

async function getSurfReport(breakId: string): Promise<SurfReport | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    // Use no-store to always get fresh data from Redis cache
    const res = await fetch(`${baseUrl}/api/breaks/${breakId}/report`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch report:', res.statusText);
      return null;
    }

    const data = await res.json();
    return data.report;
  } catch (error) {
    console.error('Error fetching report:', error);
    return null;
  }
}

export default async function BreakDetailPage({
  params,
}: {
  params: Promise<{ breakId: string }>;
}) {
  const { breakId } = await params;
  const mapEnabled = process.env.NEXT_PUBLIC_ENABLE_MAP === 'true';
  const [detail, report, gridData] = await Promise.all([
    getBreakDetail(breakId),
    getSurfReport(breakId),
    mapEnabled ? getGridData() : null,
  ]);

  if (!detail) {
    notFound();
  }

  const tideConfidence = detail.tides && detail.tides.length > 0
    ? await getTideConfidence({
        breakId,
        breakName: detail.break.name,
        region: detail.break.region,
        tides: detail.tides,
      })
    : null;

  return (
    <BreakDetailClient
      detail={detail}
      report={report}
      gridData={gridData}
      tideConfidence={tideConfidence}
    />
  );
}
