'use client';

/**
 * VoicePanel · the per-character voice anchor.
 *
 * Two fields, both pre-LoRA bridge to per-character voice
 * authenticity:
 *
 *  - authoredBy: free-text name of the artist whose register this
 *    character speaks in. The tick prompt tells the LLM "you are
 *    voiced by X" so generation pulls toward that register.
 *  - voiceSamples: 3-8 short paragraphs in the artist's actual
 *    voice. The tick prompt leads with these as few-shot, which is
 *    a much stronger signal than naming. This is how Triarch can
 *    sound like someone other than Ubani: paste paragraphs in
 *    Triarch's authoring artist's voice.
 *
 * Future: when cohort LoRAs ship, voiceSamples becomes redundant
 * (the LoRA does the same job better) and authoredBy links to a
 * Sembla / 08 artist identity. Today, paste + click is the bridge.
 */

import { useEffect, useState } from 'react';
import { updateCharacter, type Character } from '@/lib/api';

const TYRIAN = '#66023C';

const MAX_SAMPLES = 8;

export function VoicePanel({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [open, setOpen] = useState(false);
  const [authored, setAuthored] = useState(character.authoredBy ?? '');
  const [samples, setSamples] = useState<string[]>(character.voiceSamples ?? []);
  const [editingSample, setEditingSample] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthored(character.authoredBy ?? '');
    setSamples(character.voiceSamples ?? []);
  }, [character.authoredBy, character.voiceSamples]);

  const saveAuthored = async () => {
    if (authored === (character.authoredBy ?? '')) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCharacter(character.id, {
        authoredBy: authored.trim() || null,
      });
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const persistSamples = async (next: string[]) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCharacter(character.id, { voiceSamples: next });
      onUpdated(updated);
      setSamples(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save samples');
    } finally {
      setSaving(false);
    }
  };

  const startNewSample = () => {
    if (samples.length >= MAX_SAMPLES) {
      setError(`Cap is ${MAX_SAMPLES} samples. Edit or remove one first.`);
      return;
    }
    setEditingSample(samples.length);
    setDraft('');
  };

  const startEditSample = (idx: number) => {
    setEditingSample(idx);
    setDraft(samples[idx] ?? '');
  };

  const saveSample = async () => {
    if (editingSample === null) return;
    const next = [...samples];
    if (draft.trim()) {
      next[editingSample] = draft.trim();
    } else {
      // empty save = delete
      next.splice(editingSample, 1);
    }
    await persistSamples(next);
    setEditingSample(null);
    setDraft('');
  };

  const removeSample = async (idx: number) => {
    const next = samples.filter((_, i) => i !== idx);
    await persistSamples(next);
  };

  const hasContent = authored.trim().length > 0 || samples.length > 0;

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
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          Voice · authorship
          {hasContent && (
            <span
              style={{
                width: '0.4rem',
                height: '0.4rem',
                background: TYRIAN,
                display: 'inline-block',
              }}
              title={`${samples.length} sample${samples.length === 1 ? '' : 's'}${authored ? `, by ${authored}` : ''}`}
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
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <p
            style={{
              fontSize: '0.65rem',
              color: 'var(--muted-foreground)',
              fontStyle: 'italic',
              fontFamily: '"Canela", serif',
              lineHeight: 1.55,
            }}
          >
            Who voices this character. Paste 3 to 8 short samples in
            the authoring artist's actual writing. The tick prompt
            leads with them so {character.name} speaks in their
            register, not the substrate model's default. Mix samples
            from multiple artists to blend voices.
          </p>

          {error && (
            <div style={{ fontSize: '0.7rem', color: 'var(--error)' }}>{error}</div>
          )}

          {/* authoredBy */}
          <div>
            <label
              style={{
                fontSize: '0.55rem',
                letterSpacing: '0.28em',
                color: 'var(--muted-foreground)',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.3rem',
              }}
            >
              Authored by
            </label>
            <input
              type="text"
              value={authored}
              onChange={(e) => setAuthored(e.target.value)}
              onBlur={saveAuthored}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="e.g. an artist's name, your collaborator, or empty for self-authored"
              style={{
                width: '100%',
                padding: '0.4rem 0.55rem',
                fontSize: '0.78rem',
                fontFamily: 'inherit',
                background: '#000',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: 0,
                outline: 'none',
              }}
            />
          </div>

          {/* voiceSamples */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.3rem',
              }}
            >
              <label
                style={{
                  fontSize: '0.55rem',
                  letterSpacing: '0.28em',
                  color: 'var(--muted-foreground)',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                }}
              >
                Voice samples ({samples.length}/{MAX_SAMPLES})
              </label>
              <button
                type="button"
                onClick={startNewSample}
                disabled={saving || samples.length >= MAX_SAMPLES || editingSample !== null}
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  color: 'var(--muted-foreground)',
                  border: '1px solid var(--muted-foreground)',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: 0,
                  opacity: samples.length >= MAX_SAMPLES ? 0.4 : 1,
                }}
              >
                +
              </button>
            </div>

            {samples.length === 0 && editingSample === null && (
              <p
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--muted-foreground)',
                  fontStyle: 'italic',
                  fontFamily: '"Canela", serif',
                  lineHeight: 1.55,
                }}
              >
                No samples yet. Click + to paste a paragraph.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {samples.map((s, idx) =>
                editingSample === idx ? (
                  <SampleEditor
                    key={idx}
                    draft={draft}
                    setDraft={setDraft}
                    onSave={saveSample}
                    onCancel={() => {
                      setEditingSample(null);
                      setDraft('');
                    }}
                    saving={saving}
                  />
                ) : (
                  <SampleRow
                    key={idx}
                    text={s}
                    index={idx}
                    onEdit={() => startEditSample(idx)}
                    onRemove={() => removeSample(idx)}
                  />
                )
              )}
              {editingSample === samples.length && (
                <SampleEditor
                  draft={draft}
                  setDraft={setDraft}
                  onSave={saveSample}
                  onCancel={() => {
                    setEditingSample(null);
                    setDraft('');
                  }}
                  saving={saving}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SampleRow({
  text,
  index,
  onEdit,
  onRemove,
}: {
  text: string;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const preview = text.length > 200 ? text.slice(0, 200) + '...' : text;
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.015)',
        padding: '0.5rem 0.65rem',
        display: 'flex',
        gap: '0.55rem',
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.6rem',
          color: TYRIAN,
          letterSpacing: '0.1em',
          flexShrink: 0,
          paddingTop: '0.1rem',
        }}
      >
        0{index + 1}
      </span>
      <button
        type="button"
        onClick={onEdit}
        title="Click to edit"
        style={{
          flex: 1,
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: 'var(--foreground)',
          fontSize: '0.72rem',
          lineHeight: 1.55,
          cursor: 'pointer',
          whiteSpace: 'pre-wrap',
          fontFamily: 'inherit',
        }}
      >
        {preview}
      </button>
      <button
        type="button"
        onClick={onRemove}
        title="Remove sample"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--muted-foreground)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function SampleEditor({
  draft,
  setDraft,
  onSave,
  onCancel,
  saving,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        placeholder="Paste a short paragraph in the authoring artist's voice. Empty save deletes."
        style={{
          width: '100%',
          minHeight: '110px',
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
      />
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
        <button
          type="button"
          onClick={onSave}
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
          onClick={onCancel}
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
  );
}
