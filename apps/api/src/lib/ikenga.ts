// Ikenga batch helper · returns a Map of personaId → representative
// photo URL by hitting the Ikenga FastAPI persona list once. Non-fatal
// when Ikenga is offline: returns an empty map so callers fall through
// to whatever default they keep.

const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8123/api/v1').replace(/\/$/, '');
const FILE_HOST = TIZITA_API_URL.replace(/\/api\/v1$/, '');

export interface TizitaRepUrlResult {
  byPersonaId: Map<string, string>;
  available: boolean;
}

export async function fetchTizitaRepUrls(personaIds: string[]): Promise<TizitaRepUrlResult> {
  const byPersonaId = new Map<string, string>();
  if (personaIds.length === 0) return { byPersonaId, available: true };

  try {
    const res = await fetch(`${TIZITA_API_URL}/personas/`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { byPersonaId, available: false };

    const json = (await res.json()) as {
      personas?: Array<{ id: string; representative_photo_url?: string | null }>;
    };
    const wanted = new Set(personaIds);
    for (const p of json.personas ?? []) {
      if (!wanted.has(p.id)) continue;
      if (!p.representative_photo_url) continue;
      const url = p.representative_photo_url.startsWith('http')
        ? p.representative_photo_url
        : `${FILE_HOST}${p.representative_photo_url}`;
      byPersonaId.set(p.id, url);
    }
    return { byPersonaId, available: true };
  } catch {
    return { byPersonaId, available: false };
  }
}
