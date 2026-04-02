import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { breaks, observations, waves, weatherForecasts, tides } from '@/lib/db/schema';
import { desc, eq, gte, and, asc, lte } from 'drizzle-orm';
import { calculateWindQuality, degreesToCardinal, windQualityDescription } from '@/lib/breaks/wind-quality';
import { addDays } from 'date-fns';

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
    const fourteenDaysLater = addDays(now, 14);

    // Get latest observation
    const latestObs = await db.query.observations.findFirst({
      where: eq(observations.breakId, id),
      orderBy: [desc(observations.time)],
    });

    // Get current/next wave data
    const currentWave = await db.query.waves.findFirst({
      where: and(eq(waves.breakId, id), gte(waves.time, now)),
      orderBy: [asc(waves.time)],
    });

    // Get 14-day wave forecast
    const waveForecast = await db.query.waves.findMany({
      where: and(
        eq(waves.breakId, id),
        gte(waves.time, now),
        lte(waves.time, fourteenDaysLater)
      ),
      orderBy: [asc(waves.time)],
    });

    // Get 14-day weather forecast
    const weatherForecast = await db.query.weatherForecasts.findMany({
      where: and(
        eq(weatherForecasts.breakId, id),
        gte(weatherForecasts.time, now),
        lte(weatherForecasts.time, fourteenDaysLater)
      ),
      orderBy: [asc(weatherForecasts.time)],
    });

    // Get upcoming tides
    const upcomingTides = await db.query.tides.findMany({
      where: and(eq(tides.breakId, id), gte(tides.time, now)),
      orderBy: [asc(tides.time)],
      limit: 8,
    });

    // Calculate wind quality (pass wind speed to detect calm conditions)
    const windQuality = latestObs
      ? calculateWindQuality(latestObs.windDir, breakData.optimalWindDirection, latestObs.windSpeedKmh)
      : null;

    // Merge wave and weather forecast data by time
    const hourlyForecast = mergeHourlyData(waveForecast, weatherForecast, breakData.optimalWindDirection);

    // Get all breaks for nearby spots
    const allBreaks = await db.select().from(breaks);

    // Get current wave data for all breaks (for nearby spots display)
    const nearbySpots = await Promise.all(
      allBreaks
        .filter(b => b.id !== id)
        .map(async (b) => {
          const bWave = await db.query.waves.findFirst({
            where: and(eq(waves.breakId, b.id), gte(waves.time, now)),
            orderBy: [asc(waves.time)],
          });
          return {
            id: b.id,
            name: b.name,
            lat: b.lat,
            lng: b.lng,
            waveHeight: bWave?.waveHeight ?? null,
            wavePeriod: bWave?.wavePeriod ?? null,
          };
        })
    );

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
      hourlyForecast,
      tides: upcomingTides.map((t) => ({
        time: t.time,
        type: t.type,
        height: t.height,
      })),
      nearbySpots,
    });
  } catch (error) {
    console.error('API break detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Merge wave and weather forecast data by time
 */
function mergeHourlyData(
  waveData: Array<{
    time: Date;
    waveHeight: number | null;
    wavePeriod: number | null;
    waveDirection: number | null;
    swellWaveHeight: number | null;
    swellWavePeriod: number | null;
    swellWaveDirection: number | null;
  }>,
  weatherData: Array<{
    time: Date;
    windSpeed10m: number | null;
    windGusts10m: number | null;
    windDirection10m: number | null;
    precipitation: number | null;
  }>,
  optimalWindDirection: number
) {
  // Create a map of weather data by time
  const weatherMap = new Map<string, typeof weatherData[0]>();
  for (const w of weatherData) {
    weatherMap.set(w.time.toISOString(), w);
  }

  // Merge with wave data
  return waveData.map((wave) => {
    const weather = weatherMap.get(wave.time.toISOString());
    const windQuality = weather
      ? calculateWindQuality(weather.windDirection10m, optimalWindDirection, weather.windSpeed10m)
      : null;

    return {
      time: wave.time,
      waveHeight: wave.waveHeight,
      wavePeriod: wave.wavePeriod,
      waveDirection: wave.waveDirection,
      swellHeight: wave.swellWaveHeight,
      swellPeriod: wave.swellWavePeriod,
      swellDirection: wave.swellWaveDirection,
      windSpeed: weather?.windSpeed10m ?? null,
      windGust: weather?.windGusts10m ?? null,
      windDirection: weather?.windDirection10m ?? null,
      windQuality,
      precipitation: weather?.precipitation ?? null,
    };
  });
}
