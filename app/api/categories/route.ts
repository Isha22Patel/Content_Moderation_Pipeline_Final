import { NextResponse } from 'next/server';
import { HARM_CATEGORIES, CATEGORY_LABELS } from '../../../lib/moderation/constants';

export async function GET() {
  return NextResponse.json(
    HARM_CATEGORIES.map((id) => ({ id, label: CATEGORY_LABELS[id] }))
  );
}
