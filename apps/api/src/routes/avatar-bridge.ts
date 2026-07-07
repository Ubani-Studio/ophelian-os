/**
 * Boveda → Ikenga avatar pull.
 *
 * Replaces the first-letter placeholder with a real photo by pulling
 * from the linked Ikenga persona. If the character has no
 * tizitaPersonaId, the route returns a clear error so the UI can prompt
 * the user to link or upload.
 */

import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { fetchPersonaAvatarUrl } from '../lib/ikenga-bridge.js';

export async function avatarBridgeRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /characters/:id/avatar/pull-from-ikenga
  fastify.post<{ Params: { id: string }; Body?: { force?: boolean } }>(
    '/characters/:id/avatar/pull-from-ikenga',
    async (request, reply) => {
      const { id } = request.params;
      const force = request.body?.force ?? false;

      const character = await prisma.character.findUnique({
        where: { id },
        select: { id: true, name: true, tizitaPersonaId: true, avatarUrl: true },
      });
      if (!character) return reply.status(404).send({ error: 'character_not_found' });

      if (character.avatarUrl && !force) {
        return reply.status(200).send({
          status: 'no_change',
          reason: 'character already has an avatarUrl; pass {force:true} to overwrite',
          avatarUrl: character.avatarUrl,
        });
      }

      if (!character.tizitaPersonaId) {
        return reply.status(400).send({
          status: 'no_persona_link',
          reason: 'character has no tizitaPersonaId; link a Ikenga persona first or upload a photo manually',
        });
      }

      const result = await fetchPersonaAvatarUrl(character.tizitaPersonaId);
      if (!result.ok) {
        return reply.status(503).send({
          status: 'tizita_lookup_failed',
          reason: result.reason,
        });
      }

      const updated = await prisma.character.update({
        where: { id },
        data: { avatarUrl: result.url },
        select: { id: true, name: true, avatarUrl: true },
      });
      return {
        status: 'updated',
        characterId: updated.id,
        avatarUrl: updated.avatarUrl,
        sourceFromTizita: result.source,
      };
    },
  );

  // POST /avatars/bulk-pull-from-ikenga
  // Sweeps all characters with tizitaPersonaId + null avatarUrl.
  fastify.post('/avatars/bulk-pull-from-ikenga', async (_request, _reply) => {
    const candidates = await prisma.character.findMany({
      where: { tizitaPersonaId: { not: null }, avatarUrl: null },
      select: { id: true, name: true, tizitaPersonaId: true },
    });
    const results: { characterId: string; name: string; status: string; detail?: string }[] = [];
    for (const c of candidates) {
      if (!c.tizitaPersonaId) continue;
      const r = await fetchPersonaAvatarUrl(c.tizitaPersonaId);
      if (!r.ok) {
        results.push({ characterId: c.id, name: c.name, status: 'failed', detail: r.reason });
        continue;
      }
      await prisma.character.update({ where: { id: c.id }, data: { avatarUrl: r.url } });
      results.push({ characterId: c.id, name: c.name, status: 'updated', detail: r.source });
    }
    return { scanned: candidates.length, results };
  });
}
