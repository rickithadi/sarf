import { NextRequest } from 'next/server';
import { verifyCronAuth, cronResponse } from '@/lib/cron/auth';
import { db } from '@/lib/db';
import { breaks, waves } from '@/lib/db/schema';
import { fetchMarineForecast } from '@/lib/open-meteo/marine';
import { deleteCached, cacheKeys } from '@/lib/cache/redis';

export async function GET(request: NextRequest) {
  // Verify cron authentication
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    // Fetch all breaks
    const allBreaks = await db.select().from(breaks);

    const results: { breakId: string; success: boolean; count?: number; error?: string }[] = [];

    // Fetch marine forecast for each break
    for (const b of allBreaks) {
      const forecast = await fetchMarineForecast(b.lat, b.lng, 3);

      if (forecast.length === 0) {
        results.push({ breakId: b.id, success: false, error: 'No marine data' });
        continue;
      }

      try {
        // Insert all forecast points
        const values = forecast.map((f) => ({
          time: f.time,
          breakId: b.id,
          waveHeight: f.waveHeight,
          wavePeriod: f.wavePeriod,
          waveDirection: f.waveDirection,
          swellWaveHeight: f.swellWaveHeight,
          swellWavePeriod: f.swellWavePeriod,
          swellWaveDirection: f.swellWaveDirection,
        }));

        // Use upsert to handle duplicate timestamps
        for (const value of values) {
          await db
            .insert(waves)
            .values(value)
            .onConflictDoUpdate({
              target: [waves.time, waves.breakId],
              set: {
                waveHeight: value.waveHeight,
                wavePeriod: value.wavePeriod,
                waveDirection: value.waveDirection,
                swellWaveHeight: value.swellWaveHeight,
                swellWavePeriod: value.swellWavePeriod,
                swellWaveDirection: value.swellWaveDirection,
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
      message: `Wave forecasts updated`,
      success: successCount,
      failed: failCount,
      totalPoints,
      cacheCleared: successfulBreaks.length,
      results,
    });
  } catch (error) {
    console.error('Cron waves error:', error);
    return cronResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
