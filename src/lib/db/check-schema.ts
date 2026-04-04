import 'dotenv/config';
import { db } from './index';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  console.log('Checking breaks table schema...');

  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'breaks'
      ORDER BY ordinal_position;
    `);

    console.log('Columns in breaks table:');
    for (const row of result) {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkSchema();
