import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { observations, waves, weatherForecasts, tides, breaks } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  // Clear waves if ?clear=waves is passed
  const clear = request.nextUrl.searchParams.get('clear');
  if (clear === 'waves') {
    await db.delete(waves);
    return NextResponse.json({ message: 'Waves table cleared' });
  }

  // Test marine API directly if ?test=marine is passed
  const test = request.nextUrl.searchParams.get('test');
  if (test === 'marine') {
    const { fetchMarineForecast } = await import('@/lib/open-meteo/marine');
    const forecast = await fetchMarineForecast(-38.3686, 144.2811, 1);
    return NextResponse.json({
      count: forecast.length,
      sample: forecast.slice(0, 3).map(f => ({
        time: f.time,
        waveHeight: f.waveHeight,
        wavePeriod: f.wavePeriod,
        swellWaveHeight: f.swellWaveHeight,
        swellWavePeriod: f.swellWavePeriod,
      })),
    });
  }
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

  // 5. Sample wave data to check values (latest AND earliest)
  try {
    const latestWaves = await db.execute(sql`
      SELECT time, break_id, wave_height, wave_period, swell_wave_height, swell_wave_period
      FROM waves
      WHERE break_id = 'bells-beach'
      ORDER BY time DESC
      LIMIT 3
    `);
    const earliestWaves = await db.execute(sql`
      SELECT time, break_id, wave_height, wave_period, swell_wave_height, swell_wave_period
      FROM waves
      WHERE break_id = 'bells-beach'
      ORDER BY time ASC
      LIMIT 3
    `);
    const nonNullWaves = await db.execute(sql`
      SELECT time, break_id, wave_height, wave_period, swell_wave_height, swell_wave_period
      FROM waves
      WHERE break_id = 'bells-beach' AND wave_height IS NOT NULL
      LIMIT 3
    `);
    results.sampleWaves = { latest: latestWaves, earliest: earliestWaves, nonNull: nonNullWaves };
  } catch (e) {
    results.sampleWaves = { error: (e as Error).message };
  }

  // 6. Test simple insert (without ON CONFLICT)
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
