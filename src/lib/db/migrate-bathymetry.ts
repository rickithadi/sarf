/**
 * Migration script to add bathymetry columns to the breaks table.
 *
 * Usage:
 *   npx tsx src/lib/db/migrate-bathymetry.ts
 *
 * This script loads env vars from .env.local first, then .env as fallback
 * to match Next.js behavior.
 */
import dotenv from 'dotenv';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Load env files in Next.js order
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

console.log('Connecting to database...');
console.log('URL prefix:', connectionString.substring(0, 30) + '...');

const client = postgres(connectionString, {
  max: 1,
  connect_timeout: 10,
  prepare: false,
});

const db = drizzle(client);

async function migrate() {
  console.log('Adding bathymetry columns to breaks table...');

  try {
    // Add columns if they don't exist
    await db.execute(sql`
      ALTER TABLE breaks ADD COLUMN IF NOT EXISTS break_type text;
    `);
    console.log('Added break_type column');

    await db.execute(sql`
      ALTER TABLE breaks ADD COLUMN IF NOT EXISTS wave_amplification double precision;
    `);
    console.log('Added wave_amplification column');

    await db.execute(sql`
      ALTER TABLE breaks ADD COLUMN IF NOT EXISTS bathymetry json;
    `);
    console.log('Added bathymetry column');

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

migrate();
