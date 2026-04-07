import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Creating reports table...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "reports" (
      "break_id" text PRIMARY KEY NOT NULL,
      "rating" integer NOT NULL,
      "headline" text NOT NULL,
      "conditions" text NOT NULL,
      "forecast" text NOT NULL,
      "best_time" text NOT NULL,
      "best_conditions" text NOT NULL,
      "generated_at" timestamp with time zone NOT NULL
    )
  `);

  // Add FK only if it doesn't already exist
  const fkExists = await db.execute(sql`
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_break_id_breaks_id_fk'
      AND table_name = 'reports'
  `);
  if (!fkExists.length) {
    await db.execute(sql`
      ALTER TABLE "reports"
        ADD CONSTRAINT "reports_break_id_breaks_id_fk"
        FOREIGN KEY ("break_id") REFERENCES "public"."breaks"("id")
        ON DELETE no action ON UPDATE no action
    `);
  }

  const cols = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'reports' ORDER BY ordinal_position
  `);
  console.log('Columns:', cols.map((r: Record<string, unknown>) => r.column_name));
  console.log('Done.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
