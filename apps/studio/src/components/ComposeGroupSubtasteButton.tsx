'use client';

/**
 * ComposeGroupSubtasteButton · derive a group character's Subtaste
 * from its members. Shown only when compositionKind != 'solo'.
 *
 * Two-step UX: click → preview the composition + reason
 * (majority / tension / singleton) → confirm to apply. Preview-
 * first because composition can change with member edits and the
 * user should see the result before committing it.
 *
 * Sheaf-theory shape: the group's signature is locally varied
 * (members keep their own) but globally coherent (group exposes
 * a dominant + subdominant the tick prompt can use).
 */

import { useState } from 'react';
import { composeGroupSubtaste, type Character, type ComposedSubtastePreview } from '@/lib/api';

const TYRIAN = '#66023C';

const REASON_COPY: Record<ComposedSubtastePreview['composed']['reason'], string> = {
  majority: 'A code repeats across members. The group inherits it.',
  tension: 'No single code dominates. The group holds two diverging signatures as productive tension.',
  singleton: 'Only one member carries a Subtaste. The group inherits it directly.',
};

export function ComposeGroupSubtasteButton({
  character,
  onApplied,
}: {
  character: Character;
  onApplied?: (c: Character) => void;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ComposedSubtastePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  if (!character.compositionKind || character.compositionKind === 'solo') return null;

  const loadPreview = async () => {
    setBusy(true);
    setError(null);
    setApplied(false);
    try {
      const res = await composeGroupSubtaste(character.id, false);
      setPreview(res);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Composition failed');
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await composeGroupSubtaste(character.id, true);
      setPreview(res);
      setApplied(true);
      onApplied?.(character);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={loadPreview}
          disabled={busy}
          title="Derive a group-level Subtaste from member Subtastes (sheaf-theory composition)."
          style={{
            padding: '0.35rem 0.7rem',
            fontSize: '0.6rem',
            fontFamily: 'monospace',
            letterSpacing: '0.18em',
            border: `1px solid ${TYRIAN}`,
            background: 'transparent',
            color: TYRIAN,
            cursor: busy ? 'wait' : 'pointer',
            borderRadius: 0,
          }}
        >
          {busy ? '…' : 'compose subtaste from members'}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: '0.7rem', color: '#c44', fontFamily: 'monospace', margin: 0 }}>
          {error}
        </p>
      )}

      {open && preview && (
        <div
          style={{
            border: '1px solid var(--border)',
            padding: '0.75rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              fontSize: '0.55rem',
              letterSpacing: '0.32em',
              color: 'var(--muted-foreground)',
              fontFamily: 'monospace',
            }}
          >
            Group composition · {preview.composed.reason}
          </div>

          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted-foreground)',
              fontStyle: 'italic',
              fontFamily: '"Canela", serif',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {REASON_COPY[preview.composed.reason]}
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
            <span style={glyphPill(true)}>
              {preview.composed.code} {preview.composed.glyph}
            </span>
            {preview.composed.secondaryCode && (
              <span style={glyphPill(false)}>
                · {preview.composed.secondaryCode} {preview.composed.secondaryGlyph}
              </span>
            )}
            {preview.composed.shadowCode && (
              <span style={{ ...glyphPill(false), opacity: 0.6 }}>
                shadow {preview.composed.shadowCode} {preview.composed.shadowGlyph}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--muted-foreground)',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            composed from:
            {preview.composed.composedFrom.map((m, i) => (
              <span key={m.characterId}>
                {' '}
                {m.name} ({m.code}
                {m.secondaryCode ? `, ${m.secondaryCode}` : ''}){i < preview.composed.composedFrom.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            {applied ? (
              <span
                style={{
                  fontSize: '0.65rem',
                  color: TYRIAN,
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  padding: '0.35rem 0.7rem',
                }}
              >
                applied
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  style={{
                    padding: '0.35rem 0.7rem',
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--muted-foreground)',
                    cursor: 'pointer',
                    borderRadius: 0,
                  }}
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={apply}
                  disabled={busy}
                  style={{
                    padding: '0.35rem 0.7rem',
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    border: `1px solid ${TYRIAN}`,
                    background: TYRIAN,
                    color: '#fff',
                    cursor: busy ? 'wait' : 'pointer',
                    borderRadius: 0,
                  }}
                >
                  {busy ? '…' : 'apply to group'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function glyphPill(primary: boolean): React.CSSProperties {
  return {
    fontSize: primary ? '0.85rem' : '0.7rem',
    fontFamily: 'monospace',
    letterSpacing: '0.08em',
    color: primary ? TYRIAN : 'var(--muted-foreground)',
    background: 'transparent',
  };
}
