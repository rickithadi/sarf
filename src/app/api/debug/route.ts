import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { observations, waves, weatherForecasts, tides, breaks } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check TimescaleDB extension
  try {
    const ext = await db.execute(sql`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'timescaledb'
    `);
    results.timescaledb = ext.length > 0 ? { installed: true, version: ext[0]?.extversion } : { installed: false };
  } catch (e) {
    results.timescaledb = { installed: false, error: (e as Error).message };
  }

  // 2. Check which tables are hypertables
  try {
    const hypertables = await db.execute(sql`
      SELECT hypertable_name, num_chunks
      FROM timescaledb_information.hypertables
      WHERE hypertable_schema = 'public'
    `);
    results.hypertables = hypertables;
  } catch (e) {
    results.hypertables = { error: (e as Error).message };
  }

  // 3. Check table constraints (unique indexes needed for ON CONFLICT)
  try {
    const constraints = await db.execute(sql`
      SELECT tc.table_name, tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      AND tc.table_name IN ('observations', 'waves', 'weather_forecasts')
    `);
    results.constraints = constraints;
  } catch (e) {
    results.constraints = { error: (e as Error).message };
  }

  // 4. Row counts
  try {
    const breaksCount = await db.select({ count: sql<number>`count(*)` }).from(breaks);
    const obsCount = await db.select({ count: sql<number>`count(*)` }).from(observations);
    const wavesCount = await db.select({ count: sql<number>`count(*)` }).from(waves);
    const weatherCount = await db.select({ count: sql<number>`count(*)` }).from(weatherForecasts);
    const tidesCount = await db.select({ count: sql<number>`count(*)` }).from(tides);

    results.rowCounts = {
      breaks: breaksCount[0]?.count,
      observations: obsCount[0]?.count,
      waves: wavesCount[0]?.count,
      weatherForecasts: weatherCount[0]?.count,
      tides: tidesCount[0]?.count,
    };
  } catch (e) {
    results.rowCounts = { error: (e as Error).message };
  }

  // 5. Test simple insert (without ON CONFLICT)
  try {
    await db.insert(observations).values({
      time: new Date(),
      breakId: 'bells-beach',
      airTemp: 15.5,
      windSpeedKmh: 10,
      gustKmh: 15,
      windDir: 270,
      pressure: 1013,
      humidity: 80,
    });
    results.testSimpleInsert = { success: true };
  } catch (e) {
    results.testSimpleInsert = { success: false, error: (e as Error).message };
  }

  // 6. Test ON CONFLICT insert
  try {
    const testTime = new Date('2020-01-01T00:00:00Z');
    await db
      .insert(observations)
      .values({
        time: testTime,
        breakId: 'bells-beach',
        airTemp: 20,
        windSpeedKmh: 5,
        gustKmh: 10,
        windDir: 180,
        pressure: 1010,
        humidity: 70,
      })
      .onConflictDoUpdate({
        target: [observations.time, observations.breakId],
        set: { airTemp: 21 },
      });
    results.testOnConflict = { success: true };
  } catch (e) {
    results.testOnConflict = { success: false, error: (e as Error).message };
  }

  return NextResponse.json(results, { status: 200 });
}
