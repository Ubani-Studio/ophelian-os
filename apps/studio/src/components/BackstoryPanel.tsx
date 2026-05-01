'use client';

/**
 * BackstoryPanel · the deeper-context editor.
 *
 * Bio is the voice anchor (one paragraph, public-facing). Backstory
 * is the depth (psychology, history, contradictions, secrets) that
 * the tick LLM reads as background but never quotes.
 *
 * The editor is collapsed by default. Empty by default. The
 * character ticks fine without it; populating it just makes them
 * more dimensional.
 */

import { useState, useEffect } from 'react';
import { updateCharacter, generateBackstoryDraft, type Character } from '@/lib/api';

const TYRIAN = '#66023C';

export function BackstoryPanel({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(character.backstory ?? '');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(character.backstory ?? '');
  }, [character.backstory]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCharacter(character.id, { backstory: draft });
      onUpdated(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save backstory');
    } finally {
      setSaving(false);
    }
  };

  const generateDraft = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateBackstoryDraft(character.id);
      setDraft(result.draft);
      setEditing(true);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate draft');
    } finally {
      setGenerating(false);
    }
  };

  const hasContent = (character.backstory ?? '').trim().length > 0;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: '0.4rem 0',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <span
          style={{
            fontSize: '0.55rem',
            letterSpacing: '0.32em',
            color: 'var(--muted-foreground)',
            fontFamily: 'monospace',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          Backstory · depth
          {hasContent && (
            <span
              style={{
                width: '0.4rem',
                height: '0.4rem',
                background: TYRIAN,
                borderRadius: 0,
                display: 'inline-block',
              }}
              title="Backstory populated"
            />
          )}
        </span>
        <span
          style={{
            fontSize: '0.6rem',
            color: 'var(--muted-foreground)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div style={{ marginTop: '0.5rem' }}>
          <p
            style={{
              fontSize: '0.65rem',
              color: 'var(--muted-foreground)',
              fontStyle: 'italic',
              fontFamily: '"Canela", serif',
              lineHeight: 1.55,
              marginBottom: '0.6rem',
            }}
          >
            Depth, history, contradictions, secrets. Never displayed in
            cards. Never quoted by {character.name}. Read by the tick
            LLM as context only. The deeper this is, the more
            dimensional they become.
          </p>

          {error && (
            <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginBottom: '0.5rem' }}>
              {error}
            </div>
          )}

          {editing ? (
            <div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '160px',
                  padding: '0.55rem 0.7rem',
                  fontSize: '0.78rem',
                  lineHeight: 1.55,
                  fontFamily: 'inherit',
                  background: '#000',
                  color: 'var(--foreground)',
                  border: `1px solid ${TYRIAN}`,
                  borderRadius: 0,
                  outline: 'none',
                  resize: 'vertical',
                }}
                placeholder={`What does ${character.name} carry that nobody sees? Two or three paragraphs. Specifics over abstractions.`}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  style={{
                    padding: '0.3rem 0.7rem',
                    border: `1px solid ${TYRIAN}`,
                    background: TYRIAN,
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.18em',
                    textTransform: 'lowercase',
                    cursor: saving ? 'wait' : 'pointer',
                    borderRadius: 0,
                  }}
                >
                  {saving ? '...' : 'save'}
                </button>
                <button
                  type="button"
                  onClick={generateDraft}
                  disabled={generating}
                  title="Regenerate draft from bio + Subtaste + voice samples"
                  style={{
                    padding: '0.3rem 0.7rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--foreground)',
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.18em',
                    textTransform: 'lowercase',
                    cursor: generating ? 'wait' : 'pointer',
                    borderRadius: 0,
                  }}
                >
                  {generating ? 'drafting.' : 'redraft'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(character.backstory ?? '');
                  }}
                  style={{
                    padding: '0.3rem 0.7rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--muted-foreground)',
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.18em',
                    textTransform: 'lowercase',
                    cursor: 'pointer',
                    borderRadius: 0,
                  }}
                >
                  cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                onClick={() => setEditing(true)}
                style={{
                  fontSize: '0.78rem',
                  lineHeight: 1.6,
                  color: hasContent ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontStyle: hasContent ? 'normal' : 'italic',
                  fontFamily: hasContent ? 'inherit' : '"Canela", serif',
                  padding: '0.55rem 0.7rem',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.015)',
                  cursor: 'pointer',
                  whiteSpace: 'pre-wrap',
                  minHeight: '50px',
                }}
                title="Click to edit"
              >
                {hasContent
                  ? character.backstory
                  : `Empty. Click to add depth ${character.name} doesn't show on the surface.`}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={generateDraft}
                  disabled={generating}
                  title="Generate a draft backstory from bio + Subtaste + voice samples + authoredBy"
                  style={{
                    padding: '0.3rem 0.7rem',
                    border: `1px solid ${TYRIAN}`,
                    background: hasContent ? 'transparent' : TYRIAN,
                    color: hasContent ? TYRIAN : '#fff',
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.18em',
                    textTransform: 'lowercase',
                    cursor: generating ? 'wait' : 'pointer',
                    borderRadius: 0,
                  }}
                >
                  {generating ? 'drafting.' : hasContent ? 'redraft' : 'draft from bio'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
