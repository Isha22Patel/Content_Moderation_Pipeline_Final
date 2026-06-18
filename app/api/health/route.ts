import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/database/prisma';

export async function GET() {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  return NextResponse.json({
    status: 'ok',
    database: dbStatus,
    groq: Boolean(process.env.GROQ_API_KEY) ? 'configured' : 'missing',
    ok: true, // legacy frontend compatibility
    model: process.env.MODERATION_MODEL || 'llama-3.3-70b-versatile',
    apiKeyConfigured: Boolean(process.env.GROQ_API_KEY),
  });
}
