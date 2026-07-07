/**
 * Places + StoryArcs routes.
 *
 * Locations:
 *   GET    /places                            list all known locations + counts
 *   GET    /places/:name                      detail with image + recent events + occupants
 *   PUT    /places/:name                      upsert (description / kind / vibe / imageUrl)
 *   POST   /places/:name/sync-image-from-ikenga
 *
 * Story arcs:
 *   GET    /arcs                              list arcs
 *   POST   /arcs                              create
 *   GET    /arcs/:id
 *   PATCH  /arcs/:id                          update fields
 *   POST   /arcs/:id/advance                  move to next beat
 *   POST   /arcs/:id/participants             add a character
 *   DELETE /arcs/:id/participants/:charId
 */

import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { DECOLONIAL_ARCS, buildBeatsFromPrimary, type ArcPrimary } from '../lib/decolonial-arcs.js';
import { publishLive } from '../lib/live-bus.js';

const TIZITA_API_URL = process.env.TIZITA_API_URL || 'http://localhost:8123';
const TIZITA_API_PREFIX = process.env.TIZITA_API_PREFIX || '/api/v1';

interface PlacePut {
  description?: string;
  kind?: string;
  vibe?: string;
  imageUrl?: string | null;
  tizitaPhotoId?: string | null;
  metadata?: Record<string, unknown>;
}

interface ArcCreate {
  title: string;
  description?: string;
  status?: 'draft' | 'active' | 'concluded' | 'shelved';
  beats?: Array<{ title: string; body?: string; occurredAt?: string }>;
  tags?: string[];
  /** One of the 10 decolonial primaries. When set without explicit beats[],
   *  the arc auto-seeds with the primary's 5 phases. */
  primary?: ArcPrimary;
  /** Cultural variant, free text from the primary's variants[] list. */
  variant?: string;
}

interface ArcPatch extends Partial<ArcCreate> {
  currentBeatIndex?: number;
}

/**
 * Resolve a Ikenga cover photo for a place name. Tries the new Ikenga
 * Place entity first (curated cluster with chosen cover), then falls
 * back to the legacy free-text Photo.location field.
 */
async function resolveTizitaCover(name: string): Promise<
  | { status: 'ok'; url: string; photoId: string | null; source: 'tizita_place' | 'tizita_location' }
  | { status: 'no_match'; reason: string }
  | { status: 'tizita_unreachable'; reason: string }
> {
  // Step 1 — Ikenga Place entity (curated cluster).
  try {
    const res = await fetch(`${TIZITA_API_URL}${TIZITA_API_PREFIX}/places`);
    if (res.ok) {
      const places = (await res.json()) as Array<{
        id: string;
        name: string;
        cover_photo_id: string | null;
        cover_photo_url: string | null;
      }>;
      const lower = name.toLowerCase();
      const match = places.find((p) => p.name.toLowerCase() === lower);
      if (match?.cover_photo_url) {
        const url = `${TIZITA_API_URL}${match.cover_photo_url.startsWith('/') ? '' : '/'}${match.cover_photo_url}`;
        return { status: 'ok', url, photoId: match.cover_photo_id, source: 'tizita_place' };
      }
    }
  } catch (e) {
    return { status: 'tizita_unreachable', reason: (e as Error).message };
  }

  // Step 2 — legacy fallback: free-text Photo.location.
  try {
    const res = await fetch(
      `${TIZITA_API_URL}${TIZITA_API_PREFIX}/photos/by-location?location=${encodeURIComponent(name)}&limit=10`,
    );
    if (res.ok) {
      const list = (await res.json()) as Array<{ id: string }>;
      if (Array.isArray(list) && list.length > 0) {
        const first = list[0];
        return {
          status: 'ok',
          url: `${TIZITA_API_URL}${TIZITA_API_PREFIX}/photos/file/${first.id}`,
          photoId: first.id,
          source: 'tizita_location',
        };
      }
    }
  } catch (e) {
    return { status: 'tizita_unreachable', reason: (e as Error).message };
  }

  return {
    status: 'no_match',
    reason: `No Ikenga Place or photo matched "${name}".`,
  };
}

export async function placesAndArcsRoutes(fastify: FastifyInstance): Promise<void> {
  // ----- Places -----

  fastify.get('/places', async (_req, _reply) => {
    const places = await prisma.location.findMany({ orderBy: { updatedAt: 'desc' } });
    // augment with character counts + event counts
    const augmented = await Promise.all(
      places.map(async (p) => {
        const [chars, events] = await Promise.all([
          prisma.character.count({
            where: { currentLocation: { contains: p.name, mode: 'insensitive' } },
          }),
          prisma.locationEvent.count({
            where: { location: { contains: p.name, mode: 'insensitive' }, expiresAt: { gt: new Date() } },
          }),
        ]);
        return { ...p, charactersHere: chars, eventsActive: events };
      }),
    );
    return { places: augmented };
  });

  fastify.get<{ Params: { name: string } }>('/places/:name', async (request, reply) => {
    const name = decodeURIComponent(request.params.name);
    const [place, characters, events] = await Promise.all([
      prisma.location.findUnique({ where: { name } }),
      prisma.character.findMany({
        where: { currentLocation: { contains: name, mode: 'insensitive' } },
        select: { id: true, name: true, avatarUrl: true, currentLocation: true },
      }),
      prisma.locationEvent.findMany({
        where: { location: { contains: name, mode: 'insensitive' }, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    return {
      place: place ?? { name, description: '', kind: 'place', vibe: '', imageUrl: null, tizitaPhotoId: null },
      charactersHere: characters,
      recentEvents: events,
    };
  });

  fastify.put<{ Params: { name: string }; Body: PlacePut }>('/places/:name', async (request, _reply) => {
    const name = decodeURIComponent(request.params.name);
    const body = request.body ?? {};
    const place = await prisma.location.upsert({
      where: { name },
      update: {
        description: body.description ?? undefined,
        kind: body.kind ?? undefined,
        vibe: body.vibe ?? undefined,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
        tizitaPhotoId: body.tizitaPhotoId !== undefined ? body.tizitaPhotoId : undefined,
        metadata: body.metadata ?? undefined,
      },
      create: {
        name,
        description: body.description ?? '',
        kind: body.kind ?? 'place',
        vibe: body.vibe ?? '',
        imageUrl: body.imageUrl ?? null,
        tizitaPhotoId: body.tizitaPhotoId ?? null,
        metadata: body.metadata ?? {},
      },
    });
    return { place };
  });

  // POST /places/:name/sync-image-from-ikenga
  // Resolution order:
  //   1. Ikenga Place entity (curated cluster) by exact name match → use its cover.
  //   2. Legacy fallback: highest-ranked photo by free-text Photo.location.
  fastify.post<{ Params: { name: string }; Body?: { force?: boolean } }>(
    '/places/:name/sync-image-from-ikenga',
    async (request, reply) => {
      const name = decodeURIComponent(request.params.name);
      const force = request.body?.force ?? false;
      const existing = await prisma.location.findUnique({ where: { name } });
      if (existing?.imageUrl && !force) {
        return { status: 'no_change', reason: 'imageUrl already set; pass {force:true} to overwrite', place: existing };
      }
      const resolved = await resolveTizitaCover(name);
      if (resolved.status !== 'ok') {
        if (resolved.status === 'tizita_unreachable') {
          return reply.status(503).send(resolved);
        }
        return reply.status(404).send(resolved);
      }
      const place = await prisma.location.upsert({
        where: { name },
        update: { imageUrl: resolved.url, tizitaPhotoId: resolved.photoId },
        create: { name, imageUrl: resolved.url, tizitaPhotoId: resolved.photoId },
      });
      return { status: 'synced', source: resolved.source, place };
    },
  );

  // POST /places/sync-from-ikenga
  // Walks every Ikenga Place and ensures a matching Boveda Location exists.
  // Creates new ones where missing, refreshes covers where stale (or always
  // when force=true). Returns a summary so the writer can see what landed.
  fastify.post<{ Body?: { force?: boolean } }>(
    '/places/sync-from-ikenga',
    async (request, reply) => {
      const force = request.body?.force ?? false;
      let tizitaPlaces: Array<{
        id: string;
        name: string;
        kind: string;
        vibe: string | null;
        description: string | null;
        cover_photo_id: string | null;
        cover_photo_url: string | null;
        photo_count: number;
      }> = [];
      try {
        const res = await fetch(`${TIZITA_API_URL}${TIZITA_API_PREFIX}/places`);
        if (!res.ok) {
          return reply.status(res.status).send({
            status: 'tizita_error',
            reason: `Ikenga /places returned ${res.status}`,
          });
        }
        tizitaPlaces = await res.json();
      } catch (e) {
        return reply.status(503).send({
          status: 'tizita_unreachable',
          reason: (e as Error).message,
        });
      }

      const created: string[] = [];
      const updated: string[] = [];
      const skipped: string[] = [];

      for (const tp of tizitaPlaces) {
        const cover = tp.cover_photo_url
          ? `${TIZITA_API_URL}${tp.cover_photo_url.startsWith('/') ? '' : '/'}${tp.cover_photo_url}`
          : null;
        const existing = await prisma.location.findUnique({ where: { name: tp.name } });
        if (!existing) {
          await prisma.location.create({
            data: {
              name: tp.name,
              kind: tp.kind || 'place',
              description: tp.description || '',
              vibe: tp.vibe || '',
              imageUrl: cover,
              tizitaPhotoId: tp.cover_photo_id,
            },
          });
          created.push(tp.name);
          continue;
        }
        if (!force && existing.imageUrl) {
          skipped.push(tp.name);
          continue;
        }
        await prisma.location.update({
          where: { name: tp.name },
          data: {
            // Don't clobber description/vibe if the writer has set their own
            // (Boveda owns narrative; Ikenga owns visual). Cover always refreshes.
            imageUrl: cover ?? existing.imageUrl,
            tizitaPhotoId: tp.cover_photo_id ?? existing.tizitaPhotoId,
            ...(existing.description ? {} : { description: tp.description || '' }),
            ...(existing.vibe ? {} : { vibe: tp.vibe || '' }),
            ...(existing.kind === 'place' && tp.kind !== 'place' ? { kind: tp.kind } : {}),
          },
        });
        updated.push(tp.name);
      }

      return {
        status: 'ok',
        scanned: tizitaPlaces.length,
        created: created.length,
        updated: updated.length,
        skipped: skipped.length,
        details: { created, updated, skipped },
      };
    },
  );

  // ----- Story Arcs -----

  fastify.get('/arcs', async (_req, _reply) => {
    const arcs = await prisma.storyArc.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { participants: true },
    });
    return { arcs };
  });

  fastify.post<{ Body: ArcCreate }>('/arcs', async (request, _reply) => {
    const body = request.body;
    // If a decolonial primary is selected, auto-derive temperature, shadow,
    // glyph, and seed beats from the canonical 5-phase structure.
    const primaryDef = body.primary ? DECOLONIAL_ARCS[body.primary] : null;
    const beats = body.beats ?? (primaryDef ? buildBeatsFromPrimary(body.primary as ArcPrimary) : []);
    const arc = await prisma.storyArc.create({
      data: {
        title: body.title,
        description: body.description ?? primaryDef?.definition ?? '',
        status: body.status ?? 'draft',
        primary: body.primary ?? null,
        variant: body.variant ?? null,
        temperature: primaryDef?.temperature ?? null,
        shadowPrimary: primaryDef?.shadow ?? null,
        glyph: primaryDef?.glyph ?? null,
        beats,
        tags: body.tags ?? (body.primary ? [body.primary, ...(body.variant ? [`variant:${body.variant}`] : [])] : []),
        startedAt: body.status === 'active' ? new Date() : null,
      },
    });
    return { arc };
  });

  // Canonical 10 primaries — used by Studio for autocomplete + variant pickers.
  fastify.get('/arcs/primaries', async (_req, _reply) => {
    return { primaries: Object.values(DECOLONIAL_ARCS) };
  });

  fastify.get<{ Params: { primary: string } }>('/arcs/primaries/:primary', async (req, reply) => {
    const def = DECOLONIAL_ARCS[req.params.primary as ArcPrimary];
    if (!def) return reply.status(404).send({ error: 'unknown_primary' });
    return def;
  });

  fastify.get<{ Params: { id: string } }>('/arcs/:id', async (request, reply) => {
    const arc = await prisma.storyArc.findUnique({
      where: { id: request.params.id },
      include: { participants: { include: { } } as never },
    });
    if (!arc) return reply.status(404).send({ error: 'arc_not_found' });
    return { arc };
  });

  fastify.patch<{ Params: { id: string }; Body: ArcPatch }>('/arcs/:id', async (request, reply) => {
    const arc = await prisma.storyArc.findUnique({ where: { id: request.params.id } });
    if (!arc) return reply.status(404).send({ error: 'arc_not_found' });
    const data: Record<string, unknown> = {};
    if (request.body.title !== undefined) data.title = request.body.title;
    if (request.body.description !== undefined) data.description = request.body.description;
    if (request.body.status !== undefined) {
      data.status = request.body.status;
      if (request.body.status === 'active' && !arc.startedAt) data.startedAt = new Date();
      if (request.body.status === 'concluded') data.endedAt = new Date();
    }
    if (request.body.beats !== undefined) data.beats = request.body.beats;
    if (request.body.currentBeatIndex !== undefined) data.currentBeatIndex = request.body.currentBeatIndex;
    if (request.body.tags !== undefined) data.tags = request.body.tags;
    const updated = await prisma.storyArc.update({ where: { id: arc.id }, data });
    return { arc: updated };
  });

  fastify.post<{ Params: { id: string } }>('/arcs/:id/advance', async (request, reply) => {
    const arc = await prisma.storyArc.findUnique({
      where: { id: request.params.id },
      include: { participants: true },
    });
    if (!arc) return reply.status(404).send({ error: 'arc_not_found' });
    const beats = (Array.isArray(arc.beats) ? arc.beats : []) as Array<{ title: string; body?: string }>;
    const next = arc.currentBeatIndex + 1;
    const participants = arc.participants ?? [];

    if (next >= beats.length) {
      const updated = await prisma.storyArc.update({
        where: { id: arc.id },
        data: { status: 'concluded', endedAt: new Date() },
      });
      // Live: broadcast conclusion to every participant's stream so the
      // Unreal scene knows the arc has ended.
      for (const p of participants) {
        publishLive({
          type: 'beat_advance',
          characterId: p.characterId,
          payload: {
            arcId: arc.id,
            arcTitle: arc.title,
            primary: arc.primary,
            status: 'concluded',
            beatIndex: arc.currentBeatIndex,
            totalBeats: beats.length,
          },
        });
      }
      return { arc: updated, status: 'concluded' };
    }

    const updated = await prisma.storyArc.update({
      where: { id: arc.id },
      data: { currentBeatIndex: next },
    });
    const beat = beats[next];
    for (const p of participants) {
      publishLive({
        type: 'beat_advance',
        characterId: p.characterId,
        payload: {
          arcId: arc.id,
          arcTitle: arc.title,
          primary: arc.primary,
          status: 'advanced',
          beatIndex: next,
          totalBeats: beats.length,
          beat,
          role: p.role,
        },
      });
    }
    return { arc: updated, status: 'advanced', currentBeat: beat };
  });

  fastify.post<{ Params: { id: string }; Body: { characterId: string; role?: string } }>(
    '/arcs/:id/participants',
    async (request, reply) => {
      const { id } = request.params;
      const { characterId, role } = request.body;
      const character = await prisma.character.findUnique({ where: { id: characterId } });
      if (!character) return reply.status(404).send({ error: 'character_not_found' });
      const arc = await prisma.storyArc.findUnique({ where: { id } });
      if (!arc) return reply.status(404).send({ error: 'arc_not_found' });
      const p = await prisma.arcParticipant.upsert({
        where: { arcId_characterId: { arcId: id, characterId } },
        update: { role: role ?? 'lead' },
        create: { arcId: id, characterId, role: role ?? 'lead' },
      });
      return { participant: p };
    },
  );

  fastify.delete<{ Params: { id: string; charId: string } }>(
    '/arcs/:id/participants/:charId',
    async (request, _reply) => {
      const { id, charId } = request.params;
      await prisma.arcParticipant.deleteMany({ where: { arcId: id, characterId: charId } });
      return { removed: true };
    },
  );
}
