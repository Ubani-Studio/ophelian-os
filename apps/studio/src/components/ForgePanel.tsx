'use client';

/**
 * ForgePanel · the aligned character generator.
 *
 * Pick a lineage, optionally pin a Subtaste, optionally write a
 * brief. Pick which fields to regenerate. Click Forge. One Claude
 * call returns coherent bio + backstory + aliases + persona tags +
 * goals so they reference each other naturally instead of mismatching.
 *
 * Sheaf theory: locally chaotic, globally consistent. The lineage
 * + Subtaste + brief is the shared anchor every field is generated
 * against.
 *
 * Default behaviour: preview the draft, let the user edit and apply
 * per-field. Locked fields (Ubani's Starforge-anchored bio) are
 * skipped automatically.
 */

import { useEffect, useState } from 'react';
import {
  listLineages,
  realignCharacter,
  updateCharacter,
  type Character,
  type LineageOption,
  type RealignField,
  type RealignDraft,
} from '@/lib/api';

const TYRIAN = '#66023C';

const ALL_FIELDS: RealignField[] = ['bio', 'backstory', 'aliases', 'personaTags', 'goals'];
const FIELD_LABELS: Record<RealignField, string> = {
  bio: 'bio',
  backstory: 'backstory',
  aliases: 'aliases',
  personaTags: 'tags',
  goals: 'goals',
};

const SUBTASTE_OPTIONS: Array<{ code: string; display: string }> = [
  { code: 'S-0', display: 'S-0 KETH · Visionary' },
  { code: 'T-1', display: 'T-1 STRATA · Architectural' },
  { code: 'V-2', display: 'V-2 OMEN · Prophetic' },
  { code: 'L-3', display: 'L-3 SILT · Developmental' },
  { code: 'C-4', display: 'C-4 CULL · Editorial' },
  { code: 'N-5', display: 'N-5 LIMN · Integrative' },
  { code: 'H-6', display: 'H-6 TOLL · Advocacy' },
  { code: 'P-7', display: 'P-7 VAULT · Archival' },
  { code: 'D-8', display: 'D-8 WICK · Channelling' },
  { code: 'F-9', display: 'F-9 ANVIL · Manifestation' },
  { code: 'R-10', display: 'R-10 SCHISM · Contrarian' },
  { code: 'Ø', display: 'Ø VOID · Receptive' },
];

export function ForgePanel({
  character,
  onUpdated,
}: {
  character: Character;
  onUpdated: (c: Character) => void;
}) {
  const [open, setOpen] = useState(false);
  const [lineages, setLineages] = useState<LineageOption[]>([]);
  const [lineage, setLineage] = useState<string>('');
  const [brief, setBrief] = useState('');
  const [subtasteCode, setSubtasteCode] = useState('');
  const [fields, setFields] = useState<Set<RealignField>>(new Set(ALL_FIELDS));
  const [draft, setDraft] = useState<RealignDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  useEffect(() => {
    if (open && lineages.length === 0) {
      listLineages().then(setLineages).catch(() => setLineages([]));
    }
  }, [open, lineages.length]);

  const toggleField = (f: RealignField) => {
    const next = new Set(fields);
    if (next.has(f)) next.delete(f);
    else next.add(f);
    setFields(next);
  };

  const forge = async () => {
    setLoading(true);
    setError(null);
    setDraft(null);
    setSkipped([]);
    try {
      const result = await realignCharacter(character.id, {
        lineage: lineage || undefined,
        brief: brief.trim() || undefined,
        subtasteCode: subtasteCode || undefined,
        fields: Array.from(fields),
        apply: false,
      });
      setDraft(result.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Forge failed');
    } finally {
      setLoading(false);
    }
  };

  const applyField = async (field: RealignField) => {
    if (!draft || draft[field] === undefined) return;
    setApplying(field);
    setError(null);
    try {
      const value = draft[field];
      const updated = await updateCharacter(character.id, {
        [field]: value,
      } as Partial<Character>);
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to apply ${field}`);
    } finally {
      setApplying(null);
    }
  };

  const applyAll = async () => {
    if (!draft) return;
    setApplying('all');
    setError(null);
    try {
      const result = await realignCharacter(character.id, {
        lineage: lineage || undefined,
        brief: brief.trim() || undefined,
        subtasteCode: subtasteCode || undefined,
        fields: Array.from(fields),
        apply: true,
      });
      setSkipped(result.skipped ?? []);
      // refetch to update parent
      const refreshed = await updateCharacter(character.id, {});
      onUpdated(refreshed);
      setDraft(result.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply-all failed');
    } finally {
      setApplying(null);
    }
  };

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
          }}
        >
          Forge · aligned chaos
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
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <p
            style={{
              fontSize: '0.65rem',
              color: 'var(--muted-foreground)',
              fontStyle: 'italic',
              fontFamily: '"Canela", serif',
              lineHeight: 1.55,
            }}
          >
            Pick a lineage, optionally pin a Subtaste, write a brief.
            Forge generates aligned bio, backstory, aliases, tags, and
            goals in one pass so they cohere with each other.
          </p>

          {error && (
            <div style={{ fontSize: '0.7rem', color: 'var(--error)' }}>{error}</div>
          )}

          {/* Lineage picker */}
          <div>
            <label style={labelStyle}>Lineage</label>
            <select
              value={lineage}
              onChange={(e) => setLineage(e.target.value)}
              style={inputStyle}
            >
              <option value="">none · culturally indeterminate</option>
              {lineages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label} · {l.region}
                  {l.advisorGated ? ' · advisor-gated' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Subtaste pin */}
          <div>
            <label style={labelStyle}>Subtaste anchor (optional · pulls from character if blank)</label>
            <select
              value={subtasteCode}
              onChange={(e) => setSubtasteCode(e.target.value)}
              style={inputStyle}
            >
              <option value="">use character's existing</option>
              {SUBTASTE_OPTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.display}
                </option>
              ))}
            </select>
          </div>

          {/* Brief */}
          <div>
            <label style={labelStyle}>Brief (optional · 1-3 sentences anchoring who they are)</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={`e.g. "${character.name} is a Yoruba diviner who refuses to read for the wealthy. They live by the river. They are not afraid."`}
              style={{
                ...inputStyle,
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Field toggles */}
          <div>
            <label style={labelStyle}>Fields to forge</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {ALL_FIELDS.map((f) => {
                const on = fields.has(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleField(f)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.6rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.18em',
                      textTransform: 'lowercase',
                      border: `1px solid ${on ? TYRIAN : 'var(--border)'}`,
                      background: on ? TYRIAN : 'transparent',
                      color: on ? '#fff' : 'var(--muted-foreground)',
                      cursor: 'pointer',
                      borderRadius: 0,
                    }}
                  >
                    {FIELD_LABELS[f]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Forge buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
            <button
              type="button"
              onClick={forge}
              disabled={loading || fields.size === 0}
              style={primaryButtonStyle(loading)}
            >
              {loading ? 'forging.' : 'forge preview'}
            </button>
            {draft && (
              <button
                type="button"
                onClick={applyAll}
                disabled={applying === 'all'}
                style={{
                  ...primaryButtonStyle(applying === 'all'),
                  background: 'transparent',
                  color: TYRIAN,
                }}
              >
                {applying === 'all' ? 'applying.' : 'apply all'}
              </button>
            )}
          </div>

          {skipped.length > 0 && (
            <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
              Skipped (locked): {skipped.join(', ')}
            </div>
          )}

          {/* Draft preview */}
          {draft && (
            <div
              style={{
                marginTop: '0.5rem',
                border: '1px solid var(--border)',
                background: 'rgba(102,2,60,0.04)',
              }}
            >
              {draft.bio !== undefined && (
                <DraftRow
                  field="bio"
                  label="Bio"
                  body={draft.bio}
                  onApply={() => applyField('bio')}
                  applying={applying === 'bio'}
                />
              )}
              {draft.backstory !== undefined && (
                <DraftRow
                  field="backstory"
                  label="Backstory"
                  body={draft.backstory}
                  onApply={() => applyField('backstory')}
                  applying={applying === 'backstory'}
                />
              )}
              {draft.aliases !== undefined && (
                <DraftRow
                  field="aliases"
                  label="Aliases"
                  body={draft.aliases.join(' · ')}
                  onApply={() => applyField('aliases')}
                  applying={applying === 'aliases'}
                />
              )}
              {draft.personaTags !== undefined && (
                <DraftRow
                  field="personaTags"
                  label="Tags"
                  body={draft.personaTags.join(' · ')}
                  onApply={() => applyField('personaTags')}
                  applying={applying === 'personaTags'}
                />
              )}
              {draft.goals !== undefined && (
                <DraftRow
                  field="goals"
                  label="Goals"
                  body={draft.goals.map((g, i) => `0${i + 1} ${g}`).join('\n')}
                  onApply={() => applyField('goals')}
                  applying={applying === 'goals'}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  letterSpacing: '0.28em',
  color: 'var(--muted-foreground)',
  fontFamily: 'monospace',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '0.3rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.55rem',
  fontSize: '0.78rem',
  background: '#000',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: 0,
  outline: 'none',
};

const primaryButtonStyle = (loading: boolean): React.CSSProperties => ({
  padding: '0.4rem 0.85rem',
  border: `1px solid ${TYRIAN}`,
  background: TYRIAN,
  color: '#fff',
  fontSize: '0.65rem',
  fontFamily: 'monospace',
  letterSpacing: '0.2em',
  textTransform: 'lowercase',
  cursor: loading ? 'wait' : 'pointer',
  borderRadius: 0,
});

function DraftRow({
  label,
  body,
  onApply,
  applying,
}: {
  field: string;
  label: string;
  body: string;
  onApply: () => void;
  applying: boolean;
}) {
  return (
    <div
      style={{
        padding: '0.6rem 0.8rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '0.7rem',
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          fontSize: '0.55rem',
          fontFamily: 'monospace',
          letterSpacing: '0.22em',
          color: TYRIAN,
          textTransform: 'uppercase',
          width: '70px',
          flexShrink: 0,
          paddingTop: '0.15rem',
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          fontSize: '0.78rem',
          lineHeight: 1.55,
          color: 'var(--foreground)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {body}
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={applying}
        style={{
          padding: '0.2rem 0.55rem',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--foreground)',
          fontSize: '0.55rem',
          fontFamily: 'monospace',
          letterSpacing: '0.2em',
          textTransform: 'lowercase',
          cursor: applying ? 'wait' : 'pointer',
          borderRadius: 0,
          flexShrink: 0,
        }}
      >
        {applying ? '...' : 'apply'}
      </button>
    </div>
  );
}
