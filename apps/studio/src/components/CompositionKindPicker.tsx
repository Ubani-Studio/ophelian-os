'use client';

/**
 * CompositionKindPicker · solo / duo / group / collective.
 *
 * Solo (default) hides the members panel entirely. Other modes
 * surface it. Quiet four-button row, sentence-case labels.
 */

import { useState } from 'react';
import { updateCharacter, type Character } from '@/lib/api';

const TYRIAN = '#66023C';

const KINDS: Array<{ id: 'solo' | 'duo' | 'group' | 'collective'; label: string }> = [
  { id: 'solo', label: 'solo' },
  { id: 'duo', label: 'duo' },
  { id: 'group', label: 'group' },
  { id: 'collective', label: 'collective' },
];

export function CompositionKindPicker({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const current = character.compositionKind ?? 'solo';

  const setKind = async (kind: 'solo' | 'duo' | 'group' | 'collective') => {
    if (kind === current) return;
    setSaving(kind);
    try {
      const updated = await updateCharacter(character.id, { compositionKind: kind });
      onUpdated(updated);
    } catch {
      // surfaced via parent error if needed; for now silent
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mt-4">
      <div
        style={{
          fontSize: '0.55rem',
          letterSpacing: '0.32em',
          color: 'var(--muted-foreground)',
          fontFamily: 'monospace',
          textTransform: 'none',
          marginBottom: '0.4rem',
        }}
      >
        Composition
      </div>
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
        {KINDS.map((k) => {
          const on = current === k.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              disabled={saving !== null}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                letterSpacing: '0.16em',
                textTransform: 'lowercase',
                border: `1px solid ${on ? TYRIAN : 'var(--border)'}`,
                background: on ? TYRIAN : 'transparent',
                color: on ? '#fff' : 'var(--muted-foreground)',
                cursor: saving !== null ? 'wait' : 'pointer',
                borderRadius: 0,
              }}
            >
              {saving === k.id ? '...' : k.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
