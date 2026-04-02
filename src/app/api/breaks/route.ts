import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { breaks, observations, waves } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { calculateWindQuality } from '@/lib/breaks/wind-quality';
import { getCached, cacheKeys } from '@/lib/cache/redis';
import { SurfReportWithTimestamp } from '@/lib/claude/report-generator';

export async function GET() {
  try {
    // Fetch all breaks with their latest conditions
    const allBreaks = await db.select().from(breaks);

    const breaksWithRatings = await Promise.all(
      allBreaks.map(async (b) => {
        // Get latest observation
        const latestObs = await db.query.observations.findFirst({
          where: eq(observations.breakId, b.id),
          orderBy: [desc(observations.time)],
        });

        // Get latest wave data
        const latestWave = await db.query.waves.findFirst({
          where: eq(waves.breakId, b.id),
          orderBy: [desc(waves.time)],
        });

        // Calculate wind quality (pass wind speed to detect calm conditions)
        const windQuality = latestObs
          ? calculateWindQuality(latestObs.windDir, b.optimalWindDirection, latestObs.windSpeedKmh)
          : null;

        // Get Claude's rating from cached report (no fallback to calculated rating)
        let rating: number | null = null;
        let reportGeneratedAt: string | null = null;
        try {
          const cachedReport = await getCached<SurfReportWithTimestamp>(cacheKeys.surfReport(b.id));
          if (cachedReport?.rating) {
            rating = cachedReport.rating;
            reportGeneratedAt = cachedReport.generatedAt;
          }
        } catch {
          // Redis error - rating stays null
        }
        // No fallback to calculated rating - use Claude's rating or null

        return {
          id: b.id,
          name: b.name,
          region: b.region,
          lat: b.lat,
          lng: b.lng,
          rating: rating || null,
          reportGeneratedAt,
          currentConditions: latestObs
            ? {
                airTemp: latestObs.airTemp,
                windSpeedKmh: latestObs.windSpeedKmh,
                gustKmh: latestObs.gustKmh,
                windDir: latestObs.windDir,
                windQuality,
                updatedAt: latestObs.time,
              }
            : null,
          waveData: latestWave
            ? {
                height: latestWave.waveHeight,
                period: latestWave.wavePeriod,
                direction: latestWave.waveDirection,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      breaks: breaksWithRatings,
    });
  } catch (error) {
    console.error('API breaks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
