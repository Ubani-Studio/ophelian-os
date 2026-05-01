'use client';

/**
 * CreateTwinButton · creates a twin / clone of an existing
 * character. The twin inherits bio, backstory, voiceSamples,
 * authoredBy, Subtaste, and identity envelope; it gets its own
 * name (and optional bio override). twinOf links it back to the
 * source so the cohort + relationship graph can render the pair.
 *
 * Two-call flow under the hood:
 *   1. createCharacter({ name, mode='twin', worldId=source.worldId })
 *   2. mirror-from(source.id) to copy fields
 *   3. (optional) updateCharacter({ bio: override }) for a fresh
 *      bio that diverges from source while keeping voice + Subtaste
 *
 * Sits next to TickButton in the character header.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTwin, type Character } from '@/lib/api';

const TYRIAN = '#66023C';

export function CreateTwinButton({ source }: { source: Character }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'twin' | 'espíritu'>('twin');
  const [bioOverride, setBioOverride] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setMode('twin');
    setBioOverride('');
    setError(null);
  };

  const submit = async () => {
    if (!name.trim()) {
      setError('Twin needs a name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const twin = await createTwin(source.id, {
        name: name.trim(),
        mode,
        bioOverride: bioOverride.trim() || undefined,
        worldId: source.worldId ?? null,
      });
      setOpen(false);
      reset();
      router.push(`/characters/${twin.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Twin creation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Create a twin sharing ${source.name}'s Subtaste, lineage, and voice samples but with its own name and bio.`}
        style={{
          padding: '0.3rem 0.7rem',
          border: `1px solid var(--border)`,
          background: 'transparent',
          color: 'var(--muted-foreground)',
          fontSize: '0.6rem',
          fontFamily: 'monospace',
          letterSpacing: '0.18em',
          textTransform: 'lowercase',
          borderRadius: 0,
          cursor: 'pointer',
        }}
      >
        + twin
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !busy && setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--background, #0a0a0a)',
              border: '1px solid var(--border)',
              padding: '1.6rem',
              maxWidth: '32rem',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.55rem',
                  letterSpacing: '0.32em',
                  color: 'var(--muted-foreground)',
                  fontFamily: 'monospace',
                  marginBottom: '0.4rem',
                }}
              >
                Create twin
              </div>
              <h2
                style={{
                  fontFamily: '"Canela", serif',
                  fontSize: '1.5rem',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                A reflection of {source.name}
              </h2>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted-foreground)',
                  fontStyle: 'italic',
                  fontFamily: '"Canela", serif',
                  lineHeight: 1.55,
                  marginTop: '0.5rem',
                }}
              >
                The twin inherits bio, backstory, Subtaste, voice samples, and lineage.
                You give it a new name and (optionally) a fresh bio so it diverges in
                what it does while staying coherent in how it speaks.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Twin name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ai-8O"
                disabled={busy}
                autoFocus
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Mode</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(['twin', 'espíritu'] as const).map((m) => {
                  const on = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      disabled={busy}
                      style={{
                        padding: '0.3rem 0.7rem',
                        fontSize: '0.65rem',
                        fontFamily: 'monospace',
                        letterSpacing: '0.08em',
                        border: `1px solid ${on ? TYRIAN : 'var(--border)'}`,
                        background: on ? TYRIAN : 'transparent',
                        color: on ? '#fff' : 'var(--foreground)',
                        cursor: 'pointer',
                        borderRadius: 0,
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
              <p
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--muted-foreground)',
                  fontStyle: 'italic',
                  marginTop: '0.4rem',
                }}
              >
                {mode === 'twin'
                  ? 'twin: reflects the source. Linked via twinOf.'
                  : 'espíritu: a sibling autonomous character. Shares the source register but acts independently.'}
              </p>
            </div>

            <div>
              <label style={labelStyle}>Bio override (optional)</label>
              <textarea
                value={bioOverride}
                onChange={(e) => setBioOverride(e.target.value)}
                placeholder={`Leave empty to inherit ${source.name}'s bio. Fill in to give the twin a divergent surface while keeping the inherited voice + Subtaste.`}
                disabled={busy}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', minHeight: '5rem' }}
              />
            </div>

            {error && (
              <p style={{ fontSize: '0.7rem', color: '#c44', fontFamily: 'monospace', margin: 0 }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                disabled={busy}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted-foreground)',
                  cursor: busy ? 'wait' : 'pointer',
                  borderRadius: 0,
                }}
              >
                cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy || !name.trim()}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                  border: `1px solid ${TYRIAN}`,
                  background: busy || !name.trim() ? 'transparent' : TYRIAN,
                  color: busy || !name.trim() ? TYRIAN : '#fff',
                  cursor: busy ? 'wait' : 'pointer',
                  borderRadius: 0,
                }}
              >
                {busy ? 'creating…' : 'create twin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  letterSpacing: '0.28em',
  color: 'var(--muted-foreground)',
  fontFamily: 'monospace',
  display: 'block',
  marginBottom: '0.35rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  background: '#000',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: 0,
  outline: 'none',
};
