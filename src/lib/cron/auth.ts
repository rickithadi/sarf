import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify cron request authorization
 * @param request - Next.js request object
 * @returns NextResponse with 401 if unauthorized, null if authorized
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

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
