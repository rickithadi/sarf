import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify cron request authorization
 * @param request - Next.js request object
 * @returns NextResponse with 401 if unauthorized, null if authorized
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  // Skip auth in development if no CRON_SECRET is set
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken && process.env.NODE_ENV === 'development') {
    console.warn('CRON_SECRET not set - skipping auth in development');
    return null;
  }

  const authHeader = request.headers.get('authorization');

  if (!expectedToken) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Helper to create cron response
 */
export function cronResponse(data: object, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
