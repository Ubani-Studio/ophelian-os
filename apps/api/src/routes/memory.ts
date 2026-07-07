/**
 * Boveda character memory routes — Layer 4 (episodic) + Layer 2 (canon).
 *
 * Layer 4 (MemoryEpisode): rolling short-term memory. Hard retention
 *   window enforced by expiresAt. Auto-pruned. Never authoritative.
 *
 * Layer 2 (CanonicalLoreEntry): the character's long-term biography.
 *   Append-only with retract-with-reason. Signed by o8 attestation.
 *   Authoritative; injected into the tick prompt.
 *
 * The four-layer architecture from the design discussion:
 *   1. Constitution (genome / bio / tongue / voiceSamples) — already exists
 *   2. Canonical lore                                       — this file
 *   3. Reflective summaries (monthly digest)                — future
 *   4. Episodic                                             — this file
 */

import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';

const DEFAULT_EPISODE_RETENTION_DAYS = 30;
const HARD_MAX_RETENTION_DAYS = 90;

interface WriteEpisodeBody {
  kind: string;
  content: string;
  metadata?: Record<string, unknown>;
  retentionDays?: number;
}

interface PromoteCanonBody {
  episodeId: string;
  title: string;
  body?: string;
  occurredAt?: string;
  tags?: string[];
  scope?: 'public' | 'licensed_only' | 'private';
  signedBy?: string;
}

interface CreateCanonBody {
  title: string;
  body: string;
  occurredAt?: string;
  tags?: string[];
  scope?: 'public' | 'licensed_only' | 'private';
  signedBy?: string;
}

interface RetractBody {
  reason: string;
}

function buildAttestationId(characterId: string, content: string): string {
  // Lightweight deterministic id for now; real o8 / Nsibidi signing
  // is a follow-up patch. The format matches the v2 declaration_id shape.
  const ts = Date.now();
  const slice = content.slice(0, 32).replace(/\s+/g, '_');
  return `nsibidi-canon-${ts}-${characterId.slice(0, 8)}-${Buffer.from(slice).toString('hex').slice(0, 8)}`;
}

export async function memoryRoutes(fastify: FastifyInstance): Promise<void> {
  // -----------------------------------------------------------------
  // Layer 4: episodic memory
  // -----------------------------------------------------------------

  // GET /characters/:id/memory/episodes
  fastify.get<{ Params: { id: string }; Querystring: { limit?: string; kind?: string } }>(
    '/characters/:id/memory/episodes',
    async (request, reply) => {
      const { id } = request.params;
      const limit = Math.min(Number(request.query.limit ?? 50), 200);
      const kind = request.query.kind;

      const character = await prisma.character.findUnique({ where: { id }, select: { id: true } });
      if (!character) return reply.status(404).send({ error: 'character_not_found' });

      const episodes = await prisma.memoryEpisode.findMany({
        where: {
          characterId: id,
          expiresAt: { gt: new Date() },
          ...(kind ? { kind } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return { characterId: id, count: episodes.length, episodes };
    },
  );

  // POST /characters/:id/memory/episodes
  fastify.post<{ Params: { id: string }; Body: WriteEpisodeBody }>(
    '/characters/:id/memory/episodes',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body ?? ({} as WriteEpisodeBody);
      if (!body.kind || !body.content) {
        return reply.status(400).send({ error: 'kind and content are required' });
      }
      const character = await prisma.character.findUnique({ where: { id }, select: { id: true } });
      if (!character) return reply.status(404).send({ error: 'character_not_found' });

      const days = Math.max(1, Math.min(HARD_MAX_RETENTION_DAYS, body.retentionDays ?? DEFAULT_EPISODE_RETENTION_DAYS));
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const ep = await prisma.memoryEpisode.create({
        data: {
          characterId: id,
          kind: body.kind,
          content: body.content,
          metadata: (body.metadata ?? {}) as object,
          expiresAt,
        },
      });
      return { episode: ep };
    },
  );

  // POST /memory/prune  -- maintenance: delete expired episodes globally
  fastify.post('/memory/prune', async (_request, _reply) => {
    const result = await prisma.memoryEpisode.deleteMany({
      where: { expiresAt: { lt: new Date() }, promotedToCanonId: null },
    });
    return { pruned: result.count };
  });

  // -----------------------------------------------------------------
  // Layer 2: canonical lore
  // -----------------------------------------------------------------

  // GET /characters/:id/canon
  fastify.get<{ Params: { id: string }; Querystring: { scope?: string; includeRetracted?: string } }>(
    '/characters/:id/canon',
    async (request, reply) => {
      const { id } = request.params;
      const character = await prisma.character.findUnique({ where: { id }, select: { id: true } });
      if (!character) return reply.status(404).send({ error: 'character_not_found' });

      const scope = request.query.scope;
      const includeRetracted = request.query.includeRetracted === 'true';

      const entries = await prisma.canonicalLoreEntry.findMany({
        where: {
          characterId: id,
          ...(scope ? { scope } : {}),
          ...(includeRetracted ? {} : { retractedAt: null }),
        },
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      });
      return { characterId: id, count: entries.length, entries };
    },
  );

  // POST /characters/:id/canon  -- create directly (manual entry)
  fastify.post<{ Params: { id: string }; Body: CreateCanonBody }>(
    '/characters/:id/canon',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body ?? ({} as CreateCanonBody);
      if (!body.title || !body.body) {
        return reply.status(400).send({ error: 'title and body are required' });
      }
      const character = await prisma.character.findUnique({
        where: { id },
        select: { id: true, name: true, authoredBy: true },
      });
      if (!character) return reply.status(404).send({ error: 'character_not_found' });

      const entry = await prisma.canonicalLoreEntry.create({
        data: {
          characterId: id,
          title: body.title,
          body: body.body,
          occurredAt: body.occurredAt ? new Date(body.occurredAt) : null,
          tags: body.tags ?? [],
          scope: body.scope ?? 'public',
          attestationId: buildAttestationId(id, body.title + body.body),
          signedBy: body.signedBy ?? character.authoredBy ?? 'bomac1193',
        },
      });
      return { entry };
    },
  );

  // POST /characters/:id/canon/promote  -- promote an episode to canon
  fastify.post<{ Params: { id: string }; Body: PromoteCanonBody }>(
    '/characters/:id/canon/promote',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body ?? ({} as PromoteCanonBody);
      if (!body.episodeId || !body.title) {
        return reply.status(400).send({ error: 'episodeId and title are required' });
      }
      const episode = await prisma.memoryEpisode.findUnique({ where: { id: body.episodeId } });
      if (!episode || episode.characterId !== id) {
        return reply.status(404).send({ error: 'episode_not_found_for_character' });
      }
      const character = await prisma.character.findUnique({
        where: { id },
        select: { id: true, authoredBy: true },
      });
      if (!character) return reply.status(404).send({ error: 'character_not_found' });

      const entry = await prisma.canonicalLoreEntry.create({
        data: {
          characterId: id,
          title: body.title,
          body: body.body ?? episode.content,
          occurredAt: body.occurredAt ? new Date(body.occurredAt) : episode.createdAt,
          tags: body.tags ?? [],
          scope: body.scope ?? 'public',
          sourceEpisodeId: episode.id,
          attestationId: buildAttestationId(id, body.title + (body.body ?? episode.content)),
          signedBy: body.signedBy ?? character.authoredBy ?? 'bomac1193',
        },
      });
      // Mark the episode as promoted so prune doesn't delete it.
      await prisma.memoryEpisode.update({
        where: { id: episode.id },
        data: { promotedToCanonId: entry.id },
      });
      return { entry };
    },
  );

  // POST /characters/:id/canon/:entryId/retract
  fastify.post<{ Params: { id: string; entryId: string }; Body: RetractBody }>(
    '/characters/:id/canon/:entryId/retract',
    async (request, reply) => {
      const { id, entryId } = request.params;
      const body = request.body ?? ({} as RetractBody);
      if (!body.reason) {
        return reply.status(400).send({ error: 'reason is required' });
      }
      const entry = await prisma.canonicalLoreEntry.findUnique({ where: { id: entryId } });
      if (!entry || entry.characterId !== id) {
        return reply.status(404).send({ error: 'canon_entry_not_found' });
      }
      const updated = await prisma.canonicalLoreEntry.update({
        where: { id: entryId },
        data: { retractedAt: new Date(), retractionReason: body.reason },
      });
      return { entry: updated };
    },
  );
}
