// Sphere routes — one divergent media piece per record.
//
// A Sphere is a Scene (Zone) inhabitant: a format-bound, aspect-bound,
// intent-bound take. Same world, different rules. Each Sphere binds
// to one Ikenga Series for its storyboard.
//
// Spec: /home/sphinxy/boveda/CUBE_ZONE_SPHERE_ARCHITECTURE.md

import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

type SphereFormat =
  | 'film'
  | 'music_video'
  | 'content'
  | 'game'
  | 'dialogue'
  | 'interactive'
  | 'trailer'
  | 'reel'
  | 'mood';

type SphereAudioMode = 'lead' | 'remix' | 'underscore' | 'silent' | 'diegetic';
type SphereStatus = 'draft' | 'in_production' | 'locked' | 'shipped';

interface CreateSphereBody {
  sceneId: string;
  name: string;
  format?: SphereFormat;
  primaryAspect?: string;
  siblingAspect?: string | null;
  intent?: string | null;
  ikengaSeriesId?: string | null;
  castIds?: string[];
  audioMode?: SphereAudioMode;
  stelaId?: string | null;
  status?: SphereStatus;
  physics?: Prisma.InputJsonValue;
}

interface UpdateSphereBody {
  name?: string;
  format?: SphereFormat;
  primaryAspect?: string;
  siblingAspect?: string | null;
  intent?: string | null;
  ikengaSeriesId?: string | null;
  castIds?: string[];
  audioMode?: SphereAudioMode;
  stelaId?: string | null;
  status?: SphereStatus;
  physics?: Prisma.InputJsonValue | null;
}

interface ListSpheresQuery {
  sceneId?: string;
  status?: SphereStatus;
}

export async function sphereRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /spheres
  fastify.post('/spheres', async (request, reply) => {
    const body = request.body as CreateSphereBody;

    if (!body.sceneId) {
      return reply.code(400).send({ error: 'sceneId is required' });
    }
    if (!body.name) {
      return reply.code(400).send({ error: 'name is required' });
    }

    const scene = await prisma.scene.findUnique({ where: { id: body.sceneId } });
    if (!scene) {
      return reply.code(404).send({ error: 'Scene (Zone) not found' });
    }

    try {
      const sphere = await prisma.sphere.create({
        data: {
          sceneId: body.sceneId,
          name: body.name,
          format: body.format ?? 'music_video',
          primaryAspect: body.primaryAspect ?? '16:9',
          siblingAspect: body.siblingAspect ?? null,
          intent: body.intent ?? null,
          ikengaSeriesId: body.ikengaSeriesId ?? null,
          castIds: body.castIds ?? [],
          audioMode: body.audioMode ?? 'lead',
          stelaId: body.stelaId ?? null,
          status: body.status ?? 'draft',
          physics: body.physics,
        },
      });
      return reply.code(201).send(sphere);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError
        && e.code === 'P2002'
      ) {
        return reply.code(409).send({
          error: 'ikengaSeriesId already bound to another Sphere',
        });
      }
      throw e;
    }
  });

  // GET /spheres?sceneId=...&status=...
  fastify.get<{ Querystring: ListSpheresQuery }>(
    '/spheres',
    async (request, reply) => {
      const { sceneId, status } = request.query;

      const where: Prisma.SphereWhereInput = {};
      if (sceneId) where.sceneId = sceneId;
      if (status) where.status = status;

      const spheres = await prisma.sphere.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return reply.send(spheres);
    },
  );

  // GET /spheres/:id
  fastify.get<{ Params: { id: string } }>(
    '/spheres/:id',
    async (request, reply) => {
      const { id } = request.params;
      const sphere = await prisma.sphere.findUnique({
        where: { id },
        include: { scene: true },
      });
      if (!sphere) return reply.code(404).send({ error: 'Sphere not found' });
      return reply.send(sphere);
    },
  );

  // PATCH /spheres/:id
  fastify.patch<{ Params: { id: string } }>(
    '/spheres/:id',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body as UpdateSphereBody;

      const existing = await prisma.sphere.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: 'Sphere not found' });

      try {
        const sphere = await prisma.sphere.update({
          where: { id },
          data: {
            name: body.name,
            format: body.format,
            primaryAspect: body.primaryAspect,
            siblingAspect: body.siblingAspect,
            intent: body.intent,
            ikengaSeriesId: body.ikengaSeriesId,
            castIds: body.castIds,
            audioMode: body.audioMode,
            stelaId: body.stelaId,
            status: body.status,
            physics: body.physics ?? undefined,
          },
        });
        return reply.send(sphere);
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError
          && e.code === 'P2002'
        ) {
          return reply.code(409).send({
            error: 'ikengaSeriesId already bound to another Sphere',
          });
        }
        throw e;
      }
    },
  );

  // DELETE /spheres/:id
  fastify.delete<{ Params: { id: string } }>(
    '/spheres/:id',
    async (request, reply) => {
      const { id } = request.params;
      const existing = await prisma.sphere.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ error: 'Sphere not found' });
      await prisma.sphere.delete({ where: { id } });
      return reply.code(204).send();
    },
  );
}
