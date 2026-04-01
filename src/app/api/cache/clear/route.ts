import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { breaks } from '@/lib/db/schema';
import { deleteCached, cacheKeys } from '@/lib/cache/redis';

export async function POST(request: NextRequest) {
  // Only allow in development or with auth
  const isDev = process.env.NODE_ENV === 'development';
  const isLocalhost = request.headers.get('host')?.includes('localhost');

  if (!isDev || !isLocalhost) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    // Get all breaks
    const allBreaks = await db.select({ id: breaks.id }).from(breaks);

    // Clear cache for each break
    const cleared: string[] = [];
    for (const b of allBreaks) {
      await deleteCached(cacheKeys.surfReport(b.id));
      await deleteCached(cacheKeys.conditions(b.id));
      cleared.push(b.id);
    }

    return NextResponse.json({
      message: 'Cache cleared',
      clearedBreaks: cleared,
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
