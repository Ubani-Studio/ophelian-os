'use client';

/**
 * Per-Cube Nexus.
 *
 * Each Cube has its own relationship graph. This page filters the
 * existing Nexus runtime to nodes whose worldId === current cube,
 * so Triarch's edges in the Mythos and Frank Beverly's edges in
 * Station 8 game don't tangle. Cross-Cube transmedia binding lives
 * on a separate /transmedia surface (future).
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getWorld, type World } from '@/lib/api';

export default function CubeNexusPage() {
  const params = useParams();
  const cubeId = params.id as string;
  const [cube, setCube] = useState<World | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWorld(cubeId)
      .then(setCube)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [cubeId]);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <Link
          href="/cubes"
          style={{
            fontSize: '0.55rem',
            letterSpacing: '0.3em',
            color: 'var(--muted-foreground)',
            fontFamily: 'monospace',
            textDecoration: 'none',
          }}
        >
          ← cubes
        </Link>
        {cube && (
          <span style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
            / {cube.type}
          </span>
        )}
      </div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">{cube?.name ?? 'Cube'}</h1>
        <p style={{ marginTop: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
          Relationship graph scoped to this cube.
        </p>
      </div>

      {error && <p style={{ color: 'var(--error)' }}>{error}</p>}

      <div
        style={{
          border: '1px solid var(--border)',
          padding: '2rem',
          background: 'rgba(255,255,255,0.02)',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '0.6rem',
        }}
      >
        <p style={{ fontSize: '0.55rem', letterSpacing: '0.3em', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
          per-cube nexus · pending
        </p>
        <p style={{ fontFamily: '"Canela", serif', fontWeight: 300, fontSize: '1.2rem', maxWidth: '50ch' }}>
          The relationship graph for {cube?.name ?? 'this cube'} lives here.
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', maxWidth: '60ch', lineHeight: 1.6 }}>
          The existing global Nexus runtime (characters + scenes +
          relationships + connections) needs a worldId filter. That ships in
          the next pass — the route is reserved here so Cube cards can link
          to it cleanly today.
        </p>
        <Link
          href="/nexus"
          style={{
            marginTop: '0.6rem',
            padding: '0.5rem 0.9rem',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            textDecoration: 'none',
            textTransform: 'lowercase',
          }}
        >
          open global nexus for now
        </Link>
      </div>
    </div>
  );
}
