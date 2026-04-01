import { NextRequest } from 'next/server';
import { verifyCronAuth, cronResponse } from '@/lib/cron/auth';
import { regenerateAllReports } from '@/lib/claude/regenerate-reports';

export async function GET(request: NextRequest) {
  // Verify cron authentication
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const { success, failed } = await regenerateAllReports();

    return cronResponse({
      message: 'Reports regenerated',
      success: success.length,
      failed: failed.length,
      successBreaks: success,
      failedBreaks: failed,
    });
  } catch (error) {
    console.error('Cron reports error:', error);
    return cronResponse(
      { error: 'Internal server error' },
      500
    );
  }
}
