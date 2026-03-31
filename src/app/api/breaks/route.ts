import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { breaks, observations, waves } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { calculateWindQuality, windQualityScore } from '@/lib/breaks/wind-quality';

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

        // Calculate simple rating based on wind quality and wave height
        const windQuality = latestObs
          ? calculateWindQuality(latestObs.windDir, b.optimalWindDirection)
          : null;

        const windScore = windQualityScore(windQuality);

        // Simple rating: combine wind quality with wave presence
        let rating = windScore;
        if (latestWave?.waveHeight) {
          // Boost rating if there are decent waves (1-2m is ideal for most)
          if (latestWave.waveHeight >= 0.5 && latestWave.waveHeight <= 2.5) {
            rating = Math.min(5, rating + 1);
          } else if (latestWave.waveHeight < 0.3) {
            rating = Math.max(1, rating - 1);
          }
        }

        return {
          id: b.id,
          name: b.name,
          region: b.region,
          lat: b.lat,
          lng: b.lng,
          rating: rating || null,
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
