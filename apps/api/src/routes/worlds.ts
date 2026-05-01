import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

interface CreateWorldBody {
  name: string;
  description?: string;
  type?: 'setting' | 'story';
  imageUrl?: string;
  tags?: string[];
  metadata?: Prisma.InputJsonValue;
}

interface UpdateWorldBody {
  name?: string;
  description?: string | null;
  type?: 'setting' | 'story';
  imageUrl?: string | null;
  tags?: string[];
  metadata?: Prisma.InputJsonValue | null;
  /** Pinned narrative trajectory id (e.g. 'descent', 'return',
   *  'sacrifice'). Null clears the pin. */
  trajectoryId?: string | null;
  /** Optional variant pinned within the primary (e.g. 'Sankofa'
   *  under 'return'). */
  trajectoryVariant?: string | null;
}

export async function worldRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /worlds - Create a new world
  fastify.post('/worlds', async (request, reply) => {
    const body = request.body as CreateWorldBody;

    if (!body.name) {
      return reply.code(400).send({ error: 'Name is required' });
    }

    const world = await prisma.world.create({
      data: {
        name: body.name,
        description: body.description,
        type: body.type || 'setting',
        imageUrl: body.imageUrl,
        tags: body.tags || [],
        metadata: body.metadata,
      },
    });

    return reply.code(201).send(world);
  });

  // GET /worlds - List all worlds
  fastify.get('/worlds', async (_request, reply) => {
    const worlds = await prisma.world.findMany({
      orderBy: { createdAt: 'desc' },
      include: { position: true },
    });

    return reply.send(worlds);
  });

  // GET /worlds/:id - Get a world by ID
  fastify.get<{ Params: { id: string } }>('/worlds/:id', async (request, reply) => {
    const { id } = request.params;

    const world = await prisma.world.findUnique({
      where: { id },
      include: { position: true },
    });

    if (!world) {
      return reply.code(404).send({ error: 'World not found' });
    }

    return reply.send(world);
  });

  // PATCH /worlds/:id - Update a world
  fastify.patch<{ Params: { id: string } }>('/worlds/:id', async (request, reply) => {
    const { id } = request.params;
    const body = request.body as UpdateWorldBody;

    const world = await prisma.world.findUnique({
      where: { id },
    });

    if (!world) {
      return reply.code(404).send({ error: 'World not found' });
    }

    const updated = await prisma.world.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        imageUrl: body.imageUrl,
        tags: body.tags,
        metadata: body.metadata === null ? Prisma.DbNull : body.metadata,
        ...(body.trajectoryId !== undefined ? { trajectoryId: body.trajectoryId } : {}),
        ...(body.trajectoryVariant !== undefined ? { trajectoryVariant: body.trajectoryVariant } : {}),
      },
      include: { position: true },
    });

    return reply.send(updated);
  });

  // DELETE /worlds/:id - Delete a world
  fastify.delete<{ Params: { id: string } }>('/worlds/:id', async (request, reply) => {
    const { id } = request.params;

    const world = await prisma.world.findUnique({
      where: { id },
    });

    if (!world) {
      return reply.code(404).send({ error: 'World not found' });
    }

    // Delete associated connections
    await prisma.worldConnection.deleteMany({
      where: {
        OR: [
          { sourceType: 'WORLD', sourceId: id },
          { targetType: 'WORLD', targetId: id },
        ],
      },
    });

    // Delete the world (position will cascade)
    await prisma.world.delete({
      where: { id },
    });

    return reply.code(204).send();
  });

  // PUT /worlds/:id/position - Update world position
  fastify.put<{ Params: { id: string } }>('/worlds/:id/position', async (request, reply) => {
    const { id } = request.params;
    const { x, y } = request.body as { x: number; y: number };

    const world = await prisma.world.findUnique({
      where: { id },
    });

    if (!world) {
      return reply.code(404).send({ error: 'World not found' });
    }

    const position = await prisma.worldPosition.upsert({
      where: { worldId: id },
      create: { worldId: id, x, y },
      update: { x, y },
    });

    return reply.send(position);
  });
}
