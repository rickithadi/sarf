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
    max: 10, // Maximum connections in pool
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });

export type Database = typeof db;
