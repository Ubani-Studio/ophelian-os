'use client';

/**
 * TizitaAvatarButton · pulls the character's avatar from the linked
 * Ikenga persona. Replaces the first-letter placeholder with a real
 * representative photo. No-op if avatarUrl is already set unless the
 * user clicks "force overwrite".
 */

import { useState } from 'react';
import { pullAvatarFromTizita, type Character } from '@/lib/api';

const TYRIAN = '#66023C';

export function TizitaAvatarButton({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function pull(force: boolean) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await pullAvatarFromTizita(character.id, force);
      if (res.status === 'updated' && res.avatarUrl) {
        onUpdated({ ...character, avatarUrl: res.avatarUrl });
        setMessage('Updated from Ikenga.');
      } else {
        setMessage(res.reason ?? res.status);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: '10px 12px',
        border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: 0,
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 12 }}>
        <div style={{ color: 'var(--foreground)', fontSize: 12, fontWeight: 400 }}>
          Avatar from Ikenga
        </div>
        <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2, lineHeight: 1.5 }}>
          {character.avatarUrl
            ? 'Set. Force pull to overwrite from the linked Ikenga persona.'
            : 'Pull the representative photo from the linked Ikenga persona.'}
        </div>
        {message && <div style={{ fontSize: 11, color: TYRIAN, marginTop: 4 }}>{message}</div>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => pull(false)} disabled={loading} style={btn}>
          {character.avatarUrl ? 'Pull' : 'Pull avatar'}
        </button>
        {character.avatarUrl && (
          <button onClick={() => pull(true)} disabled={loading} style={btnGhost}>
            Force
          </button>
        )}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '6px 12px',
  background: TYRIAN,
  color: '#fff',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 11,
  letterSpacing: 0.3,
};

const btnGhost: React.CSSProperties = {
  ...btn,
  background: 'transparent',
  color: TYRIAN,
  border: `1px solid rgba(255,255,255,0.08)`,
};
