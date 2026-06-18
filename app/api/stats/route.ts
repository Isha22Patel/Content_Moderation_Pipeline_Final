import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/database/prisma';

export async function GET() {
  const totalProcessed = await prisma.contentRecord.count();
  const autoAllowed = await prisma.contentRecord.count({ where: { routing: 'auto_allow' } });
  const autoBlocked = await prisma.contentRecord.count({ where: { routing: 'auto_block' } });
  const pendingReview = await prisma.contentRecord.count({
    where: { routing: 'human_review', reviewOutcome: null }
  });
  const reviewed = await prisma.reviewOutcome.count();
  const humanOverrides = await prisma.reviewOutcome.count({ where: { overrodeAi: true } });
  
  const aiHumanAgreement = reviewed === 0 ? null : Math.round(((reviewed - humanOverrides) / reviewed) * 100) / 100;

  return NextResponse.json({
    totalProcessed,
    autoAllowed,
    autoBlocked,
    pendingReview,
    reviewed,
    humanOverrides,
    aiHumanAgreement,
  });
}
