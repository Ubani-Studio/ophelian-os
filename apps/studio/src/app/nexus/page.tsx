'use client';

/**
 * Nexus: Cube picker.
 *
 * Per the architectural decision in node-logic.md, each Cube is a
 * self-contained cosmology with its own relationship graph. The
 * standalone /nexus surface becomes a chooser; click into a Cube to
 * enter its scoped Nexus. Cross-Cube transmedia view lives at
 * /transmedia (future).
 *
 * The pre-rename global Nexus is preserved at /nexus_all as the
 * cross-Cube fallback while per-Cube graphs are wired.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getWorlds, type World } from '@/lib/api';

const TYRIAN = '#66023C';

export default function NexusPickerPage() {
  const [cubes, setCubes] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorlds()
      .then(setCubes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nexus</h1>
        <p style={{ marginTop: '0.5rem', maxWidth: '60ch', color: 'var(--muted-foreground)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          Each cube is a self-contained cosmology with its own
          relationship graph. Choose a cube to enter its nexus.
        </p>
      </div>

      {loading && <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', marginTop: '1rem' }}>Loading.</p>}

      {!loading && cubes.length === 0 && (
        <div
          style={{
            marginTop: '1.5rem',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            No cubes yet. <Link href="/cubes" style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}>Create one</Link> or migrate from Òrò in Settings.
          </p>
        </div>
      )}

      {!loading && cubes.length > 0 && (
        <div
          style={{
            marginTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {cubes.map((c) => (
            <Link
              key={c.id}
              href={`/cubes/${c.id}/nexus`}
              style={{
                display: 'block',
                padding: '1.25rem',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--foreground)',
                textDecoration: 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = TYRIAN;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                  {c.type}
                </span>
                <span style={{ fontSize: '0.55rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', opacity: 0.5 }}>
                  →
                </span>
              </div>
              <h2 style={{ fontFamily: '"Canela", serif', fontWeight: 300, fontSize: '1.4rem', marginBottom: '0.4rem' }}>
                {c.name}
              </h2>
              {c.description && (
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                  {c.description.length > 140 ? c.description.slice(0, 140) + '…' : c.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <p style={{ marginTop: '2rem', fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'monospace', letterSpacing: '0.15em' }}>
        cross-cube ·{' '}
        <Link href="/nexus_all" style={{ color: 'inherit', borderBottom: '1px solid var(--border)' }}>
          open global nexus
        </Link>
      </p>
    </div>
  );
}
