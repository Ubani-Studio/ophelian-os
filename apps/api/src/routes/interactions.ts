/**
 * Random character-to-character interactions.
 *
 *   POST /interactions/spark        pick a random pair, generate one exchange,
 *                                   persist as memory episodes for both.
 *   POST /interactions/spark/:idA/:idB  same but with explicit pair.
 *
 * The simplest mechanic that turns the system from "ticks" into "a
 * world where characters talk to each other unprompted". A speaks
 * first; we capture A's message as an episode for both A and B
 * (so future B ticks reference it). A second call from B is the
 * reply and adds another episode pair.
 *
 * This is the foundation of "alive NPCs with memory": every
 * interaction becomes substrate for the next.
 */

import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { callLlm, hasLlmProvider } from '../lib/llm.js';

const RETENTION_DAYS = 30;

interface SparkBody {
  /** Optional bias for who speaks first. */
  initiatorId?: string;
  /** Optional bias for who receives. */
  recipientId?: string;
  /** Optional creative brief for the LLM. */
  context?: string;
  /** Filter to characters whose currentLocation matches (case-insensitive substring).
   *  When set, a random pair is picked from co-located characters. */
  atLocation?: string;
}

interface AtmosphericEventBody {
  location: string;
  kind?: 'atmospheric' | 'external' | 'scene_event';
  content?: string; // optional override; otherwise LLM-generated
  retentionDays?: number;
}

interface CharacterForInteraction {
  id: string;
  name: string;
  bio: string;
  authoredBy: string | null;
  tongue: unknown;
  voiceSamples: unknown;
  preoccupations: unknown;
  fixations: unknown;
  tensions: unknown;
}

function readArray<T = string>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

function pickRandom<T>(arr: T[]): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildInteractionPrompt(
  initiator: CharacterForInteraction,
  recipient: CharacterForInteraction,
  prevExchange: { speaker: string; text: string }[],
  brief?: string,
): { system: string; user: string } {
  const initiatorTongue = initiator.tongue as Record<string, unknown> | null;
  const initiatorIdioms = readArray<string>(initiatorTongue?.idioms);
  const initiatorPreoc = readArray<string>(initiator.preoccupations);
  const initiatorFix = readArray<string>(initiator.fixations);
  const initiatorVoice = readArray<string>(initiator.voiceSamples).slice(0, 2);

  const livePreoc = pickRandom(initiatorPreoc) ?? pickRandom(initiatorFix);

  const system = [
    `You are ${initiator.name}. You are NOT writing a generic AI response. ` +
      `You are writing a SHORT spontaneous message to ${recipient.name}. ` +
      `Speak in YOUR voice, your tongue, your contradictions. Not theirs.`,
    initiator.bio ? `## Bio\n${initiator.bio}` : '',
    initiatorTongue
      ? `## Tongue\n${JSON.stringify(initiatorTongue)}\n\nCODE-SWITCH RULE: drop into your dialect mid-sentence. Mix registers. Failure = sounding generic.`
      : '',
    initiatorIdioms.length > 0
      ? `## Idioms YOU MUST USE (drop ONE or TWO naturally — never all): ${initiatorIdioms.map((i) => `"${i}"`).join(', ')}`
      : '',
    livePreoc ? `## What is on your mind right now\n${livePreoc}\n\nLet it bleed through obliquely. Don't restate it.` : '',
    initiatorVoice.length > 0
      ? `## Voice samples (match cadence, do not quote)\n${initiatorVoice.map((s, i) => `--- Sample ${i + 1} ---\n${s}`).join('\n\n')}`
      : '',
    `## Recipient context\n${recipient.name}: ${recipient.bio || '(no bio)'}`,
    prevExchange.length > 0
      ? `## Recent exchange\n${prevExchange.map((m) => `${m.speaker}: ${m.text}`).join('\n')}\n\nThis informs what to say. Do not repeat. Move the conversation.`
      : '',
    `## Output rules`,
    `- 1-3 sentences. Spontaneous. As if dropping into ${recipient.name}'s DMs.`,
    `- No greeting. No sign-off. Start mid-thought.`,
    `- No therapist-speak. No balanced both-sides. No em-dashes.`,
    `- If you sound like Claude or ChatGPT, you have failed.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const user = brief
    ? `Brief: ${brief}\n\nWrite the message now. Output JUST the message text. No quotes, no preamble.`
    : `Write the message now. Output JUST the message text. No quotes, no preamble.`;

  return { system, user };
}

import { runSpark } from '../lib/spark.js';

export async function interactionRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /interactions/spark
  fastify.post<{ Body: SparkBody }>('/interactions/spark', async (request, reply) => {
    const body = request.body ?? {};

    if (!hasLlmProvider()) {
      return reply.status(503).send({
        error: 'llm_provider_not_configured',
        hint: 'set ANTHROPIC_API_KEY in .env',
      });
    }

    // Pick characters. If atLocation is set, restrict to co-located characters.
    let initiatorId = body.initiatorId;
    let recipientId = body.recipientId;
    if (!initiatorId || !recipientId) {
      const where = body.atLocation
        ? { currentLocation: { contains: body.atLocation, mode: 'insensitive' as const } }
        : {};
      const all = await prisma.character.findMany({
        where,
        select: { id: true, name: true, currentLocation: true },
      });
      if (all.length < 2) {
        return reply.status(400).send({
          error: 'need_at_least_two_characters',
          hint: body.atLocation
            ? `Only ${all.length} character(s) have currentLocation matching "${body.atLocation}". Set more characters' location.`
            : 'Need at least 2 characters in the system.',
        });
      }
      const shuffled = [...all].sort(() => Math.random() - 0.5);
      initiatorId = initiatorId ?? shuffled[0].id;
      recipientId =
        recipientId ?? (shuffled[0].id === initiatorId ? shuffled[1].id : shuffled[0].id);
      if (initiatorId === recipientId) {
        recipientId = shuffled.find((c) => c.id !== initiatorId)?.id;
        if (!recipientId) return reply.status(400).send({ error: 'cannot_pair_with_self' });
      }
    }

    try {
      const result = await runSpark({
        initiatorId: initiatorId!,
        recipientId: recipientId!,
        brief: body.context,
        forceLocation: body.atLocation,
      });
      return result;
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'character_not_found') {
        return reply.status(404).send({ error: 'character_not_found' });
      }
      if (msg === 'empty_llm_output') {
        return reply.status(502).send({ error: 'empty_llm_output' });
      }
      return reply.status(502).send({ error: 'llm_call_failed', detail: msg });
    }
  });

  // POST /locations/:location/atmospheric-event
  // Generate an ambient event at a place (weather, vibe, news headline,
  // a thing happening on the corner). Every character whose
  // currentLocation matches sees it in their next tick prompt.
  fastify.post<{ Params: { location: string }; Body: AtmosphericEventBody }>(
    '/locations/:location/atmospheric-event',
    async (request, reply) => {
      const location = decodeURIComponent(request.params.location);
      const body = request.body ?? ({ location } as AtmosphericEventBody);
      const kind = body.kind ?? 'atmospheric';
      const retentionDays = Math.max(1, Math.min(30, body.retentionDays ?? 3));
      const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

      let content = body.content?.trim();
      if (!content) {
        if (!hasLlmProvider()) {
          return reply.status(503).send({
            error: 'llm_provider_not_configured',
            hint: 'set ANTHROPIC_API_KEY OR provide explicit body.content',
          });
        }
        // Pull recent atmospheric events at this location for continuity.
        const recent = await prisma.locationEvent.findMany({
          where: { location, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 4,
        });
        const sys = [
          'You generate brief atmospheric / scene events at a place in 2026.',
          'Output ONE concrete sentence. Specific. Sensory. Concrete details over generic.',
          'Examples: "The rains came at 3pm and the market stopped. Lagos smells like wet concrete and frying."',
          '"There\'s a queue around the block at the new spot on Atlantic Road. Someone\'s playing Tems through a portable speaker."',
          'Avoid: weather report tone. Avoid: balanced descriptions. Avoid: generic atmospherics.',
        ].join('\n');
        const usr = [
          `Location: ${location}`,
          `Event kind: ${kind}`,
          recent.length > 0
            ? `Recent events here (don't repeat):\n${recent.map((e) => `- ${e.content}`).join('\n')}`
            : '',
          'Generate one new atmospheric event sentence. Output ONLY the sentence.',
        ]
          .filter(Boolean)
          .join('\n\n');
        try {
          const result = await callLlm({ system: sys, user: usr, maxTokens: 120, cacheSystem: false });
          content = result.text.trim().replace(/^["']|["']$/g, '');
        } catch (e) {
          return reply.status(502).send({ error: 'llm_call_failed', detail: (e as Error).message });
        }
      }

      const evt = await prisma.locationEvent.create({
        data: { location, kind, content: content!, expiresAt },
      });
      return { event: evt };
    },
  );

  // GET /locations/:location/events  recent events at a place
  fastify.get<{ Params: { location: string }; Querystring: { limit?: string } }>(
    '/locations/:location/events',
    async (request, _reply) => {
      const location = decodeURIComponent(request.params.location);
      const limit = Math.min(Number(request.query.limit ?? 30), 100);
      const events = await prisma.locationEvent.findMany({
        where: { location, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return { location, count: events.length, events };
    },
  );

  // GET /locations/:location/who-is-here
  fastify.get<{ Params: { location: string } }>(
    '/locations/:location/who-is-here',
    async (request, _reply) => {
      const location = decodeURIComponent(request.params.location);
      const characters = await prisma.character.findMany({
        where: { currentLocation: { contains: location, mode: 'insensitive' } },
        select: { id: true, name: true, avatarUrl: true, currentLocation: true },
      });
      return { location, count: characters.length, characters };
    },
  );

  // GET /locations  distinct locations across characters + events
  fastify.get('/locations', async (_request, _reply) => {
    const [charLocs, eventLocs] = await Promise.all([
      prisma.character.findMany({
        where: { currentLocation: { not: null } },
        select: { currentLocation: true },
      }),
      prisma.locationEvent.groupBy({
        by: ['location'],
        _count: { _all: true },
        where: { expiresAt: { gt: new Date() } },
      }),
    ]);
    const map = new Map<string, { characters: number; events: number }>();
    for (const c of charLocs) {
      const k = c.currentLocation as string;
      if (!k) continue;
      const m = map.get(k) ?? { characters: 0, events: 0 };
      m.characters++;
      map.set(k, m);
    }
    for (const e of eventLocs) {
      const m = map.get(e.location) ?? { characters: 0, events: 0 };
      m.events = e._count._all;
      map.set(e.location, m);
    }
    return {
      locations: Array.from(map.entries()).map(([location, stats]) => ({ location, ...stats })),
    };
  });
}
