/**
 * Warm up surf reports for all breaks.
 * Run after deployment or when reports need to be seeded:
 *   npx tsx --env-file=.env.local scripts/warm-reports.ts
 */
import 'dotenv/config';
import { regenerateAllReports } from '../src/lib/claude/regenerate-reports';

regenerateAllReports().then(({ success, failed }) => {
  console.log(`Done. Success: ${success.join(', ') || 'none'}`);
  if (failed.length) console.log(`Failed: ${failed.join(', ')}`);
  process.exit(failed.length > 0 ? 1 : 0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
