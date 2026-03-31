import { NextRequest } from 'next/server';
import { verifyCronAuth, cronResponse } from '@/lib/cron/auth';
import { db } from '@/lib/db';
import { breaks, observations } from '@/lib/db/schema';
import { fetchBomObservations } from '@/lib/bom/observations';
import { fetchCurrentConditions } from '@/lib/open-meteo/current';

export async function GET(request: NextRequest) {
  // Verify cron authentication
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    // Fetch all breaks
    const allBreaks = await db.select().from(breaks);

    // Group breaks by BOM station ID to avoid duplicate fetches
    const stationBreaks = new Map<string, typeof allBreaks>();
    for (const b of allBreaks) {
      const existing = stationBreaks.get(b.bomStationId) || [];
      existing.push(b);
      stationBreaks.set(b.bomStationId, existing);
    }

    const results: { breakId: string; success: boolean; source?: string; error?: string }[] = [];

    // Try BOM first for each station group
    for (const [stationId, breakList] of Array.from(stationBreaks.entries())) {
      const bomObservation = await fetchBomObservations(stationId);

      if (bomObservation) {
        // BOM succeeded - insert for all breaks using this station
        for (const b of breakList) {
          try {
            const values = {
              time: bomObservation.time,
              breakId: b.id,
              airTemp: bomObservation.airTemp,
              windSpeedKmh: bomObservation.windSpeedKmh,
              gustKmh: bomObservation.gustKmh,
              windDir: bomObservation.windDir,
              pressure: bomObservation.pressure,
              humidity: bomObservation.humidity,
            };
            await db
              .insert(observations)
              .values(values)
              .onConflictDoUpdate({
                target: [observations.time, observations.breakId],
                set: {
                  airTemp: values.airTemp,
                  windSpeedKmh: values.windSpeedKmh,
                  gustKmh: values.gustKmh,
                  windDir: values.windDir,
                  pressure: values.pressure,
                  humidity: values.humidity,
                },
              });
            results.push({ breakId: b.id, success: true, source: 'bom' });
          } catch (error) {
            results.push({
              breakId: b.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      } else {
        // BOM failed - fall back to Open-Meteo per break
        for (const b of breakList) {
          const openMeteoObs = await fetchCurrentConditions(b.lat, b.lng);

          if (!openMeteoObs) {
            results.push({ breakId: b.id, success: false, error: 'Both BOM and Open-Meteo failed' });
            continue;
          }

          try {
            const values = {
              time: openMeteoObs.time,
              breakId: b.id,
              airTemp: openMeteoObs.airTemp,
              windSpeedKmh: openMeteoObs.windSpeedKmh,
              gustKmh: openMeteoObs.gustKmh,
              windDir: openMeteoObs.windDir,
              pressure: openMeteoObs.pressure,
              humidity: openMeteoObs.humidity,
            };
            await db
              .insert(observations)
              .values(values)
              .onConflictDoUpdate({
                target: [observations.time, observations.breakId],
                set: {
                  airTemp: values.airTemp,
                  windSpeedKmh: values.windSpeedKmh,
                  gustKmh: values.gustKmh,
                  windDir: values.windDir,
                  pressure: values.pressure,
                  humidity: values.humidity,
                },
              });
            results.push({ breakId: b.id, success: true, source: 'open-meteo' });
          } catch (error) {
            results.push({
              breakId: b.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return cronResponse({
      message: `Observations updated`,
      success: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error('Cron observations error:', error);
    return cronResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
