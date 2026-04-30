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

// Tyrian purple. Sourced from murex shells, the most expensive
// dye in antiquity — historically reserved for sovereigns.
const TYRIAN = '#66023C';

export function IkengaEmblem() {
  return (
    <span
      title="Ikenga · lineage anchored in real life"
      style={{
        fontFamily: '"Canela", serif',
        fontStyle: 'italic',
        fontSize: '0.85rem',
        fontWeight: 300,
        letterSpacing: '0.04em',
        color: TYRIAN,
      }}
    >
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!tizitaPersonaId || !open || data) return;
    setLoading(true);
    fetch(`${API_URL}/characters/${characterId}/tizita-photos`, {
      headers: { 'x-api-key': API_KEY },
    })
      .then((r) => r.json())
      .then((j: PhotosResponse) => setData(j))
      .catch(() => setData({ photos: [], reason: 'fetch_failed' }))
      .finally(() => setLoading(false));
  }, [characterId, tizitaPersonaId, open, data]);

  if (!tizitaPersonaId) return null;

  const photoCount = data?.photos.length ?? null;

  return (
    <section
      style={{
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
        marginTop: '1rem',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.7rem 1rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--foreground)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontSize: '0.55rem',
              letterSpacing: '0.3em',
              color: 'var(--muted-foreground)',
              fontFamily: 'monospace',
            }}
          >
            Tizita {photoCount !== null ? `· ${photoCount}` : ''}
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <IkengaEmblem />
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▾
          </span>
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 1rem 1rem 1rem' }}>
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
        </div>
      )}
    </section>
  );
}
