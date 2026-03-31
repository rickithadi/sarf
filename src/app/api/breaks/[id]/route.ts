import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { breaks, observations, waves, tides } from '@/lib/db/schema';
import { desc, eq, gte, and } from 'drizzle-orm';
import { calculateWindQuality, degreesToCardinal, windQualityDescription } from '@/lib/breaks/wind-quality';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Fetch break
    const breakData = await db.query.breaks.findFirst({
      where: eq(breaks.id, id),
    });

    if (!breakData) {
      return NextResponse.json(
        { error: 'Break not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Get latest observation
    const latestObs = await db.query.observations.findFirst({
      where: eq(observations.breakId, id),
      orderBy: [desc(observations.time)],
    });

    // Get current/next wave data
    const currentWave = await db.query.waves.findFirst({
      where: and(eq(waves.breakId, id), gte(waves.time, now)),
      orderBy: [desc(waves.time)],
    });

    // Get upcoming tides
    const upcomingTides = await db.query.tides.findMany({
      where: and(eq(tides.breakId, id), gte(tides.time, now)),
      orderBy: [desc(tides.time)],
      limit: 4,
    });

    // Calculate wind quality
    const windQuality = latestObs
      ? calculateWindQuality(latestObs.windDir, breakData.optimalWindDirection)
      : null;

    return NextResponse.json({
      break: {
        id: breakData.id,
        name: breakData.name,
        region: breakData.region,
        lat: breakData.lat,
        lng: breakData.lng,
        optimalWindDirection: breakData.optimalWindDirection,
      },
      currentConditions: latestObs
        ? {
            airTemp: latestObs.airTemp,
            windSpeedKmh: latestObs.windSpeedKmh,
            gustKmh: latestObs.gustKmh,
            windDir: latestObs.windDir,
            windDirCardinal: degreesToCardinal(latestObs.windDir),
            windQuality,
            windQualityDescription: windQualityDescription(windQuality),
            pressure: latestObs.pressure,
            humidity: latestObs.humidity,
            updatedAt: latestObs.time,
          }
        : null,
      waveData: currentWave
        ? {
            height: currentWave.waveHeight,
            period: currentWave.wavePeriod,
            direction: currentWave.waveDirection,
            directionCardinal: degreesToCardinal(currentWave.waveDirection),
            swellHeight: currentWave.swellWaveHeight,
            swellPeriod: currentWave.swellWavePeriod,
            swellDirection: currentWave.swellWaveDirection,
            swellDirectionCardinal: degreesToCardinal(currentWave.swellWaveDirection),
            forecastTime: currentWave.time,
          }
        : null,
      tides: upcomingTides.map((t) => ({
        time: t.time,
        type: t.type,
        height: t.height,
      })),
    });
  } catch (error) {
    console.error('API break detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
