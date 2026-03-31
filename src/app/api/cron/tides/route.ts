import { NextRequest } from 'next/server';
import { verifyCronAuth, cronResponse } from '@/lib/cron/auth';
import { db } from '@/lib/db';
import { breaks, tides } from '@/lib/db/schema';
import { fetchWorldTides } from '@/lib/worldtides/client';
import { fetchBomTides } from '@/lib/bom/tides';
import { and, eq, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Verify cron authentication
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    // Fetch all breaks
    const allBreaks = await db.select().from(breaks);

    const results: { breakId: string; success: boolean; count?: number; error?: string }[] = [];

    // Fetch tide data for each break
    for (const b of allBreaks) {
      // Try BOM first, fall back to WorldTides
      let tideEvents = await fetchBomTides(b.id);

      if (tideEvents.length === 0) {
        // Fallback to WorldTides
        tideEvents = await fetchWorldTides(b.lat, b.lng, 7);
      }

      if (tideEvents.length === 0) {
        results.push({ breakId: b.id, success: false, error: 'No tide data' });
        continue;
      }

      try {
        // Insert tide events
        const values = tideEvents.map((t) => ({
          time: t.time,
          breakId: b.id,
          type: t.type,
          height: t.height,
        }));

        // Delete existing future tides for this break and insert new ones
        const now = new Date();
        await db.delete(tides).where(
          and(eq(tides.breakId, b.id), gte(tides.time, now))
        );

        for (const value of values) {
          await db
            .insert(tides)
            .values(value)
            .onConflictDoNothing();
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
    const totalEvents = results.reduce((sum, r) => sum + (r.count || 0), 0);

    return cronResponse({
      message: `Tide data updated`,
      success: successCount,
      failed: failCount,
      totalEvents,
      results,
    });
  } catch (error) {
    console.error('Cron tides error:', error);
    return cronResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
