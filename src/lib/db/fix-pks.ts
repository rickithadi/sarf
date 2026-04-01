import 'dotenv/config';
import { db } from './index';
import { sql } from 'drizzle-orm';

async function fixPrimaryKeys() {
  console.log('Fixing missing primary keys...\n');

  // Check current state
  const constraints = await db.execute(sql`
    SELECT table_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name IN ('observations', 'waves', 'weather_forecasts')
    AND constraint_type = 'PRIMARY KEY'
  `);

  console.log('Current PRIMARY KEY constraints:', constraints);

  // Add primary keys if missing
  const tables = ['observations', 'weather_forecasts', 'waves'];

  for (const table of tables) {
    const hasPK = constraints.some((c: { table_name: string }) => c.table_name === table);

    if (!hasPK) {
      console.log(`Adding PRIMARY KEY to ${table}...`);
      try {
        await db.execute(sql.raw(`ALTER TABLE ${table} ADD PRIMARY KEY (time, break_id)`));
        console.log(`  ✓ Added PRIMARY KEY to ${table}`);
      } catch (e) {
        console.error(`  ✗ Failed to add PRIMARY KEY to ${table}:`, (e as Error).message);
      }
    } else {
      console.log(`  ✓ ${table} already has PRIMARY KEY`);
    }
  }

  console.log('\nDone! Verifying...');

  // Verify
  const after = await db.execute(sql`
    SELECT table_name, constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name IN ('observations', 'waves', 'weather_forecasts')
    AND constraint_type = 'PRIMARY KEY'
  `);

  console.log('PRIMARY KEY constraints after fix:', after);
  process.exit(0);
}

fixPrimaryKeys().catch((err) => {
  console.error('Fix failed:', err);
  process.exit(1);
});
