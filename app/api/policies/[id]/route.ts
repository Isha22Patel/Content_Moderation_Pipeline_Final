import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database/prisma';
import { HARM_CATEGORIES } from '../../../../lib/moderation/constants';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const platform = await prisma.platform.findUnique({
    where: { id },
    include: {
      categoryPolicies: true,
      customRules: true,
    },
  });

  if (!platform) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });

  const categories: Record<string, any> = {};
  for (const c of platform.categoryPolicies) {
    categories[c.category] = {
      enabled: c.enabled,
      reviewThreshold: c.reviewThreshold,
      autoActionThreshold: c.autoActionThreshold,
    };
  }

  return NextResponse.json({
    id: platform.id,
    name: platform.name,
    description: platform.description,
    categories,
    customRules: platform.customRules,
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, categories, customRules } = body || {};

  const platform = await prisma.platform.findUnique({ where: { id } });
  if (!platform) return NextResponse.json({ error: 'Platform not found' }, { status: 404 });

  try {
    if (name !== undefined) {
      await prisma.platform.update({
        where: { id },
        data: { name, description: description ?? '' },
      });
    }

    if (categories) {
      for (const cat of HARM_CATEGORIES) {
        const c = categories[cat];
        if (c) {
          const existing = await prisma.categoryPolicy.findFirst({
            where: { platformId: id, category: cat }
          });
          if (existing) {
             await prisma.categoryPolicy.update({
               where: { id: existing.id },
               data: {
                 enabled: Boolean(c.enabled),
                 reviewThreshold: c.reviewThreshold,
                 autoActionThreshold: c.autoActionThreshold
               }
             });
          }
        }
      }
    }

    if (customRules !== undefined) {
      await prisma.customRule.deleteMany({ where: { platformId: id } });
      const ops = customRules.map((rule: any) => {
        const rid = rule.id || \`rule_\${Date.now()}_\${Math.random().toString(36).slice(2, 5)}\`;
        return prisma.customRule.create({
          data: {
            id: rid,
            platformId: id,
            description: rule.description || '',
            contains: rule.contains,
            category: rule.category,
            action: rule.action,
          }
        });
      });
      await Promise.all(ops);
    }

    // Refetch and return
    const updated = await prisma.platform.findUnique({
      where: { id },
      include: { categoryPolicies: true, customRules: true },
    });

    const catObj: Record<string, any> = {};
    for (const c of updated!.categoryPolicies) {
      catObj[c.category] = {
        enabled: c.enabled,
        reviewThreshold: c.reviewThreshold,
        autoActionThreshold: c.autoActionThreshold,
      };
    }

    return NextResponse.json({
      id: updated!.id,
      name: updated!.name,
      description: updated!.description,
      categories: catObj,
      customRules: updated!.customRules,
    });

  } catch (err: any) {
    console.error('Policy update error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
