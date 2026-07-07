import type { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { fetchTizitaRepUrls } from '../lib/ikenga.js';
import { loadPresenceForCharacters } from '../lib/presence.js';

/**
 * The morning trail. Phase 4 of agentic-build.md.
 *
 * The user (the character with isUser=true) visits the trail to read
 * what's happened across all autonomous characters since their last
 * visit. Each row is a character + their acts in chronological order.
 *
 * Endpoints:
 *  - GET /trail              — aggregate events grouped by character
 *  - POST /trail/mark-seen   — bump the user's lastSeenAt to now
 *
 * The morning trail is the daily-active surface. It's the protest
 * move against feed-shaped social: curated, not accumulated. The
 * user reads → curates (promote / crystallise) → marks seen → walks
 * away from the day.
 */

interface TrailEvent {
  ts: string;
  edgeId: string;
  kind: string;
  form?: string;
  questId?: string;
  summary: string;
  body?: string;
  retention: 'ephemeral' | 'canonical';
  rolled_back: boolean;
  counterpartId: string;
  counterpartName: string;
}

interface TrailCharacter {
  id: string;
  name: string;
  mode: string;
  avatarUrl: string | null;
  tizitaPersonaId: string | null;
  tizitaRepresentativeUrl: string | null;
  identity: unknown;
  events: TrailEvent[];
  presence?: {
    status: 'online' | 'idle' | 'away' | 'dormant';
    lastActivityAt: string | null;
    lastActivityKind: string | null;
    currentLocation: string | null;
  };
}

export async function trailRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /trail
  // Returns the user's last-seen timestamp + every autonomous
  // character with their events since lastSeenAt (newest first per
  // character, characters sorted by most-recently-active).
  fastify.get<{
    Querystring: { since?: string; limit?: string };
  }>('/trail', async (request, reply) => {
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;

    // Find the user anchor. Exactly one character should be
    // isUser=true. If none, fall back to "show all events from
    // recent past."
    const user = await prisma.character.findFirst({ where: { isUser: true } });

    // Determine the window. Explicit since param > user.lastSeenAt > 24h ago.
    let sinceTs: Date;
    if (request.query.since) {
      sinceTs = new Date(request.query.since);
    } else if (user?.lastSeenAt) {
      sinceTs = user.lastSeenAt;
    } else {
      sinceTs = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const sinceISO = sinceTs.toISOString();

    // Pull every autonomous character.
    const autonomous = await prisma.character.findMany({
      where: { mode: { in: ['espíritu', 'twin'] } },
      select: {
        id: true,
        name: true,
        mode: true,
        avatarUrl: true,
        tizitaPersonaId: true,
        identity: true,
        currentLocation: true,
      },
    });

    if (autonomous.length === 0) {
      return reply.send({
        sinceTs: sinceISO,
        userId: user?.id ?? null,
        userLastSeenAt: user?.lastSeenAt?.toISOString() ?? null,
        characters: [] as TrailCharacter[],
        totalEvents: 0,
      });
    }

    const autonomousIds = autonomous.map((c) => c.id);
    const characterById = new Map(autonomous.map((c) => [c.id, c]));

    // Gather all relationship edges where any autonomous character
    // is an actor. Read each edge's eventLog and filter to events
    // whose ts >= sinceTs and whose actors include an autonomous
    // character.
    const edges = await prisma.characterRelationship.findMany({
      where: {
        OR: [
          { sourceCharacterId: { in: autonomousIds } },
          { targetCharacterId: { in: autonomousIds } },
        ],
      },
    });

    // Need names for counterparts that may be non-autonomous
    // (e.g. Ubani is manual but receives messages).
    const counterpartIdsNeeded = new Set<string>();
    for (const edge of edges) {
      counterpartIdsNeeded.add(edge.sourceCharacterId);
      counterpartIdsNeeded.add(edge.targetCharacterId);
    }
    const counterpartCharacters = await prisma.character.findMany({
      where: { id: { in: Array.from(counterpartIdsNeeded) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(counterpartCharacters.map((c) => [c.id, c.name]));

    // Bucket events by character (the autonomous actor).
    const byCharacter = new Map<string, TrailEvent[]>();
    for (const c of autonomous) byCharacter.set(c.id, []);

    for (const edge of edges) {
      const log = Array.isArray(edge.eventLog) ? (edge.eventLog as Array<Record<string, unknown>>) : [];
      for (const ev of log) {
        if (!ev || typeof ev !== 'object') continue;
        const ts = typeof ev.ts === 'string' ? ev.ts : null;
        if (!ts || ts < sinceISO) continue;
        if (ev.rolled_back) continue;
        const actors = Array.isArray(ev.actors) ? (ev.actors as string[]) : [];

        for (const actorId of actors) {
          if (!byCharacter.has(actorId)) continue; // not autonomous
          const counterpartId =
            edge.sourceCharacterId === actorId ? edge.targetCharacterId : edge.sourceCharacterId;
          byCharacter.get(actorId)!.push({
            ts,
            edgeId: edge.id,
            kind: typeof ev.kind === 'string' ? ev.kind : 'thought',
            form: typeof ev.form === 'string' ? ev.form : undefined,
            questId: typeof ev.questId === 'string' ? ev.questId : undefined,
            summary: typeof ev.summary === 'string' ? ev.summary : '',
            body: typeof ev.body === 'string' ? ev.body : undefined,
            retention:
              ev.retention === 'canonical' ? 'canonical' : 'ephemeral',
            rolled_back: !!ev.rolled_back,
            counterpartId,
            counterpartName: nameById.get(counterpartId) ?? counterpartId.slice(0, 6),
          });
        }
      }
    }

    // Sort each character's events newest-first and trim, then drop
    // characters with zero events from the trail (no acts since
    // last visit means nothing to read).
    const characters: TrailCharacter[] = [];
    for (const c of autonomous) {
      const events = byCharacter.get(c.id)!;
      if (events.length === 0) continue;
      events.sort((a, b) => (a.ts < b.ts ? 1 : -1));
      characters.push({
        id: c.id,
        name: c.name,
        mode: c.mode,
        avatarUrl: c.avatarUrl,
        tizitaPersonaId: c.tizitaPersonaId,
        tizitaRepresentativeUrl: null,
        identity: c.identity,
        events: events.slice(0, limit),
      });
    }

    // Sort characters by newest event.
    characters.sort((a, b) => {
      const aTs = a.events[0]?.ts ?? '';
      const bTs = b.events[0]?.ts ?? '';
      if (aTs === bTs) return a.name.localeCompare(b.name);
      return aTs < bTs ? 1 : -1;
    });

    // Enrich Ikenga-bound characters with their representative photo
    // URL (one batch call to Ikenga; non-fatal if Ikenga is offline).
    const personaIds = characters
      .map((c) => c.tizitaPersonaId)
      .filter((id): id is string => !!id);
    const { byPersonaId } = await fetchTizitaRepUrls(personaIds);
    for (const c of characters) {
      c.tizitaRepresentativeUrl = c.tizitaPersonaId
        ? byPersonaId.get(c.tizitaPersonaId) ?? null
        : null;
    }

    // Presence cues. Computes online / idle / away / dormant from
    // the latest MemoryEpisode per character so the Trail can show a
    // live dot + last-active + currentLocation alongside each row.
    const presenceMap = await loadPresenceForCharacters(
      characters.map((c) => {
        const auto = autonomous.find((a) => a.id === c.id);
        return { id: c.id, currentLocation: auto?.currentLocation ?? null };
      }),
    );
    for (const c of characters) {
      const p = presenceMap.get(c.id);
      if (p) c.presence = p;
    }

    const totalEvents = characters.reduce((acc, c) => acc + c.events.length, 0);

    return reply.send({
      sinceTs: sinceISO,
      userId: user?.id ?? null,
      userLastSeenAt: user?.lastSeenAt?.toISOString() ?? null,
      characters,
      totalEvents,
    });
  });

  // POST /trail/mark-seen
  // Bumps the user character's lastSeenAt to now. Called when the
  // user is done reading the morning trail.
  fastify.post('/trail/mark-seen', async (_request, reply) => {
    const user = await prisma.character.findFirst({ where: { isUser: true } });
    if (!user) {
      return reply
        .code(404)
        .send({ error: 'No user character found. Mark a Character with isUser=true.' });
    }
    const now = new Date();
    await prisma.character.update({
      where: { id: user.id },
      data: { lastSeenAt: now },
    });
    return reply.send({ ok: true, lastSeenAt: now.toISOString() });
  });
}
