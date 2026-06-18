import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/database/prisma';

export async function GET() {
  const overrides = await prisma.reviewOutcome.findMany({
    where: { overrodeAi: true },
    orderBy: { reviewedAt: 'desc' },
    include: { record: true },
  });

  return NextResponse.json(overrides.map((r) => ({
    recordId: r.recordId,
    content: r.record.content,
    platformId: r.record.platformId,
    aiAction: r.record.action,
    humanAction: r.finalAction,
    notes: r.notes,
    reviewedAt: r.reviewedAt,
  })));
}
