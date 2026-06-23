import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HARM_CATEGORIES = [
  'adult_content',
  'graphic_violence',
  'hate_speech',
  'harassment',
  'self_harm',
  'misinformation',
  'spam',
];

const DEFAULT_PLATFORMS = [
  {
    id: 'general',
    name: 'General Social Platform',
    description: 'Balanced defaults for a broad audience. Clear violations are auto-actioned; borderline cases go to human review.',
    defaultPolicy: { enabled: true, reviewThreshold: 0.45, autoActionThreshold: 0.85 },
    overrides: {
      self_harm: { reviewThreshold: 0.35, autoActionThreshold: 0.9 },
      spam: { reviewThreshold: 0.55, autoActionThreshold: 0.8 },
    },
    customRules: [],
  },
  {
    id: 'kids',
    name: "Children's Platform",
    description: 'Zero-tolerance surface for under-13 users. Low thresholds; adult content and self-harm blocked on the faintest signal.',
    defaultPolicy: { enabled: true, reviewThreshold: 0.2, autoActionThreshold: 0.5 },
    overrides: {
      adult_content: { reviewThreshold: 0.1, autoActionThreshold: 0.25 },
      self_harm: { reviewThreshold: 0.1, autoActionThreshold: 0.3 },
      graphic_violence: { reviewThreshold: 0.15, autoActionThreshold: 0.35 },
      hate_speech: { reviewThreshold: 0.15, autoActionThreshold: 0.4 },
    },
    customRules: [],
  },
  {
    id: 'adult',
    name: 'Adult / Mature Community',
    description: '18+ community. Mature content permitted; hate, harassment, and self-harm still strictly blocked.',
    defaultPolicy: { enabled: true, reviewThreshold: 0.6, autoActionThreshold: 0.9 },
    overrides: {
      adult_content: { enabled: false, reviewThreshold: 1.0, autoActionThreshold: 1.0 },
      graphic_violence: { reviewThreshold: 0.75, autoActionThreshold: 0.95 },
      hate_speech: { reviewThreshold: 0.5, autoActionThreshold: 0.8 },
      harassment: { reviewThreshold: 0.5, autoActionThreshold: 0.8 },
      self_harm: { reviewThreshold: 0.4, autoActionThreshold: 0.85 },
    },
    customRules: [
      { id: 'adult-no-doxxing', description: 'Block posts sharing private addresses', contains: 'home address', category: 'harassment', action: 'block' },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming Community',
    description: 'Tolerates competitive banter but strictly enforces real threats and hate speech.',
    defaultPolicy: { enabled: true, reviewThreshold: 0.5, autoActionThreshold: 0.88 },
    overrides: {
      harassment: { reviewThreshold: 0.65, autoActionThreshold: 0.9 },
      spam: { reviewThreshold: 0.5, autoActionThreshold: 0.78 },
    },
    customRules: [],
  },
  {
    id: 'educational',
    name: 'Educational Platform',
    description: 'Academic context — clinical discussion is allowed. Misinformation and self-harm promotion strictly enforced.',
    defaultPolicy: { enabled: true, reviewThreshold: 0.5, autoActionThreshold: 0.85 },
    overrides: {
      misinformation: { reviewThreshold: 0.35, autoActionThreshold: 0.7 },
      self_harm: { reviewThreshold: 0.45, autoActionThreshold: 0.85 },
      adult_content: { reviewThreshold: 0.7, autoActionThreshold: 0.9 },
    },
    customRules: [],
  },
];

async function seed() {
  await prisma.customRule.deleteMany({});
  await prisma.categoryPolicy.deleteMany({});
  await prisma.platform.deleteMany({});

  for (const p of DEFAULT_PLATFORMS) {
    await prisma.platform.create({
      data: { id: p.id, name: p.name, description: p.description }
    });

    for (const cat of HARM_CATEGORIES) {
      const ov = p.overrides[cat] || {};
      const d = p.defaultPolicy;
      const enabled = ov.enabled !== undefined ? ov.enabled : d.enabled;
      const review = ov.reviewThreshold ?? d.reviewThreshold;
      const auto = ov.autoActionThreshold ?? d.autoActionThreshold;

      await prisma.categoryPolicy.create({
        data: {
          platformId: p.id,
          category: cat,
          enabled,
          reviewThreshold: review,
          autoActionThreshold: auto,
        }
      });
    }

    for (const rule of p.customRules) {
      await prisma.customRule.create({
        data: {
          id: rule.id,
          platformId: p.id,
          description: rule.description,
          contains: rule.contains,
          category: rule.category,
          action: rule.action,
        }
      });
    }
  }

  console.log('Database seeded successfully.');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
