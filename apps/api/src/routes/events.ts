import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { z } from 'zod';
import { decideTick, type Decision, TickThrottledError } from '../lib/tick.js';
import { LlmBudgetError } from '../lib/llm.js';
import { POST_FORMS, type PostForm } from '../lib/post-forms.js';

// Phase 2 of agentic-build.md: memory tending. Events are stored on
// CharacterRelationship.eventLog as an append-only JSON array. Each
// entry shape:
//
//   {
//     ts: ISO8601,
//     actors: [characterId, ...],
//     kind: 'conversation' | 'deed' | 'thought' | 'ritual',
//     summary: string,
//     body?: string,
//     retention: 'ephemeral' | 'canonical',
//     rolled_back: boolean
//   }
//
// Ephemeral entries auto-prune after 90 days. Canonical persists
// until the user demotes them. The bóveda altar is curated, not
// accumulated.

const EPHEMERAL_TTL_MS = 90 * 24 * 60 * 60 * 1000;

type EventKind = 'conversation' | 'deed' | 'thought' | 'ritual';
type Retention = 'ephemeral' | 'canonical';

interface EventEntry {
  ts: string;
  actors: string[];
  kind: EventKind;
  summary: string;
  body?: string;
  retention: Retention;
  rolled_back: boolean;
}

const EventKindSchema = z.enum(['conversation', 'deed', 'thought', 'ritual']);
const RetentionSchema = z.enum(['ephemeral', 'canonical']);

const CreateEventSchema = z.object({
  ts: z.string().datetime().optional(),
  actors: z.array(z.string()).min(1),
  kind: EventKindSchema.default('conversation'),
  summary: z.string().min(1),
  body: z.string().optional(),
  retention: RetentionSchema.default('ephemeral'),
});

const PatchEventSchema = z.object({
  retention: RetentionSchema.optional(),
  rolled_back: z.boolean().optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
});

const CrystalliseSchema = z.object({
  fromTs: z.string().datetime(),
  toTs: z.string().datetime(),
  summary: z.string().min(1),
  body: z.string().optional(),
});

function readLog(raw: unknown): EventEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw as EventEntry[];
}

export async function eventRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /characters/:id/events — aggregate timeline for a character.
  // Walks every CharacterRelationship the character is part of and
  // pulls events where the character is an actor. Sorted newest first.
  fastify.get<{
    Params: { id: string };
    Querystring: { limit?: string; includeRolledBack?: string };
  }>('/characters/:id/events', async (request, reply) => {
    const { id } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 200;
    const includeRolledBack = request.query.includeRolledBack === 'true';

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) {
      return reply.code(404).send({ error: 'Character not found' });
    }

    const edges = await prisma.characterRelationship.findMany({
      where: {
        OR: [{ sourceCharacterId: id }, { targetCharacterId: id }],
      },
    });

    const aggregated: Array<EventEntry & { edgeId: string; counterpartId: string }> = [];
    for (const edge of edges) {
      const log = readLog(edge.eventLog);
      const counterpartId =
        edge.sourceCharacterId === id ? edge.targetCharacterId : edge.sourceCharacterId;
      for (const ev of log) {
        if (!ev || typeof ev !== 'object') continue;
        if (!Array.isArray(ev.actors) || !ev.actors.includes(id)) continue;
        if (!includeRolledBack && ev.rolled_back) continue;
        aggregated.push({ ...ev, edgeId: edge.id, counterpartId });
      }
    }

    aggregated.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return reply.send(aggregated.slice(0, limit));
  });

  // POST /relationships/:id/events — append an event to an edge log.
  fastify.post<{ Params: { id: string } }>(
    '/relationships/:id/events',
    async (request, reply) => {
      const { id } = request.params;
      const body = CreateEventSchema.parse(request.body);

      const edge = await prisma.characterRelationship.findUnique({ where: { id } });
      if (!edge) return reply.code(404).send({ error: 'Relationship not found' });

      const log = readLog(edge.eventLog);
      const entry: EventEntry = {
        ts: body.ts ?? new Date().toISOString(),
        actors: body.actors,
        kind: body.kind,
        summary: body.summary,
        body: body.body,
        retention: body.retention,
        rolled_back: false,
      };
      log.push(entry);

      await prisma.characterRelationship.update({
        where: { id },
        data: { eventLog: log as unknown as object },
      });

      return reply.code(201).send(entry);
    }
  );

  // PATCH /relationships/:id/events/:ts — toggle retention or
  // mark as rolled_back. Edits in place, since this is the sole
  // hand-editable surface for the curated altar.
  fastify.patch<{ Params: { id: string; ts: string } }>(
    '/relationships/:id/events/:ts',
    async (request, reply) => {
      const { id, ts } = request.params;
      const body = PatchEventSchema.parse(request.body);
      const decodedTs = decodeURIComponent(ts);

      const edge = await prisma.characterRelationship.findUnique({ where: { id } });
      if (!edge) return reply.code(404).send({ error: 'Relationship not found' });

      const log = readLog(edge.eventLog);
      const idx = log.findIndex((ev) => ev?.ts === decodedTs);
      if (idx === -1) return reply.code(404).send({ error: 'Event not found' });

      const existing = log[idx];
      log[idx] = {
        ...existing,
        ...(body.retention !== undefined ? { retention: body.retention } : {}),
        ...(body.rolled_back !== undefined ? { rolled_back: body.rolled_back } : {}),
        ...(body.summary !== undefined ? { summary: body.summary } : {}),
        ...(body.body !== undefined ? { body: body.body } : {}),
      };

      await prisma.characterRelationship.update({
        where: { id },
        data: { eventLog: log as unknown as object },
      });

      return reply.send(log[idx]);
    }
  );

  // POST /relationships/:id/events/crystallise — compress a span
  // [fromTs, toTs] into a single canonical summary entry. The
  // contributing events stay in the log marked rolled_back: true so
  // a future operator can audit the compression without losing
  // provenance. The crystal itself is canonical retention.
  fastify.post<{ Params: { id: string } }>(
    '/relationships/:id/events/crystallise',
    async (request, reply) => {
      const { id } = request.params;
      const body = CrystalliseSchema.parse(request.body);

      const edge = await prisma.characterRelationship.findUnique({ where: { id } });
      if (!edge) return reply.code(404).send({ error: 'Relationship not found' });

      const log = readLog(edge.eventLog);
      const inSpan = log.filter(
        (ev) => ev && ev.ts >= body.fromTs && ev.ts <= body.toTs && !ev.rolled_back
      );
      if (inSpan.length === 0) {
        return reply.code(400).send({ error: 'No active events in span' });
      }

      const actorSet = new Set<string>();
      for (const ev of inSpan) for (const a of ev.actors) actorSet.add(a);

      const updated = log.map((ev) =>
        ev && ev.ts >= body.fromTs && ev.ts <= body.toTs && !ev.rolled_back
          ? { ...ev, rolled_back: true }
          : ev
      );

      const crystal: EventEntry = {
        ts: new Date().toISOString(),
        actors: Array.from(actorSet),
        kind: 'ritual',
        summary: body.summary,
        body:
          body.body ??
          `Crystallised ${inSpan.length} events from ${body.fromTs} to ${body.toTs}.`,
        retention: 'canonical',
        rolled_back: false,
      };
      updated.push(crystal);

      await prisma.characterRelationship.update({
        where: { id },
        data: { eventLog: updated as unknown as object },
      });

      return reply.code(201).send({ crystal, compressedCount: inSpan.length });
    }
  );

  // PATCH /characters/:id/goals — set the goals array for an
  // espíritu / twin. Goals shape into the tick prompt.
  fastify.patch<{ Params: { id: string } }>('/characters/:id/goals', async (request, reply) => {
    const { id } = request.params;
    const body = z.object({ goals: z.array(z.string()) }).parse(request.body);

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return reply.code(404).send({ error: 'Character not found' });

    const updated = await prisma.character.update({
      where: { id },
      data: { goals: body.goals as unknown as object },
    });
    return reply.send({ id: updated.id, goals: updated.goals });
  });

  // POST /characters/:id/tick — run one autonomous tick for an
  // espíritu (or twin). Reads goals + recent eventLog memories +
  // neighbour graph, asks an LLM what they do next, persists the
  // result as an ephemeral entry on the appropriate edge.
  //
  // Manual / relic characters refuse to tick — they are not
  // autonomous by design.
  fastify.post<{ Params: { id: string }; Querystring: { form?: string } }>(
    '/characters/:id/tick',
    async (request, reply) => {
    const { id } = request.params;
    const forceFormRaw = request.query?.form;

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return reply.code(404).send({ error: 'Character not found' });

    if (character.mode !== 'espíritu' && character.mode !== 'twin') {
      return reply.code(400).send({
        error: `Cannot tick a ${character.mode} character. Only espíritu and twin act autonomously.`,
      });
    }

    const edges = await prisma.characterRelationship.findMany({
      where: {
        OR: [{ sourceCharacterId: id }, { targetCharacterId: id }],
      },
    });

    const counterpartIds = Array.from(
      new Set(
        edges.map((e) => (e.sourceCharacterId === id ? e.targetCharacterId : e.sourceCharacterId))
      )
    );
    const neighbours = await prisma.character.findMany({
      where: { id: { in: counterpartIds } },
      select: { id: true, name: true, mode: true },
    });
    const neighbourById = new Map(neighbours.map((n) => [n.id, n]));

    const recentEvents: Array<{ ts: string; kind: string; summary: string; counterpartName?: string }> = [];
    for (const edge of edges) {
      const log = readLog(edge.eventLog);
      const counterpartId =
        edge.sourceCharacterId === id ? edge.targetCharacterId : edge.sourceCharacterId;
      const counterpartName = neighbourById.get(counterpartId)?.name;
      for (const ev of log) {
        if (!ev || typeof ev !== 'object') continue;
        if (!Array.isArray(ev.actors) || !ev.actors.includes(id)) continue;
        if (ev.rolled_back) continue;
        recentEvents.push({
          ts: ev.ts,
          kind: ev.kind,
          summary: ev.summary,
          counterpartName,
        });
      }
    }
    recentEvents.sort((a, b) => (a.ts < b.ts ? 1 : -1));

    // Pending quests addressed to this character: walk every edge,
    // find form='quest' events with this character as a non-proposer
    // actor, exclude any that already have a quest_* resolution.
    const offered: Array<{ questId: string; proposerId: string; summary: string; body?: string; ts: string }> = [];
    const resolved = new Set<string>();
    for (const edge of edges) {
      const log = readLog(edge.eventLog);
      for (const ev of log) {
        if (!ev || typeof ev !== 'object' || (ev as { rolled_back?: boolean }).rolled_back) continue;
        const evt = ev as { form?: string; questId?: string; actors?: string[]; summary?: string; body?: string; ts?: string };
        const form = evt.form;
        const qid = evt.questId;
        if (!form || !qid) continue;
        const actors = Array.isArray(evt.actors) ? evt.actors : [];
        if (form === 'quest' && actors.length >= 2 && actors[0] !== id && actors.includes(id)) {
          offered.push({
            questId: qid,
            proposerId: actors[0],
            summary: evt.summary ?? '',
            body: evt.body,
            ts: evt.ts ?? '',
          });
        }
        if (form === 'quest_accepted' || form === 'quest_declined' || form === 'quest_completed') {
          resolved.add(qid);
        }
      }
    }
    const pendingQuests = offered
      .filter((o) => !resolved.has(o.questId))
      .map((o) => ({
        questId: o.questId,
        proposerName: neighbourById.get(o.proposerId)?.name ?? o.proposerId.slice(0, 6),
        summary: o.summary,
        body: o.body,
        ts: o.ts,
      }));

    let decision: Decision;
    try {
      decision = await decideTick({
        self: {
          id: character.id,
          name: character.name,
          bio: character.bio,
          backstory: character.backstory,
          mode: character.mode,
          goals: character.goals,
          agencyScope: character.agencyScope,
          identity: character.identity,
          toneForbidden: character.toneForbidden,
          authoredBy: character.authoredBy,
          voiceSamples: character.voiceSamples,
          tongue: character.tongue,
          gender: character.gender,
          pronouns: character.pronouns,
          timelineState: character.timelineState,
        },
        forceForm: (typeof forceFormRaw === 'string' && POST_FORMS[forceFormRaw as PostForm])
          ? (forceFormRaw as PostForm)
          : undefined,
        recentEvents: recentEvents.slice(0, 20),
        neighbours: edges.map((edge) => {
          const cId = edge.sourceCharacterId === id ? edge.targetCharacterId : edge.sourceCharacterId;
          const n = neighbourById.get(cId);
          return {
            edge,
            neighbour: n ? { id: n.id, name: n.name, mode: n.mode } : { id: cId, name: cId.slice(0, 6), mode: 'espíritu' },
          };
        }),
        pendingQuests,
      });
    } catch (err) {
      if (err instanceof TickThrottledError) {
        return reply
          .code(429)
          .send({ error: err.message, reason: err.reason, retryAfterMs: err.retryAfterMs });
      }
      if (err instanceof LlmBudgetError) {
        return reply.code(402).send({ error: err.message });
      }
      return reply
        .code(502)
        .send({ error: err instanceof Error ? err.message : 'Tick failed' });
    }

    let targetEdgeId: string | null = null;
    let actors: string[] = [id];

    if (decision.kind === 'message' && decision.targetName) {
      const target = neighbours.find(
        (n) => n.name.toLowerCase() === decision.targetName!.toLowerCase()
      );
      if (target) {
        const edge = edges.find(
          (e) =>
            (e.sourceCharacterId === id && e.targetCharacterId === target.id) ||
            (e.targetCharacterId === id && e.sourceCharacterId === target.id)
        );
        if (edge) {
          targetEdgeId = edge.id;
          actors = [id, target.id];
        }
      }
    }

    if (!targetEdgeId) {
      const firstEdge = edges[0];
      if (!firstEdge) {
        return reply.code(400).send({
          error:
            'Tick produced a result but the character has no relationships to anchor the event to. Add a relationship first.',
        });
      }
      targetEdgeId = firstEdge.id;
      actors = [id];
    }

    const entryKind: EventKind =
      decision.kind === 'message' ? 'conversation' : 'thought';

    // Quest threading: a new form='quest' gets a generated id;
    // quest_* responses inherit questId from the decision.
    const { randomUUID } = await import('crypto');
    let questId = decision.questId;
    if (decision.form === 'quest' && !questId) {
      questId = randomUUID();
    }
    const retention: Retention =
      decision.form === 'quest_accepted' || decision.form === 'quest_completed'
        ? 'canonical'
        : 'ephemeral';

    const entry: EventEntry & { form?: string; questId?: string } = {
      ts: new Date().toISOString(),
      actors,
      kind: entryKind,
      summary: decision.summary,
      body: decision.body,
      retention,
      rolled_back: false,
      ...(decision.form ? { form: decision.form } : {}),
      ...(questId ? { questId } : {}),
    };

    const targetEdge = await prisma.characterRelationship.findUnique({
      where: { id: targetEdgeId },
    });
    if (!targetEdge) {
      return reply.code(500).send({ error: 'Edge disappeared during tick' });
    }
    const log = readLog(targetEdge.eventLog);
    log.push(entry);
    await prisma.characterRelationship.update({
      where: { id: targetEdgeId },
      data: { eventLog: log as unknown as object },
    });

    return reply.send({ decision, entry, edgeId: targetEdgeId });
  });

  // POST /admin/events/prune-ephemeral — drop ephemeral entries
  // older than 90 days across every edge. Cron-callable. Returns
  // the number of pruned entries and edges touched.
  fastify.post('/admin/events/prune-ephemeral', async (_request, reply) => {
    const cutoff = new Date(Date.now() - EPHEMERAL_TTL_MS).toISOString();
    const edges = await prisma.characterRelationship.findMany({});
    let prunedTotal = 0;
    let touchedEdges = 0;

    for (const edge of edges) {
      const log = readLog(edge.eventLog);
      const kept = log.filter(
        (ev) => !(ev && ev.retention === 'ephemeral' && ev.ts < cutoff)
      );
      const removed = log.length - kept.length;
      if (removed > 0) {
        prunedTotal += removed;
        touchedEdges += 1;
        await prisma.characterRelationship.update({
          where: { id: edge.id },
          data: { eventLog: kept as unknown as object },
        });
      }
    }

    return reply.send({ pruned: prunedTotal, edgesTouched: touchedEdges, cutoff });
  });
}
