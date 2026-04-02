import { NextRequest } from 'next/server';
import { verifyCronAuth, cronResponse } from '@/lib/cron/auth';
import { db } from '@/lib/db';
import { breaks, weatherForecasts } from '@/lib/db/schema';
import { fetchWeatherForecast } from '@/lib/open-meteo/weather';
import { deleteCached, cacheKeys } from '@/lib/cache/redis';

export async function GET(request: NextRequest) {
  // Verify cron authentication
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    // Fetch all breaks
    const allBreaks = await db.select().from(breaks);

    const results: { breakId: string; success: boolean; count?: number; error?: string }[] = [];

    // Fetch weather forecast for each break
    for (const b of allBreaks) {
      const forecast = await fetchWeatherForecast(b.lat, b.lng, 14);

      if (forecast.length === 0) {
        results.push({ breakId: b.id, success: false, error: 'No forecast data' });
        continue;
      }

      try {
        // Insert all forecast points
        const values = forecast.map((f) => ({
          time: f.time,
          breakId: b.id,
          windSpeed10m: f.windSpeed10m,
          windGusts10m: f.windGusts10m,
          windDirection10m: f.windDirection10m,
          precipitation: f.precipitation,
        }));

        // Use upsert to handle duplicate timestamps
        for (const value of values) {
          await db
            .insert(weatherForecasts)
            .values(value)
            .onConflictDoUpdate({
              target: [weatherForecasts.time, weatherForecasts.breakId],
              set: {
                windSpeed10m: value.windSpeed10m,
                windGusts10m: value.windGusts10m,
                windDirection10m: value.windDirection10m,
                precipitation: value.precipitation,
              },
            });
        }

        results.push({ breakId: b.id, success: true, count: values.length });
      } catch (error) {
        results.push({
          breakId: b.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const totalPoints = results.reduce((sum, r) => sum + (r.count || 0), 0);

    // Clear report cache for successfully updated breaks
    const successfulBreaks = results.filter((r) => r.success).map((r) => r.breakId);
    for (const breakId of successfulBreaks) {
      await deleteCached(cacheKeys.surfReport(breakId));
    }

    return cronResponse({
      message: `Weather forecasts updated`,
      success: successCount,
      failed: failCount,
      totalPoints,
      cacheCleared: successfulBreaks.length,
      results,
    });
  } catch (error) {
    console.error('Cron weather error:', error);
    return cronResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
