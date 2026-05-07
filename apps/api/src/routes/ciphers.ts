/**
 * Cipher routes. UE pulls inventory + progress here, presence events
 * bump Cipher progress, and explicit decrypt calls flip state to
 * unlocked when conditions are met.
 *
 *   GET   /ciphers/inventory/:playerId   list all Ciphers + each one's
 *                                         visible state for this player
 *   POST  /ciphers/:id/decrypt           player presents the Cipher to
 *                                         the world; if their progress
 *                                         meets the threshold, returns
 *                                         the unlocked payload
 *   POST  /presence/event                UE reports player approached/
 *                                         departed/listened. Bumps
 *                                         progress on any active
 *                                         encounter or threshold cipher
 *                                         tied to this character/place.
 *   POST  /ciphers/mint                  admin/manual mint (debug)
 */

import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import {
  bumpProgress,
  mintCipher,
  pickActiveCipherFor,
  recordCipherEvent,
} from '../lib/cipher.js';

export async function cipherRoutes(fastify: FastifyInstance): Promise<void> {
  // ─────────────────────────────────────────────────────────────────────
  // GET /ciphers/inventory/:playerId
  // Returns every Cipher this player has touched (progress > 0) with its
  // visible state. Locked Ciphers show only the cryptic surface; unlocked
  // ones include the full reveal.
  // ─────────────────────────────────────────────────────────────────────
  fastify.get<{ Params: { playerId: string } }>(
    '/ciphers/inventory/:playerId',
    async (request, reply) => {
      const { playerId } = request.params;

      const progressRows = await prisma.cipherProgress.findMany({
        where: { playerId },
        include: { cipher: true },
        orderBy: { updatedAt: 'desc' },
      });

      const items = progressRows.map((row) => {
        const c = row.cipher;
        const isUnlocked = c.state === 'unlocked';
        return {
          id: c.id,
          glyph: c.signature,
          rarity: c.rarity,
          kind: c.kind,
          state: c.state,
          source: {
            character_id: c.sourceCharacterId,
            location_name: c.sourceLocationName,
            episode_id: c.sourceEpisodeId,
          },
          unlock: {
            type: c.unlockType,
            required: c.unlockValue,
            current: row.currentValue,
          },
          payload_locked: c.payloadLocked,
          payload_unlocked: isUnlocked ? c.payloadUnlocked : null,
          payload_hint: isUnlocked ? null : c.payloadHint,
          created_at: c.createdAt.toISOString(),
          unlocked_at: c.unlockedAt?.toISOString() ?? null,
        };
      });

      // Counters useful for the UE HUD
      const counters = {
        total: items.length,
        unlocked: items.filter((i) => i.state === 'unlocked').length,
        sigil_count: items.filter((i) => i.rarity === 'sigil').length,
        sigil_unlocked: items.filter(
          (i) => i.rarity === 'sigil' && i.state === 'unlocked',
        ).length,
        rare_count: items.filter((i) => i.rarity === 'rare').length,
        rare_unlocked: items.filter(
          (i) => i.rarity === 'rare' && i.state === 'unlocked',
        ).length,
      };

      return reply.send({ player_id: playerId, counters, ciphers: items });
    },
  );

  // ─────────────────────────────────────────────────────────────────────
  // POST /ciphers/:id/decrypt
  // Player attempts to decode a Cipher. If their accumulated progress
  // meets the unlock threshold, flip state to 'unlocked' and return the
  // full payload. Otherwise return the hint + remaining progress.
  // ─────────────────────────────────────────────────────────────────────
  fastify.post<{
    Params: { id: string };
    Body: { playerId: string };
  }>('/ciphers/:id/decrypt', async (request, reply) => {
    const { id } = request.params;
    const { playerId } = request.body || ({} as { playerId?: string });
    if (!playerId) {
      return reply.code(400).send({ error: 'playerId_required' });
    }

    const cipher = await prisma.cipher.findUnique({ where: { id } });
    if (!cipher) {
      return reply.code(404).send({ error: 'cipher_not_found' });
    }

    const progress = await prisma.cipherProgress.findUnique({
      where: { playerId_cipherId: { playerId, cipherId: id } },
    });
    const current = progress?.currentValue ?? 0;

    if (cipher.state === 'unlocked') {
      return reply.send({
        state: 'unlocked',
        payload: cipher.payloadUnlocked,
        glyph: cipher.signature,
        rarity: cipher.rarity,
      });
    }

    if (current >= cipher.unlockValue) {
      const updated = await prisma.cipher.update({
        where: { id },
        data: { state: 'unlocked', unlockedAt: new Date() },
      });
      return reply.send({
        state: 'unlocked',
        payload: updated.payloadUnlocked,
        glyph: updated.signature,
        rarity: updated.rarity,
        just_unlocked: true,
      });
    }

    return reply.send({
      state: 'locked',
      hint: cipher.payloadHint,
      progress: { current, required: cipher.unlockValue },
      glyph: cipher.signature,
      rarity: cipher.rarity,
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // POST /presence/event
  // UE reports a presence event (player approached, departed, listened
  // to a character). Logs the event + bumps Cipher progress.
  // ─────────────────────────────────────────────────────────────────────
  fastify.post<{
    Body: {
      playerId: string;
      characterId?: string;
      locationName?: string;
      kind?: 'approached' | 'departed' | 'listened';
      metadata?: Record<string, unknown>;
    };
  }>('/presence/event', async (request, reply) => {
    const body = request.body || ({} as never);
    const playerId = body.playerId;
    if (!playerId) return reply.code(400).send({ error: 'playerId_required' });

    const event = await prisma.presenceEvent.create({
      data: {
        playerId,
        characterId: body.characterId ?? null,
        locationName: body.locationName ?? null,
        kind: body.kind ?? 'approached',
        metadata: (body.metadata as never) ?? {},
      },
    });

    // Pull source character + location context for cipher generation
    let characterName: string | undefined;
    let characterTongue: string | undefined;
    if (body.characterId) {
      const c = await prisma.character.findUnique({
        where: { id: body.characterId },
        select: { name: true, tongue: true },
      });
      characterName = c?.name;
      const tongue = (c?.tongue ?? {}) as Record<string, unknown>;
      const tongueLines: string[] = [];
      if (typeof tongue.cadence === 'string') tongueLines.push(`cadence: ${tongue.cadence}`);
      if (typeof tongue.register === 'string') tongueLines.push(`register: ${tongue.register}`);
      if (Array.isArray(tongue.idioms)) {
        const idioms = tongue.idioms.filter((s): s is string => typeof s === 'string').slice(0, 4);
        if (idioms.length) tongueLines.push(`idioms: ${idioms.join(' | ')}`);
      }
      characterTongue = tongueLines.join('\n');
    }

    let locationVibe: string | undefined;
    if (body.locationName) {
      const loc = await prisma.location.findUnique({ where: { name: body.locationName } });
      locationVibe = loc?.vibe;
    }

    // Bump Cipher progress (or mint new) for this presence event
    const cipher = await recordCipherEvent({
      playerId,
      kind: 'encounter',
      characterId: body.characterId ?? null,
      characterName,
      characterTongue,
      locationName: body.locationName ?? null,
      locationVibe,
      episodeId: event.id,
      episodeContent: undefined,
    });

    return reply.send({
      ok: true,
      event_id: event.id,
      cipher,
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // POST /ciphers/mint  (debug / manual creation)
  // Mints a Cipher directly. Useful for seeding the system or manual
  // story beats.
  // ─────────────────────────────────────────────────────────────────────
  fastify.post<{
    Body: {
      kind: 'encounter' | 'witness' | 'threshold';
      characterId?: string;
      locationName?: string;
      episodeContent?: string;
    };
  }>('/ciphers/mint', async (request, reply) => {
    const body = request.body || ({} as never);
    if (!body.kind) return reply.code(400).send({ error: 'kind_required' });

    let characterName: string | undefined;
    let characterTongue: string | undefined;
    if (body.characterId) {
      const c = await prisma.character.findUnique({
        where: { id: body.characterId },
        select: { name: true, tongue: true },
      });
      characterName = c?.name;
      const tongue = (c?.tongue ?? {}) as Record<string, unknown>;
      const tongueLines: string[] = [];
      if (typeof tongue.cadence === 'string') tongueLines.push(`cadence: ${tongue.cadence}`);
      if (typeof tongue.register === 'string') tongueLines.push(`register: ${tongue.register}`);
      characterTongue = tongueLines.join('\n');
    }

    let locationVibe: string | undefined;
    if (body.locationName) {
      const loc = await prisma.location.findUnique({ where: { name: body.locationName } });
      locationVibe = loc?.vibe;
    }

    const minted = await mintCipher({
      kind: body.kind,
      characterId: body.characterId ?? null,
      characterName,
      characterTongue,
      locationName: body.locationName ?? null,
      locationVibe,
      episodeContent: body.episodeContent,
    });

    return reply.send(minted);
  });

  // Surface the active locked-cipher resolver for debugging / wiring
  // from external services.
  fastify.get<{
    Querystring: { characterId?: string; locationName?: string; kind?: string };
  }>('/ciphers/active', async (request, reply) => {
    const kind = (request.query.kind ?? 'encounter') as
      | 'encounter'
      | 'witness'
      | 'threshold';
    const cipher = await pickActiveCipherFor(
      request.query.characterId ?? null,
      request.query.locationName ?? null,
      kind,
    );
    return reply.send({ cipher });
  });
}
