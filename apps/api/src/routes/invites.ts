import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { nanoid } from 'nanoid';

export async function inviteRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /invites - Create a new invite code (admin)
  fastify.post('/invites', async (request, reply) => {
    const body = request.body as {
      code?: string;
      maxUses?: number;
      tier?: 'registry' | 'pro' | 'legacy';
      expiresInDays?: number;
      createdBy?: string;
      notes?: string;
    };

    // Generate code if not provided
    const code = body.code || `SEMBLA-${nanoid(6).toUpperCase()}`;

    const expiresAt = body.expiresInDays
      ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        maxUses: body.maxUses || 1,
        tier: body.tier || 'registry',
        expiresAt,
        createdBy: body.createdBy || 'system',
        notes: body.notes,
      },
    });

    return reply.code(201).send(inviteCode);
  });

  // GET /invites - List all invite codes (admin)
  fastify.get('/invites', async (_request, reply) => {
    const invites = await prisma.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        usedBy: true,
      },
    });

    return reply.send(invites);
  });

  // GET /invites/validate/:code - Validate an invite code (public)
  fastify.get<{ Params: { code: string } }>('/invites/validate/:code', async (request, reply) => {
    const { code } = request.params;

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!inviteCode) {
      return reply.code(404).send({ valid: false, reason: 'Code not found' });
    }

    if (!inviteCode.isActive) {
      return reply.code(400).send({ valid: false, reason: 'Code is no longer active' });
    }

    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return reply.code(400).send({ valid: false, reason: 'Code has expired' });
    }

    if (inviteCode.currentUses >= inviteCode.maxUses) {
      return reply.code(400).send({ valid: false, reason: 'Code has reached maximum uses' });
    }

    return reply.send({
      valid: true,
      tier: inviteCode.tier,
      usesRemaining: inviteCode.maxUses - inviteCode.currentUses,
    });
  });

  // POST /invites/redeem/:code - Redeem an invite code
  fastify.post<{ Params: { code: string } }>('/invites/redeem/:code', async (request, reply) => {
    const { code } = request.params;
    const body = request.body as {
      email: string;
      characterId?: string;
    };

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!inviteCode) {
      return reply.code(404).send({ success: false, reason: 'Code not found' });
    }

    if (!inviteCode.isActive) {
      return reply.code(400).send({ success: false, reason: 'Code is no longer active' });
    }

    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return reply.code(400).send({ success: false, reason: 'Code has expired' });
    }

    if (inviteCode.currentUses >= inviteCode.maxUses) {
      return reply.code(400).send({ success: false, reason: 'Code has reached maximum uses' });
    }

    // Check if email already used this code
    const existingUsage = await prisma.inviteCodeUsage.findFirst({
      where: {
        inviteCodeId: inviteCode.id,
        usedByEmail: body.email,
      },
    });

    if (existingUsage) {
      return reply.code(400).send({ success: false, reason: 'Email already used this code' });
    }

    // Record usage and increment counter
    await prisma.$transaction([
      prisma.inviteCodeUsage.create({
        data: {
          inviteCodeId: inviteCode.id,
          usedByEmail: body.email,
          characterId: body.characterId,
        },
      }),
      prisma.inviteCode.update({
        where: { id: inviteCode.id },
        data: { currentUses: { increment: 1 } },
      }),
    ]);

    return reply.send({
      success: true,
      tier: inviteCode.tier,
      message: 'Welcome to Sembla',
    });
  });

  // POST /waitlist - Join the waitlist
  fastify.post('/waitlist', async (request, reply) => {
    const body = request.body as {
      email: string;
      name: string;
      instagram?: string;
      agency?: string;
      reason?: string;
    };

    // Check if already on waitlist
    const existing = await prisma.waitlistRequest.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      return reply.code(400).send({
        success: false,
        reason: 'Email already on waitlist',
        status: existing.status,
      });
    }

    const request_entry = await prisma.waitlistRequest.create({
      data: {
        email: body.email,
        name: body.name,
        instagram: body.instagram,
        agency: body.agency,
        reason: body.reason,
      },
    });

    return reply.code(201).send({
      success: true,
      message: 'You have been added to the waitlist',
      position: await prisma.waitlistRequest.count({ where: { status: 'pending' } }),
    });
  });

  // GET /waitlist - List waitlist (admin)
  fastify.get('/waitlist', async (request, reply) => {
    const query = request.query as { status?: string };

    const where = query.status ? { status: query.status } : {};

    const requests = await prisma.waitlistRequest.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return reply.send(requests);
  });

  // POST /waitlist/:id/approve - Approve waitlist request (admin)
  fastify.post<{ Params: { id: string } }>('/waitlist/:id/approve', async (request, reply) => {
    const { id } = request.params;
    const body = request.body as { reviewedBy?: string; tier?: string };

    const waitlistRequest = await prisma.waitlistRequest.findUnique({
      where: { id },
    });

    if (!waitlistRequest) {
      return reply.code(404).send({ error: 'Request not found' });
    }

    // Create invite code for this person
    const code = `SEMBLA-${nanoid(6).toUpperCase()}`;
    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        maxUses: 1,
        tier: body.tier || 'registry',
        createdBy: body.reviewedBy || 'system',
        notes: `Approved from waitlist for ${waitlistRequest.email}`,
      },
    });

    // Update waitlist request
    const updated = await prisma.waitlistRequest.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: body.reviewedBy,
        inviteCodeSent: code,
      },
    });

    return reply.send({
      success: true,
      inviteCode: code,
      waitlistRequest: updated,
    });
  });

  // GET /stats - Get platform stats (for landing page)
  fastify.get('/stats', async (_request, reply) => {
    const [totalPersonas, totalLicenses, activeInvites] = await Promise.all([
      prisma.character.count({ where: { source: 'PERSONA' } }),
      prisma.license.count(),
      prisma.inviteCode.count({ where: { isActive: true } }),
    ]);

    return reply.send({
      identitiesProtected: totalPersonas,
      licensesIssued: totalLicenses,
      // Add some baseline for social proof
      displayCount: Math.max(totalPersonas, 47),
    });
  });
}
