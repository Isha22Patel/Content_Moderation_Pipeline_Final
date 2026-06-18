import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/database/prisma';
import { classify } from '../../../lib/moderation/classifier';
import { getPolicy, applyPolicy } from '../../../lib/policy-engine/engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, context } = body || {};

    if (!content?.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }
    if (!context?.platformId) {
      return NextResponse.json({ error: 'context.platformId is required' }, { status: 400 });
    }

    const policy = await getPolicy(context.platformId);
    if (!policy) {
      return NextResponse.json({ error: `Unknown platform "${context.platformId}"` }, { status: 400 });
    }

    const classification = await classify(content, context);
    const decision = applyPolicy(content, classification, policy);
    const id = `mod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const record = await prisma.contentRecord.create({
      data: {
        id,
        content,
        platformId: context.platformId,
        surface: context.surface || null,
        userHistory: context.userHistory || null,
        thread: JSON.stringify(context.thread || []),
        flags: JSON.stringify(classification.flags),
        overallReasoning: classification.overallReasoning,
        contextNotes: classification.contextNotes,
        modelUsed: classification.model,
        latencyMs: classification.latencyMs,
        action: decision.action,
        routing: decision.routing,
        perFlag: JSON.stringify(decision.perFlag),
        primaryFlag: decision.primaryFlag ? JSON.stringify(decision.primaryFlag) : null,
        decisionSummary: decision.summary,
        policyId: policy.id,
        policyName: policy.name,
        createdAt: now,
      },
    });

    return NextResponse.json(record);
  } catch (err: any) {
    console.error('Moderation error:', err.message);
    const status = /api key|groq_api_key|not configured/i.test(err.message) ? 400 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
