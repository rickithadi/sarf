import { z } from 'zod';
import { getAnthropicClient } from './client';
import { SURF_REPORT_SYSTEM_PROMPT, SURF_REPORT_USER_PROMPT } from './prompts';
import { getCached, setCached, cacheKeys, cacheTTL } from '../cache/redis';
import { db } from '../db';
import { breaks, observations, waves, weatherForecasts, tides, reports } from '../db/schema';
import { eq, desc, asc, gte, and } from 'drizzle-orm';
import { calculateWindQuality, calculateSurfRating, degreesToCardinal, windQualityDescription } from '../breaks/wind-quality';
import { format } from 'date-fns';

const SurfReportSchema = z.object({
  headline: z.string(),
  conditions: z.string(),
  forecast: z.string(),
  bestTime: z.string(),
  bestConditions: z.string(),
});

export type SurfReportWithTimestamp = z.infer<typeof SurfReportSchema> & {
  rating: number;
  generatedAt: string;
};

export type SurfReport = z.infer<typeof SurfReportSchema> & {
  rating: number;
};

/**
 * Generate a surf report for a specific break
 * Uses Claude AI with 30-minute caching
 */
export async function generateSurfReport(breakId: string, force = false): Promise<SurfReportWithTimestamp | null> {
  const cacheKey = cacheKeys.surfReport(breakId);

  if (!force) {
    // Check cache first
    const cached = await getCached<SurfReportWithTimestamp>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss — check DB before calling Claude
    const existingReport = await db.query.reports.findFirst({
      where: eq(reports.breakId, breakId),
    });
    if (existingReport) {
      const fromDb: SurfReportWithTimestamp = {
        rating: existingReport.rating,
        headline: existingReport.headline,
        conditions: existingReport.conditions,
        forecast: existingReport.forecast,
        bestTime: existingReport.bestTime,
        bestConditions: existingReport.bestConditions,
        generatedAt: existingReport.generatedAt.toISOString(),
      };
      // Re-warm the cache
      await setCached(cacheKey, fromDb, cacheTTL.surfReport);
      return fromDb;
    }
  }

  // Fetch break data
  const breakData = await db.query.breaks.findFirst({
    where: eq(breaks.id, breakId),
  });

  if (!breakData) {
    console.error(`Break not found: ${breakId}`);
    return null;
  }

  const now = new Date();

  // Fetch latest observation
  const latestObservation = await db.query.observations.findFirst({
    where: eq(observations.breakId, breakId),
    orderBy: [desc(observations.time)],
  });

  // Fetch nearest upcoming wave data
  const latestWave = await db.query.waves.findFirst({
    where: and(
      eq(waves.breakId, breakId),
      gte(waves.time, now)
    ),
    orderBy: [asc(waves.time)],
  });

  // Fetch upcoming tides
  const upcomingTides = await db.query.tides.findMany({
    where: and(
      eq(tides.breakId, breakId),
      gte(tides.time, now)
    ),
    orderBy: [asc(tides.time)],
    limit: 4,
  });

  // Fetch wind forecast for next 12 hours
  const windForecast = await db.query.weatherForecasts.findMany({
    where: and(
      eq(weatherForecasts.breakId, breakId),
      gte(weatherForecasts.time, now)
    ),
    orderBy: [asc(weatherForecasts.time)],
    limit: 12,
  });

  // Calculate wind quality (pass wind speed to detect calm conditions)
  const currentWindQuality = latestObservation
    ? calculateWindQuality(latestObservation.windDir, breakData.optimalWindDirection, latestObservation.windSpeedKmh)
    : null;

  // Compute rating deterministically from conditions data (1-5)
  const computedRating = calculateSurfRating({
    windQuality: currentWindQuality,
    windSpeedKmh: latestObservation?.windSpeedKmh ?? null,
    waveHeight: latestWave?.waveHeight ?? null,
    wavePeriod: latestWave?.wavePeriod ?? null,
  }) ?? 3;

  // Build prompt data
  const promptData = {
    breakName: breakData.name,
    region: breakData.region,
    optimalWindDirection: degreesToCardinal(breakData.optimalWindDirection),
    breakType: breakData.breakType ?? null,
    currentConditions: {
      airTemp: latestObservation?.airTemp ?? null,
      windSpeedKmh: latestObservation?.windSpeedKmh ?? null,
      gustKmh: latestObservation?.gustKmh ?? null,
      windDirection: degreesToCardinal(latestObservation?.windDir),
      windQuality: windQualityDescription(currentWindQuality),
    },
    waveData: latestWave
      ? {
          height: latestWave.waveHeight,
          period: latestWave.wavePeriod,
          direction: degreesToCardinal(latestWave.waveDirection),
          swellHeight: latestWave.swellWaveHeight,
          swellPeriod: latestWave.swellWavePeriod,
        }
      : null,
    upcomingTides: upcomingTides.map((t) => ({
      time: format(t.time, 'h:mm a'),
      type: t.type,
      height: t.height,
    })),
    forecast: windForecast.map((f) => ({
      time: format(f.time, 'h:mm a'),
      windSpeed: f.windSpeed10m,
      windDirection: degreesToCardinal(f.windDirection10m),
      windQuality: windQualityDescription(
        calculateWindQuality(f.windDirection10m, breakData.optimalWindDirection, f.windSpeed10m)
      ),
    })),
  };

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SURF_REPORT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: SURF_REPORT_USER_PROMPT(promptData),
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('No text content in Claude response');
      return null;
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Claude response:', textContent.text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = SurfReportSchema.parse(parsed);

    const generatedAt = new Date();
    const reportWithTimestamp: SurfReportWithTimestamp = {
      ...validated,
      rating: computedRating,
      generatedAt: generatedAt.toISOString(),
    };

    // Persist to DB (upsert) and cache
    await db
      .insert(reports)
      .values({
        breakId,
        rating: computedRating,
        headline: validated.headline,
        conditions: validated.conditions,
        forecast: validated.forecast,
        bestTime: validated.bestTime,
        bestConditions: validated.bestConditions,
        generatedAt,
      })
      .onConflictDoUpdate({
        target: reports.breakId,
        set: {
          rating: computedRating,
          headline: validated.headline,
          conditions: validated.conditions,
          forecast: validated.forecast,
          bestTime: validated.bestTime,
          bestConditions: validated.bestConditions,
          generatedAt,
        },
      });

    await setCached(cacheKey, reportWithTimestamp, cacheTTL.surfReport);

    return reportWithTimestamp;
  } catch (error) {
    console.error('Failed to generate surf report:', error);
    return null;
  }
}
