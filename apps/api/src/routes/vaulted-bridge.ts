/**
 * Boveda → Vaulted bridge routes.
 *
 * Two operations per character:
 *   POST /characters/:id/vaulted/register   — try to register; queue if unreachable
 *   POST /characters/:id/vaulted/sync       — refresh status from Vaulted
 *
 * The register operation is RESILIENT: if Vaulted is offline, the
 * character row is marked vaultedStatus='pending_registration' with
 * vaultedLastError holding the reason. A future scheduler can drain
 * pending registrations.
 */

import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import {
  registerCharacterAsLoraArtifact,
  fetchVaultedStatus,
} from '../lib/vaulted-bridge.js';

interface RegisterBody {
  weightsStorageUri: string;
  weightsSha256: string;
  artifactKind?: 'style' | 'character' | 'persona';
  baseModel?: string;
  rank?: number;
  trainingSteps?: number;
  triggerWord?: string;
  consentAttestation?: Record<string, unknown>;
  rightsAssertion?: string;
}

export async function vaultedBridgeRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // POST /characters/:id/vaulted/register
  fastify.post<{ Params: { id: string }; Body: RegisterBody }>(
    '/characters/:id/vaulted/register',
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body ?? ({} as RegisterBody);

      if (!body.weightsStorageUri || !body.weightsSha256) {
        return reply
          .status(400)
          .send({ error: 'weightsStorageUri + weightsSha256 are required' });
      }

      const character = await prisma.character.findUnique({ where: { id } });
      if (!character) {
        return reply.status(404).send({ error: 'character_not_found' });
      }

      const result = await registerCharacterAsLoraArtifact({
        character,
        weightsStorageUri: body.weightsStorageUri,
        weightsSha256: body.weightsSha256,
        artifactKind: body.artifactKind,
        baseModel: body.baseModel,
        rank: body.rank,
        trainingSteps: body.trainingSteps,
        triggerWord: body.triggerWord,
        consentAttestation: body.consentAttestation,
        rightsAssertion: body.rightsAssertion,
      });

      const now = new Date();
      if (result.ok) {
        const updated = await prisma.character.update({
          where: { id },
          data: {
            vaultedArtifactId: result.vaultedArtifactId,
            vaultedStatus: 'registered',
            vaultedRegisteredAt: now,
            vaultedLastSyncedAt: now,
            vaultedLastError: null,
          },
        });
        return {
          status: 'registered',
          vaultedArtifactId: result.vaultedArtifactId,
          loraArtifact: result.loraArtifact,
          characterId: updated.id,
        };
      }

      // Resilient fallback: mark pending so a sync job can retry later.
      await prisma.character.update({
        where: { id },
        data: {
          vaultedStatus: 'pending_registration',
          vaultedLastSyncedAt: now,
          vaultedLastError: `${result.reason}: ${result.detail}`,
        },
      });
      return reply.status(202).send({
        status: 'pending_registration',
        reason: result.reason,
        detail: result.detail,
        characterId: id,
        note: 'Vaulted is offline or unreachable. Registration is queued; trigger /sync when Vaulted is back.',
      });
    },
  );

  // POST /characters/:id/vaulted/sync
  fastify.post<{ Params: { id: string } }>(
    '/characters/:id/vaulted/sync',
    async (request, reply) => {
      const { id } = request.params;
      const character = await prisma.character.findUnique({ where: { id } });
      if (!character) {
        return reply.status(404).send({ error: 'character_not_found' });
      }
      if (!character.vaultedArtifactId) {
        return reply.status(400).send({
          error: 'character_not_yet_registered',
          hint: 'Call /vaulted/register first',
        });
      }
      const result = await fetchVaultedStatus(character.vaultedArtifactId);
      const now = new Date();
      if (!result.ok) {
        await prisma.character.update({
          where: { id },
          data: {
            vaultedLastSyncedAt: now,
            vaultedLastError: result.reason,
          },
        });
        return reply.status(503).send({
          status: 'sync_failed',
          reason: result.reason,
          characterId: id,
        });
      }
      const newStatus = result.acceptedLicenseCount > 0
        ? 'licensed'
        : result.artifact.is_listed
          ? 'listed'
          : 'registered';
      await prisma.character.update({
        where: { id },
        data: {
          vaultedStatus: newStatus,
          vaultedLastSyncedAt: now,
          vaultedLastError: null,
        },
      });
      return {
        status: newStatus,
        artifact: result.artifact,
        acceptedLicenseCount: result.acceptedLicenseCount,
        characterId: id,
      };
    },
  );

  // GET /characters/:id/vaulted -- current bridge state for the UI tile
  fastify.get<{ Params: { id: string } }>(
    '/characters/:id/vaulted',
    async (request, reply) => {
      const { id } = request.params;
      const c = await prisma.character.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          vaultedArtifactId: true,
          vaultedStatus: true,
          vaultedRegisteredAt: true,
          vaultedLastSyncedAt: true,
          vaultedLastError: true,
        },
      });
      if (!c) return reply.status(404).send({ error: 'character_not_found' });
      return c;
    },
  );
}
