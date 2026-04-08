import { db } from '../db';
import { breaks } from '../db/schema';
import { generateSurfReport } from './report-generator';
import { deleteCached, cacheKeys } from '../cache/redis';

/**
 * Regenerate all surf reports after data update
 * Clears cache first, then generates fresh reports
 */
export async function regenerateAllReports(): Promise<{
  success: string[];
  failed: string[];
}> {
  const allBreaks = await db.select({ id: breaks.id }).from(breaks);

  const success: string[] = [];
  const failed: string[] = [];

  for (const b of allBreaks) {
    try {
      // Clear existing cache
      await deleteCached(cacheKeys.surfReport(b.id));

      // Generate fresh report — force bypasses cache and DB to call Claude
      const report = await generateSurfReport(b.id, true);

      if (report) {
        success.push(b.id);
      } else {
        failed.push(b.id);
      }
    } catch (error) {
      console.error(`Failed to regenerate report for ${b.id}:`, error);
      failed.push(b.id);
    }
  }

  return { success, failed };
}
