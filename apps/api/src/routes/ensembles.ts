// Ensemble routes — groups of Characters that share an identity larger
// than any single member. A 3-piece band, a coven, a duo. Distinct
// from a CharacterRelationship pair because an Ensemble has its own
// bio, avatar, and visual signature.
//
// Why both Character and Ensemble: matching a description like
// "three-piece band, gritty rock energy" against the photo library
// catches group shots that no single member's centroid would surface.
// Per-character matching still works for solo shots. Both signals
// stack on the consuming app (Tizita, etc).

import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';

interface EnsembleCreateBody {
  name: string;
  bio?: string;
  kind?: string;
  aliases?: string[];
  avatarUrl?: string;
  avatarPosition?: string;
  personaTags?: string[];
}

interface EnsemblePatchBody {
  name?: string;
  bio?: string;
  kind?: string;
  aliases?: string[];
  avatarUrl?: string;
  avatarPosition?: string;
  personaTags?: string[];
  bioTextEmbedding?: number[] | null;
}

interface EnsembleMemberAddBody {
  characterId: string;
  role?: string;
  displayOrder?: number;
}

export async function ensembleRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /ensembles — create a new ensemble.
  fastify.post<{ Body: EnsembleCreateBody }>('/ensembles', async (request, reply) => {
    const body = request.body;
    if (!body || typeof body.name !== 'string' || !body.name.trim()) {
      return reply.code(400).send({ error: 'name is required' });
    }
    const ensemble = await prisma.ensemble.create({
      data: {
        name: body.name.trim(),
        bio: body.bio ?? '',
        kind: body.kind?.trim() || null,
        aliases: body.aliases ?? [],
        avatarUrl: body.avatarUrl ?? null,
        avatarPosition: body.avatarPosition ?? '50% 50%',
        personaTags: body.personaTags ?? [],
      },
    });
    return reply.code(201).send(ensemble);
  });

  // GET /ensembles — list with member count.
  fastify.get('/ensembles', async (_request, reply) => {
    const ensembles = await prisma.ensemble.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
          include: { character: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });
    return reply.send(ensembles);
  });

  // GET /ensembles/:id — full detail with members in display order.
  fastify.get<{ Params: { id: string } }>('/ensembles/:id', async (request, reply) => {
    const { id } = request.params;
    const ensemble = await prisma.ensemble.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: { displayOrder: 'asc' },
          include: {
            character: {
              select: {
                id: true,
                name: true,
                bio: true,
                avatarUrl: true,
                avatarPosition: true,
                tizitaPersonaId: true,
              },
            },
          },
        },
      },
    });
    if (!ensemble) return reply.code(404).send({ error: 'Ensemble not found' });
    return reply.send(ensemble);
  });

  // PATCH /ensembles/:id — update fields.
  fastify.patch<{ Params: { id: string }; Body: EnsemblePatchBody }>(
    '/ensembles/:id',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body ?? {};
      const data: Record<string, unknown> = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.bio !== undefined) data.bio = body.bio;
      if (body.kind !== undefined) data.kind = body.kind?.trim() || null;
      if (body.aliases !== undefined) data.aliases = body.aliases;
      if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
      if (body.avatarPosition !== undefined) data.avatarPosition = body.avatarPosition;
      if (body.personaTags !== undefined) data.personaTags = body.personaTags;
      if (body.bioTextEmbedding !== undefined) data.bioTextEmbedding = body.bioTextEmbedding as never;

      try {
        const ensemble = await prisma.ensemble.update({ where: { id }, data });
        return reply.send(ensemble);
      } catch (e) {
        return reply.code(404).send({ error: 'Ensemble not found' });
      }
    },
  );

  // DELETE /ensembles/:id — cascade-removes membership rows; characters survive.
  fastify.delete<{ Params: { id: string } }>('/ensembles/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.ensemble.delete({ where: { id } });
      return reply.send({ ok: true });
    } catch (e) {
      return reply.code(404).send({ error: 'Ensemble not found' });
    }
  });

  // POST /ensembles/:id/members — add a character (idempotent: existing membership updates role).
  fastify.post<{ Params: { id: string }; Body: EnsembleMemberAddBody }>(
    '/ensembles/:id/members',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;
      if (!body || typeof body.characterId !== 'string') {
        return reply.code(400).send({ error: 'characterId is required' });
      }
      const ensemble = await prisma.ensemble.findUnique({ where: { id } });
      if (!ensemble) return reply.code(404).send({ error: 'Ensemble not found' });

      const character = await prisma.character.findUnique({ where: { id: body.characterId } });
      if (!character) return reply.code(404).send({ error: 'Character not found' });

      const membership = await prisma.ensembleMember.upsert({
        where: { ensembleId_characterId: { ensembleId: id, characterId: body.characterId } },
        create: {
          ensembleId: id,
          characterId: body.characterId,
          role: body.role ?? null,
          displayOrder: body.displayOrder ?? 0,
        },
        update: {
          role: body.role ?? null,
          displayOrder: body.displayOrder ?? 0,
        },
      });
      return reply.send(membership);
    },
  );

  // DELETE /ensembles/:id/members/:characterId — remove a member.
  fastify.delete<{ Params: { id: string; characterId: string } }>(
    '/ensembles/:id/members/:characterId',
    async (request, reply) => {
      const { id, characterId } = request.params;
      try {
        await prisma.ensembleMember.delete({
          where: { ensembleId_characterId: { ensembleId: id, characterId } },
        });
        return reply.send({ ok: true });
      } catch (e) {
        return reply.code(404).send({ error: 'Membership not found' });
      }
    },
  );
}
