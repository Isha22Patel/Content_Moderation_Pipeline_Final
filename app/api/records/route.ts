import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/database/prisma';

export async function GET() {
  const records = await prisma.contentRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json(records);
}
