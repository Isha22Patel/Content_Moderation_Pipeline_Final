import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/database/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { reviewer, finalAction, notes } = body || {};

  if (!reviewer?.trim()) {
    return NextResponse.json({ error: 'reviewer is required' }, { status: 400 });
  }
  if (!['allow', 'review', 'block'].includes(finalAction)) {
    return NextResponse.json({ error: 'finalAction must be allow | review | block' }, { status: 400 });
  }

  const record = await prisma.contentRecord.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

  const existing = await prisma.reviewOutcome.findUnique({ where: { recordId: id } });
  if (existing) return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });

  const overrodeAi = finalAction !== record.action;
  
  await prisma.reviewOutcome.create({
    data: {
      recordId: id,
      reviewer: reviewer.trim(),
      finalAction,
      overrodeAi,
      notes: notes || null,
      reviewedAt: new Date().toISOString(),
    }
  });

  const updatedRecord = await prisma.contentRecord.findUnique({ where: { id } });
  return NextResponse.json(updatedRecord);
}
