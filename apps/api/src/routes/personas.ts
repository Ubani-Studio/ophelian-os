import type { FastifyInstance } from 'fastify';
import { createHash } from 'crypto';
import { prisma } from '../db.js';
import { buildBovedaPersonaPayload, type BovedaPersona } from '../lib/persona-payload.js';

/**
 * Persona routes — exposes the BovedaPersona contract that sister apps
 * (Slayt, etc) consume when activating a character as a posting identity.
 *
 * Endpoints
 * - GET  /personas/handler/:userId         list personas operable by this human handler
 * - GET  /personas/:id/payload             full BovedaPersona payload (signed)
 * - POST /personas/:id/revoke              revoke consent, fan-out webhook, record audit
 */
export async function personaRoutes(fastify: FastifyInstance): Promise<void> {
  const REVOCATION_WEBHOOK_DEFAULT =
    process.env.PERSONA_REVOCATION_WEBHOOK ||
    `${(process.env.SLAYT_API_URL || 'http://localhost:3035').replace(/\/$/, '')}/api/persona/revoke`;

  fastify.get<{ Params: { userId: string } }>('/personas/handler/:userId', async (request, reply) => {
    const { userId } = request.params;

    const characters = await prisma.character.findMany({
      where: {
        OR: [{ realIdentityId: userId }, { authoredBy: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        source: true,
        personaTags: true,
        worldId: true,
        updatedAt: true,
      },
    });

    return reply.send({
      handler_user_id: userId,
      personas: characters.map((c) => ({
        persona_id: c.id,
        display_name: c.name,
        avatar: c.avatarUrl,
        consent_type:
          c.source === 'PERSONA' ? 'human_clone' : c.source === 'TWIN' ? 'hybrid' : 'original_ai',
        tags: c.personaTags,
        world_id: c.worldId,
        updated_at: c.updatedAt.toISOString(),
      })),
    });
  });

  fastify.get<{ Params: { id: string }; Querystring: { revocation_webhook?: string } }>(
    '/personas/:id/payload',
    async (request, reply) => {
      const { id } = request.params;
      const handlerToken =
        (request.headers['x-imprint-handler-token'] as string | undefined) || undefined;

      const character = await prisma.character.findUnique({
        where: { id },
        include: { genome: true },
      });

      if (!character) {
        return reply.code(404).send({ error: 'Persona not found' });
      }

      const ownerId = character.realIdentityId ?? character.authoredBy;
      const licenses = ownerId
        ? await prisma.license.findMany({
            where: { ownerId, subjectType: 'CHARACTER', subjectId: id },
          })
        : [];

      const payload: BovedaPersona = buildBovedaPersonaPayload({
        character,
        genome: character.genome,
        licenses,
        revocationWebhook: request.query.revocation_webhook || REVOCATION_WEBHOOK_DEFAULT,
        imprintHandlerToken: handlerToken,
      });

      return reply.send(payload);
    },
  );

  fastify.post<{
    Params: { id: string };
    Body: { reason?: string; consumer_webhooks?: string[]; granted_by?: string };
  }>('/personas/:id/revoke', async (request, reply) => {
    const { id } = request.params;
    const { reason, consumer_webhooks, granted_by } = request.body ?? {};

    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) {
      return reply.code(404).send({ error: 'Persona not found' });
    }

    // Append REVOCATION to the consent hash chain
    const lastRecord = await prisma.consentRecord.findFirst({
      where: { characterId: id },
      orderBy: { timestamp: 'desc' },
    });
    const previousHash = lastRecord?.hash ?? null;
    const recordPayload = {
      type: 'REVOCATION' as const,
      source: 'api',
      grantedBy: granted_by ?? null,
      permissions: {
        synthesis: false,
        training: false,
        commercial: false,
        modification: false,
      },
      metadata: { reason: reason ?? 'manual revocation', characterId: id },
      previousHash,
      timestamp: new Date().toISOString(),
    };
    const hash = createHash('sha256')
      .update(JSON.stringify(recordPayload))
      .digest('hex');

    const record = await prisma.consentRecord.create({
      data: {
        type: 'REVOCATION',
        source: 'api',
        grantedBy: granted_by ?? undefined,
        permissions: recordPayload.permissions as object,
        metadata: recordPayload.metadata as object,
        previousHash: previousHash ?? undefined,
        hash,
        characterId: id,
      },
    });

    // Fan-out webhook to every consumer that has this persona activated.
    // Default consumer is Slayt; callers can pass extra webhooks for any
    // other surface (Quashi, Imperium, etc) that holds cached persona state.
    const targets = new Set<string>([REVOCATION_WEBHOOK_DEFAULT, ...(consumer_webhooks ?? [])]);
    const apiKey = process.env.ECOSYSTEM_API_SECRET || process.env.API_KEY || '';
    const webhookResults = await Promise.allSettled(
      Array.from(targets).map(async (url) => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-API-Key': apiKey,
          },
          body: JSON.stringify({
            persona_id: id,
            revocation_record_id: record.id,
            revoked_at: record.timestamp.toISOString(),
            reason: reason ?? 'manual revocation',
          }),
          signal: AbortSignal.timeout(5000),
        });
        return { url, status: res.status };
      }),
    );

    return reply.send({
      persona_id: id,
      revocation_record_id: record.id,
      revoked_at: record.timestamp.toISOString(),
      consumers: webhookResults.map((r) =>
        r.status === 'fulfilled'
          ? { ...r.value, ok: r.value.status >= 200 && r.value.status < 300 }
          : { ok: false, error: String(r.reason) },
      ),
    });
  });
}
