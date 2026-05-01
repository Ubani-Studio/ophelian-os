/**
 * Tizita federation helper. Fetches representative photo URLs for
 * a set of Tizita-bound personas in one call, returning a map
 * keyed by persona id. Used by routes that render character lists
 * (characters list, trail, altar) so they don't fan out to Tizita
 * per row.
 *
 * Tizita unreachable is non-fatal: returns an empty map and logs.
 */

const DEFAULT_TIZITA_BASE = process.env.TIZITA_API_URL || 'http://localhost:8001/api/v1';
const TIZITA_FETCH_TIMEOUT = 5000;

export interface TizitaRepResult {
  byPersonaId: Map<string, string>;
}

export async function fetchTizitaRepUrls(personaIds: string[]): Promise<TizitaRepResult> {
  if (personaIds.length === 0) {
    return { byPersonaId: new Map() };
  }

  const TIZITA_API_URL = DEFAULT_TIZITA_BASE.replace(/\/$/, '');
  const tizitaBase = TIZITA_API_URL.replace(/\/api\/v1$/, '');

  try {
    const res = await fetch(`${TIZITA_API_URL}/personas/`, {
      signal: AbortSignal.timeout(TIZITA_FETCH_TIMEOUT),
    });
    if (!res.ok) {
      return { byPersonaId: new Map() };
    }
    const json = (await res.json()) as {
      personas?: Array<{ id: string; representative_photo_url?: string | null }>;
    };
    const byPersonaId = new Map<string, string>();
    const personaSet = new Set(personaIds);
    for (const p of json.personas ?? []) {
      if (!personaSet.has(p.id)) continue;
      if (!p.representative_photo_url) continue;
      const fullUrl = p.representative_photo_url.startsWith('http')
        ? p.representative_photo_url
        : `${tizitaBase}${p.representative_photo_url}`;
      byPersonaId.set(p.id, fullUrl);
    }
    return { byPersonaId };
  } catch {
    // Tizita offline or timed out; render without rep URLs.
    return { byPersonaId: new Map() };
  }
}
