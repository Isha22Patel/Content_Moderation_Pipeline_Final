import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/database/prisma';

export async function GET() {
  const records = await prisma.contentRecord.findMany({
    where: {
      routing: 'human_review',
      reviewOutcome: { is: null },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(records);
}
