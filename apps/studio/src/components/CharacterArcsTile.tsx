'use client';

/**
 * CharacterArcsTile
 *
 * Read-only summary of arcs this character is participating in.
 * Lives in the right-column character info card. Small surface,
 * no full management here. Use the Arcs page for create / advance.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  listArcs,
  addArcParticipant,
  removeArcParticipant,
  type StoryArc,
} from '@/lib/api';

const TYRIAN = '#66023C';

const TEMP_COLOR: Record<string, string> = {
  hot: '#aa4444',
  cool: '#5fb1c5',
  crossroads: '#c5a35f',
};

export function CharacterArcsTile({ characterId }: { characterId: string }) {
  const [arcs, setArcs] = useState<StoryArc[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const r = await listArcs();
      setArcs(r.arcs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [characterId]);

  const mine = arcs.filter((a) => a.participants?.some((p) => p.characterId === characterId));
  const other = arcs.filter(
    (a) => !a.participants?.some((p) => p.characterId === characterId) && a.status !== 'concluded',
  );

  async function attach(arcId: string) {
    setBusy(arcId);
    try {
      await addArcParticipant(arcId, characterId, 'lead');
      await load();
      setAttachOpen(false);
    } finally {
      setBusy(null);
    }
  }

  async function detach(arcId: string) {
    setBusy(arcId);
    try {
      await removeArcParticipant(arcId, characterId);
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}>
          ARCS
        </strong>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link
            href="/arcs"
            title="Open Arcs page"
            style={{
              fontSize: '0.625rem',
              color: 'var(--muted-foreground)',
              textDecoration: 'none',
              border: '1px solid var(--muted-foreground)',
              padding: '2px 6px',
              borderRadius: 0,
            }}
          >
            All →
          </Link>
          <button
            onClick={() => setAttachOpen(!attachOpen)}
            title="Attach this character to an arc"
            style={{
              fontSize: '0.625rem',
              padding: '2px 6px',
              border: `1px solid ${TYRIAN}`,
              borderRadius: 0,
              background: 'transparent',
              color: TYRIAN,
              cursor: 'pointer',
            }}
          >
            {attachOpen ? 'Close' : '+ attach'}
          </button>
        </div>
      </div>

      {loading && <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Loading…</div>}

      {!loading && mine.length === 0 && !attachOpen && (
        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
          Not in any arcs yet.
        </div>
      )}

      {/* Arcs the character is in */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mine.map((a) => {
          const tempColor = a.temperature ? TEMP_COLOR[a.temperature] ?? '#888' : '#888';
          const beats = Array.isArray(a.beats) ? a.beats : [];
          const current = beats[a.currentBeatIndex];
          const role = a.participants?.find((p) => p.characterId === characterId)?.role;
          return (
            <div
              key={a.id}
              style={{
                padding: 8,
                background: '#0a0a0a',
                border: `1px solid ${TYRIAN}33`,
                borderLeft: `2px solid ${tempColor}`,
                borderRadius: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16, color: TYRIAN, lineHeight: 1 }}>{a.glyph ?? '○'}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, flex: 1, color: 'var(--foreground)' }}>{a.title}</span>
                <span
                  style={{
                    fontSize: '0.5rem',
                    color: tempColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {a.temperature ?? '—'}
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {a.primary && <span style={{ color: TYRIAN }}>{a.primary}</span>}
                {role && <span>· {role}</span>}
                <span>· {a.status}</span>
              </div>
              {current && (
                <div style={{ fontSize: '0.7rem', marginTop: 4, opacity: 0.85 }}>
                  <span style={{ opacity: 0.5 }}>beat {a.currentBeatIndex + 1}/{beats.length}:</span> {current.title}
                </div>
              )}
              <button
                onClick={() => detach(a.id)}
                disabled={busy === a.id}
                style={{
                  marginTop: 6,
                  fontSize: '0.55rem',
                  padding: '1px 5px',
                  background: 'transparent',
                  border: '1px solid var(--muted-foreground)',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  borderRadius: 0,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {busy === a.id ? '…' : 'Detach'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Attach picker */}
      {attachOpen && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: '#0a0a0a',
            border: `1px solid ${TYRIAN}55`,
            borderRadius: 0,
          }}
        >
          <div style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Attach to arc
          </div>
          {other.length === 0 ? (
            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
              No available arcs. Create one on the <Link href="/arcs" style={{ color: TYRIAN }}>Arcs page</Link>.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {other.map((a) => (
                <button
                  key={a.id}
                  onClick={() => attach(a.id)}
                  disabled={busy === a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 6px',
                    background: '#000',
                    border: `1px solid ${TYRIAN}33`,
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    textAlign: 'left',
                    borderRadius: 0,
                  }}
                >
                  <span style={{ color: TYRIAN }}>{a.glyph ?? '○'}</span>
                  <span style={{ flex: 1 }}>{a.title}</span>
                  <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{a.primary ?? ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
