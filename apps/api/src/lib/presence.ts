/**
 * Character presence helper.
 *
 * Computes a lightweight "is this character alive right now?" signal
 * from their most recent activity (MemoryEpisode timestamp). The
 * Studio uses this to render an online dot, "active 4 minutes ago",
 * and the character's currentLocation as a presence cue. Cheap: a
 * single bulk query indexed on (characterId, createdAt).
 *
 * Status thresholds (defaults, tunable via env later):
 *   online   ≤ 15 min
 *   idle     ≤ 2 hours
 *   away     ≤ 24 hours
 *   dormant  > 24 hours OR never
 */

import { prisma } from '../db.js';

export type PresenceStatus = 'online' | 'idle' | 'away' | 'dormant';

export interface Presence {
  status: PresenceStatus;
  lastActivityAt: string | null;
  lastActivityKind: string | null;
  currentLocation: string | null;
}

const ONLINE_MS = 15 * 60 * 1000;
const IDLE_MS = 2 * 60 * 60 * 1000;
const AWAY_MS = 24 * 60 * 60 * 1000;

function classify(lastMs: number | null): PresenceStatus {
  if (lastMs === null) return 'dormant';
  const age = Date.now() - lastMs;
  if (age <= ONLINE_MS) return 'online';
  if (age <= IDLE_MS) return 'idle';
  if (age <= AWAY_MS) return 'away';
  return 'dormant';
}

/**
 * Bulk-load presence for a list of character ids. Single grouped query
 * over MemoryEpisode + a fallback merge with the character row's
 * currentLocation. Returns a map keyed by character id.
 */
export async function loadPresenceForCharacters(
  characters: Array<{ id: string; currentLocation: string | null }>,
): Promise<Map<string, Presence>> {
  const ids = characters.map((c) => c.id);
  const result = new Map<string, Presence>();
  if (ids.length === 0) return result;

  // Fetch the most recent MemoryEpisode per character. The findMany
  // here is bounded by the character set so it stays small even when
  // the episode table grows. We sort desc + dedupe in JS so we don't
  // need a window function.
  const eps = await prisma.memoryEpisode.findMany({
    where: { characterId: { in: ids } },
    orderBy: { createdAt: 'desc' },
    select: { characterId: true, createdAt: true, kind: true, location: true },
    take: ids.length * 4, // small headroom; the dedupe below picks the latest per id
  });

  const seen = new Set<string>();
  const latest = new Map<string, { ts: Date; kind: string; location: string | null }>();
  for (const ep of eps) {
    if (seen.has(ep.characterId)) continue;
    seen.add(ep.characterId);
    latest.set(ep.characterId, { ts: ep.createdAt, kind: ep.kind, location: ep.location });
    if (seen.size === ids.length) break;
  }

  for (const c of characters) {
    const l = latest.get(c.id);
    const lastMs = l ? l.ts.getTime() : null;
    result.set(c.id, {
      status: classify(lastMs),
      lastActivityAt: l ? l.ts.toISOString() : null,
      lastActivityKind: l ? l.kind : null,
      currentLocation: l?.location ?? c.currentLocation,
    });
  }
  return result;
}

/** Single-character convenience. */
export async function loadPresenceForCharacter(
  id: string,
  currentLocation: string | null,
): Promise<Presence> {
  const map = await loadPresenceForCharacters([{ id, currentLocation }]);
  return map.get(id) ?? {
    status: 'dormant',
    lastActivityAt: null,
    lastActivityKind: null,
    currentLocation,
  };
}
