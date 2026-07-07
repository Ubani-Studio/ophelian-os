/**
 * Boveda → Ikenga bridge.
 *
 * Ikenga is the photo / persona truth layer. When a Boveda character
 * carries a tizitaPersonaId, we can pull a representative photo URL
 * from Ikenga to use as the character's avatar — instead of falling
 * back to the first-letter placeholder.
 */

const TIZITA_API_URL = process.env.TIZITA_API_URL || 'http://localhost:8123';
const TIZITA_API_PREFIX = process.env.TIZITA_API_PREFIX || '/api/v1';
const TIZITA_TIMEOUT_MS = Number(process.env.TIZITA_TIMEOUT_MS || 4000);

export interface TizitaPersonaPhoto {
  ok: true;
  url: string;
  photoId: string;
  source: 'persona_cover' | 'persona_first_photo' | 'persona_top_rated';
}

export interface TizitaBridgeFailure {
  ok: false;
  reason: string;
}

export async function fetchPersonaAvatarUrl(
  personaId: string,
): Promise<TizitaPersonaPhoto | TizitaBridgeFailure> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIZITA_TIMEOUT_MS);
  const tried: string[] = [];

  // Try in order: representative photo (PersonaDetail), then /best (PhotoListResponse)
  const candidates: { path: string; sourceLabel: TizitaPersonaPhoto['source'] }[] = [
    { path: `${TIZITA_API_PREFIX}/personas/${personaId}`, sourceLabel: 'persona_cover' },
    { path: `${TIZITA_API_PREFIX}/personas/${personaId}/best?limit=1`, sourceLabel: 'persona_top_rated' },
  ];

  try {
    for (const c of candidates) {
      tried.push(c.path);
      try {
        const res = await fetch(`${TIZITA_API_URL}${c.path}`, { signal: controller.signal });
        if (!res.ok) continue;
        const data: unknown = await res.json();
        // PersonaDetail shape: { id, representative_photo_url, photos: [...] }
        const obj = (data ?? {}) as Record<string, unknown>;
        const repUrl = typeof obj.representative_photo_url === 'string' ? obj.representative_photo_url : null;
        const url = repUrl ?? extractUrl(data);
        const photoId = extractId(data);
        if (url) {
          clearTimeout(timer);
          const fullUrl = url.startsWith('http')
            ? url
            : `${TIZITA_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
          return {
            ok: true,
            url: fullUrl,
            photoId: photoId ?? 'unknown',
            source: c.sourceLabel,
          };
        }
      } catch {
        // try next candidate
      }
    }
  } finally {
    clearTimeout(timer);
  }

  return {
    ok: false,
    reason: `No photo URL from Ikenga persona ${personaId}. Tried: ${tried.join(', ')}`,
  };
}

function extractUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  // Direct URL field
  if (typeof obj.url === 'string') return obj.url;
  if (typeof obj.file_url === 'string') return obj.file_url;
  if (typeof obj.thumbnail_url === 'string') return obj.thumbnail_url;

  // photo[].url shape (list response)
  if (Array.isArray(obj.photos) && obj.photos.length > 0) {
    return extractUrl(obj.photos[0]);
  }
  if (Array.isArray(obj.items) && obj.items.length > 0) {
    return extractUrl(obj.items[0]);
  }
  if (Array.isArray(data) && (data as unknown[]).length > 0) {
    return extractUrl((data as unknown[])[0]);
  }

  // Single photo nested
  if (obj.photo && typeof obj.photo === 'object') {
    return extractUrl(obj.photo);
  }
  if (obj.cover_photo && typeof obj.cover_photo === 'object') {
    return extractUrl(obj.cover_photo);
  }
  return null;
}

function extractId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.id === 'string') return obj.id;
  if (Array.isArray(obj.photos) && obj.photos.length > 0) return extractId(obj.photos[0]);
  if (Array.isArray(obj.items) && obj.items.length > 0) return extractId(obj.items[0]);
  if (Array.isArray(data) && (data as unknown[]).length > 0) return extractId((data as unknown[])[0]);
  return null;
}
