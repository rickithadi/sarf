import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { breaks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateSurfReport } from '@/lib/claude/report-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verify break exists
    const breakData = await db.query.breaks.findFirst({
      where: eq(breaks.id, id),
    });

    if (!breakData) {
      return NextResponse.json(
        { error: 'Break not found' },
        { status: 404 }
      );
    }

    // Generate report (uses 30-min cache)
    const report = await generateSurfReport(id);

    if (!report) {
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      breakId: id,
      breakName: breakData.name,
      report,
    });
  } catch (error) {
    console.error('API report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
