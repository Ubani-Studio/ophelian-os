'use client';

/**
 * TizitaPanel
 *
 * Surfaces a character's Tizita-bound photos and brief inline on the
 * character detail page. The Ikenga emblem marks characters that come
 * from real-life lineage (Tizita People) — a personal-shrine signal,
 * borrowed from Igbo tradition where the ikenga is the carved figure
 * of personal achievement and right-hand strength.
 *
 * If the character has no tizitaPersonaId, the panel renders nothing.
 * If Tizita is unreachable, it shows the reason quietly.
 */

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5130';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ophelian-dev-key-2026';

interface TizitaPhoto {
  id: string;
  url: string | null;
  thumbnailUrl: string | null;
}

interface PhotosResponse {
  photos: TizitaPhoto[];
  reason?: string;
  tizita_base?: string;
}

export function IkengaEmblem({ size = 14 }: { size?: number }) {
  return (
    <span
      title="Ikenga · Tizita-bound; lineage anchored in real life"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.55rem',
        letterSpacing: '0.25em',
        color: 'rgba(255,200,140,0.7)',
        fontFamily: 'monospace',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M3 14 L3 9 L5 9 L5 6 L8 3 L11 6 L11 9 L13 9 L13 14" />
        <path d="M5 9 L11 9" />
        <circle cx="8" cy="11" r="0.6" fill="currentColor" />
      </svg>
      Ikenga
    </span>
  );
}

export function TizitaPanel({
  characterId,
  tizitaPersonaId,
}: {
  characterId: string;
  tizitaPersonaId: string | null | undefined;
}) {
  const [data, setData] = useState<PhotosResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tizitaPersonaId) return;
    setLoading(true);
    fetch(`${API_URL}/characters/${characterId}/tizita-photos`, {
      headers: { 'x-api-key': API_KEY },
    })
      .then((r) => r.json())
      .then((j: PhotosResponse) => setData(j))
      .catch(() => setData({ photos: [], reason: 'fetch_failed' }))
      .finally(() => setLoading(false));
  }, [characterId, tizitaPersonaId]);

  if (!tizitaPersonaId) return null;

  return (
    <section
      style={{
        border: '1px solid var(--border)',
        padding: '1rem 1.25rem',
        background: 'rgba(255,255,255,0.02)',
        marginTop: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
          Tizita
        </p>
        <IkengaEmblem />
      </div>

      {loading && (
        <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Loading photos.</p>
      )}

      {!loading && data?.photos && data.photos.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: '0.4rem',
          }}
        >
          {data.photos.map((p) => {
            const src = p.thumbnailUrl ?? p.url ?? '';
            const fullSrc = src.startsWith('http') || !data.tizita_base ? src : `${data.tizita_base}${src}`;
            if (!fullSrc) return null;
            return (
              <div
                key={p.id}
                style={{
                  aspectRatio: '1 / 1',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fullSrc}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            );
          })}
        </div>
      )}

      {!loading && data?.photos?.length === 0 && (
        <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          {data.reason === 'tizita_unreachable'
            ? 'Tizita unreachable. Start it on :8001 to see photos here.'
            : data.reason === 'no_tizita_persona'
              ? 'No Tizita persona bound.'
              : 'No photos found in Tizita for this persona.'}
        </p>
      )}
    </section>
  );
}
