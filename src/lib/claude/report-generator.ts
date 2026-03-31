import { z } from 'zod';
import { getAnthropicClient } from './client';
import { SURF_REPORT_SYSTEM_PROMPT, SURF_REPORT_USER_PROMPT } from './prompts';
import { getCached, setCached, cacheKeys, cacheTTL } from '../cache/redis';
import { db } from '../db';
import { breaks, observations, waves, weatherForecasts, tides } from '../db/schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import { calculateWindQuality, degreesToCardinal, windQualityDescription } from '../breaks/wind-quality';
import { format } from 'date-fns';

const SurfReportSchema = z.object({
  rating: z.number().min(1).max(5),
  headline: z.string(),
  conditions: z.string(),
  forecast: z.string(),
  bestTime: z.string(),
});

export type SurfReport = z.infer<typeof SurfReportSchema>;

/**
 * Generate a surf report for a specific break
 * Uses Claude AI with 30-minute caching
 */
export async function generateSurfReport(breakId: string): Promise<SurfReport | null> {
  // Check cache first
  const cacheKey = cacheKeys.surfReport(breakId);
  const cached = await getCached<SurfReport>(cacheKey);
  if (cached) {
    return cached;
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

  // Fetch latest wave data
  const latestWave = await db.query.waves.findFirst({
    where: and(
      eq(waves.breakId, breakId),
      gte(waves.time, now)
    ),
    orderBy: [desc(waves.time)],
  });

  // Fetch upcoming tides
  const upcomingTides = await db.query.tides.findMany({
    where: and(
      eq(tides.breakId, breakId),
      gte(tides.time, now)
    ),
    orderBy: [desc(tides.time)],
    limit: 4,
  });

  // Fetch wind forecast for next 12 hours
  const windForecast = await db.query.weatherForecasts.findMany({
    where: and(
      eq(weatherForecasts.breakId, breakId),
      gte(weatherForecasts.time, now)
    ),
    orderBy: [desc(weatherForecasts.time)],
    limit: 12,
  });

  // Calculate wind quality
  const currentWindQuality = latestObservation
    ? calculateWindQuality(latestObservation.windDir, breakData.optimalWindDirection)
    : null;

  // Build prompt data
  const promptData = {
    breakName: breakData.name,
    region: breakData.region,
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
        calculateWindQuality(f.windDirection10m, breakData.optimalWindDirection)
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

    // Cache the result
    await setCached(cacheKey, validated, cacheTTL.surfReport);

    return validated;
  } catch (error) {
    console.error('Failed to generate surf report:', error);
    return null;
  }
}
