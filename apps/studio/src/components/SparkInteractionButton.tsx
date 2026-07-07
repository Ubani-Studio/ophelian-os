'use client';

/**
 * SparkInteractionButton — fires POST /interactions/spark with this
 * character as initiator. Picks a random recipient on the backend
 * (co-located if currentLocation is set on both, else random).
 *
 * The exchange is persisted as a MemoryEpisode on both sides — so
 * sparking here adds to both characters' memory and (if location
 * shared) emits a LocationEvent. This is the surface that lets random
 * happen.
 */

import { useState } from 'react';
import { sparkRandomInteraction, type Character } from '@/lib/api';

const TYRIAN = '#66023C';

interface Result {
  initiator: { id: string; name: string };
  recipient: { id: string; name: string };
  message: string;
  episodeIds: { initiator: string; recipient: string };
  previousExchangeCount: number;
}

export function SparkInteractionButton({ character }: { character: Character }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function spark() {
    setBusy(true);
    setError(null);
    try {
      const r = await sparkRandomInteraction({ initiatorId: character.id });
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={spark}
        disabled={busy}
        title="Spark a random interaction with another character (persists to both memories)"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.5rem 0.75rem',
          background: 'transparent',
          color: 'var(--foreground)',
          border: `1px solid ${TYRIAN}`,
          borderRadius: 0,
          cursor: busy ? 'wait' : 'pointer',
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>{busy ? 'Sparking…' : 'Spark interaction'}</span>
        <span style={{ color: TYRIAN }}>↯</span>
      </button>

      {error && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#aa4444' }}>{error}</div>
      )}

      {result && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: '#0a0a0a',
            border: `1px solid ${TYRIAN}33`,
            borderLeft: `2px solid ${TYRIAN}`,
            borderRadius: 0,
          }}
        >
          <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            {result.initiator.name} → {result.recipient.name}
            {result.previousExchangeCount > 0 && (
              <span style={{ marginLeft: 6, opacity: 0.5 }}>
                · {result.previousExchangeCount} prior
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--foreground)' }}>
            {result.message}
          </div>
          <div style={{ fontSize: 9, opacity: 0.4, marginTop: 6, fontFamily: 'monospace' }}>
            saved · ep:{result.episodeIds.initiator.slice(0, 8)} ↔ ep:{result.episodeIds.recipient.slice(0, 8)}
          </div>
        </div>
      )}
    </div>
  );
}
