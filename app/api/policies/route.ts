import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/database/prisma';

export async function GET() {
  const platforms = await prisma.platform.findMany({
    include: {
      categoryPolicies: true,
      customRules: true,
    },
    orderBy: { id: 'asc' },
  });

  const formatted = platforms.map((platform) => {
    const categories: Record<string, any> = {};
    for (const c of platform.categoryPolicies) {
      categories[c.category] = {
        enabled: c.enabled,
        reviewThreshold: c.reviewThreshold,
        autoActionThreshold: c.autoActionThreshold,
      };
    }
    return {
      id: platform.id,
      name: platform.name,
      description: platform.description,
      categories,
      customRules: platform.customRules,
    };
  });

  return NextResponse.json(formatted);
}
