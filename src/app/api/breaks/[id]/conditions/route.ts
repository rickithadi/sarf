import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { breaks, observations, weatherForecasts, waves } from '@/lib/db/schema';
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

    // Get recent observations (last 12 hours)
    const recentObservations = await db
      .select()
      .from(observations)
      .where(
        and(
          eq(observations.breakId, id),
          gte(observations.time, new Date(now.getTime() - 12 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(observations.time))
      .limit(24);

    // Get weather forecast (next 24 hours)
    const forecast = await db
      .select()
      .from(weatherForecasts)
      .where(
        and(
          eq(weatherForecasts.breakId, id),
          gte(weatherForecasts.time, now)
        )
      )
      .orderBy(desc(weatherForecasts.time))
      .limit(24);

    // Get wave forecast (next 24 hours)
    const waveForecast = await db
      .select()
      .from(waves)
      .where(
        and(
          eq(waves.breakId, id),
          gte(waves.time, now)
        )
      )
      .orderBy(desc(waves.time))
      .limit(24);

    // Format observations with wind quality
    const formattedObservations = recentObservations.map((obs) => ({
      time: obs.time,
      airTemp: obs.airTemp,
      windSpeedKmh: obs.windSpeedKmh,
      gustKmh: obs.gustKmh,
      windDir: obs.windDir,
      windDirCardinal: degreesToCardinal(obs.windDir),
      windQuality: calculateWindQuality(obs.windDir, breakData.optimalWindDirection),
      windQualityDescription: windQualityDescription(
        calculateWindQuality(obs.windDir, breakData.optimalWindDirection)
      ),
      pressure: obs.pressure,
      humidity: obs.humidity,
    }));

    // Format weather forecast with wind quality
    const formattedForecast = forecast.map((f) => ({
      time: f.time,
      windSpeed10m: f.windSpeed10m,
      windGusts10m: f.windGusts10m,
      windDirection10m: f.windDirection10m,
      windDirCardinal: degreesToCardinal(f.windDirection10m),
      windQuality: calculateWindQuality(f.windDirection10m, breakData.optimalWindDirection),
      windQualityDescription: windQualityDescription(
        calculateWindQuality(f.windDirection10m, breakData.optimalWindDirection)
      ),
      precipitation: f.precipitation,
    }));

    // Format wave forecast
    const formattedWaves = waveForecast.map((w) => ({
      time: w.time,
      waveHeight: w.waveHeight,
      wavePeriod: w.wavePeriod,
      waveDirection: w.waveDirection,
      waveDirCardinal: degreesToCardinal(w.waveDirection),
      swellHeight: w.swellWaveHeight,
      swellPeriod: w.swellWavePeriod,
      swellDirection: w.swellWaveDirection,
      swellDirCardinal: degreesToCardinal(w.swellWaveDirection),
    }));

    return NextResponse.json({
      breakId: id,
      breakName: breakData.name,
      optimalWindDirection: breakData.optimalWindDirection,
      observations: formattedObservations,
      weatherForecast: formattedForecast,
      waveForecast: formattedWaves,
    });
  } catch (error) {
    console.error('API conditions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
