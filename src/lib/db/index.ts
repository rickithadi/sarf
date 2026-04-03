import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Use global to prevent multiple connections during Next.js hot reload
const globalForDb = globalThis as unknown as {
  client: Sql | undefined;
};

const client =
  globalForDb.client ??
  postgres(connectionString, {
    max: 1, // Serverless: 1 connection per function invocation
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Required for Supabase connection pooler
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });

export type Database = typeof db;
