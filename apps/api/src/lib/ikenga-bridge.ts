// Ikenga (Tizita) bridge · server-side helper that fetches a persona's
// representative photo URL from the Ikenga FastAPI backend so Boveda
// can pull avatars when a character is linked via tizitaPersonaId.
//
// Defaults match the Ikenga dev port (8001). Override with TIZITA_API_URL.

const TIZITA_API_URL = (process.env.TIZITA_API_URL || 'http://localhost:8123/api/v1').replace(/\/$/, '');
const FILE_HOST = TIZITA_API_URL.replace(/\/api\/v1$/, '');

export type FetchPersonaAvatarResult =
  | { ok: true; url: string; source: string }
  | { ok: false; reason: string };

export async function fetchPersonaAvatarUrl(personaId: string): Promise<FetchPersonaAvatarResult> {
  if (!personaId) return { ok: false, reason: 'persona_id missing' };

  try {
    const res = await fetch(`${TIZITA_API_URL}/personas/${encodeURIComponent(personaId)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, reason: `tizita responded ${res.status}` };
    }

    const persona = (await res.json()) as { representative_photo_url?: string | null };
    const raw = persona.representative_photo_url;
    if (!raw) return { ok: false, reason: 'persona has no representative_photo_url' };

    const url = raw.startsWith('http') ? raw : `${FILE_HOST}${raw}`;
    return { ok: true, url, source: 'tizita' };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : 'tizita unreachable',
    };
  }
}
