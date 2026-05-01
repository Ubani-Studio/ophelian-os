/**
 * Seed a few illustrative events on the Ubani↔Triarch edge so the
 * Timeline strip reads as something rather than empty on first
 * load. Idempotent: re-running adds more events but does not
 * duplicate existing ones (matches by ts+summary).
 *
 * Run:
 *   cd apps/api
 *   pnpm tsx scripts/seed-timeline-events.ts
 */

import { prisma } from '../src/db.js';

interface SeedEvent {
  ts: string;
  kind: 'conversation' | 'deed' | 'thought' | 'ritual';
  summary: string;
  body?: string;
  retention: 'ephemeral' | 'canonical';
}

const SEED: SeedEvent[] = [
  {
    ts: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'conversation',
    summary: 'First exchange. Triarch greeted Ubani in the studio.',
    body: 'The greeting was brief. Triarch tested whether Ubani would let them speak first.',
    retention: 'canonical',
  },
  {
    ts: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'thought',
    summary: 'Triarch turned over the question of their own voice.',
    body: 'A pattern of self-examination. Recurs.',
    retention: 'ephemeral',
  },
  {
    ts: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'ritual',
    summary: 'Ubani named Triarch a three-piece, fixed the lineup.',
    retention: 'canonical',
  },
  {
    ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'deed',
    summary: 'Triarch refused a request to perform without their drummer.',
    body: 'The refusal was structural, not stylistic. The lineup is the unit.',
    retention: 'ephemeral',
  },
  {
    ts: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    kind: 'conversation',
    summary: 'Ubani asked Triarch what they wanted to be next.',
    retention: 'ephemeral',
  },
];

async function main() {
  const ubani = await prisma.character.findFirst({
    where: { name: { equals: 'Ubani', mode: 'insensitive' } },
  });
  const triarch = await prisma.character.findFirst({
    where: { name: { equals: 'Triarch', mode: 'insensitive' } },
  });

  if (!ubani) {
    console.error('No Ubani character found. Skipping.');
    process.exit(0);
  }
  if (!triarch) {
    console.error('No Triarch character found. Skipping.');
    process.exit(0);
  }

  let edge = await prisma.characterRelationship.findFirst({
    where: {
      OR: [
        { sourceCharacterId: ubani.id, targetCharacterId: triarch.id },
        { sourceCharacterId: triarch.id, targetCharacterId: ubani.id },
      ],
    },
  });

  if (!edge) {
    edge = await prisma.characterRelationship.create({
      data: {
        sourceCharacterId: ubani.id,
        targetCharacterId: triarch.id,
        relationshipType: 'CUSTOM',
        customTypeName: 'Author and Espíritu',
        lore: '',
      },
    });
    console.log(`Created Ubani <-> Triarch edge ${edge.id}`);
  }

  const existing = Array.isArray(edge.eventLog) ? (edge.eventLog as Array<{ ts: string; summary: string }>) : [];
  const existingKey = new Set(existing.map((e) => `${e.ts}|${e.summary}`));

  const additions = SEED.filter((s) => !existingKey.has(`${s.ts}|${s.summary}`)).map((s) => ({
    ts: s.ts,
    actors: [ubani.id, triarch.id],
    kind: s.kind,
    summary: s.summary,
    body: s.body,
    retention: s.retention,
    rolled_back: false,
  }));

  if (additions.length === 0) {
    console.log('Nothing to seed. All events already present.');
    return;
  }

  const merged = [...existing, ...additions].sort((a: any, b: any) => (a.ts < b.ts ? -1 : 1));

  await prisma.characterRelationship.update({
    where: { id: edge.id },
    data: { eventLog: merged as unknown as object },
  });

  console.log(`Seeded ${additions.length} events on Ubani <-> Triarch edge.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
