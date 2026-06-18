import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await prisma.contentRecord.findUnique({
    where: { id },
  });
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  return NextResponse.json(record);
}
